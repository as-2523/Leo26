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
 * calls (≤ 20). At 4 scheduled refreshes/day that stays well inside the
 * free tier.
 */
import type { Fixture } from "../types";
import { matchTrackedTeam } from "../teams";
import { normalizeFormat } from "../formats";
import { getScheduleWindow } from "../window";
import { fetchJson } from "./http";

const BASE = "https://api.cricapi.com/v1";
const PAGE_SIZE = 25;
const MAX_SERIES_PAGES = 4;
const MAX_SERIES_DETAIL = 14;

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

function matchToFixture(m: CricApiMatch): Fixture | null {
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
    series: m.name ?? "—",
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
    .sort((a, b) => (a.startDate ?? "").localeCompare(b.startDate ?? ""))
    .slice(0, MAX_SERIES_DETAIL);
}

export async function fetchCricApiFixtures(): Promise<Fixture[]> {
  const key = process.env.CRICAPI_KEY;
  if (!key) throw new Error("CRICAPI_KEY not configured");
  const apikey = encodeURIComponent(key);

  const fixtures: Fixture[] = [];
  const errors: string[] = [];

  // Pass 1: current matches.
  try {
    const res = await fetchJson<ListResponse<CricApiMatch>>(
      `${BASE}/matches?apikey=${apikey}&offset=0`
    );
    if (res.status !== "success" || !Array.isArray(res.data)) {
      throw new Error("CricAPI /matches returned an unsuccessful response");
    }
    fixtures.push(
      ...res.data.map(matchToFixture).filter((f): f is Fixture => f !== null)
    );
  } catch (e) {
    errors.push(e instanceof Error ? e.message : String(e));
  }

  // Pass 2: upcoming series overlapping the window.
  const seriesList: CricApiSeries[] = [];
  for (let page = 0; page < MAX_SERIES_PAGES; page++) {
    try {
      const res = await fetchJson<ListResponse<CricApiSeries>>(
        `${BASE}/series?apikey=${apikey}&offset=${page * PAGE_SIZE}`
      );
      if (res.status !== "success" || !Array.isArray(res.data)) break;
      seriesList.push(...res.data);
      if (res.data.length < PAGE_SIZE) break;
    } catch (e) {
      errors.push(e instanceof Error ? e.message : String(e));
      break;
    }
  }

  const detailResults = await Promise.allSettled(
    selectCandidateSeries(seriesList).map(async (s) => {
      const res = await fetchJson<SeriesInfoResponse>(
        `${BASE}/series_info?apikey=${apikey}&id=${encodeURIComponent(s.id!)}`
      );
      const list = res.data?.matchList;
      return Array.isArray(list)
        ? list.map(matchToFixture).filter((f): f is Fixture => f !== null)
        : [];
    })
  );
  for (const r of detailResults) {
    if (r.status === "fulfilled") fixtures.push(...r.value);
  }

  if (fixtures.length === 0 && errors.length > 0) {
    throw new Error(errors[0]);
  }
  return fixtures;
}
