import { ClientOnly, createFileRoute } from "@tanstack/react-router";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { SavedScenarios } from "@/components/SavedScenarios";
import { SCENARIOS_DESCRIPTION, SCENARIOS_TITLE, pageHead } from "@/lib/seo";

export const Route = createFileRoute("/scenarios")({
  head: () => pageHead({ title: SCENARIOS_TITLE, description: SCENARIOS_DESCRIPTION, path: "/scenarios", noindex: true }),
  headers: () => ({ "X-Robots-Tag": "noindex" }),
  component: () => <div className="min-h-screen"><SiteHeader /><main className="mx-auto max-w-6xl px-5 py-12"><p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Private on this device</p><h1 className="mt-3 text-4xl font-semibold sm:text-6xl">Saved solar scenarios</h1><ClientOnly fallback={<div className="mt-10 h-64 animate-pulse rounded-3xl bg-muted" aria-label="Loading saved scenarios" />}><SavedScenarios /></ClientOnly></main><SiteFooter /></div>,
});
