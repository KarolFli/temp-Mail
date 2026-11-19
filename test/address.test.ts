import { describe, expect, it } from "vitest";
import { generateLocalPart, isValidLocalPart, parseAddress } from "@/lib/address";

const domains = ["example.com", "mail.example.org"];

describe("parseAddress", () => {
  it("normalizes case and whitespace", () => {
    expect(parseAddress("  John.Doe@Example.COM ", domains)).toEqual({
      local: "john.doe",
      domain: "example.com",
      address: "john.doe@example.com",
    });
  });

  it("rejects domains that are not served", () => {
    expect(parseAddress("john@evil.com", domains)).toBeNull();
  });

  it.each(["", "@example.com", "no-at-sign", ".dot@example.com", "dot.@example.com", "a..b@example.com", "spa ce@example.com", "a<b@example.com"])(
    "rejects invalid input %j",
    (input) => expect(parseAddress(input, domains)).toBeNull(),
  );
});

describe("generateLocalPart", () => {
  it("produces valid, unique local parts", () => {
    const generated = new Set(Array.from({ length: 500 }, generateLocalPart));
    expect(generated.size).toBeGreaterThan(495);
    for (const local of generated) expect(isValidLocalPart(local)).toBe(true);
  });
});
