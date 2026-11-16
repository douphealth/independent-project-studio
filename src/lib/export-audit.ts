// Client-side, multi-page Quote Audit Dossier. Generated on-device with jsPDF; nothing is uploaded.
import type { jsPDF as JsPDF } from "jspdf";
import { CONTRACT_ITEMS, installerQuestions, type AuditInput, type AuditResult, type Severity } from "./audit";
import { money, num } from "./solar";
import type { SolarProfile } from "./pvgis.functions";
import type { Scenario } from "./scenarios";

const INK: [number, number, number] = [24, 30, 46];
const MUTED: [number, number, number] = [96, 102, 118];
const SUN: [number, number, number] = [214, 110, 18];
const SEV: Record<Severity, [number, number, number]> = { pass: [34, 139, 84], caution: [214, 140, 18], fail: [196, 52, 44] };
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const W = 210, M = 16, CW = W - 2 * M, BOTTOM = 280;

// Built-in PDF fonts are WinAnsi; normalise characters they cannot draw.
const t = (s: string) => s.replace(/[\u202f\u00a0]/g, " ").replace(/−/g, "-").replace(/≈/g, "~").replace(/≥/g, ">=").replace(/≤/g, "<=").replace(/→/g, "->").replace(/[–—]/g, "-").replace(/ł/g, "l").replace(/[‘’]/g, "'").replace(/[“”]/g, '"');

export async function exportAuditPdf(scenario: Scenario, profile: SolarProfile, input: AuditInput, r: AuditResult) {
  const { jsPDF } = await import("jspdf");
  const doc: JsPDF = new jsPDF({ unit: "mm", format: "a4" });
  const c = scenario.currency;
  const $ = (n: number, d = 0) => t(money(n, c, d));
  const issued = new Date().toISOString().slice(0, 10);
  const ref = `SP-${issued.replace(/-/g, "")}-${Math.abs(Math.round(scenario.place.lat * 1000 + scenario.place.lon * 1000 + input.base.costPerKw)) % 100000}`;
  let y = 0;

  const font = (size: number, style: "normal" | "bold" = "normal", color = INK) => { doc.setFont("helvetica", style); doc.setFontSize(size); doc.setTextColor(...color); };
  const para = (s: string, x = M, w = CW, lh = 4.6, size = 9.5, color = MUTED) => { font(size, "normal", color); const lines = doc.splitTextToSize(t(s), w) as string[]; ensure(lines.length * lh); doc.text(lines, x, y); y += lines.length * lh; };
  const newPage = () => { doc.addPage(); y = 22; };
  const ensure = (h: number) => { if (y + h > BOTTOM) newPage(); };
  const h1 = (n: string, title: string) => { newPage(); font(9, "bold", SUN); doc.text(n, M, y); y += 7; font(20, "bold"); doc.text(t(title), M, y); y += 4; doc.setDrawColor(...SUN); doc.setLineWidth(0.6); doc.line(M, y, M + 24, y); y += 9; };
  const h2 = (title: string) => { ensure(14); y += 3; font(12, "bold"); doc.text(t(title), M, y); y += 6; };
  const kv = (rows: [string, string][], col = 92) => { rows.forEach(([k, v], i) => { ensure(7); if (i % 2 === 0) { doc.setFillColor(246, 244, 239); doc.rect(M, y - 4.4, CW, 6.6, "F"); } font(9.5, "normal", MUTED); doc.text(t(k), M + 2, y); font(9.5, "bold"); doc.text(t(v), M + col, y); y += 6.6; }); y += 2; };
  const table = (head: string[], rows: string[][], widths: number[], size = 8) => {
    const row = (cells: string[], bold: boolean, fill?: [number, number, number]) => { ensure(6); if (fill) { doc.setFillColor(...fill); doc.rect(M, y - 4, CW, 5.8, "F"); } font(size, bold ? "bold" : "normal", bold ? INK : MUTED); let x = M + 1.5; cells.forEach((cell, i) => { const w = widths[i]!; doc.text(t(cell), i === 0 ? x : x + w - 3, y, { align: i === 0 ? "left" : "right" }); x += w; }); y += 5.8; };
    row(head, true, [236, 232, 222]);
    rows.forEach((r2, i) => { if (y + 6 > BOTTOM) { newPage(); row(head, true, [236, 232, 222]); } row(r2, false, i % 2 ? [250, 249, 246] : undefined); });
    y += 3;
  };
  const badge = (sev: Severity, x: number, yy: number) => { doc.setFillColor(...SEV[sev]); doc.roundedRect(x, yy - 3.6, 17, 5, 1.2, 1.2, "F"); font(7, "bold", [255, 255, 255]); doc.text(sev === "pass" ? "PASS" : sev === "caution" ? "CHECK" : "RED FLAG", x + 8.5, yy, { align: "center" }); };

  // ---------- Cover ----------
  doc.setFillColor(...INK); doc.rect(0, 0, W, 118, "F");
  doc.setFillColor(...SUN); doc.circle(W - 30, 30, 16, "F");
  font(10, "bold", [245, 190, 120]); doc.text("SOLARPAYBACK  |  INDEPENDENT QUOTE AUDIT", M, 24);
  font(28, "bold", [255, 255, 255]); doc.text(doc.splitTextToSize(t("Solar Quote Audit Dossier"), 140) as string[], M, 46);
  font(13, "normal", [215, 218, 228]); doc.text(t(scenario.name), M, 62);
  doc.text(t(`${scenario.place.name}, ${scenario.place.country}`), M, 70);
  font(9, "normal", [170, 176, 192]); doc.text(t(`${scenario.place.lat.toFixed(4)}, ${scenario.place.lon.toFixed(4)}  |  Issued ${issued}  |  Ref ${ref}`), M, 80);
  // grade disk
  const gs: Severity = r.grade === "A" || r.grade === "B" ? "pass" : r.grade === "C" ? "caution" : "fail";
  doc.setFillColor(255, 255, 255); doc.circle(M + 18, 100, 13, "F"); font(24, "bold", SEV[gs]); doc.text(r.grade, M + 18, 108.5 - 6, { align: "center" });
  font(8, "bold", MUTED); doc.text(`${r.score}/100`, M + 18, 108, { align: "center" });
  font(13, "bold", [255, 255, 255]); doc.text(doc.splitTextToSize(t(r.verdict), 140) as string[], M + 38, 98);
  y = 134;
  font(12, "bold"); doc.text("Headline numbers", M, y); y += 7;
  const m = r.model;
  const tiles: [string, string][] = [
    ["Independent payback", m.payback == null ? `> ${input.base.lifetime} yrs` : `${num(m.payback, 1)} yrs`],
    ["Upfront cost", $(m.upfront)],
    [`${input.base.lifetime}-yr net gain`, $(m.totalNet)],
    ["IRR", m.irr == null ? "n/a" : `${num(m.irr, 1)}%`],
    ["PVGIS year-1 output", `${num(r.pvgisAnnualKwh)} kWh`],
    ["Installer claim", input.claimedAnnualKwh ? `${num(input.claimedAnnualKwh)} kWh` : "Not stated"],
  ];
  tiles.forEach(([k, v], i) => { const x = M + (i % 3) * (CW / 3), yy = y + Math.floor(i / 3) * 22; doc.setFillColor(246, 244, 239); doc.roundedRect(x, yy, CW / 3 - 3, 19, 2, 2, "F"); font(8, "normal", MUTED); doc.text(t(k), x + 4, yy + 6.5); font(13, "bold"); doc.text(t(v), x + 4, yy + 14.5); });
  y += 50;
  font(12, "bold"); doc.text("Findings at a glance", M, y); y += 7;
  r.findings.forEach((f) => { ensure(7); badge(f.severity, M, y); font(9.5, "bold"); doc.text(t(`${f.area}: ${f.title}`).slice(0, 105), M + 21, y); y += 6.4; });
  y += 3;
  para("This dossier tests an installer's quote against the European Commission JRC PVGIS satellite record for this exact location and an independent, transparent cash-flow model. It is an estimate, not financial, tax or engineering advice, and does not replace an on-site survey.", M, CW, 4.2, 8);

  // ---------- 1. Detailed findings ----------
  h1("SECTION 1", "Detailed findings");
  r.findings.forEach((f) => { ensure(18); badge(f.severity, M, y); font(10.5, "bold"); const tl = doc.splitTextToSize(t(f.title), CW - 22) as string[]; doc.text(tl, M + 21, y); y += tl.length * 5 + 1; para(f.detail, M + 21, CW - 21, 4.4, 9); y += 4; });

  // ---------- 2. Yield forensics ----------
  h1("SECTION 2", "Generation forensics");
  kv([
    ["PVGIS database / period", `${profile.radiationDb} (${profile.period})`],
    ["Roof modelled", `${profile.angle} deg tilt, ${profile.aspect} deg aspect, ${profile.loss}% losses`],
    ["Specific yield (PVGIS)", `${num(profile.annualKwhPerKwp)} kWh/kWp/yr`],
    ["Installer specific yield", r.claimedYieldPerKwp ? `${num(r.claimedYieldPerKwp)} kWh/kWp/yr` : "Not stated"],
    ["Claim vs PVGIS", r.yieldGapPct == null ? "-" : `${r.yieldGapPct >= 0 ? "+" : ""}${num(r.yieldGapPct, 1)}%`],
    ["Year-to-year variation (1 SD)", profile.yearToYearSdKwh ? `+/- ${num(profile.yearToYearSdKwh * input.base.systemKw)} kWh (${num((profile.yearToYearSdKwh / profile.annualKwhPerKwp) * 100, 1)}%)` : "n/a"],
    ["System size", `${input.base.systemKw} kWp`],
  ]);
  h2("Monthly generation profile (PVGIS, your system)");
  const mx = Math.max(...profile.monthly.map((x) => x.kwh)) * input.base.systemKw;
  const chartH = 48, base0 = y + chartH; ensure(chartH + 14);
  const bw = CW / 12;
  profile.monthly.forEach((mo, i) => { const v = mo.kwh * input.base.systemKw, h = (v / mx) * chartH; doc.setFillColor(...SUN); doc.rect(M + i * bw + 1.5, base0 - h, bw - 3, h, "F"); font(7, "bold", INK); doc.text(num(v), M + i * bw + bw / 2, base0 - h - 1.5, { align: "center" }); font(7.5, "normal", MUTED); doc.text(MONTHS[i]!, M + i * bw + bw / 2, base0 + 4.5, { align: "center" }); });
  y = base0 + 11;
  const sorted = [...profile.monthly].sort((a2, b2) => a2.kwh - b2.kwh);
  para(`Best month ${MONTHS[sorted[11]!.month - 1]} produces ${num((sorted[11]!.kwh / sorted[0]!.kwh), 1)}x the weakest month (${MONTHS[sorted[0]!.month - 1]}). Winter output determines how much grid electricity you will still buy; summer output determines how much you export.`);
  if (r.claimModel) { h2("If the installer's generation claim were true"); table(["Metric", "Independent (PVGIS)", "Installer claim basis"], [["Payback", m.payback == null ? "never" : `${num(m.payback, 1)} yrs`, r.claimModel.payback == null ? "never" : `${num(r.claimModel.payback, 1)} yrs`], ["Year-1 savings", $(m.year1Savings), $(r.claimModel.year1Savings)], [`${input.base.lifetime}-yr net gain`, $(m.totalNet), $(r.claimModel.totalNet)], ["NPV", $(m.npv), $(r.claimModel.npv)]], [70, 54, 54], 9); para("The difference between these columns is the value at risk if the installer's generation estimate proves optimistic."); }

  // ---------- 3. Financial stress test ----------
  h1("SECTION 3", "Financial stress test");
  kv([
    ["Installed cost", `${$(input.base.costPerKw)}/kWp x ${input.base.systemKw} kWp`], ["Grant / incentive", $(input.base.grant)],
    ["Import / export price", `${$(input.base.importPrice, 3)} / ${$(input.base.exportPrice, 3)} per kWh`],
    ["Self-consumption", `${input.base.selfUsePct}% of generation`], ["Escalation import / export", `${input.base.priceEscalationPct}% / ${input.base.exportEscalationPct}% per yr`],
    ["Degradation", `${input.base.degradationPct}% per yr`], ["Maintenance", `${$(input.base.omPerKwYear)}/kWp/yr, +${input.base.omEscalationPct}%/yr`],
    ["Inverter replacement", input.base.inverterReplacementYear ? `Year ${input.base.inverterReplacementYear}, ${$(input.base.inverterReplacementCost)}` : "Not modelled"],
    ["Discount rate", `${input.base.discountPct}%`], ["Discounted cost per solar kWh", $(m.lcoe, 3)],
    ["Break-even installed cost (NPV = 0)", r.breakEvenCostPerKw == null ? "Not achievable" : `${$(r.breakEvenCostPerKw)}/kWp`],
  ]);
  h2("Downside scenarios");
  table(["Scenario", "Payback", "NPV", "Net gain"], r.scenarios.map((s) => [s.label, s.payback == null ? "never" : `${num(s.payback, 1)} yrs`, $(s.npv), $(s.totalNet)]), [82, 30, 33, 33], 8.5);
  if (r.breakEvenCostPerKw) para(`Negotiation anchor: every ${$(50)}/kWp off the price shortens payback; above ${$(r.breakEvenCostPerKw)}/kWp the system no longer beats a ${input.base.discountPct}% alternative return.`);
  if (r.priceRank) { h2("Price against your other quotes"); para(`This quote ranks ${r.priceRank.position} of ${r.priceRank.of} by cost per kWp (cheapest ${$(r.priceRank.cheapest)}, dearest ${$(r.priceRank.dearest)}); ${num(r.priceRank.diffToCheapestPct, 1)}% above the cheapest. Compare component specifications before treating price alone as decisive.`); }
  if (r.battery) {
    h2("Battery due diligence");
    const b = r.battery;
    kv([["Extra cost", $(b.marginalCost)], ["Self-use with battery", `${input.battery!.selfUsePctWith}% (vs ${input.base.selfUsePct}%)`], ["Extra year-1 savings", $(b.marginalYear1Saving)], ["Battery simple payback", b.simplePayback == null ? "never" : `${num(b.simplePayback, 1)} yrs`], ["Change in NPV", `${b.npvDelta >= 0 ? "+" : ""}${$(b.npvDelta)}`], ["Payback, whole system with battery", b.withBattery.payback == null ? "never" : `${num(b.withBattery.payback, 1)} yrs`]]);
    para("Battery warranties (typically 10 years or a cycle limit) are often shorter than the payback period shown. Model a replacement if the battery must outlast its warranty.");
  }

  // ---------- 4. Cash-flow ledger ----------
  h1("SECTION 4", `${input.base.lifetime}-year cash-flow ledger`);
  table(["Year", "Gen kWh", "Self kWh", "Export kWh", "Savings", "O&M", "Replace", "Net", "Cumulative"], m.years.map((row) => [String(row.year), num(row.generation), num(row.selfUsed), num(row.exported), $(row.savings), $(row.om), row.replacement ? $(row.replacement) : "-", $(row.cashflow), $(row.cumulative)]), [12, 20, 20, 20, 22, 18, 20, 22, 24], 7.5);

  // ---------- 5. Contract & questions ----------
  h1("SECTION 5", "Contract protections & negotiation");
  CONTRACT_ITEMS.forEach((ci) => { ensure(14); const ok = !!input.contract[ci.key]; badge(ok ? "pass" : ci.critical ? "fail" : "caution", M, y); font(9.5, "bold"); doc.text(t(ci.label), M + 21, y, { maxWidth: CW - 21 }); y += (doc.splitTextToSize(t(ci.label), CW - 21) as string[]).length * 4.6; para(ci.why, M + 21, CW - 21, 4.2, 8.5); y += 2.5; });
  h2("Questions to send the installer before signing");
  installerQuestions(r).forEach((q, i) => { ensure(10); font(9.5, "bold", SUN); doc.text(`${i + 1}.`, M, y); para(q, M + 7, CW - 7, 4.5, 9.5, INK); y += 1.5; });
  ensure(40); h2("Methodology & limitations");
  para("Generation: EU JRC PVGIS 5.3 PVcalc, crystalline silicon, fixed mounting, terrain horizon, user-selected tilt/aspect/losses. Economics: annual model with separate import/export escalation, degradation, escalating maintenance and a one-off inverter replacement; payback interpolated within the crossing year; NPV and IRR on annual cash flows; break-even cost by bisection on NPV = 0. Price comparison uses only the quotes you entered - SolarPayback publishes no market price benchmarks. Roof shading, structure, electrical condition, tariff eligibility and grant rules must be verified on site and with official sources. Solar data (c) European Union, PVGIS.", M, CW, 4.2, 8.5);

  // footers
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) { doc.setPage(p); font(7.5, "normal", MUTED); doc.text(t(`SolarPayback Quote Audit  |  ${ref}  |  Estimate only - not financial advice`), M, 290); doc.text(`${p} / ${pages}`, W - M, 290, { align: "right" }); }
  doc.save(`${scenario.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "solar"}-quote-audit.pdf`);
  return pages;
}
