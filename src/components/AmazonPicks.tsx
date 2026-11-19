import { AMAZON } from "@/monetize.config";

export type Pick = { label: string; query: string; why: string };

/** Amazon search link with the site's Associates tag (no prices: those need the Product Advertising API). */
export const amazonUrl = (query: string) => `https://${AMAZON.domain}/s?k=${encodeURIComponent(query)}&tag=${encodeURIComponent(AMAZON.tag)}`;

/**
 * Labelled Amazon recommendations. Renders nothing until AMAZON.tag is set in src/monetize.config.ts.
 * Picks are product categories that follow from the page's own guidance, never a change to the verdict.
 */
export function AmazonPicks({ title, intro, picks }: { title: string; intro?: string; picks: Pick[] }) {
  if (!AMAZON.tag || !picks.length) return null;
  return (
    <aside className="mx-auto my-10 w-full max-w-6xl px-5" aria-label="Shopping suggestions">
      <div className="rounded-2xl border border-dashed border-border bg-card p-5">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Shopping · Amazon</p>
        <h2 className="mt-1 text-xl font-semibold">{title}</h2>
        {intro && <p className="mt-1 text-sm text-muted-foreground">{intro}</p>}
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {picks.map((p) => (
            <li key={p.query}>
              <a href={amazonUrl(p.query)} target="_blank" rel="sponsored nofollow noopener" data-offer="amazon" className="block h-full rounded-xl border border-border p-4 transition hover:border-primary">
                <span className="block font-semibold">{p.label}</span>
                <span className="mt-1 block text-sm text-muted-foreground">{p.why}</span>
                <span className="mt-3 block text-sm font-semibold text-primary">See options on Amazon ↗</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">As an Amazon Associate we earn from qualifying purchases. Suggestions never change our research or verdicts.</p>
    </aside>
  );
}
