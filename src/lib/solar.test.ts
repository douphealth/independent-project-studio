import { describe, expect, it } from "vitest";
import { DEFAULTS, calculate, irr } from "./solar";

const base = { ...DEFAULTS, annualKwhPerKwp: 1500, degradationPct: 0, priceEscalationPct: 0, exportEscalationPct: 0, omPerKwYear: 0, omEscalationPct: 0, inverterReplacementYear: 0 };

describe("solar engine", () => {
  it("upfront subtracts grant from system cost", () => { expect(calculate({ ...base, systemKw: 5, costPerKw: 1000, grant: 1000 }).upfront).toBe(4000); });
  it("payback equals upfront / flat annual saving", () => {
    const r = calculate({ ...base, costPerKw: 1300 });
    expect(r.year1Savings).toBeCloseTo(1020, 6);
    expect(r.payback).toBeCloseTo(6500 / 1020, 6);
  });
  it("self-use never exceeds household consumption", () => { expect(calculate({ ...base, selfUsePct: 90, annualUsageKwh: 2000 }).years[0]!.selfUsed).toBe(2000); });
  it("returns null payback when savings never cover cost", () => { expect(calculate({ ...base, importPrice: 0.01, exportPrice: 0 }).payback).toBeNull(); });
  it("IRR of -100 then 110 is 10%", () => { expect(irr(100, [110])).toBeCloseTo(10, 4); });
  it("rejects invalid inputs", () => { expect(() => calculate({ ...base, systemKw: -1 })).toThrow(RangeError); });
  it("deducts inverter replacement in its selected year and in LCOE", () => {
    const without = calculate({ ...base, inverterReplacementYear: 0 });
    const withReplacement = calculate({ ...base, inverterReplacementYear: 12, inverterReplacementCost: 1200 });
    expect(withReplacement.years[11]!.replacement).toBe(1200);
    expect(withReplacement.totalNet).toBeCloseTo(without.totalNet - 1200, 6);
    expect(withReplacement.lcoe).toBeGreaterThan(without.lcoe);
  });
  it("escalates maintenance independently", () => {
    const r = calculate({ ...base, omPerKwYear: 20, omEscalationPct: 5 });
    expect(r.years[0]!.om).toBe(100);
    expect(r.years[1]!.om).toBeCloseTo(105, 6);
  });
  it("escalates export revenue independently from import prices", () => {
    const flat = calculate({ ...base, selfUsePct: 0, exportEscalationPct: 0 });
    const rising = calculate({ ...base, selfUsePct: 0, exportEscalationPct: 10 });
    expect(rising.years[1]!.savings).toBeCloseTo(flat.years[1]!.savings * 1.1, 6);
  });
});
