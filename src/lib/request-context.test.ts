import { describe, expect, it } from "vitest";

import { likelyMobileFromHeaders } from "./request-context";

const PIXEL =
  "Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36";
const IPHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148";
const IPAD =
  "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/605.1.15";
const DESKTOP =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";

describe("likelyMobileFromHeaders", () => {
  it("trusts the mobile client hint over the user agent", () => {
    expect(likelyMobileFromHeaders(new Headers({ "sec-ch-ua-mobile": "?1", "user-agent": DESKTOP }))).toBe(true);
    expect(likelyMobileFromHeaders(new Headers({ "sec-ch-ua-mobile": "?0", "user-agent": PIXEL }))).toBe(false);
  });

  it("falls back to the user agent: phones yes, tablets and desktops no", () => {
    expect(likelyMobileFromHeaders(new Headers({ "user-agent": PIXEL }))).toBe(true);
    expect(likelyMobileFromHeaders(new Headers({ "user-agent": IPHONE }))).toBe(true);
    expect(likelyMobileFromHeaders(new Headers({ "user-agent": IPAD }))).toBe(false);
    expect(likelyMobileFromHeaders(new Headers({ "user-agent": DESKTOP }))).toBe(false);
    expect(likelyMobileFromHeaders(new Headers())).toBe(false);
  });
});
