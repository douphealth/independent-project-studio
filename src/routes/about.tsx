import { createFileRoute, Link } from "@tanstack/react-router";
import { ContentPage } from "@/components/ContentPage";
import { SITE_URL } from "@/lib/cities";

const T = "About SolarPayback — independent solar intelligence";
const D = "Why SolarPayback exists, how it stays independent, and how live solar data and transparent assumptions help homeowners assess quotes.";
export const Route = createFileRoute("/about")({
  head: () => ({ meta: [{ title: T }, { name: "description", content: D }, { property: "og:title", content: T }, { property: "og:description", content: D }, { property: "og:type", content: "website" }, { property: "og:url", content: `${SITE_URL}/about` }, { name: "twitter:card", content: "summary_large_image" }], links: [{ rel: "canonical", href: `${SITE_URL}/about` }] }),
  component: () => <ContentPage eyebrow="About the project" title="Independent by design." intro="SolarPayback helps homeowners answer one practical question: will this rooftop solar quote pay for itself on my home?">
    <section><h2>No installer marketplace</h2><p>SolarPayback does not sell leads, accept installer commissions, rank sponsors or invent reviews. Directory positions are determined by search and objective sort choices—not payment.</p></section>
    <section><h2>Verifiable solar data</h2><p>City and location production comes from the European Commission Joint Research Centre's <a href="https://re.jrc.ec.europa.eu/pvgis.html" target="_blank" rel="noreferrer">PVGIS service</a>. Every result identifies the radiation database, source period, roof assumptions and retrieval date. We cache profiles for resilience and label stale fallbacks.</p></section>
    <section><h2>Your assumptions remain visible</h2><p>Illustrative starting values are not market prices. The calculator lets you replace the installed cost, grant, import and export tariffs, consumption, self-use, maintenance, degradation and replacement assumptions. The formulas are explained in our <Link to="/methodology">methodology</Link>.</p></section>
    <section><h2>Private, account-free tools</h2><p>Saved scenarios stay in your browser's local storage. PDF and CSV files are generated on your device. A share link contains the scenario assumptions in the URL, so treat it as information you intentionally disclose.</p></section>
    <section><h2>Corrections are welcome</h2><p>Solar data and policy guidance need scrutiny. Use our <Link to="/contact">corrections page</Link> to report a broken source, misleading explanation or calculation issue through the project's public repository.</p></section>
  </ContentPage>,
});
