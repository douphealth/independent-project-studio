import { createFileRoute, Link } from "@tanstack/react-router";
import { ContentPage } from "@/components/ContentPage";
import { SITE_URL } from "@/lib/cities";

const T = "Terms & estimate limitations | SolarPayback";
const D = "The terms and limitations for SolarPayback's solar production, payback, savings, NPV, IRR and report estimates.";
export const Route = createFileRoute("/terms")({
  head: () => ({ meta: [{ title: T }, { name: "description", content: D }, { property: "og:title", content: T }, { property: "og:description", content: D }, { property: "og:type", content: "website" }, { property: "og:url", content: `${SITE_URL}/terms` }, { name: "twitter:card", content: "summary_large_image" }], links: [{ rel: "canonical", href: `${SITE_URL}/terms` }] }),
  component: () => <ContentPage eyebrow="Terms of use" title="Estimates for decisions—not promises of returns." intro="Use SolarPayback to compare assumptions and prepare better questions for installers, engineers and financial professionals.">
    <section><h2>No professional advice</h2><p>SolarPayback provides general estimates, not financial, investment, tax, legal or engineering advice. We do not assess roof structure, electrical safety, planning permission, product warranties or installer suitability.</p></section>
    <section><h2>No guaranteed outcome</h2><p>Actual generation and savings vary with weather, shading, roof geometry, equipment, downtime, household behavior, tariffs, taxes, policy changes and installation quality. A payback period or return shown by the model is not guaranteed.</p></section>
    <section><h2>External data</h2><p>PVGIS and Open-Meteo are external public services. Although responses are validated, cached and labelled, we cannot guarantee their availability or accuracy. Cached profiles may be older than a live request; stale fallbacks are labelled.</p></section>
    <section><h2>Illustrative defaults and policy guidance</h2><p>Default installed costs, tariffs and financial assumptions are illustrative—not market averages or quotes. Country checklists link to official starting points but do not establish eligibility for grants, export payments or other support. Verify current rules for your installation address and date.</p></section>
    <section><h2>Your responsibility</h2><p>Check every material assumption before making a purchase. Obtain a site-specific survey and complete written quote. Read our <Link to="/methodology">methodology</Link> for the model's exact scope and limitations.</p></section>
  </ContentPage>,
});
