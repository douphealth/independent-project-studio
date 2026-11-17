import { createFileRoute, Link } from "@tanstack/react-router";
import { ContentPage } from "@/components/ContentPage";
import { PRIVACY_DESCRIPTION, PRIVACY_TITLE, breadcrumbNode, jsonLdGraph, pageHead } from "@/lib/seo";

const CRUMBS = [{ name: "Home", path: "/" }, { name: "Privacy", path: "/privacy" }] as const;
export const Route = createFileRoute("/privacy")({
  head: () => pageHead({ title: PRIVACY_TITLE, description: PRIVACY_DESCRIPTION, path: "/privacy", jsonLd: jsonLdGraph(breadcrumbNode(CRUMBS)) }),
  component: () => <ContentPage eyebrow="Privacy in plain language" title="Your quote is not our product." intro="SolarPayback has no accounts, advertising trackers or installer lead lists. This page explains the data that is still necessary to calculate a result." crumbs={CRUMBS} related={[{ href: "/terms", label: "Terms" }, { href: "/contact", label: "Contact and corrections" }]}>
    <section><h2>Financial and household inputs</h2><p>System cost, grant, electricity use, tariffs and other financial assumptions are processed in your browser. They are not sent to a SolarPayback database because no such customer database exists in this version.</p></section>
    <section><h2>Saved scenarios</h2><p>When you select Save, the scenario and a dated solar-profile snapshot are stored in your browser's local storage on that device. They remain until you delete them or clear site data. They are not synchronized between devices. Use the Saved scenarios page to delete individual entries.</p></section>
    <section><h2>Share links</h2><p>A share link encodes your scenario name, location, roof settings and financial assumptions in the URL. Anyone with the link can read them. URLs may also be retained in browser history, server logs or referrer data. Do not share a link containing information you want to keep private. Shared scenario URLs are marked noindex.</p></section>
    <section><h2>Location requests</h2><p>Your location search is sent through our server to <strong>Open-Meteo's geocoding API</strong>. Coordinates and roof parameters are sent through our server to the <strong>EU JRC PVGIS API</strong> to obtain production estimates. Those providers can observe the request and network metadata under their own policies.</p><p><a href="https://open-meteo.com/en/terms" target="_blank" rel="noreferrer">Open-Meteo terms</a> · <a href="https://commission.europa.eu/legal-notice_en" target="_blank" rel="noreferrer">European Commission legal notice</a></p></section>
    <section><h2>Exports and external resources</h2><p>CSV and PDF generation happens on your device. Fonts are served with the site rather than requested from a third-party font service. Official policy links and the source repository are external sites; their own privacy terms apply when you choose to open them.</p></section>
    <section><h2>Measurement and changes</h2><p>This version does not include an analytics or conversion-tracking service. If privacy-respecting aggregate measurement is added later, this notice should be updated before deployment. For privacy questions or corrections, use the <Link to="/contact">contact and corrections page</Link>.</p></section>
  </ContentPage>,
});
