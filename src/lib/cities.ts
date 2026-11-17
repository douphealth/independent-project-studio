// Directory entries contain only verifiable identity and location facts.
// Solar figures are always fetched from EU JRC PVGIS — never hard-coded here.
export type Currency = "EUR" | "GBP" | "PLN";
export type City = { slug: string; name: string; country: string; countrySlug: string; lat: number; lon: number };
export type CountryGuide = {
  slug: string;
  name: string;
  currency: Currency;
  language: string;
  officialSource: string;
  officialSourceLabel: string;
  intro: string;
  checklist: string[];
};

export const CITIES: City[] = [
  { slug: "athens", name: "Athens", country: "Greece", countrySlug: "greece", lat: 37.9838, lon: 23.7275 },
  { slug: "thessaloniki", name: "Thessaloniki", country: "Greece", countrySlug: "greece", lat: 40.6401, lon: 22.9444 },
  { slug: "madrid", name: "Madrid", country: "Spain", countrySlug: "spain", lat: 40.4168, lon: -3.7038 },
  { slug: "seville", name: "Seville", country: "Spain", countrySlug: "spain", lat: 37.3891, lon: -5.9845 },
  { slug: "barcelona", name: "Barcelona", country: "Spain", countrySlug: "spain", lat: 41.3874, lon: 2.1686 },
  { slug: "lisbon", name: "Lisbon", country: "Portugal", countrySlug: "portugal", lat: 38.7223, lon: -9.1393 },
  { slug: "porto", name: "Porto", country: "Portugal", countrySlug: "portugal", lat: 41.1579, lon: -8.6291 },
  { slug: "rome", name: "Rome", country: "Italy", countrySlug: "italy", lat: 41.9028, lon: 12.4964 },
  { slug: "milan", name: "Milan", country: "Italy", countrySlug: "italy", lat: 45.4642, lon: 9.19 },
  { slug: "palermo", name: "Palermo", country: "Italy", countrySlug: "italy", lat: 38.1157, lon: 13.3615 },
  { slug: "marseille", name: "Marseille", country: "France", countrySlug: "france", lat: 43.2965, lon: 5.3698 },
  { slug: "paris", name: "Paris", country: "France", countrySlug: "france", lat: 48.8566, lon: 2.3522 },
  { slug: "lyon", name: "Lyon", country: "France", countrySlug: "france", lat: 45.764, lon: 4.8357 },
  { slug: "munich", name: "Munich", country: "Germany", countrySlug: "germany", lat: 48.1351, lon: 11.582 },
  { slug: "berlin", name: "Berlin", country: "Germany", countrySlug: "germany", lat: 52.52, lon: 13.405 },
  { slug: "hamburg", name: "Hamburg", country: "Germany", countrySlug: "germany", lat: 53.5511, lon: 9.9937 },
  { slug: "vienna", name: "Vienna", country: "Austria", countrySlug: "austria", lat: 48.2082, lon: 16.3738 },
  { slug: "amsterdam", name: "Amsterdam", country: "Netherlands", countrySlug: "netherlands", lat: 52.3676, lon: 4.9041 },
  { slug: "brussels", name: "Brussels", country: "Belgium", countrySlug: "belgium", lat: 50.8503, lon: 4.3517 },
  { slug: "warsaw", name: "Warsaw", country: "Poland", countrySlug: "poland", lat: 52.2297, lon: 21.0122 },
  { slug: "dublin", name: "Dublin", country: "Ireland", countrySlug: "ireland", lat: 53.3498, lon: -6.2603 },
  { slug: "london", name: "London", country: "United Kingdom", countrySlug: "united-kingdom", lat: 51.5072, lon: -0.1276 },
  { slug: "nicosia", name: "Nicosia", country: "Cyprus", countrySlug: "cyprus", lat: 35.1856, lon: 33.3823 },
  { slug: "valletta", name: "Valletta", country: "Malta", countrySlug: "malta", lat: 35.8989, lon: 14.5146 },
];

export const COUNTRY_GUIDES: CountryGuide[] = [
  { slug: "greece", name: "Greece", currency: "EUR", language: "Greek", officialSource: "https://ypen.gov.gr/", officialSourceLabel: "Ministry of Environment and Energy", intro: "Compare southern and northern solar yield, then test how your actual import tariff and export compensation change the result.", checklist: ["Ask whether export compensation is fixed, indexed or netted.", "Confirm the grant status and eligibility dates before subtracting one.", "Check roof shading from nearby buildings and terraces."] },
  { slug: "spain", name: "Spain", currency: "EUR", language: "Spanish", officialSource: "https://www.idae.es/", officialSourceLabel: "IDAE — energy transition guidance", intro: "Spanish cities show substantial variation in seasonal output. Use your bill's energy charges and your quote's exact export assumptions.", checklist: ["Separate energy charges from fixed bill charges.", "Confirm surplus compensation and any applicable limits.", "Check autonomous-community and municipal incentives directly."] },
  { slug: "portugal", name: "Portugal", currency: "EUR", language: "Portuguese", officialSource: "https://www.dgeg.gov.pt/", officialSourceLabel: "DGEG — energy directorate", intro: "Compare Atlantic and southern production, then model self-consumption against the household's real daytime demand.", checklist: ["Verify the export arrangement in writing.", "Use the all-in avoidable electricity rate, not only a standing charge.", "Include access and roof-work costs in the quote."] },
  { slug: "italy", name: "Italy", currency: "EUR", language: "Italian", officialSource: "https://www.gse.it/", officialSourceLabel: "GSE — energy services manager", intro: "Northern and southern yields differ materially. Compare like-for-like installer quotes and verify the current scheme before treating an incentive as certain.", checklist: ["Confirm which scheme and tariff applies to the installation.", "Check inverter and monitoring replacement assumptions.", "Use an avoidable tariff from recent bills."] },
  { slug: "france", name: "France", currency: "EUR", language: "French", officialSource: "https://www.ecologie.gouv.fr/", officialSourceLabel: "Ministry for the Ecological Transition", intro: "Model both self-used and exported electricity rather than assuming every generated kWh offsets the retail tariff.", checklist: ["Verify the current purchase obligation or export contract.", "Check administrative and grid-connection costs.", "Ask for production assumptions using the roof's real orientation."] },
  { slug: "germany", name: "Germany", currency: "EUR", language: "German", officialSource: "https://www.bundesnetzagentur.de/", officialSourceLabel: "Bundesnetzagentur", intro: "Compare city output across Germany and make the export tariff, self-consumption and installation scope explicit.", checklist: ["Confirm the applicable feed-in or direct-marketing route.", "Separate battery cost and savings from rooftop-only economics.", "Include metering and electrical upgrades in the quote."] },
  { slug: "austria", name: "Austria", currency: "EUR", language: "German", officialSource: "https://www.e-control.at/", officialSourceLabel: "E-Control — Austrian energy regulator", intro: "Use city-centre output only as a starting point: alpine shading and roof geometry can matter more than a small city-average difference.", checklist: ["Verify current investment support and export arrangements.", "Model shading and snow-related access carefully.", "Ask for structural and electrical work in the installed price."] },
  { slug: "netherlands", name: "Netherlands", currency: "EUR", language: "Dutch", officialSource: "https://www.rvo.nl/", officialSourceLabel: "Netherlands Enterprise Agency", intro: "A lower annual yield can still produce a sound investment when self-consumption and avoidable tariffs are favourable.", checklist: ["Check the current netting and export rules at the installation date.", "Model future tariff changes as scenarios, not certainty.", "Confirm roof-load and cable-route costs."] },
  { slug: "belgium", name: "Belgium", currency: "EUR", language: "Dutch, French and German", officialSource: "https://economie.fgov.be/", officialSourceLabel: "Federal Public Service Economy", intro: "Regional rules can differ, so treat the country page as a comparison tool and verify the rule for the exact installation address.", checklist: ["Identify the responsible regional energy authority.", "Confirm metering, injection and tariff treatment.", "Use the quote's complete grid and administrative scope."] },
  { slug: "poland", name: "Poland", currency: "PLN", language: "Polish", officialSource: "https://www.gov.pl/web/klimat", officialSourceLabel: "Ministry of Climate and Environment", intro: "Run the model in PLN using your actual quote and bill. Compare cities, then verify current settlement and support rules.", checklist: ["Confirm how exported and imported energy is settled.", "Check current programme eligibility before entering a grant.", "Include roof, mounting and grid-connection work in PLN."] },
  { slug: "ireland", name: "Ireland", currency: "EUR", language: "English and Irish", officialSource: "https://www.seai.ie/", officialSourceLabel: "Sustainable Energy Authority of Ireland", intro: "Use recent household consumption and export terms to see whether the system is sized for usable generation rather than headline output.", checklist: ["Verify current grant and export eligibility.", "Use the avoidable unit rate from your electricity bill.", "Ask whether BER, grid and electrical work is included."] },
  { slug: "united-kingdom", name: "United Kingdom", currency: "GBP", language: "English", officialSource: "https://www.gov.uk/government/organisations/department-for-energy-security-and-net-zero", officialSourceLabel: "Department for Energy Security and Net Zero", intro: "Calculate in GBP and separate your import tariff from the export rate offered by your supplier.", checklist: ["Confirm the export tariff and eligibility with the supplier.", "Include scaffolding and electrical upgrades in the quote.", "Check listed-building or conservation-area constraints."] },
  { slug: "cyprus", name: "Cyprus", currency: "EUR", language: "Greek and Turkish", officialSource: "https://www.gov.cy/meci/", officialSourceLabel: "Ministry of Energy, Commerce and Industry", intro: "High annual output does not remove the need to size the system around consumption, export rules and roof conditions.", checklist: ["Verify the current scheme and export compensation.", "Avoid oversizing without a use for surplus generation.", "Check roof access, shading and equipment cooling."] },
  { slug: "malta", name: "Malta", currency: "EUR", language: "Maltese and English", officialSource: "https://www.energywateragency.gov.mt/", officialSourceLabel: "Energy and Water Agency", intro: "Use the live yield as a baseline, then account for limited roof space, shading and the exact installation quote.", checklist: ["Confirm current grant and export arrangements.", "Use usable roof area rather than a target system size.", "Include roof preparation and grid-connection costs."] },
];

export const getCity = (slug: string) => CITIES.find((c) => c.slug === slug);
export const getCountry = (slug: string) => COUNTRY_GUIDES.find((c) => c.slug === slug);
export const citiesForCountry = (slug: string) => CITIES.filter((c) => c.countrySlug === slug);
export const currencyForCountry = (country: string): Currency => country === "United Kingdom" ? "GBP" : country === "Poland" ? "PLN" : "EUR";
export { SITE_URL } from "./site";
