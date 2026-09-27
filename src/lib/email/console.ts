import "server-only";

import {
  isSendableAddress,
  type EmailMessage,
  type EmailProvider,
  type SendResult,
} from "./types";

/**
 * The development and test provider.
 *
 * Writes the message to the server log and records it in memory so a
 * test can assert what would have been sent. It reports `accepted`,
 * which is honest for what it is: the message *was* accepted — by a log.
 *
 * **Refuses to construct in production.** A deployment misconfigured onto
 * this provider would silently swallow every notification while looking
 * entirely healthy, which is the worst possible failure for something
 * whose whole job is to leave the building. Two guards, the same pattern
 * as the mock AI provider: the registry does not offer it in production,
 * and this throws if it is reached anyway.
 */
export class ConsoleEmailProvider implements EmailProvider {
  readonly name = "console";

  /** Everything this provider has "sent", newest last. */
  readonly outbox: EmailMessage[] = [];

  constructor() {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "The console email provider cannot be used in production; it delivers nothing."
      );
    }
  }

  isConfigured(): boolean {
    return true;
  }

  async send(message: EmailMessage): Promise<SendResult> {
    if (!isSendableAddress(message.to.email)) {
      return {
        status: "rejected",
        provider: this.name,
        reason: "The recipient address is not sendable.",
        retryable: false,
      };
    }

    this.outbox.push(message);

    console.info(
      `[email:console] to=${message.to.email} subject=${JSON.stringify(
        message.subject
      )}\n${message.text}`
    );

    return {
      status: "accepted",
      id: `console-${this.outbox.length}`,
      provider: this.name,
    };
  }
}

/**
 * A provider that rejects everything, for testing the failure path.
 *
 * Exists so the "provider failure" case is exercised by a real
 * `SendResult` travelling through the real pipeline, rather than by a
 * mock of the pipeline itself.
 */
export class RejectingEmailProvider implements EmailProvider {
  readonly name = "rejecting";

  constructor(private readonly retryable = false) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("The rejecting email provider cannot be used in production.");
    }
  }

  isConfigured(): boolean {
    return true;
  }

  async send(): Promise<SendResult> {
    return {
      status: "rejected",
      provider: this.name,
      reason: "This provider rejects everything by design.",
      retryable: this.retryable,
    };
  }
}
