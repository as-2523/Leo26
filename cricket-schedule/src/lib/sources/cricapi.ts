/**
 * CricAPI (cricketdata.org) adapter — secondary source.
 *
 * A documented public API with a free tier. Enabled only when CRICAPI_KEY is
 * set in the environment; otherwise the adapter reports itself as skipped.
 * The free tier limits daily calls, which the aggregator's 30-minute cache
 * keeps well within bounds.
 */
import type { Fixture } from "../types";
import { matchTrackedTeam } from "../teams";
import { normalizeFormat } from "../formats";
import { fetchJson } from "./http";

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

interface CricApiResponse {
  status?: string;
  data?: CricApiMatch[];
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

export async function fetchCricApiFixtures(): Promise<Fixture[]> {
  const key = process.env.CRICAPI_KEY;
  if (!key) throw new Error("CRICAPI_KEY not configured");

  const url = `https://api.cricapi.com/v1/matches?apikey=${encodeURIComponent(key)}&offset=0`;
  const data = await fetchJson<CricApiResponse>(url);
  if (data.status !== "success" || !Array.isArray(data.data)) {
    throw new Error("CricAPI returned an unsuccessful response");
  }
  return data.data
    .map(matchToFixture)
    .filter((f): f is Fixture => f !== null);
}
