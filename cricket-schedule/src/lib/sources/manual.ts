/**
 * Curated fixtures — verified matches that live sources don't carry.
 *
 * Mostly unofficial A-team and youth games with patchy API coverage. Every
 * entry must cite a public source. Curated entries rank below all live
 * sources in dedupe priority, so the moment an API starts covering a match
 * the live record wins automatically; past entries fall out of the rolling
 * window on their own.
 */
import type { Fixture } from "../types";

const SLC_TOUR_SOURCE =
  "https://srilankacricket.lk/2026/06/tri-nation-a-series-and-four-day-series/";

const TRI_SERIES = "India A Tri-Series in Sri Lanka (with Sri Lanka A, Afghanistan A)";
const FOUR_DAY_SERIES = "India A Four-Day Series in Sri Lanka";

/** Times not announced precisely → hasStartTime false (shows "Time TBC"). */
const ENTRIES: Omit<Fixture, "id">[] = [
  {
    teamId: "india-a-men",
    teamName: "India A Men",
    opponent: "Sri Lanka A",
    startTimeUtc: "2026-06-15T04:30:00.000Z",
    hasStartTime: false,
    format: "List A",
    formatLabel: "Unofficial ODI",
    series: TRI_SERIES,
    seriesStartUtc: "2026-06-09T00:00:00.000Z",
    seriesEndUtc: "2026-06-21T00:00:00.000Z",
    venue: "Rangiri Dambulla International Stadium",
    city: "Dambulla",
    source: "manual",
    sourceUrl: SLC_TOUR_SOURCE,
  },
  {
    teamId: "india-a-men",
    teamName: "India A Men",
    opponent: "Afghanistan A",
    startTimeUtc: "2026-06-17T04:30:00.000Z",
    hasStartTime: false,
    format: "List A",
    formatLabel: "Unofficial ODI",
    series: TRI_SERIES,
    seriesStartUtc: "2026-06-09T00:00:00.000Z",
    seriesEndUtc: "2026-06-21T00:00:00.000Z",
    venue: "Rangiri Dambulla International Stadium",
    city: "Dambulla",
    source: "manual",
    sourceUrl: SLC_TOUR_SOURCE,
  },
  {
    teamId: "india-a-men",
    teamName: "India A Men",
    opponent: "TBC (final, if India A qualify)",
    startTimeUtc: "2026-06-21T04:30:00.000Z",
    hasStartTime: false,
    format: "List A",
    formatLabel: "Unofficial ODI — Final",
    series: TRI_SERIES,
    seriesStartUtc: "2026-06-09T00:00:00.000Z",
    seriesEndUtc: "2026-06-21T00:00:00.000Z",
    venue: "Rangiri Dambulla International Stadium",
    city: "Dambulla",
    source: "manual",
    sourceUrl: SLC_TOUR_SOURCE,
  },
  {
    teamId: "india-a-men",
    teamName: "India A Men",
    opponent: "Sri Lanka A",
    startTimeUtc: "2026-06-25T04:30:00.000Z",
    hasStartTime: false,
    endTimeUtc: "2026-06-28T04:30:00.000Z",
    format: "First-class",
    formatLabel: "Unofficial Test (4-day)",
    series: FOUR_DAY_SERIES,
    seriesStartUtc: "2026-06-25T00:00:00.000Z",
    seriesEndUtc: "2026-07-05T00:00:00.000Z",
    venue: "Galle International Cricket Stadium",
    city: "Galle",
    source: "manual",
    sourceUrl: SLC_TOUR_SOURCE,
  },
  {
    // Second four-day game: the series runs to 5 July per SLC; start date
    // inferred as 2 July (4-day match ending on the published final day).
    teamId: "india-a-men",
    teamName: "India A Men",
    opponent: "Sri Lanka A",
    startTimeUtc: "2026-07-02T04:30:00.000Z",
    hasStartTime: false,
    endTimeUtc: "2026-07-05T04:30:00.000Z",
    format: "First-class",
    formatLabel: "Unofficial Test (4-day)",
    series: FOUR_DAY_SERIES,
    seriesStartUtc: "2026-06-25T00:00:00.000Z",
    seriesEndUtc: "2026-07-05T00:00:00.000Z",
    venue: "Galle International Cricket Stadium",
    city: "Galle",
    source: "manual",
    sourceUrl: SLC_TOUR_SOURCE,
  },
];

export function getManualFixtures(): Fixture[] {
  return ENTRIES.map((e) => ({ ...e, id: "" })); // ids assigned during dedupe
}
