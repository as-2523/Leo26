import type { TeamId } from "./types";

export interface TeamConfig {
  id: TeamId;
  /** Display name used across the UI. */
  name: string;
  shortName: string;
  /**
   * Lowercased exact-match aliases. Matching is equality-based (not substring)
   * so that "India" never swallows "India A" or "India Women".
   */
  aliases: string[];
  /**
   * ESPNcricinfo team object id used by the team-schedule endpoint.
   * Verify against the team page URL, e.g. espncricinfo.com/team/india-6.
   */
  espnTeamId: number;
  /** Accent color used for calendar chips, legend and table badges. */
  color: string;
  /** True for youth sides — their fixtures are bucketed under "Youth". */
  youth?: boolean;
}

export const TEAMS: TeamConfig[] = [
  {
    id: "india-men",
    name: "India Men",
    shortName: "IND",
    aliases: ["india", "ind", "india men", "india national cricket team"],
    espnTeamId: 6,
    color: "#1d4ed8",
  },
  {
    id: "india-a-men",
    name: "India A Men",
    shortName: "IND A",
    aliases: ["india a", "ind a", "india a men"],
    espnTeamId: 1024,
    color: "#ea580c",
  },
  {
    id: "india-u19-men",
    name: "India Under-19 Men",
    shortName: "IND U19",
    aliases: [
      "india under-19",
      "india under-19s",
      "india under 19",
      "india under 19s",
      "india u19",
      "india u-19",
      "ind u19",
    ],
    espnTeamId: 446,
    color: "#16a34a",
    youth: true,
  },
  {
    id: "india-women",
    name: "India Women",
    shortName: "IND-W",
    aliases: ["india women", "ind women", "ind-w", "india w", "india wmn"],
    espnTeamId: 1926,
    color: "#db2777",
  },
  {
    id: "india-a-women",
    name: "India A Women",
    shortName: "IND-A-W",
    aliases: ["india a women", "india women a", "ind a women", "india a wmn"],
    espnTeamId: 3867,
    color: "#7c3aed",
  },
];

export const TEAM_BY_ID = new Map(TEAMS.map((t) => [t.id, t]));

const normalize = (name: string) => name.trim().toLowerCase().replace(/\s+/g, " ");

/**
 * Resolve a raw team name from any source to one of the tracked teams,
 * or null when the name belongs to an untracked team (e.g. an opponent).
 */
export function matchTrackedTeam(rawName: string | undefined | null): TeamConfig | null {
  if (!rawName) return null;
  const n = normalize(rawName);
  for (const team of TEAMS) {
    if (team.aliases.includes(n)) return team;
  }
  return null;
}
