import { z } from "zod";

export type SolarProfile = {
  lat: number;
  lon: number;
  elevation: number | null;
  radiationDb: string;
  period: string;
  angle: number;
  aspect: number;
  loss: number;
  annualKwhPerKwp: number;
  monthly: { month: number; kwh: number; irradiation: number }[];
  yearToYearSdKwh: number | null;
  fetchedAt: string;
  stale: boolean;
};

export type ProfileQuery = { lat: number; lon: number; angle: number; aspect: number; loss: number };
type CacheEntry = { profile: SolarProfile; storedAt: number };
const profileCache = new Map<string, CacheEntry>();
const geoCache = new Map<string, { at: number; results: GeoPlace[] }>();
const FRESH_MS = 24 * 60 * 60 * 1000;

const pvgisSchema = z.object({
  inputs: z.object({
    location: z.object({ elevation: z.number().nullish() }).optional(),
    meteo_data: z.object({ radiation_db: z.string().optional(), year_min: z.number().optional(), year_max: z.number().optional() }).optional(),
  }).optional(),
  outputs: z.object({
    totals: z.object({ fixed: z.object({ E_y: z.number().positive(), SD_y: z.number().nullish() }) }),
    monthly: z.object({ fixed: z.array(z.object({ month: z.number().int().min(1).max(12), E_m: z.number().nonnegative(), "H(i)_m": z.number().nonnegative() })).length(12) }),
  }),
});

const geoSchema = z.object({ results: z.array(z.object({
  name: z.string(), admin1: z.string().optional(), country: z.string().optional(), latitude: z.number(), longitude: z.number(),
})).optional() });
export type GeoPlace = { name: string; country: string; lat: number; lon: number };

function remember(map: Map<string, CacheEntry>, key: string, entry: CacheEntry) {
  if (map.size >= 500) map.delete(map.keys().next().value!);
  map.set(key, entry);
}

export async function fetchSolarProfile(q: ProfileQuery): Promise<SolarProfile> {
  const key = [q.lat.toFixed(4), q.lon.toFixed(4), q.angle, q.aspect, q.loss].join(":");
  const cached = profileCache.get(key);
  if (cached && Date.now() - cached.storedAt < FRESH_MS) return { ...cached.profile, stale: false };
  const u = new URL("https://re.jrc.ec.europa.eu/api/v5_3/PVcalc");
  u.search = new URLSearchParams({ lat: q.lat.toFixed(4), lon: q.lon.toFixed(4), peakpower: "1", loss: String(q.loss), angle: String(q.angle), aspect: String(q.aspect), outputformat: "json" }).toString();
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 12000);
  try {
    const res = await fetch(u, { signal: ctrl.signal, headers: { accept: "application/json" } });
    if (!res.ok) throw new Error(`PVGIS responded ${res.status}`);
    const parsed = pvgisSchema.safeParse(await res.json());
    if (!parsed.success) throw new Error("PVGIS returned an unexpected response");
    const j = parsed.data;
    const md = j.inputs?.meteo_data ?? {};
    const profile: SolarProfile = {
      lat: q.lat, lon: q.lon, elevation: j.inputs?.location?.elevation ?? null,
      radiationDb: md.radiation_db ?? "PVGIS", period: md.year_min ? `${md.year_min}–${md.year_max}` : "",
      angle: q.angle, aspect: q.aspect, loss: q.loss, annualKwhPerKwp: j.outputs.totals.fixed.E_y,
      yearToYearSdKwh: j.outputs.totals.fixed.SD_y ?? null,
      monthly: j.outputs.monthly.fixed.map((m) => ({ month: m.month, kwh: m.E_m, irradiation: m["H(i)_m"] })),
      fetchedAt: new Date().toISOString(), stale: false,
    };
    remember(profileCache, key, { profile, storedAt: Date.now() });
    return profile;
  } catch (error) {
    if (cached) return { ...cached.profile, stale: true };
    throw error;
  } finally { clearTimeout(timer); }
}

export async function fetchGeocode(query: string): Promise<GeoPlace[]> {
  const key = query.trim().toLowerCase();
  const cached = geoCache.get(key);
  if (cached && Date.now() - cached.at < FRESH_MS) return cached.results;
  const u = `https://geocoding-api.open-meteo.com/v1/search?count=6&format=json&name=${encodeURIComponent(query)}`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(u, { signal: ctrl.signal, headers: { accept: "application/json" } });
    if (!res.ok) throw new Error("Geocoding unavailable");
    const parsed = geoSchema.safeParse(await res.json());
    if (!parsed.success) throw new Error("Unexpected geocoding response");
    const results = (parsed.data.results ?? []).map((r) => ({ name: [r.name, r.admin1].filter(Boolean).join(", "), country: r.country ?? "", lat: r.latitude, lon: r.longitude }));
    if (geoCache.size >= 200) geoCache.delete(geoCache.keys().next().value!);
    geoCache.set(key, { at: Date.now(), results });
    return results;
  } catch (error) {
    if (cached) return cached.results;
    throw error;
  } finally { clearTimeout(timer); }
}

export async function fetchDirectoryProfiles(places: { slug: string; lat: number; lon: number }[]) {
  const out: { slug: string; profile: SolarProfile | null }[] = [];
  let cursor = 0;
  async function worker() {
    while (cursor < places.length) {
      const place = places[cursor++]!;
      try { out.push({ slug: place.slug, profile: await fetchSolarProfile({ lat: place.lat, lon: place.lon, angle: 30, aspect: 0, loss: 14 }) }); }
      catch { out.push({ slug: place.slug, profile: null }); }
    }
  }
  await Promise.all(Array.from({ length: Math.min(6, places.length) }, worker));
  return out;
}
