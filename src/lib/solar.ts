// Pure, deterministic solar investment engine. No network, no side effects.
export type Inputs = {
  annualKwhPerKwp: number; // specific yield from PVGIS (kWh/kWp/yr)
  systemKw: number;
  costPerKw: number; // installed cost, € per kWp
  grant: number; // € upfront subsidy
  annualUsageKwh: number;
  importPrice: number; // €/kWh
  exportPrice: number; // €/kWh
  selfUsePct: number; // share of generation consumed on site, 0-100
  priceEscalationPct: number;
  degradationPct: number; // per year
  discountPct: number;
  omPerKwYear: number; // € per kWp per year
  lifetime: number; // years
};

export const DEFAULTS: Omit<Inputs, "annualKwhPerKwp"> = {
  systemKw: 5,
  costPerKw: 1300,
  grant: 0,
  annualUsageKwh: 4500,
  importPrice: 0.25,
  exportPrice: 0.06,
  selfUsePct: 40,
  priceEscalationPct: 2,
  degradationPct: 0.5,
  discountPct: 4,
  omPerKwYear: 15,
  lifetime: 25,
};

export type YearRow = {
  year: number;
  generation: number;
  selfUsed: number;
  exported: number;
  savings: number;
  om: number;
  cashflow: number;
  cumulative: number;
};

export type Result = {
  upfront: number;
  years: YearRow[];
  payback: number | null; // fractional years, null if never
  npv: number;
  irr: number | null; // percent
  totalNet: number;
  year1Generation: number;
  year1Savings: number;
  coveragePct: number;
  lcoe: number; // €/kWh, discounted
};

export function validate(i: Inputs): void {
  const chk = (n: number, lo: number, hi: number, name: string) => {
    if (!Number.isFinite(n) || n < lo || n > hi) throw new RangeError(`Invalid ${name}`);
  };
  chk(i.annualKwhPerKwp, 100, 3000, "yield");
  chk(i.systemKw, 0.5, 1000, "system size");
  chk(i.costPerKw, 100, 10000, "cost");
  chk(i.grant, 0, 1e7, "grant");
  chk(i.annualUsageKwh, 0, 1e8, "usage");
  chk(i.importPrice, 0, 5, "import price");
  chk(i.exportPrice, 0, 5, "export price");
  chk(i.selfUsePct, 0, 100, "self-use");
  chk(i.priceEscalationPct, -10, 20, "escalation");
  chk(i.degradationPct, 0, 5, "degradation");
  chk(i.discountPct, 0, 30, "discount rate");
  chk(i.omPerKwYear, 0, 500, "maintenance");
  if (!Number.isInteger(i.lifetime) || i.lifetime < 1 || i.lifetime > 50) throw new RangeError("Invalid lifetime");
}

export function irr(upfront: number, flows: number[]): number | null {
  const npvAt = (r: number) => flows.reduce((s, cf, t) => s + cf / Math.pow(1 + r, t + 1), -upfront);
  let lo = -0.99, hi = 1;
  if (npvAt(lo) * npvAt(hi) > 0) return null;
  for (let k = 0; k < 200; k++) {
    const mid = (lo + hi) / 2;
    if (npvAt(lo) * npvAt(mid) <= 0) hi = mid; else lo = mid;
  }
  return ((lo + hi) / 2) * 100;
}

export function calculate(i: Inputs): Result {
  validate(i);
  const upfront = Math.max(0, i.systemKw * i.costPerKw - i.grant);
  const rows: YearRow[] = [];
  let cumulative = -upfront;
  let npv = -upfront;
  let payback: number | null = upfront === 0 ? 0 : null;
  let discGen = 0, discCost = upfront;
  for (let y = 1; y <= i.lifetime; y++) {
    const generation = i.annualKwhPerKwp * i.systemKw * Math.pow(1 - i.degradationPct / 100, y - 1);
    // Self-use can never exceed what the household actually consumes.
    const selfUsed = Math.min(generation * (i.selfUsePct / 100), i.annualUsageKwh);
    const exported = generation - selfUsed;
    const esc = Math.pow(1 + i.priceEscalationPct / 100, y - 1);
    const savings = selfUsed * i.importPrice * esc + exported * i.exportPrice * esc;
    const om = i.omPerKwYear * i.systemKw;
    const cashflow = savings - om;
    const prev = cumulative;
    cumulative += cashflow;
    const d = Math.pow(1 + i.discountPct / 100, y);
    npv += cashflow / d;
    discGen += generation / d;
    discCost += om / d;
    if (payback === null && prev < 0 && cumulative >= 0) payback = y - 1 + -prev / cashflow;
    rows.push({ year: y, generation, selfUsed, exported, savings, om, cashflow, cumulative });
  }
  const y1 = rows[0]!;
  return {
    upfront,
    years: rows,
    payback,
    npv,
    irr: irr(upfront, rows.map((r) => r.cashflow)),
    totalNet: cumulative,
    year1Generation: y1.generation,
    year1Savings: y1.savings,
    coveragePct: i.annualUsageKwh > 0 ? Math.min(100, (y1.selfUsed / i.annualUsageKwh) * 100) : 0,
    lcoe: discGen > 0 ? discCost / discGen : 0,
  };
}

export const eur = (n: number, d = 0) =>
  new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR", maximumFractionDigits: d }).format(n);
export const num = (n: number, d = 0) => new Intl.NumberFormat("en-IE", { maximumFractionDigits: d }).format(n);
