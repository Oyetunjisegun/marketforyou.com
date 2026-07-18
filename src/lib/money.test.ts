import { afterEach, describe, expect, it } from "vitest";
import { CHARGE_CURRENCY, usdToNgn, usdToNgnRate } from "./money";

const ORIGINAL = process.env.NEXT_PUBLIC_USD_NGN_RATE;

afterEach(() => {
  if (ORIGINAL === undefined) delete process.env.NEXT_PUBLIC_USD_NGN_RATE;
  else process.env.NEXT_PUBLIC_USD_NGN_RATE = ORIGINAL;
});

describe("usdToNgnRate", () => {
  it("falls back to the default when unset", () => {
    delete process.env.NEXT_PUBLIC_USD_NGN_RATE;
    expect(usdToNgnRate()).toBe(1600);
  });

  it("uses a valid override", () => {
    process.env.NEXT_PUBLIC_USD_NGN_RATE = "1750";
    expect(usdToNgnRate()).toBe(1750);
  });

  it("ignores non-positive or non-numeric overrides", () => {
    process.env.NEXT_PUBLIC_USD_NGN_RATE = "0";
    expect(usdToNgnRate()).toBe(1600);
    process.env.NEXT_PUBLIC_USD_NGN_RATE = "-5";
    expect(usdToNgnRate()).toBe(1600);
    process.env.NEXT_PUBLIC_USD_NGN_RATE = "abc";
    expect(usdToNgnRate()).toBe(1600);
  });
});

describe("usdToNgn", () => {
  it("converts and rounds to whole naira", () => {
    process.env.NEXT_PUBLIC_USD_NGN_RATE = "1600";
    expect(usdToNgn(10)).toBe(16000);
    expect(usdToNgn(9.99)).toBe(15984); // 15984.0 -> 15984
  });

  it("rounds fractional kobo away", () => {
    process.env.NEXT_PUBLIC_USD_NGN_RATE = "1601";
    expect(usdToNgn(0.001)).toBe(2); // 1.601 -> 2
  });

  it("charges in NGN", () => {
    expect(CHARGE_CURRENCY).toBe("NGN");
  });
});
