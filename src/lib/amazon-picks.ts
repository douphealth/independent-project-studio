import type { Pick } from "@/components/AmazonPicks";

// Tools that improve a payback estimate or a small first step into solar. No product is
// assumed eligible for grants or legal to connect everywhere.
export const SOLAR_PICKS: Pick[] = [
  { label: "Whole-home energy monitor", query: "whole home energy monitor clamp", why: "Shows when you use electricity, the biggest input to self-consumption and payback." },
  { label: "Plug-in energy meter", query: "plug in electricity usage monitor", why: "Measures what individual appliances use, so you can shift them into sunny hours." },
  { label: "Balcony / plug-in solar kit", query: "balcony solar kit plug in", why: "A small first step. Check your country allows plug-in systems and whether you must register one." },
  { label: "Solar panel cleaning kit", query: "solar panel cleaning brush kit", why: "Dirty panels produce less. Only clean panels you can reach safely from the ground." },
];
