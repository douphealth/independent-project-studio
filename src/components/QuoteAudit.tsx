import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, FileSearch, Loader2, ShieldAlert, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { CONTRACT_ITEMS, runAudit, type AuditInput, type ContractKey, type Severity } from "@/lib/audit";
import { money, num, type Inputs } from "@/lib/solar";
import type { SolarProfile } from "@/lib/pvgis.functions";
import type { Scenario } from "@/lib/scenarios";
import type { Currency } from "@/lib/cities";

const SEV: Record<Severity, { icon: typeof CheckCircle2; cls: string; label: string }> = {
  pass: { icon: CheckCircle2, cls: "text-success", label: "Pass" },
  caution: { icon: AlertTriangle, cls: "text-primary", label: "Check" },
  fail: { icon: XCircle, cls: "text-destructive", label: "Red flag" },
};

export function QuoteAudit({ base, profile, scenario, currency }: { base: Inputs; profile: SolarProfile; scenario: Scenario | null; currency: Currency }) {
  const [claimKwh, setClaimKwh] = useState(0);
  const [claimPayback, setClaimPayback] = useState(0);
  const [claimSavings, setClaimSavings] = useState(0);
  const [batteryCost, setBatteryCost] = useState(0);
  const [batterySelf, setBatterySelf] = useState(70);
  const [others, setOthers] = useState("");
  const [contract, setContract] = useState<Partial<Record<ContractKey, boolean>>>({});
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const input = useMemo<AuditInput>(() => ({
    base, claimedAnnualKwh: claimKwh, claimedPaybackYears: claimPayback, claimedYear1Savings: claimSavings,
    yearToYearSdKwhPerKwp: profile.yearToYearSdKwh,
    battery: batteryCost > 0 ? { cost: batteryCost, selfUsePctWith: batterySelf } : null,
    otherQuoteCostPerKw: others.split(/[,;\s]+/).map(Number).filter((n) => Number.isFinite(n) && n > 0),
    contract, currency,
  }), [currency, base, claimKwh, claimPayback, claimSavings, profile.yearToYearSdKwh, batteryCost, batterySelf, others, contract]);
  const r = useMemo(() => { try { return runAudit(input); } catch { return null; } }, [input]);

  async function download() {
    if (!scenario || !r) return;
    setBusy(true); setMsg(null);
    try { const { exportAuditPdf } = await import("@/lib/export-audit"); const pages = await exportAuditPdf(scenario, profile, input, r); setMsg(`Audit dossier downloaded (${pages} pages).`); }
    catch { setMsg("The audit dossier could not be generated. Please try again."); }
    finally { setBusy(false); }
  }

  const n = (set: (n: number) => void) => (e: React.ChangeEvent<HTMLInputElement>) => { const x = Number(e.target.value); set(Number.isFinite(x) && x >= 0 ? x : 0); };
  const gradeTone = !r ? "" : r.grade <= "B" ? "bg-success text-success-foreground" : r.grade === "C" ? "bg-primary text-primary-foreground" : "bg-destructive text-destructive-foreground";

  return (
    <section id="quote-audit" aria-labelledby="audit-title" className="overflow-hidden rounded-3xl border border-border bg-card shadow-soft">
      <div className="bg-night p-6 text-night-foreground">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary-glow"><FileSearch className="h-4 w-4" />Independent quote audit</p>
        <h2 id="audit-title" className="mt-2 text-2xl font-semibold sm:text-3xl">Is your installer's quote telling the truth?</h2>
        <p className="mt-2 max-w-2xl text-sm text-night-muted">Enter what the installer promised. We test each claim against PVGIS satellite data for this exact roof and stress-test the economics. The figures above (cost, tariff, self-use) are treated as the quote.</p>
      </div>
      <div className="grid gap-6 p-6 lg:grid-cols-2">
        <div className="space-y-5">
          <fieldset className="grid gap-3 sm:grid-cols-3"><legend className="mb-2 text-sm font-semibold">Installer's claims (0 = not stated)</legend>
            <Num id="a-kwh" label="Output, kWh/yr" value={claimKwh} onChange={n(setClaimKwh)} />
            <Num id="a-pb" label="Payback, yrs" value={claimPayback} onChange={n(setClaimPayback)} step={0.5} />
            <Num id="a-sv" label={`Yr-1 saving, ${currency}`} value={claimSavings} onChange={n(setClaimSavings)} />
          </fieldset>
          <fieldset className="grid gap-3 sm:grid-cols-2"><legend className="mb-2 text-sm font-semibold">Battery in the quote? (0 = none)</legend>
            <Num id="a-bc" label={`Battery price, ${currency}`} value={batteryCost} onChange={n(setBatteryCost)} />
            <Num id="a-bs" label="Self-use with battery, %" value={batterySelf} onChange={(e) => setBatterySelf(Math.min(100, Math.max(0, Number(e.target.value) || 0)))} />
          </fieldset>
          <div><label htmlFor="a-oth" className="text-xs font-medium text-muted-foreground">Your other quotes, {currency} per kWp (comma-separated)</label><Input id="a-oth" inputMode="decimal" placeholder="e.g. 1150, 1420" value={others} onChange={(e) => setOthers(e.target.value)} className="mt-1" /></div>
          <fieldset><legend className="mb-2 text-sm font-semibold">What does the quote/contract include?</legend>
            <div className="space-y-2">{CONTRACT_ITEMS.map((c) => <label key={c.key} className="flex items-start gap-2.5 text-sm"><Checkbox checked={!!contract[c.key]} onCheckedChange={(v) => setContract((s) => ({ ...s, [c.key]: v === true }))} className="mt-0.5" /><span>{c.label}{c.critical && <span className="ml-1 text-xs font-semibold text-destructive">critical</span>}</span></label>)}</div>
          </fieldset>
        </div>
        <div className="space-y-4" aria-live="polite">
          {r ? <>
            <div className="flex items-center gap-4 rounded-2xl bg-secondary p-5">
              <span className={`grid h-16 w-16 shrink-0 place-items-center rounded-full font-display text-3xl font-bold ${gradeTone}`} aria-label={`Grade ${r.grade}`}>{r.grade}</span>
              <div><p className="text-xs uppercase tracking-widest text-muted-foreground">Audit score {r.score}/100</p><p className="mt-1 font-semibold leading-snug">{r.verdict}</p></div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Mini label="PVGIS year-1 output" value={`${num(r.pvgisAnnualKwh)} kWh`} />
              <Mini label="Claim vs PVGIS" value={r.yieldGapPct == null ? "—" : `${r.yieldGapPct >= 0 ? "+" : ""}${num(r.yieldGapPct, 1)}%`} />
              <Mini label="Independent payback" value={r.model.payback == null ? "Never" : `${num(r.model.payback, 1)} yrs`} />
              <Mini label="Break-even price" value={r.breakEvenCostPerKw == null ? "—" : `${money(r.breakEvenCostPerKw, currency)}/kWp`} />
            </div>
            <ul className="space-y-2">{r.findings.map((f, i) => { const S = SEV[f.severity]; return <li key={i} className="flex gap-3 rounded-xl border border-border p-3"><S.icon className={`mt-0.5 h-5 w-5 shrink-0 ${S.cls}`} aria-label={S.label} /><div><p className="text-sm font-semibold">{f.title}</p><p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{f.detail}</p></div></li>; })}</ul>
            <div className="rounded-2xl border border-primary/40 bg-accent p-5">
              <p className="flex items-center gap-2 font-semibold text-accent-foreground"><ShieldAlert className="h-5 w-5" />Full Quote Audit Dossier (PDF)</p>
              <p className="mt-1 text-sm text-accent-foreground/80">Graded verdict, generation forensics with monthly chart, six downside scenarios, battery due diligence, {base.lifetime}-year ledger, contract checklist and a tailored list of questions to send your installer.</p>
              <Button type="button" variant="sun" className="mt-4" onClick={download} disabled={busy || !scenario}>{busy ? <Loader2 className="animate-spin" /> : <FileSearch />}Download audit dossier</Button>
              {msg && <p role="status" className="mt-2 text-sm">{msg}</p>}
            </div>
          </> : <p className="text-sm text-muted-foreground">Adjust the inputs to a valid range to run the audit.</p>}
        </div>
      </div>
    </section>
  );
}

function Num({ id, label, value, onChange, step = 1 }: { id: string; label: string; value: number; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; step?: number }) {
  return <div><label htmlFor={id} className="text-xs font-medium text-muted-foreground">{label}</label><Input id={id} type="number" min={0} step={step} value={value || ""} placeholder="0" onChange={onChange} className="mt-1 tabular" /></div>;
}
function Mini({ label, value }: { label: string; value: string }) { return <div className="rounded-xl bg-secondary p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-0.5 font-semibold tabular">{value}</p></div>; }
