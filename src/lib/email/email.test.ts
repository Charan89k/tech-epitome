import { describe, expect, it, vi } from "vitest";

import { ConsoleEmailProvider, RejectingEmailProvider } from "./console";
import { ResendProvider } from "./resend";
import { reviewReminderEmail } from "./templates";
import { isSendableAddress, sanitiseHeaderValue } from "./types";

/**
 * The email layer.
 *
 * **The Resend adapter has never talked to Resend.** No API key was
 * available, so what is verified here is the request it builds, the
 * responses it parses, and how it classifies failures — against a
 * stubbed `fetch`. A wrong field name would pass all of this and fail
 * on the first real send; the README says so, and so does this comment,
 * because a structural test that reads like a live one is worse than no
 * test.
 *
 * What these *do* pin is the contract's central promise: a message the
 * provider did not accept is never reported as accepted.
 */

describe("address validation", () => {
  it("accepts ordinary addresses", () => {
    for (const address of [
      "a@b.test",
      "learner+tag@example.co.uk",
      "first.last@sub.domain.org",
    ]) {
      expect(isSendableAddress(address), address).toBe(true);
    }
  });

  it("rejects header injection", () => {
    // The whole reason this exists: a newline in an address is a second
    // header waiting to be interpreted.
    for (const address of [
      "a@b.test\nBcc: everyone@example.com",
      "a@b.test\r\nSubject: hijacked",
      "a@b.test\tx",
      "a@b.test, c@d.test",
      "a@b.test;c@d.test",
      "<a@b.test>",
    ]) {
      expect(isSendableAddress(address), JSON.stringify(address)).toBe(false);
    }
  });

  it("rejects malformed and oversized addresses", () => {
    for (const address of ["", "no-at-sign", "a@b", "a@@b.test", `${"x".repeat(250)}@b.test`]) {
      expect(isSendableAddress(address), address).toBe(false);
    }
  });

  it("strips newlines from a header value", () => {
    expect(sanitiseHeaderValue("Subject\r\nBcc: x@y.test")).toBe(
      "Subject Bcc: x@y.test"
    );
  });
});

describe("the review reminder template", () => {
  const to = { email: "learner@example.test", name: "Ada" };

  it("says what is waiting and links to the queue", () => {
    const message = reviewReminderEmail(to, { name: "Ada", dueCount: 3 });
    expect(message.subject).toContain("3 reviews are due");
    expect(message.text).toContain("Hi Ada");
    expect(message.text).toContain("3 items are");
    expect(message.text).toMatch(/\/review/);
  });

  it("uses the singular for one", () => {
    const message = reviewReminderEmail(to, { name: null, dueCount: 1 });
    expect(message.subject).toContain("1 review is due");
    expect(message.text).toContain("1 item is");
    // No name is not "Hi null".
    expect(message.text).toContain("Hi,");
  });

  it("always carries a plain-text part", () => {
    // Deliverability, and a text-only client should get the whole thing.
    const message = reviewReminderEmail(to, { name: "Ada", dueCount: 2 });
    expect(message.text.length).toBeGreaterThan(50);
    expect(message.html).toBeDefined();
  });

  it("tells the reader how to turn it off", () => {
    const message = reviewReminderEmail(to, { name: "Ada", dueCount: 2 });
    expect(message.text).toMatch(/\/settings/);
    expect(message.text).toMatch(/turn them off/i);
    expect(message.html).toMatch(/\/settings/);
  });

  it("says it is not marketing, because it is not", () => {
    const message = reviewReminderEmail(to, { name: "Ada", dueCount: 2 });
    expect(message.text).toMatch(/free/i);
    expect(message.text).toMatch(/nothing to buy/i);
    // And nothing that would make it read like a campaign.
    expect(message.text.toLowerCase()).not.toMatch(
      /upgrade|subscribe|premium|offer|discount/
    );
  });

  it("escapes a name into the HTML part", () => {
    const message = reviewReminderEmail(to, {
      name: '<script>alert(1)</script>',
      dueCount: 1,
    });
    expect(message.html).not.toContain("<script>");
    expect(message.html).toContain("&lt;script&gt;");
  });
});

describe("the console provider", () => {
  it("records what it would have sent", async () => {
    const provider = new ConsoleEmailProvider();
    const result = await provider.send({
      to: { email: "a@b.test" },
      subject: "Hello",
      text: "Body",
    });

    expect(result.status).toBe("accepted");
    expect(provider.outbox).toHaveLength(1);
    expect(provider.outbox[0]!.subject).toBe("Hello");
  });

  it("still refuses an unsendable address", async () => {
    const provider = new ConsoleEmailProvider();
    const result = await provider.send({
      to: { email: "a@b.test\nBcc: x@y.test" },
      subject: "Hello",
      text: "Body",
    });

    expect(result.status).toBe("rejected");
    expect(provider.outbox).toHaveLength(0);
  });
});

describe("the Resend adapter", () => {
  const from = "CodeForge <noreply@codeforge.test>";
  const message = {
    to: { email: "learner@example.test" },
    subject: "Subject",
    text: "Body",
    html: "<p>Body</p>",
  };

  it("reports skipped rather than failing when unconfigured", async () => {
    const provider = new ResendProvider(undefined, from);
    expect(provider.isConfigured()).toBe(false);

    const result = await provider.send(message);
    expect(result.status).toBe("skipped");
  });

  it("builds the request the API expects", async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(JSON.stringify({ id: "re_123" }), { status: 200 })
    );
    const provider = new ResendProvider("key_abc", from, fetchImpl as never);

    const result = await provider.send({ ...message, idempotencyKey: "k1" });

    expect(result).toEqual({
      status: "accepted",
      id: "re_123",
      provider: "resend",
    });

    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.resend.com/emails");
    expect(init.method).toBe("POST");

    const headers = init.headers as Record<string, string>;
    expect(headers.authorization).toBe("Bearer key_abc");
    expect(headers["Idempotency-Key"]).toBe("k1");

    const body = JSON.parse(init.body as string);
    expect(body).toMatchObject({
      from,
      to: ["learner@example.test"],
      subject: "Subject",
      text: "Body",
      html: "<p>Body</p>",
    });
  });

  it("never puts the key anywhere but the header", async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(JSON.stringify({ id: "re_1" }), { status: 200 })
    );
    const provider = new ResendProvider("SUPERSECRET", from, fetchImpl as never);
    const result = await provider.send(message);

    const [, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(init.body as string).not.toContain("SUPERSECRET");
    expect(JSON.stringify(result)).not.toContain("SUPERSECRET");
  });

  it("treats a 4xx as permanent and a 5xx or 429 as retryable", async () => {
    for (const [status, retryable] of [
      [400, false],
      [401, false],
      [422, false],
      [429, true],
      [500, true],
      [503, true],
    ] as const) {
      const provider = new ResendProvider(
        "key",
        from,
        (async () => new Response("{}", { status })) as never
      );
      const result = await provider.send(message);

      expect(result.status, String(status)).toBe("rejected");
      if (result.status === "rejected") {
        expect(result.retryable, String(status)).toBe(retryable);
        // The reason is safe to store: a status, not a payload.
        expect(result.reason).toContain(String(status));
      }
    }
  });

  it("refuses to call a 2xx with no id an acceptance", async () => {
    // The contract's central promise. A delivery we cannot identify is
    // not a delivery we can claim.
    const provider = new ResendProvider(
      "key",
      from,
      (async () => new Response(JSON.stringify({ ok: true }), { status: 200 })) as never
    );
    const result = await provider.send(message);
    expect(result.status).toBe("rejected");
  });

  it("classifies a network failure as retryable", async () => {
    const provider = new ResendProvider(
      "key",
      from,
      (async () => {
        throw new Error("ECONNREFUSED");
      }) as never
    );
    const result = await provider.send(message);

    expect(result.status).toBe("rejected");
    if (result.status === "rejected") expect(result.retryable).toBe(true);
  });

  it("classifies a timeout as retryable and says so", async () => {
    const provider = new ResendProvider(
      "key",
      from,
      (async () => {
        const error = new Error("timed out");
        error.name = "TimeoutError";
        throw error;
      }) as never
    );
    const result = await provider.send(message);

    expect(result.status).toBe("rejected");
    if (result.status === "rejected") {
      expect(result.retryable).toBe(true);
      expect(result.reason).toMatch(/in time/);
    }
  });

  it("refuses an unsendable address before any request is made", async () => {
    const fetchImpl = vi.fn();
    const provider = new ResendProvider("key", from, fetchImpl as never);

    const result = await provider.send({
      ...message,
      to: { email: "a@b.test\nBcc: everyone@example.com" },
    });

    expect(result.status).toBe("rejected");
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});

describe("the rejecting provider", () => {
  it("exists so the failure path is exercised for real", async () => {
    const result = await new RejectingEmailProvider().send();
    expect(result.status).toBe("rejected");
  });
});
