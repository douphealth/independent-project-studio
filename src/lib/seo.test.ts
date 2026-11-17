import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { CITIES, COUNTRY_GUIDES, citiesForCountry } from "./cities";
import {
  ABOUT_DESCRIPTION,
  ABOUT_TITLE,
  CALCULATOR_DESCRIPTION,
  CALCULATOR_TITLE,
  CITIES_TITLE,
  COMPARE_DESCRIPTION,
  COMPARE_TITLE,
  CONTACT_DESCRIPTION,
  CONTACT_TITLE,
  HOME_DESCRIPTION,
  HOME_TITLE,
  METHODOLOGY_DESCRIPTION,
  METHODOLOGY_TITLE,
  PRIVACY_DESCRIPTION,
  PRIVACY_TITLE,
  SCENARIOS_DESCRIPTION,
  SCENARIOS_TITLE,
  SITE_URL,
  TERMS_DESCRIPTION,
  TERMS_TITLE,
  absoluteUrl,
  citiesDescription,
  cityDescription,
  cityTitle,
  countryDescription,
  countryTitle,
  indexablePaths,
  llmsTxt,
  organizationNode,
  pageHead,
  robotsTxt,
  sitemapXml,
  websiteNode,
} from "./seo";

const STATIC_META = [
  [HOME_TITLE, HOME_DESCRIPTION],
  [CALCULATOR_TITLE, CALCULATOR_DESCRIPTION],
  [CITIES_TITLE, citiesDescription()],
  [COMPARE_TITLE, COMPARE_DESCRIPTION],
  [METHODOLOGY_TITLE, METHODOLOGY_DESCRIPTION],
  [ABOUT_TITLE, ABOUT_DESCRIPTION],
  [PRIVACY_TITLE, PRIVACY_DESCRIPTION],
  [TERMS_TITLE, TERMS_DESCRIPTION],
  [CONTACT_TITLE, CONTACT_DESCRIPTION],
  [SCENARIOS_TITLE, SCENARIOS_DESCRIPTION],
] as const;

describe("production origin", () => {
  it("hardcodes the public apex and ignores pages.dev", () => {
    const source = readFileSync(path.join(process.cwd(), "src/lib/site.ts"), "utf8");
    expect(SITE_URL).toBe("https://solarpayback.shop");
    expect(source).toContain('export const SITE_URL = "https://solarpayback.shop"');
    expect(source).not.toContain("pages.dev");
    expect(source).not.toMatch(/process\.env|CF_PAGES|request\.url|pages\.dev/);
  });
});

describe("indexable metadata", () => {
  it("keeps titles and descriptions within search limits and unique", () => {
    const titles = STATIC_META.map(([title]) => title);
    const descriptions = STATIC_META.map(([, description]) => description);
    for (const title of titles) expect(title.length).toBeLessThanOrEqual(60);
    for (const description of descriptions) expect(description.length).toBeLessThanOrEqual(160);
    expect(new Set(titles).size).toBe(titles.length);
    expect(new Set(descriptions).size).toBe(descriptions.length);
  });

  it("keeps city and country titles and descriptions within limits", () => {
    for (const city of CITIES) {
      expect(cityTitle(city.name).length).toBeLessThanOrEqual(60);
      expect(cityDescription(city.name, 99999).length).toBeLessThanOrEqual(160);
    }
    for (const country of COUNTRY_GUIDES) {
      const names = citiesForCountry(country.slug).map((city) => city.name);
      expect(countryTitle(country.name).length).toBeLessThanOrEqual(60);
      expect(countryDescription(country.name, names, country.currency).length).toBeLessThanOrEqual(160);
    }
  });
});

describe("sitemap, robots, and llms", () => {
  it("lists every indexable URL on the production origin", () => {
    const paths = indexablePaths();
    expect(paths).toHaveLength(9 + COUNTRY_GUIDES.length + CITIES.length);
    expect(paths).not.toContain("/scenarios");
    const xml = sitemapXml();
    expect(xml.startsWith("<?xml")).toBe(true);
    expect(xml).toContain('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"');
    expect(xml.match(/<loc>/g)).toHaveLength(paths.length);
    for (const path of paths) expect(xml).toContain(`<loc>${absoluteUrl(path)}</loc>`);
    expect(xml).not.toContain("pages.dev");
    expect(xml).not.toContain("solar-payback-93s");
  });

  it("allows AI crawlers and points the sitemap at the apex", () => {
    const robots = robotsTxt();
    for (const agent of ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "PerplexityBot", "ClaudeBot", "Google-Extended", "Applebot-Extended", "Bingbot"]) {
      expect(robots).toContain(`User-agent: ${agent}`);
    }
    expect(robots).toContain("Allow: /");
    expect(robots).not.toContain("Disallow");
    expect(robots).toContain("Sitemap: https://solarpayback.shop/sitemap.xml");
    expect(robots).not.toContain("pages.dev");
  });

  it("points llms.txt and structured data at the apex", () => {
    const llms = llmsTxt();
    expect(llms).toContain("https://solarpayback.shop/calculator");
    expect(llms).toContain("https://solarpayback.shop/cities/athens");
    expect(llms).toContain("https://solarpayback.shop/countries/greece");
    expect(llms).not.toContain("pages.dev");
    const head = pageHead({ title: HOME_TITLE, description: HOME_DESCRIPTION, path: "/", jsonLd: { "@graph": [organizationNode(), websiteNode()] } });
    expect(head.links[0]).toEqual({ rel: "canonical", href: "https://solarpayback.shop/" });
    expect(head.meta).toContainEqual({ property: "og:url", content: "https://solarpayback.shop/" });
    expect(JSON.stringify(head.scripts)).toContain("https://solarpayback.shop/#organization");
    expect(JSON.stringify(head.scripts)).not.toContain("pages.dev");
  });
});
