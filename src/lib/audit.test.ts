import { describe, expect, it } from "vitest";
import { breakEvenCostPerKw, CONTRACT_ITEMS, installerQuestions, runAudit, type AuditInput } from "./audit";
import { DEFAULTS, calculate } from "./solar";

const all = Object.fromEntries(CONTRACT_ITEMS.map((c) => [c.key, true]));
const base = { ...DEFAULTS, annualKwhPerKwp: 1500 }; // 7,500 kWh/yr for 5 kWp
const mk = (o: Partial<AuditInput> = {}): AuditInput => ({ base, claimedAnnualKwh: 7500, claimedPaybackYears: 0, claimedYear1Savings: 0, yearToYearSdKwhPerKwp: null, battery: null, otherQuoteCostPerKw: [], contract: all, ...o });

describe("quote audit", () => {
  it("flags a yield claim more than 12% above PVGIS as a fail", () => {
    const r = runAudit(mk({ claimedAnnualKwh: 8500 }));
    expect(r.yieldGapPct).toBeCloseTo(13.33, 1);
    expect(r.findings.find((f) => f.area === "Yield")?.severity).toBe("fail");
  });
  it("treats a claim within 5% as consistent", () => {
    expect(runAudit(mk({ claimedAnnualKwh: 7700 })).findings.find((f) => f.area === "Yield")?.severity).toBe("pass");
  });
  it("flags a payback claim more than 3 years shorter than the model", () => {
    const real = calculate(base).payback!;
    const r = runAudit(mk({ claimedPaybackYears: Math.max(1, Math.floor(real - 4)) }));
    expect(r.findings.find((f) => f.area === "Payback")?.severity).toBe("fail");
  });
  it("ranks price only against the user's own quotes", () => {
    const r = runAudit(mk({ otherQuoteCostPerKw: [1000] }));
    expect(r.priceRank).toMatchObject({ position: 2, of: 2, cheapest: 1000 });
    expect(r.priceRank!.diffToCheapestPct).toBeCloseTo(30, 5);
    expect(runAudit(mk()).priceRank).toBeNull();
  });
  it("break-even cost gives NPV of about zero", () => {
    const be = breakEvenCostPerKw(base)!;
    expect(Math.abs(calculate({ ...base, costPerKw: be }).npv)).toBeLessThan(1);
  });
  it("battery marginal cost equals battery price", () => {
    const r = runAudit(mk({ battery: { cost: 5000, selfUsePctWith: 70 } }));
    expect(r.battery!.marginalCost).toBeCloseTo(5000, 5);
    expect(r.battery!.marginalYear1Saving).toBeGreaterThan(0);
  });
  it("missing critical contract items lower the score and generate questions", () => {
    const full = runAudit(mk());
    const weak = runAudit(mk({ contract: {} }));
    expect(weak.score).toBeLessThan(full.score);
    expect(weak.contractScore.missingCritical).toHaveLength(6);
    expect(installerQuestions(weak).length).toBeGreaterThanOrEqual(10);
  });
  it("credible quote with full protections grades A", () => {
    expect(runAudit(mk()).grade).toBe("A");
  });
});
