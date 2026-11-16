import { createFileRoute } from "@tanstack/react-router";
import { ExternalLink, FileWarning, Github, Scale } from "lucide-react";
import { ContentPage } from "@/components/ContentPage";
import { SITE_URL } from "@/lib/cities";

const T = "Contact & data corrections | SolarPayback";
const D = "Report a SolarPayback calculation issue, broken official source or misleading directory statement through the project's public repository.";
export const Route = createFileRoute("/contact")({
  head: () => ({ meta: [{ title: T }, { name: "description", content: D }, { property: "og:title", content: T }, { property: "og:description", content: D }, { property: "og:type", content: "website" }, { property: "og:url", content: `${SITE_URL}/contact` }, { name: "twitter:card", content: "summary_large_image" }], links: [{ rel: "canonical", href: `${SITE_URL}/contact` }] }),
  component: () => <ContentPage eyebrow="Contact & corrections" title="Help make every number more trustworthy." intro="Corrections are handled through the project's public source repository, where technical details and resolution status can be inspected.">
    <section className="rounded-3xl border border-border bg-card p-6 shadow-soft"><Github className="h-7 w-7 text-primary" /><h2 className="mt-4">Report an issue on GitHub</h2><p>Use the issue tracker for calculation discrepancies, incorrect source labels, broken official links or accessibility problems. Do not attach electricity bills, addresses, quote documents or other private information.</p><a href="https://github.com/douphealth/solar-payback/issues" target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 font-semibold !text-primary-foreground no-underline">Open the issue tracker<ExternalLink className="h-4 w-4" /></a></section>
    <section><h2>What to include</h2><ul className="list-disc space-y-2 pl-5"><li>The public page URL and the statement or result you believe is wrong.</li><li>The expected result and reproducible assumptions, with private details removed.</li><li>An authoritative source and effective date for a policy or attribution correction.</li><li>Browser and device information for an accessibility or layout problem.</li></ul></section>
    <section><h2>What this channel cannot do</h2><p>The repository does not provide individualized financial advice, installer recommendations, roof surveys or eligibility determinations. Never post private bills or identity documents. SolarPayback does not sell your details to installers.</p></section>
  </ContentPage>,
});
