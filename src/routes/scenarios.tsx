import { ClientOnly, createFileRoute } from "@tanstack/react-router";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { SavedScenarios } from "@/components/SavedScenarios";
import { SITE_URL } from "@/lib/cities";

const T = "Saved solar quotes & scenario comparison | SolarPayback";
const D = "Compare solar installer scenarios saved privately in your browser. Reopen, export and evaluate payback, NPV and long-term net gain.";

export const Route = createFileRoute("/scenarios")({
  head: () => ({ meta: [{ title: T }, { name: "description", content: D }, { name: "robots", content: "noindex,follow" }, { property: "og:title", content: T }, { property: "og:description", content: D }, { property: "og:type", content: "website" }, { property: "og:url", content: `${SITE_URL}/scenarios` }, { name: "twitter:card", content: "summary_large_image" }], links: [{ rel: "canonical", href: `${SITE_URL}/scenarios` }] }),
  component: () => <div className="min-h-screen"><SiteHeader /><main className="mx-auto max-w-6xl px-5 py-12"><p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Private on this device</p><h1 className="mt-3 text-4xl font-semibold sm:text-6xl">Saved solar scenarios</h1><ClientOnly fallback={<div className="mt-10 h-64 animate-pulse rounded-3xl bg-muted" aria-label="Loading saved scenarios" />}><SavedScenarios /></ClientOnly></main><SiteFooter /></div>,
});
