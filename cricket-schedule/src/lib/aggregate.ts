/**
 * Aggregator: fans out to live sources, normalizes, deduplicates, clamps to
 * the rolling schedule window (see WINDOW_MONTHS), and caches the result.
 *
 * Source chain (documented in the README):
 *   1. ESPNcricinfo public JSON API  — primary
 *   2. BCCI official fixtures pages  — robots.txt-respecting scrape
 *   3. CricAPI (cricketdata.org)     — only when CRICAPI_KEY is set
 *   4. Bundled sample fixtures       — last resort, clearly flagged in the UI
 *
 * Rate-limit policy: results are cached in-process for CACHE_TTL_MS. Even a
 * forced refresh (?force=1) will not contact upstream sources more than once
 * per MIN_REFRESH_INTERVAL_MS.
 */
import type { Fixture, FixturesPayload, SourceStatus } from "./types";
import { clampToWindow, dedupeFixtures } from "./normalize";
import { getScheduleWindow } from "./window";
import { fetchEspnFixtures } from "./sources/espn";
import { fetchBcciFixtures } from "./sources/bcci";
import { fetchCricApi, isCricApiConfigured } from "./sources/cricapi";
import { mergeExpectedSeries } from "./expected";
import { getManualFixtures } from "./sources/manual";
import { getSeedFixtures } from "./sources/seed";

const CACHE_TTL_MS = 30 * 60 * 1000;
const MIN_REFRESH_INTERVAL_MS = 60 * 1000;

interface CacheEntry {
  payload: FixturesPayload;
  fetchedAt: number;
}

// Module-level cache survives across requests within one server process.
let cache: CacheEntry | null = null;
let lastUpstreamAttempt = 0;
let inflight: Promise<FixturesPayload> | null = null;

const errorMessage = (e: unknown) =>
  e instanceof Error ? e.message : String(e);

async function runSource(
  fn: () => Promise<Fixture[]>,
  id: SourceStatus["id"]
): Promise<{ status: SourceStatus; fixtures: Fixture[] }> {
  try {
    const fixtures = await fn();
    return { status: { id, ok: true, count: fixtures.length }, fixtures };
  } catch (e) {
    return { status: { id, ok: false, count: 0, error: errorMessage(e) }, fixtures: [] };
  }
}

async function buildPayload(): Promise<FixturesPayload> {
  const window = getScheduleWindow();
  const sources: SourceStatus[] = [];
  let live: Fixture[] = [];

  const espn = await runSource(fetchEspnFixtures, "espn");
  sources.push(espn.status);
  live = live.concat(espn.fixtures);

  const bcci = await runSource(fetchBcciFixtures, "bcci");
  sources.push(bcci.status);
  live = live.concat(bcci.fixtures);

  let expectedSeries: FixturesPayload["meta"]["expectedSeries"] = [];
  if (isCricApiConfigured()) {
    try {
      const cric = await fetchCricApi();
      sources.push({ id: "cricapi", ok: true, count: cric.fixtures.length });
      live = live.concat(cric.fixtures);
      expectedSeries = cric.expectedSeries;
    } catch (e) {
      sources.push({ id: "cricapi", ok: false, count: 0, error: errorMessage(e) });
    }
  } else {
    sources.push({ id: "cricapi", ok: false, count: 0, error: "skipped: CRICAPI_KEY not set" });
  }

  // Curated fixtures for verified matches no API covers (e.g. unofficial
  // A-team tours). Lowest live priority, so API data wins on overlap.
  const manual = getManualFixtures();
  sources.push({ id: "manual", ok: true, count: manual.length });
  live = live.concat(manual);

  let usedFallback = false;
  let merged = clampToWindow(dedupeFixtures(live), window);

  if (merged.length === 0) {
    usedFallback = true;
    const seed = clampToWindow(dedupeFixtures(getSeedFixtures()), window);
    sources.push({ id: "seed", ok: true, count: seed.length });
    merged = seed;
  }

  // Drop expectations already satisfied by confirmed fixtures from any
  // source, then add curated potential matches not covered anywhere.
  const confirmedSeries = new Set(merged.map((f) => f.series));
  expectedSeries = mergeExpectedSeries(
    expectedSeries.filter((s) => !confirmedSeries.has(s.name)),
    confirmedSeries
  );

  return {
    fixtures: merged,
    meta: {
      generatedAt: new Date().toISOString(),
      windowStart: window.start.toISOString(),
      windowEnd: window.end.toISOString(),
      sources,
      usedFallback,
      expectedSeries,
    },
  };
}

export async function getFixtures(force = false): Promise<FixturesPayload> {
  const now = Date.now();
  const fresh = cache && now - cache.fetchedAt < CACHE_TTL_MS;
  const refreshAllowed = now - lastUpstreamAttempt >= MIN_REFRESH_INTERVAL_MS;

  if (cache && (fresh && !force || !refreshAllowed)) {
    return cache.payload;
  }
  if (inflight) return inflight;

  lastUpstreamAttempt = now;
  inflight = buildPayload()
    .then((payload) => {
      cache = { payload, fetchedAt: Date.now() };
      return payload;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}
