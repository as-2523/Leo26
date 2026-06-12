/**
 * CricAPI (cricketdata.org) adapter.
 *
 * A documented public API with a free tier (100 calls/day). Enabled when
 * CRICAPI_KEY is set. Two passes:
 *
 *   1. /v1/matches      — current and imminent matches (1 call)
 *   2. /v1/series       — upcoming series overlapping the schedule window,
 *      preselected by name relevance, then /v1/series_info per candidate
 *      for their full match lists.
 *
 * Call budget per refresh: 1 + up to MAX_SERIES_PAGES + MAX_SERIES_DETAIL
 * calls (≤ 24) — far inside the free tier at the 48-hour refresh cadence.
 */
import type { ExpectedSeries, Fixture } from "../types";
import { matchTrackedTeam } from "../teams";
import { normalizeFormat } from "../formats";
import { getScheduleWindow } from "../window";
import { fetchJson } from "./http";

const BASE = "https://api.cricapi.com/v1";
const PAGE_SIZE = 25;
const MAX_SERIES_PAGES = 4;
const MAX_SERIES_DETAIL = 17;

/** Series whose names plausibly involve the tracked Indian teams. */
const RELEVANT_SERIES = /india|world cup|asia cup|champions trophy|under.?19|u-?19|emerging|tri.?series/i;

interface CricApiMatch {
  id?: string;
  name?: string;
  matchType?: string;
  status?: string;
  venue?: string;
  date?: string;
  dateTimeGMT?: string;
  teams?: string[];
  matchStarted?: boolean;
  matchEnded?: boolean;
  series_id?: string;
}

export interface CricApiSeries {
  id?: string;
  name?: string;
  startDate?: string;
  endDate?: string;
}

interface ListResponse<T> {
  status?: string;
  data?: T[];
}

interface SeriesInfoResponse {
  status?: string;
  data?: { matchList?: CricApiMatch[] };
}

export function isCricApiConfigured(): boolean {
  return Boolean(process.env.CRICAPI_KEY);
}

/**
 * CricAPI's match `name` is the match title ("India vs England, 3rd ODI"),
 * not a series name. When the series catalog has no entry, fall back to the
 * title minus its final ", Nth XXX" segment so a tour's matches still group
 * together in the Series view and ongoing-series detection.
 */
export function fallbackSeriesName(matchName: string | undefined): string {
  if (!matchName) return "—";
  const i = matchName.lastIndexOf(",");
  return i > 0 ? matchName.slice(0, i).trim() : matchName;
}

function matchToFixture(m: CricApiMatch, series?: CricApiSeries): Fixture | null {
  if (m.matchStarted || m.matchEnded) return null;
  const start = m.dateTimeGMT ? `${m.dateTimeGMT}Z` : m.date;
  if (!start) return null;
  const startDate = new Date(start);
  if (Number.isNaN(startDate.getTime())) return null;

  const sideNames = m.teams ?? [];
  const tracked = sideNames.map(matchTrackedTeam).find((t) => t !== null);
  if (!tracked) return null;
  const opponent =
    sideNames.find((n) => matchTrackedTeam(n)?.id !== tracked.id) ?? "TBC";

  // Series-level dates: with upcoming-only fixture data, these are what
  // tells the UI a mid-tour series has already begun.
  const seriesStart = series?.startDate ? new Date(series.startDate) : null;
  const validSeriesStart =
    seriesStart && !Number.isNaN(seriesStart.getTime()) ? seriesStart : null;
  const seriesEnd = series ? parseSeriesEnd(series, validSeriesStart) : null;

  const formatLabel = m.matchType ?? "Unknown";
  return {
    id: "", // assigned during dedupe
    teamId: tracked.id,
    teamName: tracked.name,
    opponent,
    startTimeUtc: startDate.toISOString(),
    hasStartTime: Boolean(m.dateTimeGMT),
    format: tracked.youth ? "Youth" : normalizeFormat(formatLabel),
    formatLabel,
    series: series?.name ?? fallbackSeriesName(m.name),
    seriesStartUtc: validSeriesStart?.toISOString(),
    seriesEndUtc: seriesEnd?.toISOString(),
    venue: m.venue ?? "TBC",
    source: "cricapi",
  };
}

/**
 * CricAPI sometimes returns series end dates without a year ("Aug 30").
 * Resolve against the series start year, rolling over a year boundary.
 */
function parseSeriesEnd(series: CricApiSeries, start: Date | null): Date | null {
  if (!series.endDate) return null;
  let end = new Date(series.endDate);
  if (!Number.isNaN(end.getTime()) && end.getFullYear() >= 2020) return end;
  if (!start) return null;
  end = new Date(`${series.endDate} ${start.getFullYear()}`);
  if (Number.isNaN(end.getTime())) return null;
  if (end < start) end.setFullYear(end.getFullYear() + 1);
  return end;
}

/**
 * Pick the series worth a detail call: name looks relevant and the series
 * overlaps the schedule window. Exported for unit tests.
 */
export function selectCandidateSeries(
  seriesList: CricApiSeries[],
  now: Date = new Date()
): CricApiSeries[] {
  const window = getScheduleWindow(now);
  return seriesList
    .filter((s) => {
      if (!s.id || !s.name || !RELEVANT_SERIES.test(s.name)) return false;
      const start = s.startDate ? new Date(s.startDate) : null;
      if (!start || Number.isNaN(start.getTime())) return false;
      if (start > window.end) return false;
      const end = parseSeriesEnd(s, start);
      // Skip series that clearly finished before the window opened.
      if (end && end < window.start) return false;
      if (!end && start < new Date(now.getTime() - 60 * 24 * 3_600_000)) return false;
      return true;
    })
    .sort((a, b) => {
      // Series naming India directly are the actual tours filling the later
      // months of the window — never let big near-term tournaments crowd
      // them out of the detail-call budget.
      const aIndia = /india/i.test(a.name ?? "") ? 0 : 1;
      const bIndia = /india/i.test(b.name ?? "") ? 0 : 1;
      return aIndia - bIndia || (a.startDate ?? "").localeCompare(b.startDate ?? "");
    })
    .slice(0, MAX_SERIES_DETAIL);
}

/**
 * Series listed in the catalog (with approximate dates) for which no
 * confirmed fixtures were obtained — surfaced in the UI as "expected but
 * not confirmed". Exported for unit tests.
 */
export function selectExpectedSeries(
  seriesList: CricApiSeries[],
  confirmedSeriesNames: Set<string>,
  now: Date = new Date()
): ExpectedSeries[] {
  const window = getScheduleWindow(now);
  const seen = new Set<string>();
  const expected: ExpectedSeries[] = [];
  for (const s of seriesList) {
    if (!s.name || !RELEVANT_SERIES.test(s.name)) continue;
    if (confirmedSeriesNames.has(s.name) || seen.has(s.name)) continue;
    const start = s.startDate ? new Date(s.startDate) : null;
    if (!start || Number.isNaN(start.getTime())) continue;
    if (start > window.end) continue;
    const end = parseSeriesEnd(s, start);
    if ((end ?? start) < window.start) continue;
    seen.add(s.name);
    expected.push({
      name: s.name,
      startUtc: start.toISOString(),
      endUtc: end?.toISOString(),
      sourceUrl: `https://www.espncricinfo.com/search?query=${encodeURIComponent(s.name)}`,
    });
  }
  return expected
    .sort((a, b) => a.startUtc.localeCompare(b.startUtc))
    .slice(0, 12);
}

export interface CricApiResult {
  fixtures: Fixture[];
  expectedSeries: ExpectedSeries[];
}

export async function fetchCricApi(): Promise<CricApiResult> {
  const key = process.env.CRICAPI_KEY;
  if (!key) throw new Error("CRICAPI_KEY not configured");
  const apikey = encodeURIComponent(key);

  const fixtures: Fixture[] = [];
  const errors: string[] = [];

  // Pass 1: the series catalog — also provides series_id → name lookups
  // so fixtures from the /matches feed carry real series names.
  const seriesList: CricApiSeries[] = [];
  for (let page = 0; page < MAX_SERIES_PAGES; page++) {
    try {
      const res = await fetchJson<ListResponse<CricApiSeries>>(
        `${BASE}/series?apikey=${apikey}&offset=${page * PAGE_SIZE}`
      );
      if (res.status !== "success" || !Array.isArray(res.data)) {
        // Typically quota exhaustion — surface it instead of failing silently.
        errors.push(`CricAPI /series page ${page} returned an unsuccessful response`);
        break;
      }
      seriesList.push(...res.data);
      if (res.data.length < PAGE_SIZE) break;
    } catch (e) {
      errors.push(e instanceof Error ? e.message : String(e));
      break;
    }
  }
  // Targeted catalog search: blind paging only sees the first ~100 entries,
  // which misses lower-profile series (e.g. unofficial A-team tours).
  for (const term of ["india", "tri-series"]) {
    try {
      const res = await fetchJson<ListResponse<CricApiSeries>>(
        `${BASE}/series?apikey=${apikey}&offset=0&search=${encodeURIComponent(term)}`
      );
      if (res.status === "success" && Array.isArray(res.data)) {
        seriesList.push(...res.data);
      } else {
        errors.push(`CricAPI /series search "${term}" returned an unsuccessful response`);
      }
    } catch (e) {
      errors.push(e instanceof Error ? e.message : String(e));
    }
  }

  const seriesById = new Map(seriesList.filter((s) => s.id).map((s) => [s.id!, s]));
  const uniqueSeries = [...seriesById.values()];

  // Pass 2: detailed match lists for India-relevant series in the window.
  const detailResults = await Promise.allSettled(
    selectCandidateSeries(uniqueSeries).map(async (s) => {
      const res = await fetchJson<SeriesInfoResponse>(
        `${BASE}/series_info?apikey=${apikey}&id=${encodeURIComponent(s.id!)}`
      );
      const list = res.data?.matchList;
      return Array.isArray(list)
        ? list.map((m) => matchToFixture(m, s)).filter((f): f is Fixture => f !== null)
        : [];
    })
  );
  for (const r of detailResults) {
    if (r.status === "fulfilled") fixtures.push(...r.value);
  }

  // Pass 3: current matches, catching anything the series pass missed.
  try {
    const res = await fetchJson<ListResponse<CricApiMatch>>(
      `${BASE}/matches?apikey=${apikey}&offset=0`
    );
    if (res.status !== "success" || !Array.isArray(res.data)) {
      throw new Error("CricAPI /matches returned an unsuccessful response");
    }
    fixtures.push(
      ...res.data
        .map((m) => matchToFixture(m, m.series_id ? seriesById.get(m.series_id) : undefined))
        .filter((f): f is Fixture => f !== null)
    );
  } catch (e) {
    errors.push(e instanceof Error ? e.message : String(e));
  }

  if (fixtures.length === 0 && errors.length > 0) {
    throw new Error(errors[0]);
  }

  const confirmedSeriesNames = new Set(fixtures.map((f) => f.series));
  return {
    fixtures,
    expectedSeries: selectExpectedSeries(uniqueSeries, confirmedSeriesNames),
  };
}
