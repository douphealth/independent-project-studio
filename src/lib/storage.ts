import type { Scenario } from "./scenarios";
import type { SolarProfile } from "./pvgis.functions";

export type SavedScenario = Scenario & { id: string; updatedAt: string; profile?: SolarProfile };
const KEY = "solarpayback.scenarios.v1";

export function listScenarios(): SavedScenario[] {
  if (typeof window === "undefined") return [];
  try {
    const rows = JSON.parse(window.localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(rows) ? rows.filter((r) => r && typeof r.id === "string" && r.version === 1) : [];
  } catch { return []; }
}

export function saveScenario(scenario: Scenario, id?: string, profile?: SolarProfile): SavedScenario {
  const saved: SavedScenario = { ...scenario, id: id ?? `s-${Date.now().toString(36)}`, updatedAt: new Date().toISOString(), ...(profile ? { profile } : {}) };
  const rows = listScenarios();
  const index = rows.findIndex((r) => r.id === saved.id);
  if (index >= 0) rows[index] = saved; else rows.unshift(saved);
  window.localStorage.setItem(KEY, JSON.stringify(rows.slice(0, 30)));
  return saved;
}

export function deleteScenario(id: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(listScenarios().filter((s) => s.id !== id)));
}
