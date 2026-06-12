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
    const endMs = Math.max(...sorted.map(fixtureEndMs));
    const hasBegun = istDayKey(sorted[0].startTimeUtc) <= todayKey;
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
