import type { ReactNode } from "react";
import { SiteFooter, SiteHeader } from "./SiteChrome";

export function ContentPage({ eyebrow, title, intro, children }: { eyebrow: string; title: string; intro: string; children: ReactNode }) {
  return <div className="min-h-screen"><SiteHeader /><main className="mx-auto max-w-3xl px-5 py-12"><p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">{eyebrow}</p><h1 className="mt-3 text-4xl font-semibold sm:text-5xl">{title}</h1><p className="mt-4 text-lg leading-relaxed text-muted-foreground">{intro}</p><div className="mt-10 space-y-10 leading-relaxed text-muted-foreground [&_h2]:mb-3 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:text-foreground [&_h3]:mb-2 [&_h3]:mt-5 [&_h3]:font-semibold [&_h3]:text-foreground [&_strong]:text-foreground [&_a]:text-primary [&_a]:underline">{children}</div></main><SiteFooter /></div>;
}
