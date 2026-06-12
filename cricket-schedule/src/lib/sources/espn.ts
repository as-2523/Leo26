/**
 * ESPNcricinfo adapter — primary source.
 *
 * Uses the public JSON endpoints that power espncricinfo.com (the
 * "hs-consumer-api"). This is preferred over HTML scraping: it is the same
 * data the site serves, is far more stable than markup, and avoids parsing
 * pages disallowed for crawling. Calls are cached by the aggregator (30 min
 * TTL) so each team endpoint is hit at most twice an hour.
 *
 * The API is unofficial, so all parsing is defensive: missing or renamed
 * fields skip a match rather than fail the source.
 */
import type { Fixture } from "../types";
import { matchTrackedTeam, TEAMS, type TeamConfig } from "../teams";
import { normalizeFormat } from "../formats";
import { fetchJson } from "./http";

interface EspnTeamRef {
  team?: { id?: number; objectId?: number; name?: string; longName?: string };
}

interface EspnMatch {
  objectId?: number;
  slug?: string;
  startTime?: string;
  endTime?: string;
  startDate?: string;
  format?: string;
  stage?: string;
  state?: string;
  status?: string;
  teams?: EspnTeamRef[];
  series?: { name?: string; longName?: string; slug?: string };
  ground?: { name?: string; longName?: string; town?: { name?: string } };
  title?: string;
}

interface EspnTeamSchedule {
  content?: {
    matches?: EspnMatch[];
    upcomingMatches?: EspnMatch[];
  };
}

const teamScheduleUrl = (espnTeamId: number) =>
  `https://hs-consumer-api.espncricinfo.com/v1/pages/team/schedule?lang=en&teamId=${espnTeamId}`;

function matchToFixture(m: EspnMatch, team: TeamConfig): Fixture | null {
  const start = m.startTime ?? m.startDate;
  if (!start) return null;
  const startDate = new Date(start);
  if (Number.isNaN(startDate.getTime())) return null;

  // Results/live games are excluded; the dashboard is upcoming-only.
  const state = (m.state ?? "").toUpperCase();
  if (state && state !== "PRE" && state !== "SCHEDULED" && state !== "UPCOMING") return null;

  const sides = (m.teams ?? [])
    .map((t) => t.team?.longName ?? t.team?.name)
    .filter((n): n is string => Boolean(n));
  const opponent =
    sides.find((n) => matchTrackedTeam(n)?.id !== team.id) ?? "TBC";

  const formatLabel = m.format ?? "Unknown";
  const format = team.youth ? "Youth" : normalizeFormat(formatLabel);

  return {
    id: "", // assigned during dedupe
    teamId: team.id,
    teamName: team.name,
    opponent,
    startTimeUtc: startDate.toISOString(),
    hasStartTime: Boolean(m.startTime),
    endTimeUtc: m.endTime ? new Date(m.endTime).toISOString() : undefined,
    format,
    formatLabel,
    series: m.series?.longName ?? m.series?.name ?? m.title ?? "—",
    venue: m.ground?.longName ?? m.ground?.name ?? "TBC",
    city: m.ground?.town?.name,
    source: "espn",
    sourceUrl: m.slug && m.objectId
      ? `https://www.espncricinfo.com/series/${m.series?.slug ?? "match"}/${m.slug}-${m.objectId}`
      : undefined,
  };
}

/** Fetch upcoming fixtures for every tracked team. Per-team failures are isolated. */
export async function fetchEspnFixtures(): Promise<Fixture[]> {
  const results = await Promise.allSettled(
    TEAMS.map(async (team) => {
      const data = await fetchJson<EspnTeamSchedule>(teamScheduleUrl(team.espnTeamId));
      const matches = data.content?.matches ?? data.content?.upcomingMatches ?? [];
      return matches
        .map((m) => matchToFixture(m, team))
        .filter((f): f is Fixture => f !== null);
    })
  );

  const fixtures = results
    .filter((r): r is PromiseFulfilledResult<Fixture[]> => r.status === "fulfilled")
    .flatMap((r) => r.value);

  // If every team request failed, surface the first error so the aggregator
  // records the source as down and moves to the next source.
  if (fixtures.length === 0) {
    const firstError = results.find((r) => r.status === "rejected");
    if (firstError && results.every((r) => r.status === "rejected")) {
      throw new Error(String((firstError as PromiseRejectedResult).reason));
    }
  }
  return fixtures;
}
