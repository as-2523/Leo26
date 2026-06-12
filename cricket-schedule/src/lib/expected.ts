/**
 * Curated "potential matches" — announced tours whose match dates are not
 * yet published AND which no live data source catalogs yet.
 *
 * Maintenance: each entry cites a public source and self-retires — it is
 * hidden as soon as any confirmed fixture or source-catalog series mentions
 * all of its keywords, and drops out of the UI once its window passes.
 * Update this list when boards announce or schedule new tours.
 */
import type { ExpectedSeries } from "./types";
import { getScheduleWindow } from "./window";

interface CuratedExpected extends ExpectedSeries {
  /**
   * Lowercase keywords; the entry is hidden when any confirmed or
   * source-cataloged series name contains all of them.
   */
  keywords: string[];
}

export const CURATED_EXPECTED: CuratedExpected[] = [
  {
    // Announced as part of India's 2026 calendar (WTC cycle); dates TBC.
    name: "India tour of Sri Lanka — 2 Tests (World Test Championship)",
    startUtc: "2026-08-01T00:00:00.000Z",
    endUtc: "2026-08-31T00:00:00.000Z",
    sourceUrl:
      "https://www.olympics.com/en/news/indian-cricket-team-2026-calendar-schedule-dates",
    keywords: ["india", "sri lanka"],
  },
];

/**
 * Combine source-derived expectations with curated entries, dropping any
 * curated entry already covered by confirmed fixtures or catalog data.
 */
export function mergeExpectedSeries(
  dynamic: ExpectedSeries[],
  knownSeriesNames: Iterable<string>,
  now: Date = new Date()
): ExpectedSeries[] {
  const window = getScheduleWindow(now);
  const haystack = [...knownSeriesNames, ...dynamic.map((d) => d.name)].map((n) =>
    n.toLowerCase()
  );
  const curated = CURATED_EXPECTED.filter((c) => {
    const start = new Date(c.startUtc);
    const end = c.endUtc ? new Date(c.endUtc) : start;
    if (end < window.start || start > window.end) return false;
    return !haystack.some((name) => c.keywords.every((k) => name.includes(k)));
  }).map((c): ExpectedSeries => ({
    name: c.name,
    startUtc: c.startUtc,
    endUtc: c.endUtc,
    sourceUrl: c.sourceUrl,
  }));

  return [...dynamic, ...curated].sort((a, b) => a.startUtc.localeCompare(b.startUtc));
}
