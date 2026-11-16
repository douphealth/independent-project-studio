// Shared editorial design system for SolarPayback's on-device PDF reports.
// Layout values are millimetres on A4. No report data leaves the browser.
import type { jsPDF as JsPDF } from "jspdf";

export type RGB = [number, number, number];
export const PDF_COLOR = {
  ink: [22, 32, 48] as RGB,
  navy: [15, 29, 47] as RGB,
  muted: [91, 101, 116] as RGB,
  sun: [221, 139, 24] as RGB,
  sunSoft: [251, 241, 220] as RGB,
  paper: [250, 248, 243] as RGB,
  line: [221, 222, 216] as RGB,
  white: [255, 255, 255] as RGB,
  green: [31, 120, 82] as RGB,
  greenSoft: [232, 244, 236] as RGB,
  red: [180, 55, 48] as RGB,
  redSoft: [251, 235, 232] as RGB,
  blueSoft: [234, 240, 246] as RGB,
};

export const PDF_W = 210;
export const PDF_MARGIN = 16;
export const PDF_CONTENT_W = PDF_W - PDF_MARGIN * 2;
export const PDF_BOTTOM = 275;
export const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Built-in PDF fonts use WinAnsi. Keep meaning while replacing unsupported glyphs.
export const pdfText = (value: string) => value
  .replace(/[\u202f\u00a0]/g, " ")
  .replace(/−/g, "-")
  .replace(/≈/g, "~")
  .replace(/≥/g, ">=")
  .replace(/≤/g, "<=")
  .replace(/→/g, "->")
  .replace(/[–—]/g, "-")
  .replace(/×/g, "x")
  .replace(/ł/g, "l")
  .replace(/[‘’]/g, "'")
  .replace(/[“”]/g, '"');

export function reportReference(prefix: string, date: string, seed: number) {
  return `${prefix}-${date.replace(/-/g, "")}-${Math.abs(Math.round(seed)) % 100000}`;
}

export function reportSlug(value: string, fallback: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || fallback;
}

export class PdfReport {
  y = 22;

  constructor(
    public doc: JsPDF,
    public options: { title: string; subject: string; reportLabel: string; reference: string },
  ) {
    doc.setProperties({ title: options.title, subject: options.subject, creator: "SolarPayback", author: "SolarPayback", keywords: "solar, PVGIS, payback, independent estimate" });
  }

  font(size: number, bold = false, color: RGB = PDF_COLOR.ink, display = false) {
    this.doc.setFont(display ? "times" : "helvetica", bold ? "bold" : "normal");
    this.doc.setFontSize(size);
    this.doc.setTextColor(...color);
  }

  brand(x = PDF_MARGIN, y = 18, dark = false) {
    const d = this.doc;
    d.setFillColor(...PDF_COLOR.sun);
    d.circle(x + 2.6, y - 2.5, 2.5, "F");
    d.setDrawColor(...(dark ? PDF_COLOR.white : PDF_COLOR.navy));
    d.setLineWidth(0.65);
    d.line(x, y + 1, x + 6, y + 1);
    this.font(12, true, dark ? PDF_COLOR.white : PDF_COLOR.ink, true);
    d.text("SolarPayback", x + 9, y);
  }

  header() {
    this.brand(PDF_MARGIN, 14);
    this.font(7.2, true, PDF_COLOR.muted);
    this.doc.text(pdfText(this.options.reportLabel.toUpperCase()), PDF_W - PDF_MARGIN, 13.5, { align: "right" });
    this.doc.setDrawColor(...PDF_COLOR.line);
    this.doc.setLineWidth(0.25);
    this.doc.line(PDF_MARGIN, 19, PDF_W - PDF_MARGIN, 19);
  }

  newPage() {
    this.doc.addPage();
    this.header();
    this.y = 29;
  }

  ensure(height: number) {
    if (this.y + height > PDF_BOTTOM) this.newPage();
  }

  section(kicker: string, title: string, intro?: string) {
    this.newPage();
    this.font(7.8, true, PDF_COLOR.sun);
    this.doc.text(pdfText(kicker.toUpperCase()), PDF_MARGIN, this.y);
    this.y += 9;
    this.font(23, true, PDF_COLOR.ink, true);
    const lines = this.doc.splitTextToSize(pdfText(title), PDF_CONTENT_W) as string[];
    this.doc.text(lines, PDF_MARGIN, this.y);
    this.y += lines.length * 8.5 + 1;
    this.doc.setDrawColor(...PDF_COLOR.sun);
    this.doc.setLineWidth(0.8);
    this.doc.line(PDF_MARGIN, this.y, PDF_MARGIN + 25, this.y);
    this.y += 8;
    if (intro) this.paragraph(intro, { size: 9.3, lineHeight: 4.5 });
    this.y += 2;
  }

  h2(title: string, deck?: string) {
    this.ensure(deck ? 22 : 14);
    this.y += 3;
    this.font(13.5, true, PDF_COLOR.ink, true);
    this.doc.text(pdfText(title), PDF_MARGIN, this.y);
    this.y += 5.5;
    if (deck) this.paragraph(deck, { size: 8.2, lineHeight: 3.9 });
  }

  paragraph(text: string, options: { x?: number; width?: number; lineHeight?: number; size?: number; color?: RGB; bold?: boolean } = {}) {
    const { x = PDF_MARGIN, width = PDF_CONTENT_W, lineHeight = 4.4, size = 9, color = PDF_COLOR.muted, bold = false } = options;
    this.font(size, bold, color);
    const lines = this.doc.splitTextToSize(pdfText(text), width) as string[];
    this.ensure(lines.length * lineHeight + 1);
    this.doc.text(lines, x, this.y);
    this.y += lines.length * lineHeight;
  }

  keyValues(rows: [string, string][], valueColumn = 92) {
    rows.forEach(([label, value], index) => {
      this.font(8.7, false, PDF_COLOR.muted);
      const labelLines = this.doc.splitTextToSize(pdfText(label), valueColumn - 7) as string[];
      this.font(8.7, true, PDF_COLOR.ink);
      const valueLines = this.doc.splitTextToSize(pdfText(value), PDF_CONTENT_W - valueColumn - 3) as string[];
      const rowH = Math.max(labelLines.length, valueLines.length) * 3.8 + 3.1;
      this.ensure(rowH);
      if (index % 2 === 0) {
        this.doc.setFillColor(...PDF_COLOR.paper);
        this.doc.rect(PDF_MARGIN, this.y - 3.5, PDF_CONTENT_W, rowH, "F");
      }
      this.font(8.7, false, PDF_COLOR.muted);
      this.doc.text(labelLines, PDF_MARGIN + 2, this.y);
      this.font(8.7, true, PDF_COLOR.ink);
      this.doc.text(valueLines, PDF_MARGIN + valueColumn, this.y);
      this.y += rowH;
    });
    this.y += 3;
  }

  metricGrid(items: [string, string][], columns = 3, tileHeight = 23) {
    const gap = 3;
    const width = (PDF_CONTENT_W - gap * (columns - 1)) / columns;
    const rows = Math.ceil(items.length / columns);
    this.ensure(rows * (tileHeight + gap));
    items.forEach(([label, value], index) => {
      const x = PDF_MARGIN + (index % columns) * (width + gap);
      const yy = this.y + Math.floor(index / columns) * (tileHeight + gap);
      this.doc.setFillColor(...PDF_COLOR.paper);
      this.doc.roundedRect(x, yy, width, tileHeight, 1.8, 1.8, "F");
      this.doc.setFillColor(...PDF_COLOR.sun);
      this.doc.rect(x, yy, 1.2, tileHeight, "F");
      this.font(7.1, false, PDF_COLOR.muted);
      const labelLines = this.doc.splitTextToSize(pdfText(label.toUpperCase()), width - 8) as string[];
      this.doc.text(labelLines.slice(0, 2), x + 4.5, yy + 6);
      this.font(12.5, true, PDF_COLOR.ink, true);
      const valueLines = this.doc.splitTextToSize(pdfText(value), width - 8) as string[];
      this.doc.text(valueLines.slice(0, 2), x + 4.5, yy + 15.5);
    });
    this.y += rows * (tileHeight + gap) + 3;
  }

  table(head: string[], rows: string[][], widths: number[], fontSize = 7.6) {
    const lineHeight = fontSize * 0.47;
    const drawRow = (cells: string[], header: boolean, stripe: boolean) => {
      this.font(fontSize, header, header ? PDF_COLOR.white : PDF_COLOR.ink);
      const wrapped = cells.map((cell, i) => this.doc.splitTextToSize(pdfText(cell), widths[i]! - 3) as string[]);
      const rowH = Math.max(...wrapped.map((lines) => lines.length)) * lineHeight + 2.8;
      if (this.y + rowH > PDF_BOTTOM) {
        this.newPage();
        drawRow(head, true, false);
      }
      if (header) this.doc.setFillColor(...PDF_COLOR.navy);
      else if (stripe) this.doc.setFillColor(...PDF_COLOR.paper);
      if (header || stripe) this.doc.rect(PDF_MARGIN, this.y - 3.4, PDF_CONTENT_W, rowH, "F");
      let x = PDF_MARGIN;
      wrapped.forEach((lines, i) => {
        this.font(fontSize, header || i === 0, header ? PDF_COLOR.white : i === 0 ? PDF_COLOR.ink : PDF_COLOR.muted);
        const width = widths[i]!;
        lines.forEach((line, lineIndex) => {
          const baseline = this.y + lineIndex * lineHeight;
          this.doc.text(line, i === 0 ? x + 1.5 : x + width - 1.5, baseline, { align: i === 0 ? "left" : "right" });
        });
        x += width;
      });
      this.y += rowH;
    };
    this.ensure(14);
    drawRow(head, true, false);
    rows.forEach((row, index) => drawRow(row, false, index % 2 === 1));
    this.y += 4;
  }

  callout(title: string, body: string, tone: "sun" | "green" | "red" | "blue" = "sun") {
    const fill = tone === "green" ? PDF_COLOR.greenSoft : tone === "red" ? PDF_COLOR.redSoft : tone === "blue" ? PDF_COLOR.blueSoft : PDF_COLOR.sunSoft;
    const accent = tone === "green" ? PDF_COLOR.green : tone === "red" ? PDF_COLOR.red : tone === "blue" ? PDF_COLOR.navy : PDF_COLOR.sun;
    this.font(10, true, PDF_COLOR.ink);
    const titleLines = this.doc.splitTextToSize(pdfText(title), PDF_CONTENT_W - 12) as string[];
    this.font(8.6, false, PDF_COLOR.muted);
    const bodyLines = this.doc.splitTextToSize(pdfText(body), PDF_CONTENT_W - 12) as string[];
    const height = titleLines.length * 4.5 + bodyLines.length * 4 + 9;
    this.ensure(height);
    this.doc.setFillColor(...fill);
    this.doc.roundedRect(PDF_MARGIN, this.y - 4, PDF_CONTENT_W, height, 2, 2, "F");
    this.doc.setFillColor(...accent);
    this.doc.rect(PDF_MARGIN, this.y - 4, 1.5, height, "F");
    this.font(10, true, PDF_COLOR.ink);
    this.doc.text(titleLines, PDF_MARGIN + 6, this.y + 1);
    this.y += titleLines.length * 4.5 + 3;
    this.font(8.6, false, PDF_COLOR.muted);
    this.doc.text(bodyLines, PDF_MARGIN + 6, this.y);
    this.y += bodyLines.length * 4 + 6;
  }

  badge(label: string, tone: "pass" | "caution" | "fail", x: number, y: number) {
    const color = tone === "pass" ? PDF_COLOR.green : tone === "caution" ? PDF_COLOR.sun : PDF_COLOR.red;
    const text = tone === "pass" ? "PASS" : tone === "caution" ? "CHECK" : "RED FLAG";
    const width = tone === "fail" ? 22 : 18;
    this.doc.setFillColor(...color);
    this.doc.roundedRect(x, y - 3.6, width, 5.2, 1.2, 1.2, "F");
    this.font(6.6, true, PDF_COLOR.white);
    this.doc.text(text, x + width / 2, y, { align: "center" });
    this.font(9.5, true, PDF_COLOR.ink);
    this.doc.text(pdfText(label), x + width + 3, y);
  }

  monthlyChart(values: number[], unit: string, height = 47) {
    this.ensure(height + 20);
    const top = this.y + 5;
    const base = top + height;
    const max = Math.max(...values, 1);
    this.font(6.5, false, PDF_COLOR.muted);
    [0, 0.5, 1].forEach((fraction) => {
      const yy = base - height * fraction;
      this.doc.setDrawColor(...PDF_COLOR.line);
      this.doc.setLineWidth(0.2);
      this.doc.line(PDF_MARGIN, yy, PDF_MARGIN + PDF_CONTENT_W, yy);
      this.doc.text(pdfText(`${Math.round(max * fraction)}`), PDF_MARGIN, yy - 1.2);
    });
    const slot = PDF_CONTENT_W / 12;
    values.forEach((value, index) => {
      const h = Math.max(0.5, (value / max) * (height - 8));
      const x = PDF_MARGIN + index * slot;
      this.doc.setFillColor(...(index % 2 === 0 ? PDF_COLOR.sun : ([232, 163, 65] as RGB)));
      this.doc.rect(x + 2.2, base - h, slot - 4.4, h, "F");
      this.font(6.2, true, PDF_COLOR.ink);
      this.doc.text(pdfText(`${Math.round(value)}`), x + slot / 2, base - h - 1.6, { align: "center" });
      this.font(6.5, false, PDF_COLOR.muted);
      this.doc.text(MONTH_SHORT[index]!, x + slot / 2, base + 4.5, { align: "center" });
    });
    this.y = base + 10;
    this.font(7.2, false, PDF_COLOR.muted);
    this.doc.text(pdfText(`Monthly modelled generation (${unit}). Values are annual-model inputs, not a production guarantee.`), PDF_MARGIN, this.y);
    this.y += 6;
  }

  cashflowChart(rows: { year: number; cumulative: number }[], format: (value: number) => string, height = 57) {
    this.ensure(height + 25);
    const left = PDF_MARGIN + 17;
    const right = PDF_MARGIN + PDF_CONTENT_W;
    const top = this.y + 4;
    const bottom = top + height;
    const min = Math.min(0, ...rows.map((row) => row.cumulative));
    const max = Math.max(0, ...rows.map((row) => row.cumulative));
    const spread = Math.max(1, max - min);
    const py = (value: number) => bottom - ((value - min) / spread) * height;
    const px = (year: number) => left + ((year - 1) / Math.max(1, rows.length - 1)) * (right - left);
    this.font(6.5, false, PDF_COLOR.muted);
    [min, min + spread / 2, max].forEach((value) => {
      const yy = py(value);
      this.doc.setDrawColor(...PDF_COLOR.line);
      this.doc.setLineWidth(0.2);
      this.doc.line(left, yy, right, yy);
      this.doc.text(pdfText(format(value)), left - 2, yy + 1, { align: "right" });
    });
    if (min < 0 && max > 0) {
      this.doc.setDrawColor(...PDF_COLOR.sun);
      this.doc.setLineWidth(0.45);
      this.doc.line(left, py(0), right, py(0));
    }
    for (let i = 1; i < rows.length; i++) {
      const previous = rows[i - 1]!;
      const current = rows[i]!;
      this.doc.setDrawColor(...(current.cumulative >= 0 ? PDF_COLOR.green : PDF_COLOR.red));
      this.doc.setLineWidth(0.8);
      this.doc.line(px(previous.year), py(previous.cumulative), px(current.year), py(current.cumulative));
    }
    rows.forEach((row) => {
      if (row.year !== 1 && row.year !== rows.length && row.year % 5 !== 0) return;
      this.doc.setFillColor(...(row.cumulative >= 0 ? PDF_COLOR.green : PDF_COLOR.red));
      this.doc.circle(px(row.year), py(row.cumulative), 1.15, "F");
      this.font(6.5, false, PDF_COLOR.muted);
      this.doc.text(`Y${row.year}`, px(row.year), bottom + 5, { align: "center" });
    });
    this.y = bottom + 11;
    this.font(7.2, false, PDF_COLOR.muted);
    this.doc.text("Undiscounted cumulative cash flow after upfront cost. The zero line is simple payback, not NPV break-even.", left, this.y);
    this.y += 6;
  }

  finish(filename: string) {
    const pages = this.doc.getNumberOfPages();
    for (let page = 1; page <= pages; page++) {
      this.doc.setPage(page);
      this.doc.setDrawColor(...PDF_COLOR.line);
      this.doc.setLineWidth(0.25);
      this.doc.line(PDF_MARGIN, 282, PDF_W - PDF_MARGIN, 282);
      this.font(6.8, false, PDF_COLOR.muted);
      this.doc.text(pdfText(`SolarPayback  |  ${this.options.reference}  |  Independent estimate - not financial, tax or engineering advice`), PDF_MARGIN, 288);
      this.font(7.2, true, PDF_COLOR.ink);
      this.doc.text(`${page} / ${pages}`, PDF_W - PDF_MARGIN, 288, { align: "right" });
    }
    this.doc.save(filename);
    return pages;
  }
}
