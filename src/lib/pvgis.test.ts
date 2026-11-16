import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchSolarProfile } from "./pvgis.server";

const payload = {
  inputs: { location: { elevation: 100 }, meteo_data: { radiation_db: "PVGIS-SARAH3", year_min: 2005, year_max: 2023 } },
  outputs: {
    totals: { fixed: { E_y: 1500, SD_y: 30 } },
    monthly: { fixed: Array.from({ length: 12 }, (_, i) => ({ month: i + 1, E_m: 125, "H(i)_m": 140 })) },
  },
};
const query = { lat: 12.3456, lon: 23.4567, angle: 30, aspect: 0, loss: 14 };

afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe("PVGIS validation and resilience", () => {
  it("validates and returns a complete solar profile", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => payload }));
    const profile = await fetchSolarProfile(query);
    expect(profile.annualKwhPerKwp).toBe(1500);
    expect(profile.monthly).toHaveLength(12);
    expect(profile.stale).toBe(false);
  });
  it("serves a stale cached profile when a refresh fails", async () => {
    const now = Date.now();
    vi.spyOn(Date, "now").mockReturnValue(now);
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => payload });
    vi.stubGlobal("fetch", fetchMock);
    await fetchSolarProfile({ ...query, lat: 23.4567 });
    vi.spyOn(Date, "now").mockReturnValue(now + 25 * 60 * 60 * 1000);
    fetchMock.mockRejectedValueOnce(new Error("offline"));
    const profile = await fetchSolarProfile({ ...query, lat: 23.4567 });
    expect(profile.stale).toBe(true);
    expect(profile.annualKwhPerKwp).toBe(1500);
  });
  it("rejects malformed data rather than inventing a yield", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ outputs: {} }) }));
    await expect(fetchSolarProfile({ ...query, lat: 34.5678 })).rejects.toThrow("unexpected response");
  });
});
