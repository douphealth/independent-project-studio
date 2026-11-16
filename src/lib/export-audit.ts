// Client-side Quote Audit Dossier. Generated on-device with jsPDF; nothing is uploaded.
import type { jsPDF as JsPDF } from "jspdf";
import { CONTRACT_ITEMS, installerQuestions, type AuditInput, type AuditResult, type Severity } from "./audit";
import { money, num } from "./solar";
import type { SolarProfile } from "./pvgis.functions";
import type { Scenario } from "./scenarios";
import { MONTH_SHORT, PDF_COLOR, PDF_CONTENT_W, PDF_MARGIN, PDF_W, PdfReport, pdfText, reportReference, reportSlug } from "./pdf-report";

export async function exportAuditPdf(scenario: Scenario, profile: SolarProfile, input: AuditInput, r: AuditResult) {
  const { jsPDF } = await import("jspdf");
  const currency = scenario.currency;
  const $ = (value: number, digits = 0) => pdfText(money(value, currency, digits));
  const issued = new Date().toISOString().slice(0, 10);
  const reference = reportReference("SP-A", issued, scenario.place.lat * 1000 + scenario.place.lon * 1000 + input.base.costPerKw);
  const report = new PdfReport(new jsPDF({ unit: "mm", format: "a4" }) as JsPDF, {
    title: `${scenario.name} - Independent Solar Quote Audit`,
    subject: `Quote screening dossier for ${scenario.place.name}, ${scenario.place.country}`,
    reportLabel: "Independent quote audit dossier",
    reference,
  });
  const { doc } = report;
  const model = r.model;
  const base = input.base;
  const severityColor = (severity: Severity) => severity === "pass" ? PDF_COLOR.green : severity === "caution" ? PDF_COLOR.sun : PDF_COLOR.red;

  // Cover / executive decision brief.
  doc.setFillColor(...PDF_COLOR.navy);
  doc.rect(0, 0, PDF_W, 122, "F");
  doc.setFillColor(...PDF_COLOR.sun);
  doc.circle(PDF_W - 28, 31, 17, "F");
  doc.setFillColor(...PDF_COLOR.navy);
  doc.circle(PDF_W - 22, 26, 15, "F");
  report.brand(PDF_MARGIN, 21, true);
  report.font(7.5, true, [244, 190, 112]);
  doc.text("INDEPENDENT QUOTE AUDIT  /  EVIDENCE DOSSIER", PDF_MARGIN, 35);
  report.font(26, true, PDF_COLOR.white, true);
  doc.text("Solar quote\naudit dossier", PDF_MARGIN, 52);
  report.font(11.5, true, PDF_COLOR.white);
  doc.text(doc.splitTextToSize(pdfText(scenario.name), 108) as string[], PDF_MARGIN, 77);
  report.font(9, false, [203, 211, 222]);
  doc.text(pdfText(`${scenario.place.name}, ${scenario.place.country}`), PDF_MARGIN, 89);
  report.font(7.3, false, [163, 176, 194]);
  doc.text(pdfText(`${scenario.place.lat.toFixed(4)}, ${scenario.place.lon.toFixed(4)}  |  Issued ${issued}  |  ${reference}`), PDF_MARGIN, 101);
  // Grade is deliberately labelled as a screening score, never a certification.
  doc.setFillColor(...PDF_COLOR.white);
  doc.circle(PDF_W - 38, 87, 15, "F");
  report.font(27, true, severityColor(r.grade === "A" || r.grade === "B" ? "pass" : r.grade === "C" ? "caution" : "fail"), true);
  doc.text(r.grade, PDF_W - 38, 89, { align: "center" });
  report.font(7.5, true, PDF_COLOR.muted);
  doc.text(`${r.score} / 100`, PDF_W - 38, 98, { align: "center" });

  report.y = 138;
  report.h2("Executive decision brief");
  report.paragraph(r.verdict, { size: 11, lineHeight: 5.2, color: PDF_COLOR.ink, bold: true });
  report.y += 3;
  report.metricGrid([
    ["Independent simple payback", model.payback == null ? `Beyond ${base.lifetime} years` : `${num(model.payback, 1)} years`],
    ["Net upfront quote", $(model.upfront)],
    [`NPV at ${base.discountPct}%`, $(model.npv)],
    ["PVGIS year-1 generation", `${num(r.pvgisAnnualKwh)} kWh`],
    ["Installer generation claim", input.claimedAnnualKwh ? `${num(input.claimedAnnualKwh)} kWh` : "Not stated"],
    ["Contract protections confirmed", `${r.contractScore.met} / ${r.contractScore.total}`],
  ]);
  report.h2("Findings at a glance");
  r.findings.slice(0, 6).forEach((finding) => {
    report.ensure(7);
    report.badge(finding.area, finding.severity, PDF_MARGIN, report.y);
    report.font(8.2, true, PDF_COLOR.ink);
    const title = doc.splitTextToSize(pdfText(finding.title), PDF_CONTENT_W - 50) as string[];
    doc.text(title[0]!, PDF_MARGIN + 51, report.y);
    report.y += 6.5;
  });

  // Findings with evidence and next action.
  report.section("01  /  Exceptions", "Detailed findings & priorities", "Each finding is derived from the entered quote, the PVGIS baseline or the shared financial model. Resolve red flags first, then document every clarification in writing.");
  r.findings.forEach((finding, index) => {
    report.font(10.5, true, PDF_COLOR.ink);
    const titleLines = doc.splitTextToSize(pdfText(finding.title), PDF_CONTENT_W - 29) as string[];
    report.font(8.8, false, PDF_COLOR.muted);
    const detailLines = doc.splitTextToSize(pdfText(finding.detail), PDF_CONTENT_W - 29) as string[];
    const height = titleLines.length * 4.7 + detailLines.length * 4 + 11;
    report.ensure(height);
    report.badge("", finding.severity, PDF_MARGIN, report.y);
    report.font(7.2, true, PDF_COLOR.muted);
    doc.text(pdfText(`${String(index + 1).padStart(2, "0")}  ${finding.area.toUpperCase()}`), PDF_MARGIN + 28, report.y - 5);
    report.font(10.5, true, PDF_COLOR.ink);
    doc.text(titleLines, PDF_MARGIN + 28, report.y + 1);
    report.y += titleLines.length * 4.7 + 3;
    report.font(8.8, false, PDF_COLOR.muted);
    doc.text(detailLines, PDF_MARGIN + 28, report.y);
    report.y += detailLines.length * 4 + 7;
    doc.setDrawColor(...PDF_COLOR.line);
    doc.setLineWidth(0.2);
    doc.line(PDF_MARGIN + 28, report.y - 3, PDF_MARGIN + PDF_CONTENT_W, report.y - 3);
  });
  report.callout("Evidence standard", "A 'pass' means the entered claim falls within this report's screening threshold; it does not prove future performance. Where no installer claim was supplied, the report says 'not stated' rather than inventing a comparison.", "sun");

  // Generation forensics.
  report.section("02  /  Generation", "Solar-resource forensics", "The independent baseline is the PVGIS response for the exact coordinates and roof settings. Differences can arise from modelling choices as well as weather; a gap is a question to resolve, not automatic proof of misrepresentation.");
  report.keyValues([
    ["PVGIS database / reference period", `${profile.radiationDb} / ${profile.period}`],
    ["PVGIS response retrieved", `${profile.fetchedAt.slice(0, 10)}${profile.stale ? " / stale cached fallback" : ""}`],
    ["Coordinates", `${scenario.place.lat.toFixed(5)}, ${scenario.place.lon.toFixed(5)}`],
    ["Roof modelled", `${profile.angle} deg tilt / ${profile.aspect} deg aspect / ${profile.loss}% losses`],
    ["PVGIS specific year-1 yield", `${num(profile.annualKwhPerKwp)} kWh/kWp`],
    ["Installer specific yield", r.claimedYieldPerKwp ? `${num(r.claimedYieldPerKwp)} kWh/kWp` : "Not stated"],
    ["Claim difference vs PVGIS", r.yieldGapPct == null ? "Not testable - no claim entered" : `${r.yieldGapPct >= 0 ? "+" : ""}${num(r.yieldGapPct, 1)}%`],
    ["Year-to-year variability supplied", profile.yearToYearSdKwh ? `1 SD: ${num(profile.yearToYearSdKwh * base.systemKw)} kWh/year for this system` : "Not available in the PVGIS response"],
    ["Array size", `${num(base.systemKw, 2)} kWp`],
  ], 82);
  report.h2("Monthly generation profile", "Monthly PVGIS values are scaled by the entered array size. They are long-term model estimates, not guaranteed monthly output.");
  report.monthlyChart(profile.monthly.map((month) => month.kwh * base.systemKw), "kWh");
  const sorted = [...profile.monthly].sort((a, b) => a.kwh - b.kwh);
  report.paragraph(`Strongest month: ${MONTH_SHORT[sorted[11]!.month - 1]}. Weakest month: ${MONTH_SHORT[sorted[0]!.month - 1]}. The annual financial model uses a single self-consumption percentage and therefore does not capture seasonal mismatch between generation and demand.`);
  report.h2("Claim reconciliation");
  report.table(
    ["Metric", "Installer / entered claim", "Independent model", "Difference"],
    [
      ["Year-1 generation", input.claimedAnnualKwh ? `${num(input.claimedAnnualKwh)} kWh` : "Not stated", `${num(r.pvgisAnnualKwh)} kWh`, r.yieldGapPct == null ? "n/a" : `${r.yieldGapPct >= 0 ? "+" : ""}${num(r.yieldGapPct, 1)}%`],
      ["Simple payback", input.claimedPaybackYears ? `${num(input.claimedPaybackYears, 1)} yrs` : "Not stated", model.payback == null ? "Beyond horizon" : `${num(model.payback, 1)} yrs`, r.paybackGapYears == null ? "n/a" : `${r.paybackGapYears >= 0 ? "+" : ""}${num(r.paybackGapYears, 1)} yrs`],
      ["Year-1 savings", input.claimedYear1Savings ? $(input.claimedYear1Savings) : "Not stated", $(model.year1Savings), r.savingsGapPct == null ? "n/a" : `${r.savingsGapPct >= 0 ? "+" : ""}${num(r.savingsGapPct, 1)}%`],
    ],
    [42, 46, 45, 45],
    7.5,
  );

  // Financial model, stress tests, battery and competing quotes.
  report.section("03  /  Economics", "Financial stress test", "The base case is not a forecast. Downside cases expose which assumptions carry the result and provide a structured basis for negotiation.");
  report.metricGrid([
    [`${base.lifetime}-year net cash gain`, $(model.totalNet)],
    ["Internal rate of return", model.irr == null ? "Not available" : `${num(model.irr, 1)}%`],
    ["Discounted cost / generated kWh", $(model.lcoe, 3)],
    ["Break-even installed price", r.breakEvenCostPerKw == null ? "No positive NPV in range" : `${$(r.breakEvenCostPerKw)}/kWp`],
    ["Year-1 savings", $(model.year1Savings)],
    ["Final cumulative cash flow", $(model.totalNet)],
  ]);
  report.h2("Complete financial assumptions");
  report.keyValues([
    ["Installed price / grant", `${$(base.costPerKw)}/kWp / ${$(base.grant)}`],
    ["Import / export price in year 1", `${$(base.importPrice, 3)} / ${$(base.exportPrice, 3)} per kWh`],
    ["Self-consumption", `${base.selfUsePct}% of generation, capped by annual usage`],
    ["Annual import / export escalation", `${base.priceEscalationPct}% / ${base.exportEscalationPct}%`],
    ["Annual degradation", `${base.degradationPct}%`],
    ["Maintenance", `${$(base.omPerKwYear)}/kWp/year, escalating ${base.omEscalationPct}%/year`],
    ["Inverter replacement", base.inverterReplacementYear ? `Year ${base.inverterReplacementYear} / ${$(base.inverterReplacementCost)}` : "Not modelled"],
    ["Discount rate / horizon", `${base.discountPct}% / ${base.lifetime} years`],
  ], 82);
  report.h2("Downside scenario matrix", "Each row recalculates the full annual model. 'Combined stress' applies lower yield, flat energy prices and lower self-use together; the separate +15% cost overrun is not also stacked.");
  report.table(
    ["Scenario", "Simple payback", "NPV", "Net cash gain"],
    r.scenarios.map((item) => [item.label, item.payback == null ? "Beyond horizon" : `${num(item.payback, 1)} yrs`, $(item.npv), $(item.totalNet)]),
    [78, 34, 33, 33],
    7.7,
  );
  if (r.breakEvenCostPerKw != null) {
    report.callout("Negotiation anchor", `${$(r.breakEvenCostPerKw)}/kWp is the modelled installed-price boundary where NPV equals zero at your ${base.discountPct}% discount rate, within the engine's allowed price range. It is not a market valuation or a recommended offer.`, "sun");
  }
  if (r.priceRank) {
    report.h2("Your entered quote set");
    report.paragraph(`This quote ranks ${r.priceRank.position} of ${r.priceRank.of} by price per kWp: cheapest ${$(r.priceRank.cheapest)}/kWp, highest ${$(r.priceRank.dearest)}/kWp. The audited quote is ${num(r.priceRank.diffToCheapestPct, 1)}% above the cheapest. This is not a market benchmark. Prices are only comparable after aligning panel and inverter models, warranties, mounting, access, electrical and grid work, taxes and grant treatment.`);
  }
  if (r.battery) {
    const battery = r.battery;
    report.h2("Battery marginal economics", "The battery case changes upfront cost and self-consumption only. It does not simulate hourly charging, battery efficiency, capacity fade, replacement or tariff-specific dispatch.");
    report.keyValues([
      ["Additional upfront cost", $(battery.marginalCost)],
      ["Self-use without / with battery", `${base.selfUsePct}% / ${input.battery!.selfUsePctWith}%`],
      ["Additional year-1 savings", $(battery.marginalYear1Saving)],
      ["Battery simple payback", battery.simplePayback == null ? "No positive marginal saving" : `${num(battery.simplePayback, 1)} years`],
      ["Change in whole-system NPV", `${battery.npvDelta >= 0 ? "+" : ""}${$(battery.npvDelta)}`],
      ["Whole-system payback with battery", battery.withBattery.payback == null ? "Beyond horizon" : `${num(battery.withBattery.payback, 1)} years`],
    ], 82);
    report.callout("Battery diligence", "Compare the marginal payback with the actual warranty years, throughput or cycle limit, retained-capacity terms, round-trip efficiency and replacement cost. Those physical battery effects are outside this annual model.", "blue");
  }
  report.h2("Cumulative cash-flow trajectory");
  report.cashflowChart(model.years, (value) => $(value), 45);
  if (r.claimModel) {
    report.h2("Sensitivity to the installer's generation claim", "This counterfactual changes only annual yield. It is not an endorsement of the claim.");
    report.table(
      ["Metric", "PVGIS baseline", "Installer-yield counterfactual"],
      [
        ["Simple payback", model.payback == null ? "Beyond horizon" : `${num(model.payback, 1)} yrs`, r.claimModel.payback == null ? "Beyond horizon" : `${num(r.claimModel.payback, 1)} yrs`],
        ["Year-1 savings", $(model.year1Savings), $(r.claimModel.year1Savings)],
        [`${base.lifetime}-year net cash gain`, $(model.totalNet), $(r.claimModel.totalNet)],
        [`NPV at ${base.discountPct}%`, $(model.npv), $(r.claimModel.npv)],
      ],
      [66, 52, 60],
      8,
    );
  }

  // Ledger.
  report.section("04  /  Reconciliation", `${base.lifetime}-year cash-flow ledger`, "This appendix is the calculation trail behind the headline metrics. Values are displayed rounded; the underlying model retains full precision.");
  report.table(
    ["Year", "Gen. kWh", "Self kWh", "Export kWh", "Savings", "O&M", "Replace", "Net flow", "Cumulative"],
    model.years.map((row) => [String(row.year), num(row.generation), num(row.selfUsed), num(row.exported), $(row.savings), $(row.om), row.replacement ? $(row.replacement) : "-", $(row.cashflow), $(row.cumulative)]),
    [11, 20, 20, 20, 22, 18, 20, 22, 25],
    7.1,
  );
  report.paragraph("Cumulative cash flow begins with the negative net upfront cost and adds each year's savings less maintenance and replacement. NPV is calculated separately with the entered discount rate; the cumulative column is undiscounted.");

  // Contract protections and installer questions.
  report.section("05  /  Diligence", "Contract protections & negotiation", "Use this section with the actual quote, contract and warranty documents. An unchecked item means 'not confirmed in the entered audit', not necessarily absent from the installer's paperwork.");
  CONTRACT_ITEMS.forEach((item) => {
    const confirmed = !!input.contract[item.key];
    const severity: Severity = confirmed ? "pass" : item.critical ? "fail" : "caution";
    report.font(9.4, true, PDF_COLOR.ink);
    const labelLines = doc.splitTextToSize(pdfText(`${item.label}${item.critical ? " [critical]" : ""}`), PDF_CONTENT_W - 29) as string[];
    report.font(8.2, false, PDF_COLOR.muted);
    const whyLines = doc.splitTextToSize(pdfText(item.why), PDF_CONTENT_W - 29) as string[];
    report.ensure(labelLines.length * 4.2 + whyLines.length * 3.8 + 10);
    report.badge("", severity, PDF_MARGIN, report.y);
    report.font(9.4, true, PDF_COLOR.ink);
    doc.text(labelLines, PDF_MARGIN + 28, report.y);
    report.y += labelLines.length * 4.2 + 2;
    report.font(8.2, false, PDF_COLOR.muted);
    doc.text(whyLines, PDF_MARGIN + 28, report.y);
    report.y += whyLines.length * 3.8 + 7;
  });
  report.section("06  /  Negotiation", "Installer question schedule", "Send these questions with the source quote and request written answers. They are generated from the report's unresolved findings and unconfirmed protections.");
  const questions = installerQuestions(r);
  if (!questions.length) report.paragraph("No additional targeted questions were triggered. Still request the final itemised contract, warranty documents and a written generation method before signing.", { color: PDF_COLOR.ink });
  questions.forEach((question, index) => {
    report.font(9, true, PDF_COLOR.sun);
    const number = `${index + 1}.`;
    report.font(9, false, PDF_COLOR.ink);
    const lines = doc.splitTextToSize(pdfText(question), PDF_CONTENT_W - 10) as string[];
    report.ensure(lines.length * 4.3 + 4);
    report.font(9, true, PDF_COLOR.sun);
    doc.text(number, PDF_MARGIN, report.y);
    report.font(9, false, PDF_COLOR.ink);
    doc.text(lines, PDF_MARGIN + 8, report.y);
    report.y += lines.length * 4.3 + 3;
  });

  // Methodology is its own clean closing section so it cannot be orphaned.
  report.section("07  /  Governance", "Methodology, provenance & limitations", "This closing record defines what the dossier can and cannot establish. Keep it with the source quote and the PVGIS settings used.");
  report.h2("Evidence hierarchy");
  report.keyValues([
    ["Location-specific solar evidence", `EU JRC PVGIS 5.3 / ${profile.radiationDb} / ${profile.period}`],
    ["Installer claims", "User-entered values; not independently read from the original quote"],
    ["Contract status", "User-entered confirmations; verify against signed documents"],
    ["Competing prices", "Only user-entered quotes; no external market-price benchmark"],
    ["Financial results", "Deterministic outputs of the assumptions printed in this dossier"],
    ["Report processing", "Generated on-device; the report workflow does not upload the quote"],
  ], 82);
  report.h2("Calculation method");
  report.paragraph("Generation: EU JRC PVGIS 5.3 PVcalc, crystalline silicon, fixed mounting, terrain horizon, entered tilt, aspect and system losses. Official tool: https://re.jrc.ec.europa.eu/pvg_tools/en/. Solar data (c) European Union, PVGIS. PVGIS estimates long-term solar resource; actual output varies with weather, shading, equipment, availability and installation quality.");
  report.paragraph("Economics: annual cash flows with separate import and export escalation, geometric module degradation, escalating maintenance and an optional one-off inverter replacement. Self-used generation is capped by annual electricity usage. Simple payback is interpolated in the crossing year; NPV discounts all annual flows and upfront cost; IRR solves the annual series. Break-even installed price uses bisection for NPV = 0 across the model's allowed 100-10,000 currency/kWp range.");
  report.paragraph("Audit scoring: fixed deductions for claim gaps, downside performance, competing-quote differences, battery economics and unconfirmed contract items. Thresholds are screening heuristics, not statistical confidence intervals. The grade should prioritise questions, not replace professional due diligence.");
  report.h2("Material exclusions");
  report.paragraph("No hourly load or generation matching, battery dispatch or degradation, shading-object survey, structural or electrical assessment, roof ownership review, planning review, financing, taxes, insurance, tariff eligibility, grant eligibility, curtailment, downtime, residual value or installer credit assessment. Confirm these with appropriately qualified independent professionals and official sources.");
  report.callout("Appropriate use", "Use this dossier to reconcile claims, expose assumptions and prepare questions before signing. Do not treat it as financial, tax, legal or engineering advice, a guaranteed yield, or a substitute for an on-site survey and complete contract review.", "sun");

  return report.finish(`${reportSlug(scenario.name, "solar")}-quote-audit-dossier.pdf`);
}
