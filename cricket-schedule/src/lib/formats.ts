import type { FormatCategory } from "./types";

/**
 * Map a raw format string from any source onto a normalized filter bucket.
 * Youth team fixtures are additionally forced into "Youth" by the caller
 * (the raw label is preserved on the fixture for display).
 */
export function normalizeFormat(raw: string | undefined | null): FormatCategory {
  if (!raw) return "Other";
  const f = raw.trim().toUpperCase().replace(/[\s_-]+/g, "");

  if (/^(YOUTH|U19|UNDER19)/.test(f)) return "Youth";
  if (f === "TEST" || f === "WTEST" || f === "TESTMATCH") return "Test";
  if (f === "ODI" || f === "WODI" || f === "ODM") return "ODI";
  if (f === "T20" || f === "T20I" || f === "WT20I" || f === "IT20" || f === "T20D") return "T20";
  if (f === "FC" || f === "FIRSTCLASS" || f === "4DAY" || f === "MULTIDAY") return "First-class";
  if (f === "LISTA" || f === "LIMITEDOVERS" || f === "ODA" || f === "50OVER") return "List A";
  return "Other";
}

export const ALL_FORMATS: FormatCategory[] = [
  "Test",
  "ODI",
  "T20",
  "First-class",
  "List A",
  "Youth",
  "Other",
];
