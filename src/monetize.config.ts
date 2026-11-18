// Partner / affiliate slots. A slot stays invisible until its url is set.
// Add your tracking link to "url" (and the programme name to "partner"), commit, push: Cloudflare deploys it.
// Per-item links (e.g. one product page per device) go in OFFER_LINKS keyed by item slug; they override the slot url.
export type OfferSlotId = "installer-quotes";
export type OfferSlot = { heading: string; body: string; cta: string; url: string; partner: string };

export const OFFER_SLOTS: Record<OfferSlotId, OfferSlot> = {
  "installer-quotes": { heading: "Compare solar installer quotes in {context}", body: "Request quotes from local installers, then test each quote's figures in the SolarPayback calculator.", cta: "Get installer quotes", url: "", partner: "" },
};

export const OFFER_LINKS: Record<string, string> = {};
