import { z } from "zod";
import { DEFAULTS, type Inputs } from "./solar";
import type { Currency } from "./cities";

export type ScenarioPlace = { name: string; country: string; lat: number; lon: number };
export type RoofOptions = { angle: number; aspect: number; loss: number };
export type ScenarioValues = Omit<Inputs, "annualKwhPerKwp">;
export type Scenario = {
  version: 1;
  name: string;
  place: ScenarioPlace;
  values: ScenarioValues;
  roof: RoofOptions;
  currency: Currency;
};

const number = z.number().finite();
const scenarioSchema = z.object({
  version: z.literal(1),
  name: z.string().trim().min(1).max(80),
  place: z.object({ name: z.string().min(1).max(120), country: z.string().max(100), lat: number.min(-60).max(72), lon: number.min(-180).max(180) }),
  values: z.object({
    systemKw: number.min(0.5).max(1000), costPerKw: number.min(100).max(10000), grant: number.min(0).max(1e7),
    annualUsageKwh: number.min(0).max(1e8), importPrice: number.min(0).max(5), exportPrice: number.min(0).max(5),
    selfUsePct: number.min(0).max(100), priceEscalationPct: number.min(-10).max(20), exportEscalationPct: number.min(-10).max(20),
    degradationPct: number.min(0).max(5), discountPct: number.min(0).max(30), omPerKwYear: number.min(0).max(500),
    omEscalationPct: number.min(-10).max(20), inverterReplacementYear: z.number().int().min(0).max(50),
    inverterReplacementCost: number.min(0).max(1e7), lifetime: z.number().int().min(1).max(50),
  }),
  roof: z.object({ angle: number.min(0).max(90), aspect: number.min(-180).max(180), loss: number.min(0).max(40) }),
  currency: z.enum(["EUR", "GBP", "PLN"]),
});

export const DEFAULT_ROOF: RoofOptions = { angle: 30, aspect: 0, loss: 14 };

export function encodeScenario(s: Scenario): string {
  return encodeURIComponent(JSON.stringify(s));
}

export function decodeScenario(raw: unknown): Scenario | null {
  if (typeof raw !== "string" || raw.length > 12000) return null;
  try {
    const parsed = scenarioSchema.safeParse(JSON.parse(decodeURIComponent(raw)));
    return parsed.success ? parsed.data : null;
  } catch { return null; }
}

export function createScenario(place: ScenarioPlace, values: ScenarioValues = { ...DEFAULTS }, roof: RoofOptions = DEFAULT_ROOF, currency: Currency = "EUR", name = "My solar scenario"): Scenario {
  return { version: 1, name, place, values: { ...values }, roof: { ...roof }, currency };
}
