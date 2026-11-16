import { calculate, money, num } from "./solar";
import type { SolarProfile } from "./pvgis.functions";
import type { Scenario } from "./scenarios";

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportScenarioCsv(scenario: Scenario, profile: SolarProfile) {
  const result = calculate({ ...scenario.values, annualKwhPerKwp: profile.annualKwhPerKwp });
  const lines = [
    ["SolarPayback scenario", scenario.name], ["Location", `${scenario.place.name}, ${scenario.place.country}`],
    ["Coordinates", `${scenario.place.lat}, ${scenario.place.lon}`], ["PVGIS database", profile.radiationDb],
    ["PVGIS period", profile.period], ["Retrieved", profile.fetchedAt], ["Annual yield kWh/kWp", profile.annualKwhPerKwp],
    ["Tilt degrees", profile.angle], ["Aspect degrees", profile.aspect], ["System losses %", profile.loss],
    ["Currency", scenario.currency], ["Payback years", result.payback ?? "Not within lifetime"], ["NPV", result.npv], ["IRR %", result.irr ?? "Not available"], [],
    ["Year", "Generation kWh", "Self-used kWh", "Exported kWh", "Savings", "Maintenance", "Replacement", "Net cash flow", "Cumulative"],
    ...result.years.map((r) => [r.year, r.generation, r.selfUsed, r.exported, r.savings, r.om, r.replacement, r.cashflow, r.cumulative]),
  ];
  const csv = lines.map((row) => row.map((v) => `"${String(v ?? "").replaceAll('"', '""')}"`).join(",")).join("\n");
  download(new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" }), `${scenario.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "solar-scenario"}.csv`);
}

export async function exportScenarioPdf(scenario: Scenario, profile: SolarProfile) {
  const { jsPDF } = await import("jspdf");
  const result = calculate({ ...scenario.values, annualKwhPerKwp: profile.annualKwhPerKwp });
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const c = scenario.currency;
  doc.setTextColor(28, 34, 51); doc.setFont("helvetica", "bold"); doc.setFontSize(24); doc.text("SolarPayback", 18, 22);
  doc.setFontSize(16); doc.text(scenario.name, 18, 34);
  doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(80, 80, 80);
  doc.text(`${scenario.place.name}, ${scenario.place.country} | ${scenario.place.lat.toFixed(4)}, ${scenario.place.lon.toFixed(4)}`, 18, 43);
  doc.setDrawColor(220, 120, 20); doc.line(18, 49, 192, 49);
  doc.setTextColor(28, 34, 51); doc.setFontSize(12); doc.setFont("helvetica", "bold"); doc.text("Investment summary", 18, 61);
  const summary: [string, string][] = [
    ["Estimated payback", result.payback == null ? `Not within ${scenario.values.lifetime} years` : `${num(result.payback, 1)} years`],
    ["Upfront cost", money(result.upfront, c)], ["Year-1 savings", money(result.year1Savings, c)],
    [`${scenario.values.lifetime}-year net gain`, money(result.totalNet, c)], [`NPV at ${scenario.values.discountPct}%`, money(result.npv, c)],
    ["IRR", result.irr == null ? "Not available" : `${num(result.irr, 1)}%`], ["Year-1 generation", `${num(result.year1Generation)} kWh`],
    ["Bill covered by solar", `${num(result.coveragePct)}%`], ["Discounted cost per solar kWh", money(result.lcoe, c, 3)],
  ];
  doc.setFontSize(10);
  summary.forEach(([label, value], i) => { const y = 72 + i * 8; doc.setFont("helvetica", "normal"); doc.text(label, 18, y); doc.setFont("helvetica", "bold"); doc.text(value, 105, y); });
  let y = 151;
  doc.setFont("helvetica", "bold"); doc.setFontSize(12); doc.text("System and solar assumptions", 18, y); y += 10;
  const assumptions = [
    `System: ${scenario.values.systemKw} kWp at ${money(scenario.values.costPerKw, c)}/kWp; grant: ${money(scenario.values.grant, c)}`,
    `PVGIS: ${profile.radiationDb} (${profile.period}); ${num(profile.annualKwhPerKwp)} kWh/kWp/year`,
    `Roof: ${profile.angle} degrees tilt, ${profile.aspect} degrees aspect, ${profile.loss}% system losses`,
    `Self-use: ${scenario.values.selfUsePct}%; import: ${money(scenario.values.importPrice, c, 2)}/kWh; export: ${money(scenario.values.exportPrice, c, 2)}/kWh`,
    `Degradation: ${scenario.values.degradationPct}%/year; lifetime: ${scenario.values.lifetime} years`,
    `Inverter replacement: ${scenario.values.inverterReplacementYear ? `year ${scenario.values.inverterReplacementYear}, ${money(scenario.values.inverterReplacementCost, c)}` : "not modelled"}`,
    `Data retrieved: ${profile.fetchedAt.slice(0, 10)}${profile.stale ? " (cached fallback)" : ""}`,
  ];
  doc.setFont("helvetica", "normal"); doc.setFontSize(9); assumptions.forEach((line) => { doc.text(line, 18, y, { maxWidth: 174 }); y += 8; });
  y += 5; doc.setFont("helvetica", "bold"); doc.setFontSize(12); doc.text("Annual cash-flow ledger", 18, y); y += 8;
  doc.setFontSize(8); doc.text("Year", 18, y); doc.text("Generation", 40, y); doc.text("Savings", 75, y); doc.text("Net flow", 110, y); doc.text("Cumulative", 145, y); y += 4;
  doc.setFont("helvetica", "normal");
  for (const row of result.years) {
    if (y > 274) { doc.addPage(); y = 20; }
    doc.text(String(row.year), 18, y); doc.text(`${num(row.generation)} kWh`, 40, y); doc.text(money(row.savings, c), 75, y); doc.text(money(row.cashflow, c), 110, y); doc.text(money(row.cumulative, c), 145, y); y += 7;
  }
  if (y > 260) { doc.addPage(); y = 22; } else y += 8;
  doc.setFontSize(8); doc.setTextColor(100, 100, 100);
  doc.text("Estimate only — not financial, tax or engineering advice. Hourly usage, shading, structural suitability and future tariffs require separate assessment. Battery dispatch is not simulated.", 18, y, { maxWidth: 174 });
  doc.save(`${scenario.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "solar-scenario"}.pdf`);
}
