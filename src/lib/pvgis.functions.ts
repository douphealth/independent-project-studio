import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type SolarProfile = {
  lat: number;
  lon: number;
  elevation: number | null;
  radiationDb: string;
  period: string;
  angle: number;
  aspect: number;
  annualKwhPerKwp: number;
  monthly: { month: number; kwh: number; irradiation: number }[];
  yearToYearSdKwh: number | null;
  fetchedAt: string;
};

const input = z.object({
  lat: z.number().min(-60).max(72),
  lon: z.number().min(-180).max(180),
  angle: z.number().min(0).max(90).default(30),
  aspect: z.number().min(-180).max(180).default(0),
  loss: z.number().min(0).max(40).default(14),
});

export const getSolarProfile = createServerFn({ method: "GET" })
  .inputValidator((d: z.input<typeof input>) => input.parse(d))
  .handler(async ({ data }): Promise<SolarProfile> => {
    const u = new URL("https://re.jrc.ec.europa.eu/api/v5_3/PVcalc");
    u.search = new URLSearchParams({
      lat: data.lat.toFixed(4), lon: data.lon.toFixed(4), peakpower: "1",
      loss: String(data.loss), angle: String(data.angle), aspect: String(data.aspect), outputformat: "json",
    }).toString();
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 12000);
    try {
      const res = await fetch(u, { signal: ctrl.signal, headers: { accept: "application/json" } });
      if (!res.ok) throw new Error(`PVGIS responded ${res.status}`);
      const j: any = await res.json();
      const md = j.inputs?.meteo_data ?? {};
      return {
        lat: data.lat, lon: data.lon,
        elevation: j.inputs?.location?.elevation ?? null,
        radiationDb: md.radiation_db ?? "PVGIS",
        period: md.year_min ? `${md.year_min}–${md.year_max}` : "",
        angle: data.angle, aspect: data.aspect,
        annualKwhPerKwp: j.outputs.totals.fixed.E_y,
        yearToYearSdKwh: j.outputs.totals.fixed.SD_y ?? null,
        monthly: j.outputs.monthly.fixed.map((m: any) => ({ month: m.month, kwh: m.E_m, irradiation: m["H(i)_m"] })),
        fetchedAt: new Date().toISOString(),
      };
    } finally {
      clearTimeout(t);
    }
  });

const geoInput = z.object({ q: z.string().trim().min(2).max(80) });
export const geocode = createServerFn({ method: "GET" })
  .inputValidator((d: z.input<typeof geoInput>) => geoInput.parse(d))
  .handler(async ({ data }) => {
    const u = `https://geocoding-api.open-meteo.com/v1/search?count=6&format=json&name=${encodeURIComponent(data.q)}`;
    const res = await fetch(u);
    if (!res.ok) return [] as { name: string; country: string; lat: number; lon: number }[];
    const j: any = await res.json();
    return ((j.results ?? []) as any[]).map((r) => ({
      name: [r.name, r.admin1].filter(Boolean).join(", "), country: r.country ?? "", lat: r.latitude, lon: r.longitude,
    }));
  });
