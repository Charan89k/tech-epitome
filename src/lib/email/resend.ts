import "server-only";

import {
  isSendableAddress,
  sanitiseHeaderValue,
  type EmailMessage,
  type EmailProvider,
  type SendResult,
} from "./types";

/**
 * Resend, over `fetch`.
 *
 * No SDK, for the same reason the Anthropic adapter has none: one HTTP
 * call does not justify a dependency, and a hand-written adapter is a
 * file somebody can read in full when the provider misbehaves.
 *
 * **Never runtime-verified against Resend.** No API key was available in
 * the environment this was written in, so what is tested is the request
 * this builds, the responses it parses and the failures it classifies —
 * against a stubbed `fetch`, not against the service. The README says so
 * too. That is a real limitation, not a formality: a wrong field name
 * would pass every test here and fail on the first real send.
 */

const API_URL = "https://api.resend.com/emails";

export class ResendProvider implements EmailProvider {
  readonly name = "resend";

  constructor(
    private readonly apiKey: string | undefined,
    private readonly from: string,
    /** Injectable so the adapter is testable without a network. */
    private readonly fetchImpl: typeof fetch = fetch
  ) {}

  isConfigured(): boolean {
    return Boolean(this.apiKey && this.from);
  }

  async send(message: EmailMessage): Promise<SendResult> {
    if (!this.isConfigured()) {
      return {
        status: "skipped",
        provider: this.name,
        reason: "Resend is not configured (RESEND_API_KEY / EMAIL_FROM).",
      };
    }

    if (!isSendableAddress(message.to.email)) {
      // Not retryable and not an exception: a bad address on one row must
      // not stop a batch.
      return {
        status: "rejected",
        provider: this.name,
        reason: "The recipient address is not sendable.",
        retryable: false,
      };
    }

    const headers: Record<string, string> = {
      // The key goes in a header and is never logged, never echoed into
      // a result, and never included in an error message.
      authorization: `Bearer ${this.apiKey}`,
      "content-type": "application/json",
    };
    if (message.idempotencyKey) {
      headers["Idempotency-Key"] = sanitiseHeaderValue(message.idempotencyKey);
    }

    let response: Response;
    try {
      response = await this.fetchImpl(API_URL, {
        method: "POST",
        headers,
        body: JSON.stringify({
          from: this.from,
          to: [message.to.email],
          subject: sanitiseHeaderValue(message.subject),
          text: message.text,
          ...(message.html ? { html: message.html } : {}),
        }),
        // A scheduled job must not hang on a slow provider.
        signal: AbortSignal.timeout(15_000),
      });
    } catch (error) {
      // A network failure or a timeout. Worth retrying; worth nothing in
      // the log beyond its class, since the message may contain an
      // address.
      return {
        status: "rejected",
        provider: this.name,
        reason:
          error instanceof Error && error.name === "TimeoutError"
            ? "The provider did not respond in time."
            : "The provider could not be reached.",
        retryable: true,
      };
    }

    if (!response.ok) {
      // 4xx is a bad request and will fail again identically; 429 and 5xx
      // are worth another attempt.
      const retryable = response.status === 429 || response.status >= 500;
      return {
        status: "rejected",
        provider: this.name,
        reason: `The provider rejected the message (HTTP ${response.status}).`,
        retryable,
      };
    }

    const body = (await response.json().catch(() => null)) as {
      id?: unknown;
    } | null;

    if (!body || typeof body.id !== "string") {
      // A 2xx with no id is not a delivery we can claim. Saying
      // "accepted" here would be exactly the lie the contract forbids.
      return {
        status: "rejected",
        provider: this.name,
        reason: "The provider accepted the request but returned no id.",
        retryable: false,
      };
    }

    return { status: "accepted", id: body.id, provider: this.name };
  }
}
