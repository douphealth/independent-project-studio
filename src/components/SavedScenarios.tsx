import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Download, FileText, Trash2 } from "lucide-react";
import { deleteScenario, listScenarios, type SavedScenario } from "@/lib/storage";
import { encodeScenario } from "@/lib/scenarios";
import { calculate, money, num } from "@/lib/solar";
import { exportScenarioCsv, exportScenarioPdf } from "@/lib/export";
import { Button } from "@/components/ui/button";

export function SavedScenarios() {
  const [rows, setRows] = useState<SavedScenario[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  useEffect(() => { setRows(listScenarios()); }, []);
  const comparisons = useMemo(() => selected.map((id) => rows.find((r) => r.id === id)).filter((r): r is SavedScenario => Boolean(r)), [rows, selected]);
  function remove(id: string) { deleteScenario(id); setRows(listScenarios()); setSelected((s) => s.filter((x) => x !== id)); }
  function toggle(id: string) { setSelected((s) => s.includes(id) ? s.filter((x) => x !== id) : s.length < 3 ? [...s, id] : s); }
  if (!rows.length) return <section className="mt-10 rounded-3xl border border-dashed border-border bg-card p-12 text-center"><h2 className="text-3xl font-semibold">No saved scenarios on this device</h2><p className="mx-auto mt-3 max-w-lg text-muted-foreground">Save two or three installer quotes in the calculator, then return here to compare their costs, payback and long-term return.</p><Button asChild variant="sun" className="mt-6"><Link to="/calculator">Create a scenario<ArrowRight /></Link></Button></section>;
  return <>
    <p className="mt-5 text-sm text-muted-foreground">Stored only in this browser. Select up to three quotes to compare. Sharing a scenario puts its assumptions into the copied URL.</p>
    <div className="mt-8 grid gap-5 lg:grid-cols-2">{rows.map((s) => {
      const result = s.profile ? calculate({ ...s.values, annualKwhPerKwp: s.profile.annualKwhPerKwp }) : null;
      return <article key={s.id} className="rounded-3xl border border-border bg-card p-6 shadow-soft"><div className="flex items-start justify-between gap-4"><div><h2 className="text-2xl font-semibold">{s.name}</h2><p className="mt-1 text-sm text-muted-foreground">{s.place.name}, {s.place.country} · updated {new Date(s.updatedAt).toLocaleDateString("en-GB")}</p></div><label className="flex items-center gap-2 text-xs font-medium"><input type="checkbox" checked={selected.includes(s.id)} disabled={!selected.includes(s.id) && selected.length >= 3} onChange={() => toggle(s.id)} />Compare</label></div>
        <div className="mt-5 grid grid-cols-3 gap-3"><Metric label="Payback" value={result?.payback != null ? `${num(result.payback, 1)} yrs` : "—"} /><Metric label="Upfront" value={result ? money(result.upfront, s.currency) : "—"} /><Metric label="NPV" value={result ? money(result.npv, s.currency) : "—"} /></div>
        <div className="mt-5 flex flex-wrap gap-2"><Button asChild variant="sun" size="sm"><Link to="/calculator" search={{ scenario: encodeScenario(s) }}>Open & edit<ArrowRight /></Link></Button><Button variant="outline" size="sm" disabled={!s.profile} onClick={() => s.profile && exportScenarioCsv(s, s.profile)}><Download />CSV</Button><Button variant="outline" size="sm" disabled={!s.profile} onClick={() => s.profile && void exportScenarioPdf(s, s.profile)}><FileText />PDF</Button><Button variant="ghost" size="sm" onClick={() => remove(s.id)} aria-label={`Delete ${s.name}`}><Trash2 />Delete</Button></div>
      </article>;
    })}</div>
    {comparisons.length > 1 && <section className="mt-10 overflow-hidden rounded-3xl border border-border bg-card shadow-soft"><div className="p-6"><h2 className="text-3xl font-semibold">Quote comparison</h2><p className="mt-1 text-sm text-muted-foreground">Each row uses the solar profile saved with that scenario. Check the retrieval date before making a final decision.</p></div><div className="overflow-x-auto"><table className="w-full min-w-[720px] text-sm"><thead className="bg-secondary text-left text-xs uppercase tracking-wider text-muted-foreground"><tr><th className="p-4">Metric</th>{comparisons.map((s) => <th key={s.id} className="p-4">{s.name}</th>)}</tr></thead><tbody>{[
      ["Location", (s: SavedScenario) => s.place.name], ["System", (s: SavedScenario) => `${num(s.values.systemKw, 1)} kWp`],
      ["Upfront", (s: SavedScenario) => s.profile ? money(calculate({ ...s.values, annualKwhPerKwp: s.profile.annualKwhPerKwp }).upfront, s.currency) : "—"],
      ["Payback", (s: SavedScenario) => { if (!s.profile) return "—"; const p = calculate({ ...s.values, annualKwhPerKwp: s.profile.annualKwhPerKwp }).payback; return p == null ? "Not within lifetime" : `${num(p, 1)} years`; }],
      ["Year-1 savings", (s: SavedScenario) => s.profile ? money(calculate({ ...s.values, annualKwhPerKwp: s.profile.annualKwhPerKwp }).year1Savings, s.currency) : "—"],
      ["NPV", (s: SavedScenario) => s.profile ? money(calculate({ ...s.values, annualKwhPerKwp: s.profile.annualKwhPerKwp }).npv, s.currency) : "—"],
      ["Net gain", (s: SavedScenario) => s.profile ? money(calculate({ ...s.values, annualKwhPerKwp: s.profile.annualKwhPerKwp }).totalNet, s.currency) : "—"],
      ["Solar data", (s: SavedScenario) => s.profile ? `${num(s.profile.annualKwhPerKwp)} kWh/kWp · ${s.profile.fetchedAt.slice(0, 10)}` : "Not saved"],
    ].map(([label, fn]) => <tr key={label as string} className="border-t border-border"><th className="p-4 text-left font-medium text-muted-foreground">{label as string}</th>{comparisons.map((s) => <td key={s.id} className="p-4 font-semibold tabular">{(fn as (s: SavedScenario) => string)(s)}</td>)}</tr>)}</tbody></table></div></section>}
  </>;
}
function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-xl bg-secondary p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 font-semibold tabular">{value}</p></div>; }
