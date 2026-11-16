// Directory entries: only verifiable facts (name, country, coordinates).
// Solar figures are fetched live from EU JRC PVGIS — never hard-coded.
export type City = { slug: string; name: string; country: string; countrySlug: string; lat: number; lon: number };

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

export const getCity = (slug: string) => CITIES.find((c) => c.slug === slug);
export const SITE_URL = "https://solar-payback-93s.pages.dev";
