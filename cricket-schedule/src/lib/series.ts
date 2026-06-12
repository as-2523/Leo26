/** Grouping of fixtures by series/competition, with "currently running" detection. */
import type { Fixture, TeamId } from "./types";
import { istDayKey } from "./display";

export interface SeriesGroup {
  name: string;
  /** Sorted ascending by start time. */
  fixtures: Fixture[];
  teamIds: TeamId[];
  formatLabels: string[];
  start: string;
  end: string;
  /** True when the series has begun (first match today IST or earlier) and is not over. */
  running: boolean;
}

/** Assumed duration of a match when the source gives no end time. */
const DEFAULT_MATCH_HOURS = 12;

/**
 * Curated windows for major tournaments, used only when fixtures carry no
 * source-provided series dates (e.g. data preserved from an older pull).
 * Matched by name keywords (all must appear, case-insensitive); entries
 * self-retire once their window passes. Cited and maintained like
 * CURATED_EXPECTED in expected.ts.
 */
export const KNOWN_SERIES_WINDOWS: {
  keywords: string[];
  startUtc: string;
  endUtc: string;
}[] = [
  {
    // ICC Women's T20 World Cup 2026, England, 12 Jun – 5 Jul 2026.
    keywords: ["women", "t20 world cup"],
    startUtc: "2026-06-12T00:00:00.000Z",
    endUtc: "2026-07-05T00:00:00.000Z",
  },
];

function knownWindowFor(seriesName: string) {
  const name = seriesName.toLowerCase();
  return (
    KNOWN_SERIES_WINDOWS.find((w) => w.keywords.every((k) => name.includes(k))) ?? null
  );
}

function fixtureEndMs(f: Fixture): number {
  // endTimeUtc marks the final day of a multi-day match; add a day's play.
  const base = f.endTimeUtc ?? f.startTimeUtc;
  return new Date(base).getTime() + DEFAULT_MATCH_HOURS * 3_600_000;
}

export function groupBySeries(fixtures: Fixture[], now: Date = new Date()): SeriesGroup[] {
  const byName = new Map<string, Fixture[]>();
  for (const f of fixtures) {
    const list = byName.get(f.series);
    if (list) list.push(f);
    else byName.set(f.series, [f]);
  }

  const todayKey = istDayKey(now.toISOString());
  const groups = [...byName.entries()].map(([name, list]): SeriesGroup => {
    const sorted = [...list].sort((a, b) => a.startTimeUtc.localeCompare(b.startTimeUtc));
    // Fixture data is upcoming-only, so for a mid-tour series the first
    // *upcoming* match may be days away. Prefer the source-provided series
    // start date as evidence the series has already begun, falling back to
    // the curated windows for major tournaments.
    const known = knownWindowFor(name);
    const beginIso =
      sorted
        .map((f) => f.seriesStartUtc)
        .filter((s): s is string => Boolean(s && !Number.isNaN(new Date(s).getTime())))
        .sort()[0] ??
      known?.startUtc ??
      sorted[0].startTimeUtc;
    const endCandidates = [
      ...sorted.map(fixtureEndMs),
      ...sorted
        .map((f) => (f.seriesEndUtc ? new Date(f.seriesEndUtc).getTime() : NaN))
        .map((t) => t + DEFAULT_MATCH_HOURS * 3_600_000),
      known ? new Date(known.endUtc).getTime() + DEFAULT_MATCH_HOURS * 3_600_000 : NaN,
    ].filter((t) => !Number.isNaN(t));
    const endMs = Math.max(...endCandidates);
    const hasBegun = istDayKey(beginIso) <= todayKey;
    return {
      name,
      fixtures: sorted,
      teamIds: [...new Set(sorted.map((f) => f.teamId))],
      formatLabels: [...new Set(sorted.map((f) => f.formatLabel))],
      start: sorted[0].startTimeUtc,
      end: sorted[sorted.length - 1].endTimeUtc ?? sorted[sorted.length - 1].startTimeUtc,
      running: hasBegun && endMs >= now.getTime(),
    };
  });

  // Running series first, then by start date.
  return groups.sort(
    (a, b) => Number(b.running) - Number(a.running) || a.start.localeCompare(b.start)
  );
}

/** Names of series currently in progress, for highlighting in other views. */
export function runningSeriesNames(fixtures: Fixture[], now: Date = new Date()): Set<string> {
  return new Set(
    groupBySeries(fixtures, now)
      .filter((g) => g.running)
      .map((g) => g.name)
  );
}
