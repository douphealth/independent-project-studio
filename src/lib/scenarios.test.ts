import { describe, expect, it } from "vitest";
import { createScenario, decodeScenario, encodeScenario } from "./scenarios";

const scenario = createScenario({ name: "Athens", country: "Greece", lat: 37.9838, lon: 23.7275 }, undefined, undefined, "EUR", "Quote A");

describe("shareable scenarios", () => {
  it("round-trips every assumption through a URL-safe value", () => {
    const encoded = encodeScenario(scenario);
    expect(encoded).not.toContain("{");
    expect(decodeScenario(encoded)).toEqual(scenario);
  });
  it("rejects malformed or out-of-range scenarios", () => {
    expect(decodeScenario("not-json")).toBeNull();
    expect(decodeScenario(encodeURIComponent(JSON.stringify({ ...scenario, values: { ...scenario.values, systemKw: -2 } })))).toBeNull();
  });
});
