import type { Fixture, SourceId } from "./types";
import type { ScheduleWindow } from "./window";
import { isWithinWindow } from "./window";

/** Higher-priority sources win when the same fixture appears in several. */
const SOURCE_PRIORITY: Record<SourceId, number> = {
  espn: 3,
  cricapi: 2,
  seed: 1,
};

const normalizeName = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");

/**
 * Key that identifies "the same match" across sources: same tracked team,
 * same opponent, same UTC calendar date and same format bucket.
 */
export function fixtureKey(f: Fixture): string {
  const day = f.startTimeUtc.slice(0, 10);
  return [f.teamId, normalizeName(f.opponent), day, f.format].join("|");
}

/** Stable, URL-safe id derived from the dedupe key (djb2 hash). */
export function fixtureId(key: string): string {
  let h = 5381;
  for (let i = 0; i < key.length; i++) {
    h = ((h << 5) + h + key.charCodeAt(i)) | 0;
  }
  return `fx-${(h >>> 0).toString(36)}`;
}

/**
 * Merge fixtures from multiple sources: drop duplicates, keeping the entry
 * from the highest-priority source, and sort ascending by start time.
 */
export function dedupeFixtures(fixtures: Fixture[]): Fixture[] {
  const byKey = new Map<string, Fixture>();
  for (const f of fixtures) {
    const key = fixtureKey(f);
    const existing = byKey.get(key);
    if (!existing || SOURCE_PRIORITY[f.source] > SOURCE_PRIORITY[existing.source]) {
      byKey.set(key, { ...f, id: fixtureId(key) });
    }
  }
  return [...byKey.values()].sort((a, b) =>
    a.startTimeUtc.localeCompare(b.startTimeUtc)
  );
}

/** Keep only fixtures starting inside the rolling schedule window. */
export function clampToWindow(fixtures: Fixture[], window: ScheduleWindow): Fixture[] {
  return fixtures.filter((f) => isWithinWindow(f.startTimeUtc, window));
}
