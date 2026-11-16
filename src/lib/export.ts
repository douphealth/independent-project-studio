import { calculate, money, num } from "./solar";
import type { SolarProfile } from "./pvgis.functions";
import type { Scenario } from "./scenarios";
import { MONTH_SHORT, PDF_COLOR, PDF_CONTENT_W, PDF_MARGIN, PDF_W, PdfReport, pdfText, reportReference, reportSlug } from "./pdf-report";

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
  download(new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" }), `${reportSlug(scenario.name, "solar-scenario")}.csv`);
}

export async function exportScenarioPdf(scenario: Scenario, profile: SolarProfile) {
  const { jsPDF } = await import("jspdf");
  const result = calculate({ ...scenario.values, annualKwhPerKwp: profile.annualKwhPerKwp });
  const currency = scenario.currency;
  const $ = (value: number, digits = 0) => pdfText(money(value, currency, digits));
  const issued = new Date().toISOString().slice(0, 10);
  const reference = reportReference("SP-S", issued, scenario.place.lat * 1000 + scenario.place.lon * 1000 + scenario.values.costPerKw);
  const report = new PdfReport(new jsPDF({ unit: "mm", format: "a4" }), {
    title: `${scenario.name} - Solar Investment Memorandum`,
    subject: `Independent solar payback estimate for ${scenario.place.name}, ${scenario.place.country}`,
    reportLabel: "Solar investment memorandum",
    reference,
  });
  const { doc } = report;
  const values = scenario.values;
  const year1 = result.years[0]!;
  const selfUseKwh = year1.selfUsed;
  const exportKwh = year1.exported;

  // Cover: an editorial executive summary, not a screenshot of the calculator.
  doc.setFillColor(...PDF_COLOR.navy);
  doc.rect(0, 0, PDF_W, 116, "F");
  doc.setFillColor(...PDF_COLOR.sun);
  doc.circle(PDF_W - 30, 33, 15, "F");
  doc.setDrawColor(...PDF_COLOR.sun);
  doc.setLineWidth(0.8);
  for (let ray = 0; ray < 8; ray++) {
    const angle = ray * Math.PI / 4;
    doc.line(PDF_W - 30 + Math.cos(angle) * 19, 33 + Math.sin(angle) * 19, PDF_W - 30 + Math.cos(angle) * 22, 33 + Math.sin(angle) * 22);
  }
  report.brand(PDF_MARGIN, 22, true);
  report.font(7.6, true, [244, 190, 112]);
  doc.text("INDEPENDENT  /  EVIDENCE-LED  /  ON-DEVICE", PDF_MARGIN, 36);
  report.font(27, true, PDF_COLOR.white, true);
  doc.text("Solar investment\nmemorandum", PDF_MARGIN, 53);
  report.font(11.5, true, PDF_COLOR.white);
  doc.text(doc.splitTextToSize(pdfText(scenario.name), 112) as string[], PDF_MARGIN, 78);
  report.font(9, false, [203, 211, 222]);
  doc.text(pdfText(`${scenario.place.name}, ${scenario.place.country}`), PDF_MARGIN, 90);
  report.font(7.5, false, [163, 176, 194]);
  doc.text(pdfText(`${scenario.place.lat.toFixed(4)}, ${scenario.place.lon.toFixed(4)}  |  Issued ${issued}  |  ${reference}`), PDF_MARGIN, 101);

  report.y = 132;
  report.h2("Executive investment summary", "All monetary results are calculated from the inputs reproduced in this report. Figures are rounded for presentation; calculations use unrounded values.");
  report.metricGrid([
    ["Simple payback", result.payback == null ? `Beyond ${values.lifetime} years` : `${num(result.payback, 1)} years`],
    ["Net upfront cost", $(result.upfront)],
    [`${values.lifetime}-year net cash gain`, $(result.totalNet)],
    [`NPV at ${values.discountPct}%`, $(result.npv)],
    ["Year-1 solar generation", `${num(result.year1Generation)} kWh`],
    ["Year-1 bill saving + export", $(result.year1Savings)],
  ]);
  const paybackNarrative = result.payback == null
    ? `On these inputs, cumulative cash flow does not recover the net upfront cost within the ${values.lifetime}-year model horizon.`
    : `Simple payback is modelled at ${num(result.payback, 1)} years. This is undiscounted; NPV separately accounts for the ${values.discountPct}% annual discount rate.`;
  report.callout(
    result.npv >= 0 ? "The model clears your stated discount rate" : "The model does not clear your stated discount rate",
    `${paybackNarrative} Modelled NPV is ${$(result.npv)}. This is an estimate, not a recommendation to buy or reject a system.`,
    result.npv >= 0 ? "green" : "red",
  );
  report.h2("Evidence & scope");
  report.paragraph(`Solar resource: European Commission Joint Research Centre PVGIS, ${profile.radiationDb}, reference period ${profile.period}, retrieved ${profile.fetchedAt.slice(0, 10)}${profile.stale ? " from the application's stale-data fallback" : ""}. Financial inputs: supplied by the user, not observed market facts. Outputs: deterministic annual cash-flow estimates. No hourly load, battery dispatch, shading survey, structural review, tax treatment or financing is simulated.`);

  // Solar resource and energy balance.
  report.section("01  /  Solar evidence", "Resource & energy balance", "PVGIS supplies the location-specific solar baseline. Roof geometry and loss assumptions remain user-controlled so that the estimate can be reconciled with an installer's own model.");
  report.keyValues([
    ["PVGIS source", `EU JRC PVGIS 5.3 / ${profile.radiationDb}`],
    ["Climate-data reference period", profile.period],
    ["Modelled location", `${scenario.place.lat.toFixed(5)}, ${scenario.place.lon.toFixed(5)}`],
    ["Plane orientation", `${profile.angle} deg tilt / ${profile.aspect} deg aspect (0 = south, negative = east)`],
    ["System loss assumption", `${profile.loss}%`],
    ["Specific year-1 yield", `${num(profile.annualKwhPerKwp)} kWh/kWp`],
    ["Array size", `${num(values.systemKw, 2)} kWp / crystalline silicon, fixed mounting`],
    ["PVGIS response status", profile.stale ? "Cached fallback - verify before relying on result" : "Live or normally cached API response"],
  ], 82);
  report.h2("Monthly generation profile", "Seasonality affects self-consumption and export value even when the annual total looks attractive.");
  report.monthlyChart(profile.monthly.map((month) => month.kwh * values.systemKw), "kWh");
  report.metricGrid([
    ["Self-used in year 1", `${num(selfUseKwh)} kWh`],
    ["Exported in year 1", `${num(exportKwh)} kWh`],
    ["Annual usage met by self-used solar", `${num(result.coveragePct, 1)}%`],
  ]);
  const best = [...profile.monthly].sort((a, b) => b.kwh - a.kwh)[0]!;
  const weakest = [...profile.monthly].sort((a, b) => a.kwh - b.kwh)[0]!;
  report.callout("Seasonality check", `${MONTH_SHORT[best.month - 1]} is the strongest modelled month and ${MONTH_SHORT[weakest.month - 1]} the weakest. The annual model applies one self-consumption percentage to every month; it does not prove that the same share can be used in winter and summer.`, "blue");

  // Economics and transparent assumptions.
  report.section("02  /  Financial model", "Returns & cash-flow trajectory", "Simple payback, net cash gain, NPV and IRR answer different questions. Read them together rather than treating a single headline as a decision rule.");
  report.metricGrid([
    ["Internal rate of return", result.irr == null ? "Not available" : `${num(result.irr, 1)}%`],
    ["Discounted lifetime cost / generated kWh", $(result.lcoe, 3)],
    ["Year-1 savings", $(result.year1Savings)],
    ["Year-1 maintenance", $(year1.om)],
    ["Model horizon", `${values.lifetime} years`],
    ["Final cumulative cash flow", $(result.totalNet)],
  ]);
  report.h2("Cumulative cash flow", "The curve includes the initial outlay, escalating savings, maintenance and any modelled inverter replacement.");
  report.cashflowChart(result.years, (value) => $(value), 42);
  report.h2("Complete model assumptions");
  report.keyValues([
    ["Installed price / grant", `${$(values.costPerKw)}/kWp / ${$(values.grant)}`],
    ["Annual household electricity use", `${num(values.annualUsageKwh)} kWh`],
    ["Self-consumption assumption", `${values.selfUsePct}% of generation, capped by annual use`],
    ["Import / export price in year 1", `${$(values.importPrice, 3)} / ${$(values.exportPrice, 3)} per kWh`],
    ["Annual import / export escalation", `${values.priceEscalationPct}% / ${values.exportEscalationPct}%`],
    ["Annual module degradation", `${values.degradationPct}%`],
    ["Maintenance", `${$(values.omPerKwYear)}/kWp/year, escalating ${values.omEscalationPct}%/year`],
    ["Inverter replacement", values.inverterReplacementYear ? `Year ${values.inverterReplacementYear} / ${$(values.inverterReplacementCost)}` : "Not modelled"],
    ["Discount rate", `${values.discountPct}% per year`],
  ], 82);

  // Reconciliation ledger and methodology.
  report.section("03  /  Audit trail", `${values.lifetime}-year cash-flow ledger`, "Every annual result below can be reproduced from the assumptions on the previous page. Savings combine avoided imports and export revenue; net cash flow deducts maintenance and replacements.");
  report.table(
    ["Year", "Gen. kWh", "Self kWh", "Export kWh", "Savings", "O&M", "Replace", "Net flow", "Cumulative"],
    result.years.map((row) => [String(row.year), num(row.generation), num(row.selfUsed), num(row.exported), $(row.savings), $(row.om), row.replacement ? $(row.replacement) : "-", $(row.cashflow), $(row.cumulative)]),
    [11, 20, 20, 20, 22, 18, 20, 22, 25],
    7.1,
  );
  report.section("04  /  Method", "Methodology, sources & limitations", "This reproducibility note defines the evidence and calculations behind the memorandum. Keep it with the assumptions and ledger for a complete audit trail.");
  report.h2("Solar evidence");
  report.paragraph("Generation: EU JRC PVGIS 5.3 PVcalc, crystalline silicon, fixed mounting, terrain horizon and the stated tilt, aspect and losses. Source: https://re.jrc.ec.europa.eu/pvg_tools/en/. Solar data (c) European Union, PVGIS. The reference period describes the climate dataset; it is not a forecast of any individual future year.");
  report.h2("Financial definitions");
  report.paragraph("Economics: annual model. Generation degrades geometrically. Self-used energy is generation multiplied by the self-use percentage, capped at annual electricity usage. Avoided-import and export revenues escalate independently. NPV discounts annual net cash flows and the upfront cost; IRR solves the annual cash-flow series; simple payback is interpolated within the crossing year. The discounted lifetime cost per generated kWh includes upfront, maintenance and replacement costs divided by discounted generation.");
  report.h2("Material exclusions");
  report.paragraph("Not modelled: hourly demand or solar matching, battery operation and degradation, shading objects, roof structure, electrical works, financing, taxes, tariff eligibility, curtailment, downtime, insurance, grant rules or residual value. Verify these with qualified professionals and official sources before making a commitment.");
  report.callout("Reproduce before relying", "Confirm the coordinates, roof settings, data-retrieval date and every financial input against your own quote and electricity bill. Re-run the report if any assumption changes; do not compare outputs generated from different inputs.", "blue");
  return report.finish(`${reportSlug(scenario.name, "solar-scenario")}-investment-memorandum.pdf`);
}
