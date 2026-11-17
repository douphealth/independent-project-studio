import { CITIES, COUNTRY_GUIDES } from "./cities";
import { SITE_URL } from "./site";
import { num } from "./solar";

export { SITE_URL };

export const SOCIAL_IMAGE = `${SITE_URL}/solarpayback-social.jpg`;
export const SOCIAL_IMAGE_ALT = "Solar panels on a whitewashed Mediterranean roof at sunset";
export const ORGANIZATION_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;

export const HOME_TITLE = "SolarPayback — When will solar panels pay for themselves?";
export const HOME_DESCRIPTION = "Estimates when rooftop solar pays for itself using live EU PVGIS data, your electricity price, and your installer quote.";
export const CALCULATOR_TITLE = "Solar payback, NPV and IRR calculator | SolarPayback";
export const CALCULATOR_DESCRIPTION = "Estimate solar payback, savings, NPV and IRR from live PVGIS production and the installer quote and electricity tariff you enter.";
export const CITIES_TITLE = "Compare solar yield by city | SolarPayback";
export const COMPARE_TITLE = "Compare solar production in European cities | SolarPayback";
export const COMPARE_DESCRIPTION = "Compare annual and monthly PVGIS solar yield for up to three cities, with the same assumptions and links to each city's calculator.";
export const METHODOLOGY_TITLE = "Solar payback methodology and limits | SolarPayback";
export const METHODOLOGY_DESCRIPTION = "PVGIS assumptions and formulas behind SolarPayback production, self-use, payback, NPV, IRR, LCOE, maintenance and inverter replacement.";
export const ABOUT_TITLE = "About SolarPayback — independent estimates";
export const ABOUT_DESCRIPTION = "SolarPayback is an independent solar payback tool. It uses live PVGIS data, shows its assumptions, and does not sell installer leads.";
export const PRIVACY_TITLE = "Privacy: local scenarios and external data | SolarPayback";
export const PRIVACY_DESCRIPTION = "What SolarPayback stores in your browser, what share links contain, and which location data is sent to PVGIS and Open-Meteo.";
export const TERMS_TITLE = "Terms and estimate limitations | SolarPayback";
export const TERMS_DESCRIPTION = "SolarPayback provides general solar production and payback estimates, not financial, tax, legal or engineering advice or guaranteed savings.";
export const CONTACT_TITLE = "Contact and data corrections | SolarPayback";
export const CONTACT_DESCRIPTION = "Report a SolarPayback calculation issue, broken official source or misleading statement through the project's public repository.";
export const SCENARIOS_TITLE = "Saved solar scenarios | SolarPayback";
export const SCENARIOS_DESCRIPTION = "Compare solar installer scenarios saved privately in this browser. Reopen, export and review payback, NPV and long-term net gain.";

const STATIC_INDEXABLE_PATHS = ["/", "/calculator", "/cities", "/compare", "/methodology", "/about", "/privacy", "/terms", "/contact"] as const;

export function citiesDescription(): string {
  return `Compare live PVGIS solar production for ${CITIES.length} European cities, then calculate payback with your own quote and electricity tariff.`;
}

export function cityTitle(name: string): string {
  return `${name} solar yield and payback | SolarPayback`;
}

export function cityDescription(name: string, annualKwhPerKwp: number): string {
  return `${name} produces about ${num(annualKwhPerKwp)} kWh/kWp/year (PVGIS). Compare monthly output and calculate payback with your own quote.`;
}

export function countryTitle(name: string): string {
  return `${name} solar yield by city | SolarPayback`;
}

export function countryDescription(name: string, cityNames: readonly string[], currency: string): string {
  return `Compare live PVGIS solar yield for ${cityNames.join(", ")} in ${name}. Calculate payback in ${currency} using your own quote.`;
}

export function absoluteUrl(path: string): string {
  if (path === "/") return `${SITE_URL}/`;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function indexablePaths(): string[] {
  return [
    ...STATIC_INDEXABLE_PATHS,
    ...COUNTRY_GUIDES.map((country) => `/countries/${country.slug}`),
    ...CITIES.map((city) => `/cities/${city.slug}`),
  ];
}

function xmlEscape(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** Indexable HTML URLs only. lastmod is omitted: the repo stores no content modification dates. */
export function sitemapXml(): string {
  const urls = indexablePaths()
    .map((path) => `  <url><loc>${xmlEscape(absoluteUrl(path))}</loc></url>`)
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

const AI_CRAWLERS = ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "PerplexityBot", "ClaudeBot", "Google-Extended", "Applebot-Extended", "Bingbot"] as const;

export function robotsTxt(): string {
  const groups = ["*", ...AI_CRAWLERS].map((agent) => `User-agent: ${agent}\nAllow: /`).join("\n\n");
  return `${groups}\n\nSitemap: ${SITE_URL}/sitemap.xml\n`;
}

export function llmsTxt(): string {
  const keyPages = [
    ["/", "Home", "When rooftop solar pays for itself, using live EU PVGIS data and your own quote and tariff."],
    ["/calculator", "Payback calculator", "Payback, savings, NPV and IRR from live PVGIS production and the figures you enter."],
    ["/cities", "City directory", `Live PVGIS yield for ${CITIES.length} European cities.`],
    ["/compare", "Compare cities", "Annual and monthly yield for up to three cities under the same roof assumptions."],
    ["/methodology", "Methodology", "Formulas, PVGIS assumptions, and what the model does not know."],
    ["/about", "About", "Independence, data sources, and what SolarPayback does not sell."],
    ["/contact", "Contact", "Corrections through the public source repository."],
    ["/privacy", "Privacy", "Browser storage, share links, and requests sent to PVGIS and Open-Meteo."],
    ["/terms", "Terms", "Estimate limitations. Not financial, tax, legal, or engineering advice."],
  ] as const;
  const countries = COUNTRY_GUIDES.map((country) => `- [${country.name}](${absoluteUrl(`/countries/${country.slug}`)}): city yield guide, calculator currency ${country.currency}.`);
  const cities = CITIES.map((city) => `- [${city.name}](${absoluteUrl(`/cities/${city.slug}`)}): ${city.country}.`);
  const pages = keyPages.map(([path, label, summary]) => `- [${label}](${absoluteUrl(path)}): ${summary}`);
  return [
    "# SolarPayback",
    "",
    "> Independent solar payback estimates using live EU JRC PVGIS production and the electricity price and installer quote you enter. No installer commissions, sponsored rankings, or lead selling.",
    "",
    "SolarPayback estimates when rooftop solar pays for itself. Directory reference prices are illustrative defaults, not market quotes. Solar yields are fetched from PVGIS and are not hard-coded per city.",
    "",
    "## Key pages",
    "",
    ...pages,
    "",
    "## Country guides",
    "",
    ...countries,
    "",
    "## Cities",
    "",
    ...cities,
    "",
    "## Notes",
    "",
    "- Saved scenarios stay in the browser. Shared scenario URLs are noindex.",
    "- Source repository: https://github.com/douphealth/solar-payback",
    "- Solar production data: https://re.jrc.ec.europa.eu/pvgis.html",
    "",
  ].join("\n");
}

export function organizationNode() {
  return {
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name: "SolarPayback",
    url: `${SITE_URL}/`,
    logo: `${SITE_URL}/favicon.png`,
    description: "Independent solar payback estimates built on EU JRC PVGIS data. No installer commissions, sponsored rankings or lead selling.",
    sameAs: ["https://github.com/douphealth/solar-payback"],
  };
}

export function websiteNode() {
  return {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    name: "SolarPayback",
    url: `${SITE_URL}/`,
    description: HOME_DESCRIPTION,
    publisher: { "@id": ORGANIZATION_ID },
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/cities?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function breadcrumbNode(crumbs: readonly { name: string; path: string }[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.path),
    })),
  };
}

export function jsonLdGraph(...nodes: object[]) {
  return { "@context": "https://schema.org", "@graph": nodes };
}

type HeadMeta = { title: string } | { name: string; content: string } | { property: string; content: string };

export function pageHead(input: {
  title: string;
  description: string;
  path: string;
  ogType?: "website" | "article";
  noindex?: boolean;
  jsonLd?: object;
}) {
  const url = absoluteUrl(input.path);
  const meta: HeadMeta[] = [
    { title: input.title },
    { name: "description", content: input.description },
    { name: "robots", content: input.noindex ? "noindex,follow" : "index,follow" },
    { property: "og:title", content: input.title },
    { property: "og:description", content: input.description },
    { property: "og:type", content: input.ogType ?? "website" },
    { property: "og:url", content: url },
    { property: "og:image", content: SOCIAL_IMAGE },
    { property: "og:image:alt", content: SOCIAL_IMAGE_ALT },
    { property: "og:image:width", content: "1200" },
    { property: "og:image:height", content: "630" },
    { property: "og:site_name", content: "SolarPayback" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: input.title },
    { name: "twitter:description", content: input.description },
    { name: "twitter:image", content: SOCIAL_IMAGE },
    { name: "twitter:image:alt", content: SOCIAL_IMAGE_ALT },
  ];
  return {
    meta,
    links: [{ rel: "canonical", href: url }],
    scripts: input.jsonLd ? [{ type: "application/ld+json", children: JSON.stringify(input.jsonLd) }] : [],
  };
}

export function textResponse(body: string, contentType: string): Response {
  return new Response(body, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
