import { describe, expect, it } from "vitest";
import { DEFAULTS, calculate, irr } from "./solar";

const base = { ...DEFAULTS, annualKwhPerKwp: 1500, degradationPct: 0, priceEscalationPct: 0, omPerKwYear: 0 };

describe("solar engine", () => {
  it("upfront subtracts grant from system cost", () => {
    expect(calculate({ ...base, systemKw: 5, costPerKw: 1000, grant: 1000 }).upfront).toBe(4000);
  });
  it("payback equals upfront / flat annual saving", () => {
    // 5kWp*1500=7500kWh; 40% self=3000*0.25=750; 4500*0.06=270 => 1020/yr; upfront 6500
    const r = calculate({ ...base, costPerKw: 1300 });
    expect(r.year1Savings).toBeCloseTo(1020, 6);
    expect(r.payback).toBeCloseTo(6500 / 1020, 6);
  });
  it("self-use never exceeds household consumption", () => {
    const r = calculate({ ...base, selfUsePct: 90, annualUsageKwh: 2000 });
    expect(r.years[0].selfUsed).toBe(2000);
  });
  it("returns null payback when savings never cover cost", () => {
    expect(calculate({ ...base, importPrice: 0.01, exportPrice: 0 }).payback).toBeNull();
  });
  it("IRR of -100 then 110 is 10%", () => {
    expect(irr(100, [110])).toBeCloseTo(10, 4);
  });
  it("rejects invalid inputs", () => {
    expect(() => calculate({ ...base, systemKw: -1 })).toThrow(RangeError);
  });
});
