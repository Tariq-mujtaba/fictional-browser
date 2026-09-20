import { describe, expect, it } from "vitest";
import { parseFictionalAddress } from "./fictional-address";

describe("parseFictionalAddress", () => {
  it("normalizes valid fictional addresses", () => {
    expect(parseFictionalAddress("  Lantern-Room.ZZ ")).toBe(
      "lantern-room.zz",
    );
  });

  it.each([
    "lantern",
    "https://lantern.zz",
    "two.parts.zz",
    "-lantern.zz",
    "lantern-.zz",
    `${"a".repeat(64)}.zz`,
  ])("rejects %s", (value) => {
    expect(parseFictionalAddress(value)).toBeNull();
  });
});
