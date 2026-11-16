// Pure quote-audit engine. Compares installer claims against PVGIS and the shared financial model.
// No invented market benchmarks: every check uses PVGIS, the user's own figures or explicit model maths.
import { calculate, type Inputs, type Result } from "./solar";

export type ContractKey =
  | "itemised" | "panelWarranty" | "inverterWarranty" | "workmanship" | "performanceGuarantee"
  | "shadingSurvey" | "gridIncluded" | "accessIncluded" | "stagedPayment" | "monitoring";

export const CONTRACT_ITEMS: { key: ContractKey; label: string; why: string; critical: boolean }[] = [
  { key: "itemised", label: "Itemised quote (panels, inverter, mounting, labour, electrical)", why: "Without line items you cannot compare quotes like-for-like or spot padding.", critical: true },
  { key: "panelWarranty", label: "Panel product and performance warranty stated (brand, model, years, % output)", why: "Degradation assumptions are only as good as the written performance warranty.", critical: true },
  { key: "inverterWarranty", label: "Inverter model and warranty term stated", why: "The inverter is the component most likely to need replacement within the system life.", critical: true },
  { key: "workmanship", label: "Installer workmanship / roof-penetration warranty", why: "Leaks and mounting faults are excluded from manufacturer warranties.", critical: true },
  { key: "performanceGuarantee", label: "Written annual generation estimate with method and shading assumption", why: "A number with no method cannot be held to account.", critical: false },
  { key: "shadingSurvey", label: "Site shading survey performed (on-site or 3D)", why: "Shading is the largest source of error versus satellite estimates.", critical: false },
  { key: "gridIncluded", label: "Grid / network connection paperwork and meter changes included", why: "Excluded grid work is a frequent post-signature extra.", critical: true },
  { key: "accessIncluded", label: "Scaffolding / access equipment included in the price", why: "Access is often quoted separately after acceptance.", critical: false },
  { key: "stagedPayment", label: "Staged payment — balance due only after commissioning", why: "Full prepayment leaves you exposed if the installer fails.", critical: true },
  { key: "monitoring", label: "Monitoring included so you can verify output", why: "You cannot enforce a generation estimate you cannot measure.", critical: false },
];

export type AuditInput = {
  base: Inputs;
  claimedAnnualKwh: number; // 0 = not stated
  claimedPaybackYears: number; // 0 = not stated
  claimedYear1Savings: number; // 0 = not stated
  yearToYearSdKwhPerKwp: number | null;
  battery: { cost: number; selfUsePctWith: number } | null; // null = no battery quoted
  otherQuoteCostPerKw: number[]; // user's competing quotes; never invented benchmarks
  contract: Partial<Record<ContractKey, boolean>>;
};

export type Severity = "pass" | "caution" | "fail";
export type Finding = { area: string; severity: Severity; title: string; detail: string };

export type AuditResult = {
  score: number; // 0..100
  grade: "A" | "B" | "C" | "D" | "E";
  verdict: string;
  findings: Finding[];
  model: Result;
  pvgisAnnualKwh: number;
  yieldGapPct: number | null; // claim vs PVGIS, positive = installer more optimistic
  claimedYieldPerKwp: number | null;
  paybackGapYears: number | null;
  savingsGapPct: number | null;
  claimModel: Result | null; // economics if installer's yield claim were true
  scenarios: { label: string; payback: number | null; npv: number; totalNet: number }[];
  battery: null | { withBattery: Result; marginalCost: number; marginalYear1Saving: number; simplePayback: number | null; npvDelta: number; verdict: Severity };
  priceRank: null | { position: number; of: number; cheapest: number; dearest: number; diffToCheapestPct: number };
  breakEvenCostPerKw: number | null; // max cost/kWp that still pays back within lifetime
  contractScore: { met: number; total: number; missingCritical: string[]; missing: string[] };
};

const pct = (a: number, b: number) => ((a - b) / b) * 100;

/** Highest installed cost per kWp at which the system still has NPV >= 0 (bisection on the pure model). */
export function breakEvenCostPerKw(base: Inputs): number | null {
  const npvAt = (c: number) => calculate({ ...base, costPerKw: c }).npv;
  let lo = 100, hi = 10000;
  if (npvAt(lo) < 0) return null;
  if (npvAt(hi) >= 0) return hi;
  for (let k = 0; k < 60; k++) { const m = (lo + hi) / 2; if (npvAt(m) >= 0) lo = m; else hi = m; }
  return lo;
}

export function runAudit(a: AuditInput): AuditResult {
  const model = calculate(a.base);
  const findings: Finding[] = [];
  let score = 100;
  const pvgisAnnualKwh = model.year1Generation;

  // 1. Yield claim vs PVGIS satellite baseline
  let yieldGapPct: number | null = null, claimedYieldPerKwp: number | null = null, claimModel: Result | null = null;
  if (a.claimedAnnualKwh > 0) {
    yieldGapPct = pct(a.claimedAnnualKwh, pvgisAnnualKwh);
    claimedYieldPerKwp = a.claimedAnnualKwh / a.base.systemKw;
    const sdPct = a.yearToYearSdKwhPerKwp && a.base.annualKwhPerKwp ? (a.yearToYearSdKwhPerKwp / a.base.annualKwhPerKwp) * 100 : 0;
    if (claimedYieldPerKwp >= 100 && claimedYieldPerKwp <= 3000) claimModel = calculate({ ...a.base, annualKwhPerKwp: claimedYieldPerKwp });
    if (yieldGapPct > 12) { score -= 25; findings.push({ area: "Yield", severity: "fail", title: `Generation claim is ${yieldGapPct.toFixed(1)}% above PVGIS`, detail: `The quote promises ${Math.round(a.claimedAnnualKwh)} kWh/yr; PVGIS long-term data for this roof gives ${Math.round(pvgisAnnualKwh)} kWh/yr${sdPct ? ` (normal year-to-year variation ±${sdPct.toFixed(1)}%)` : ""}. Ask the installer for their software, irradiance source, loss and shading assumptions in writing.` }); }
    else if (yieldGapPct > 5) { score -= 10; findings.push({ area: "Yield", severity: "caution", title: `Generation claim is ${yieldGapPct.toFixed(1)}% above PVGIS`, detail: `Moderately optimistic. Check whether the installer used lower system losses than the ${a.base.annualKwhPerKwp ? "modelled" : ""} PVGIS scenario, and whether the claim is for year 1 only.` }); }
    else findings.push({ area: "Yield", severity: "pass", title: yieldGapPct < -5 ? `Generation claim is conservative (${yieldGapPct.toFixed(1)}% vs PVGIS)` : "Generation claim is consistent with PVGIS", detail: `Claim ${Math.round(a.claimedAnnualKwh)} kWh/yr vs PVGIS ${Math.round(pvgisAnnualKwh)} kWh/yr.` });
  } else { score -= 8; findings.push({ area: "Yield", severity: "caution", title: "No annual generation figure stated", detail: "A quote without a written generation estimate cannot be verified. Request one with the method used." }); }

  // 2. Payback claim
  let paybackGapYears: number | null = null;
  if (a.claimedPaybackYears > 0) {
    if (model.payback == null) { score -= 25; findings.push({ area: "Payback", severity: "fail", title: `Claimed ${a.claimedPaybackYears}-year payback is not reached within ${a.base.lifetime} years`, detail: "With your tariff, self-use and costs the model never recovers the investment. The claim likely assumes higher self-consumption, tariffs or yield." }); }
    else {
      paybackGapYears = model.payback - a.claimedPaybackYears;
      if (paybackGapYears > 3) { score -= 20; findings.push({ area: "Payback", severity: "fail", title: `Payback claim is ${paybackGapYears.toFixed(1)} years too short`, detail: `Claimed ${a.claimedPaybackYears} yrs; independent model ${model.payback.toFixed(1)} yrs. Ask which self-consumption %, tariff escalation and maintenance costs were assumed.` }); }
      else if (paybackGapYears > 1) { score -= 8; findings.push({ area: "Payback", severity: "caution", title: `Payback claim is ${paybackGapYears.toFixed(1)} years optimistic`, detail: `Claimed ${a.claimedPaybackYears} yrs vs model ${model.payback.toFixed(1)} yrs.` }); }
      else findings.push({ area: "Payback", severity: "pass", title: "Payback claim is realistic", detail: `Claimed ${a.claimedPaybackYears} yrs vs model ${model.payback.toFixed(1)} yrs.` });
    }
  }

  // 3. Year-1 savings claim
  let savingsGapPct: number | null = null;
  if (a.claimedYear1Savings > 0 && model.year1Savings > 0) {
    savingsGapPct = pct(a.claimedYear1Savings, model.year1Savings);
    if (savingsGapPct > 25) { score -= 15; findings.push({ area: "Savings", severity: "fail", title: `Year-1 savings claim is ${savingsGapPct.toFixed(0)}% above the model`, detail: "Savings claims often value all generation at the import price. Exported energy usually earns far less." }); }
    else if (savingsGapPct > 10) { score -= 6; findings.push({ area: "Savings", severity: "caution", title: `Year-1 savings claim is ${savingsGapPct.toFixed(0)}% above the model`, detail: "Check the self-consumption share and export rate the installer assumed." }); }
    else findings.push({ area: "Savings", severity: "pass", title: "Year-1 savings claim is consistent", detail: `${savingsGapPct >= 0 ? "+" : ""}${savingsGapPct.toFixed(0)}% versus the model.` });
  }

  // 4. Self-consumption realism (physical bound: cannot self-use more than demand)
  const gen = pvgisAnnualKwh;
  if (a.base.selfUsePct > 60 && !a.battery) { score -= 6; findings.push({ area: "Self-use", severity: "caution", title: `${a.base.selfUsePct}% self-consumption without a battery is ambitious`, detail: "Homes without storage or significant daytime load typically self-consume well under half of generation. Test a lower value." }); }
  if (a.base.annualUsageKwh > 0 && gen > a.base.annualUsageKwh * 1.5) { score -= 5; findings.push({ area: "Sizing", severity: "caution", title: `System generates ${(gen / a.base.annualUsageKwh * 100).toFixed(0)}% of your annual use`, detail: "Most extra generation is exported at the lower export rate. A smaller system may give a better return." }); }

  // 5. Profitability & downside scenarios
  const mk = (label: string, o: Partial<Inputs>) => { const r = calculate({ ...a.base, ...o }); return { label, payback: r.payback, npv: r.npv, totalNet: r.totalNet }; };
  const scenarios = [
    mk("Base case", {}),
    mk("Yield −10% (shading / weather)", { annualKwhPerKwp: a.base.annualKwhPerKwp * 0.9 }),
    mk("Electricity prices flat (0% escalation)", { priceEscalationPct: 0, exportEscalationPct: 0 }),
    mk("Self-use −15 points", { selfUsePct: Math.max(0, a.base.selfUsePct - 15) }),
    mk("Cost overrun +15%", { costPerKw: a.base.costPerKw * 1.15 }),
    mk("Combined stress", { annualKwhPerKwp: a.base.annualKwhPerKwp * 0.9, priceEscalationPct: 0, exportEscalationPct: 0, selfUsePct: Math.max(0, a.base.selfUsePct - 15) }),
  ];
  if (model.npv < 0) { score -= 20; findings.push({ area: "Return", severity: "fail", title: "Negative NPV at your discount rate", detail: `At ${a.base.discountPct}% the investment destroys value. Negotiate price or reconsider size.` }); }
  else if (scenarios[5]!.npv < 0) { score -= 7; findings.push({ area: "Return", severity: "caution", title: "Return turns negative under combined stress", detail: "The project only works if yield, prices and self-use all hold. Build in a margin of safety." }); }
  else findings.push({ area: "Return", severity: "pass", title: "Positive return survives combined stress test", detail: "NPV stays positive with 10% lower yield, flat prices and lower self-use." });

  const be = breakEvenCostPerKw(a.base);
  if (be != null && a.base.costPerKw > be) findings.push({ area: "Price", severity: "fail", title: "Quoted price exceeds the break-even price", detail: `The maximum cost at which NPV ≥ 0 is ≈${Math.round(be)} per kWp; the quote is ${Math.round(a.base.costPerKw)}.` });

  // 6. Price vs user's own competing quotes
  let priceRank: AuditResult["priceRank"] = null;
  const others = a.otherQuoteCostPerKw.filter((c) => c > 0);
  if (others.length) {
    const all = [...others, a.base.costPerKw].sort((x, y) => x - y);
    const cheapest = all[0]!, dearest = all[all.length - 1]!;
    const diff = pct(a.base.costPerKw, cheapest);
    priceRank = { position: all.indexOf(a.base.costPerKw) + 1, of: all.length, cheapest, dearest, diffToCheapestPct: diff };
    if (diff > 20) { score -= 10; findings.push({ area: "Price", severity: "fail", title: `${diff.toFixed(0)}% dearer per kWp than your cheapest quote`, detail: "Ask for an itemised justification (panel/inverter brand, mounting, extras) or use the cheaper quote as leverage." }); }
    else if (diff > 8) { score -= 4; findings.push({ area: "Price", severity: "caution", title: `${diff.toFixed(0)}% dearer per kWp than your cheapest quote`, detail: "Compare component specifications before choosing." }); }
    else findings.push({ area: "Price", severity: "pass", title: diff === 0 ? "Cheapest of your quotes per kWp" : "Competitively priced against your other quotes", detail: `${priceRank.position} of ${priceRank.of} by cost per kWp.` });
  }

  // 7. Battery marginal economics
  let battery: AuditResult["battery"] = null;
  if (a.battery && a.battery.cost > 0) {
    const withBattery = calculate({ ...a.base, grant: a.base.grant - a.battery.cost < 0 ? 0 : a.base.grant, costPerKw: a.base.costPerKw + (a.base.grant - a.battery.cost < 0 ? a.battery.cost - a.base.grant : a.battery.cost) / a.base.systemKw - (a.base.grant - a.battery.cost < 0 ? a.base.grant / a.base.systemKw : 0), selfUsePct: a.battery.selfUsePctWith });
    const marginalCost = withBattery.upfront - model.upfront;
    const marginalYear1Saving = withBattery.year1Savings - model.year1Savings;
    const simplePayback = marginalYear1Saving > 0 ? marginalCost / marginalYear1Saving : null;
    const npvDelta = withBattery.npv - model.npv;
    const verdict: Severity = npvDelta >= 0 ? "pass" : simplePayback != null && simplePayback < a.base.lifetime * 0.6 ? "caution" : "fail";
    battery = { withBattery, marginalCost, marginalYear1Saving, simplePayback, npvDelta, verdict };
    if (verdict === "fail") score -= 10;
    findings.push({ area: "Battery", severity: verdict, title: npvDelta >= 0 ? "Battery adds value" : "Battery reduces the overall return", detail: `Adds ${Math.round(marginalYear1Saving)} in year-1 savings for ${Math.round(marginalCost)} extra; simple battery payback ${simplePayback == null ? "never" : simplePayback.toFixed(1) + " yrs"}; NPV change ${npvDelta >= 0 ? "+" : ""}${Math.round(npvDelta)}. Battery warranties are usually shorter than panel life.` });
  }

  // 8. Contract protections
  const missing = CONTRACT_ITEMS.filter((c) => !a.contract[c.key]);
  const missingCritical = missing.filter((c) => c.critical).map((c) => c.label);
  score -= missingCritical.length * 4 + (missing.length - missingCritical.length) * 2;
  if (missingCritical.length) findings.push({ area: "Contract", severity: "fail", title: `${missingCritical.length} critical contract protection${missingCritical.length > 1 ? "s" : ""} missing`, detail: missingCritical.join("; ") + "." });
  else if (missing.length) findings.push({ area: "Contract", severity: "caution", title: `${missing.length} recommended protection${missing.length > 1 ? "s" : ""} missing`, detail: missing.map((m) => m.label).join("; ") + "." });
  else findings.push({ area: "Contract", severity: "pass", title: "All ten contract protections confirmed", detail: "Keep the signed documents and warranty registrations together." });

  score = Math.max(0, Math.min(100, Math.round(score)));
  const grade = score >= 85 ? "A" : score >= 70 ? "B" : score >= 55 ? "C" : score >= 40 ? "D" : "E";
  const fails = findings.filter((f) => f.severity === "fail").length;
  const verdict = grade === "A" ? "Strong quote: claims are credible and the economics hold under stress." : grade === "B" ? "Good quote with points to clarify before signing." : grade === "C" ? `Proceed only after resolving ${fails || "the"} flagged issue${fails === 1 ? "" : "s"}.` : grade === "D" ? "Significant problems: renegotiate or obtain alternative quotes." : "Do not sign as quoted: claims or economics do not stand up.";
  return { score, grade, verdict, findings, model, pvgisAnnualKwh, yieldGapPct, claimedYieldPerKwp, paybackGapYears, savingsGapPct, claimModel, scenarios, battery, priceRank, breakEvenCostPerKw: be, contractScore: { met: CONTRACT_ITEMS.length - missing.length, total: CONTRACT_ITEMS.length, missingCritical, missing: missing.map((m) => m.label) } };
}

/** Questions to send the installer, generated from the failed/caution findings. */
export function installerQuestions(r: AuditResult): string[] {
  const q: string[] = [];
  const has = (area: string, s: Severity[] = ["fail", "caution"]) => r.findings.some((f) => f.area === area && s.includes(f.severity));
  if (has("Yield")) q.push("Which software and irradiance database produced your generation estimate, and what system-loss and shading values did you use?");
  if (has("Payback") || has("Savings")) q.push("Please list the self-consumption %, import tariff, export rate and annual price escalation behind your payback and savings figures.");
  if (has("Price")) q.push("Please itemise the price: panel and inverter make/model, mounting system, labour, electrical work, access and grid connection.");
  if (has("Battery")) q.push("What self-consumption rate do you expect with and without the battery, and what is the battery's warranted cycle count and end-of-warranty capacity?");
  if (has("Sizing") || has("Self-use")) q.push("What would a smaller system matched to my daytime demand cost, and how would payback change?");
  if (has("Return")) q.push("Can you offer a lower price or a staged payment schedule that improves the return?");
  r.contractScore.missing.forEach((m) => q.push(`Please confirm in writing: ${m.charAt(0).toLowerCase() + m.slice(1)}.`));
  return q;
}
