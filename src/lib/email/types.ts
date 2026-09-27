/**
 * The email provider contract.
 *
 * Same shape as the AI abstraction in `src/lib/ai`, for the same reason:
 * nothing above this layer names a vendor, so swapping provider is one
 * adapter rather than a grep.
 *
 * The contract's most important property is that **a send either
 * succeeded or it did not, and the caller is told which**. There is no
 * fire-and-forget: a provider that rejected a message must never be
 * reported as having delivered it, and the result type has no shape that
 * lets a caller ignore the difference by accident.
 *
 * "Delivered" here means *accepted by the provider* — that is all an API
 * call can honestly tell us. Whether the mail later bounced is a webhook
 * the product does not have, and the type is named `accepted` rather than
 * `delivered` so nothing in the codebase claims otherwise.
 */

export type EmailAddress = {
  email: string;
  name?: string;
};

export type EmailMessage = {
  to: EmailAddress;
  subject: string;
  /** Always required. A plain-text part is not optional for deliverability. */
  text: string;
  /** Optional rich part. */
  html?: string;
  /**
   * Deduplication key. Providers that support it use it to collapse a
   * retry into the original send; those that do not still get it in a
   * header, and the caller's own idempotency check is what actually
   * guarantees it.
   */
  idempotencyKey?: string;
};

export type SendResult =
  | {
      status: "accepted";
      /** The provider's own id, for correlating with its dashboard. */
      id: string;
      provider: string;
    }
  | {
      status: "rejected";
      provider: string;
      /** Safe to log and to store. Never contains the payload or a key. */
      reason: string;
      /** True when a later attempt might succeed: a timeout, a 5xx, a 429. */
      retryable: boolean;
    }
  | {
      status: "skipped";
      provider: string;
      /** Why nothing was sent: no provider configured, suppressed, etc. */
      reason: string;
    };

export interface EmailProvider {
  /** Stable identifier, recorded against every attempt. */
  readonly name: string;
  /** Whether the provider is configured well enough to attempt a send. */
  isConfigured(): boolean;
  send(message: EmailMessage): Promise<SendResult>;
}

/**
 * Thrown only for programmer error — a message that could never be sent
 * by any provider. A provider *rejecting* a valid message is a
 * `SendResult`, not an exception.
 */
export class InvalidEmailError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidEmailError";
  }
}

/**
 * The shape an address must have before any provider sees it.
 *
 * Deliberately strict and boring. The point is not to validate every
 * legal RFC 5322 address; it is to make sure a header-injection attempt
 * (`a@b.test\nBcc: everyone`) never reaches an adapter that might
 * interpolate it.
 */
const ADDRESS = /^[^\s@,;<>"]+@[^\s@,;<>".]+\.[^\s@,;<>"]+$/;

export function isSendableAddress(value: string): boolean {
  if (value.length > 254) return false;
  // Explicit, because a regex with no newline class silently accepts
  // them when the input has a trailing newline.
  if (/[\r\n\t]/.test(value)) return false;
  return ADDRESS.test(value);
}

/**
 * Strips anything that could break out of a header value.
 *
 * Subjects come from templates rather than from users today, but the one
 * that changes that will not be accompanied by somebody remembering to
 * add this.
 */
export function sanitiseHeaderValue(value: string): string {
  return value.replace(/[\r\n]+/g, " ").trim().slice(0, 300);
}
