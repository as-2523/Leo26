/**
 * Data-quality gate for refreshes: a degraded pull (source outage, API
 * quota exhaustion) must never overwrite a healthy dataset. When the fresh
 * payload looks much worse than the previously published one, keep the
 * previous fixtures (re-clamped to the current rolling window).
 */
import type { FixturesPayload } from "./types";
import { getScheduleWindow, isWithinWindow } from "./window";
import { dedupeFixtures } from "./normalize";

/** Below this many fixtures a live pull is suspect regardless of history. */
const MIN_HEALTHY = 10;

export interface ChooseResult {
  payload: FixturesPayload;
  preserved: boolean;
}

export function choosePayload(
  fresh: FixturesPayload,
  previous: FixturesPayload | null,
  now: Date = new Date()
): ChooseResult {
  if (
    !previous ||
    previous.meta?.usedFallback ||
    !Array.isArray(previous.fixtures) ||
    previous.fixtures.length === 0
  ) {
    return { payload: fresh, preserved: false };
  }

  const window = getScheduleWindow(now);
  const prevInWindow = previous.fixtures.filter((f) =>
    isWithinWindow(f.startTimeUtc, window)
  );

  // Sample data never replaces real data; otherwise a pull is degraded when
  // it shrank to less than half of what was previously published.
  const freshIsSample = fresh.meta.usedFallback;
  const freshLooksDegraded =
    freshIsSample ||
    fresh.fixtures.length < Math.max(MIN_HEALTHY, Math.floor(prevInWindow.length / 2));

  if (
    !freshLooksDegraded ||
    prevInWindow.length === 0 ||
    (!freshIsSample && prevInWindow.length <= fresh.fixtures.length)
  ) {
    return { payload: fresh, preserved: false };
  }

  // Merge rather than replace: anything genuinely new in the degraded pull
  // (e.g. curated fixtures, the few matches a rate-limited API returned)
  // still lands on top of the preserved dataset. Sample data is never
  // merged in.
  const fixtures = freshIsSample
    ? dedupeFixtures(prevInWindow)
    : dedupeFixtures([...fresh.fixtures, ...prevInWindow]);

  return {
    preserved: true,
    payload: {
      fixtures,
      meta: {
        // Keep the previous generatedAt: the bulk of the data is from that pull.
        ...previous.meta,
        windowStart: window.start.toISOString(),
        windowEnd: window.end.toISOString(),
        // Current source statuses, so the footer shows what actually failed.
        sources: fresh.meta.sources,
        usedFallback: false,
        expectedSeries: previous.meta.expectedSeries?.length
          ? previous.meta.expectedSeries
          : fresh.meta.expectedSeries,
      },
    },
  };
}
