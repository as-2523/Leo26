/**
 * Bundled sample fixtures — last-resort fallback.
 *
 * Used only when no live source responds (network outage, upstream change,
 * or a restricted deployment environment). Dates are generated relative to
 * "today" so the demo always has data across the full rolling window, and
 * the UI shows a prominent banner explaining that the data is illustrative,
 * not a real schedule.
 */
import { addDays, setHours, startOfDay } from "date-fns";
import type { Fixture, FormatCategory, TeamId } from "../types";
import { TEAM_BY_ID } from "../teams";

interface SeedSpec {
  teamId: TeamId;
  opponent: string;
  series: string;
  venue: string;
  city: string;
  format: FormatCategory;
  formatLabel: string;
  /** Days from today. */
  offsetDays: number;
  /** Local-ish start hour in UTC. */
  startHourUtc: number;
  /** Multi-day matches: number of days the match spans. */
  spanDays?: number;
}

const SPECS: SeedSpec[] = [
  // India Men — white-ball tour then a home Test series
  { teamId: "india-men", opponent: "England", series: "India tour of England — ODI series", venue: "Kennington Oval", city: "London", format: "ODI", formatLabel: "ODI", offsetDays: 9, startHourUtc: 10 },
  { teamId: "india-men", opponent: "England", series: "India tour of England — ODI series", venue: "Lord's", city: "London", format: "ODI", formatLabel: "ODI", offsetDays: 12, startHourUtc: 10 },
  { teamId: "india-men", opponent: "England", series: "India tour of England — ODI series", venue: "Edgbaston", city: "Birmingham", format: "ODI", formatLabel: "ODI", offsetDays: 15, startHourUtc: 10 },
  { teamId: "india-men", opponent: "England", series: "India tour of England — T20I series", venue: "Old Trafford", city: "Manchester", format: "T20", formatLabel: "T20I", offsetDays: 19, startHourUtc: 17 },
  { teamId: "india-men", opponent: "England", series: "India tour of England — T20I series", venue: "Headingley", city: "Leeds", format: "T20", formatLabel: "T20I", offsetDays: 21, startHourUtc: 17 },
  { teamId: "india-men", opponent: "West Indies", series: "West Indies tour of India — Test series", venue: "Arun Jaitley Stadium", city: "Delhi", format: "Test", formatLabel: "Test", offsetDays: 48, startHourUtc: 4, spanDays: 5 },
  { teamId: "india-men", opponent: "West Indies", series: "West Indies tour of India — Test series", venue: "MA Chidambaram Stadium", city: "Chennai", format: "Test", formatLabel: "Test", offsetDays: 56, startHourUtc: 4, spanDays: 5 },

  // India A Men — shadow tour
  { teamId: "india-a-men", opponent: "England Lions", series: "India A tour of England — unofficial Tests", venue: "County Ground", city: "Northampton", format: "First-class", formatLabel: "First-class", offsetDays: 6, startHourUtc: 10, spanDays: 4 },
  { teamId: "india-a-men", opponent: "England Lions", series: "India A tour of England — unofficial Tests", venue: "New Road", city: "Worcester", format: "First-class", formatLabel: "First-class", offsetDays: 13, startHourUtc: 10, spanDays: 4 },
  { teamId: "india-a-men", opponent: "Australia A", series: "Australia A tour of India — one-day series", venue: "M Chinnaswamy Stadium", city: "Bengaluru", format: "List A", formatLabel: "List A", offsetDays: 38, startHourUtc: 4 },
  { teamId: "india-a-men", opponent: "Australia A", series: "Australia A tour of India — one-day series", venue: "M Chinnaswamy Stadium", city: "Bengaluru", format: "List A", formatLabel: "List A", offsetDays: 40, startHourUtc: 4 },

  // India U19 Men — youth series
  { teamId: "india-u19-men", opponent: "Sri Lanka Under-19", series: "Sri Lanka U19 tour of India — Youth ODIs", venue: "KSCA Stadium", city: "Alur", format: "Youth", formatLabel: "Youth ODI", offsetDays: 24, startHourUtc: 4 },
  { teamId: "india-u19-men", opponent: "Sri Lanka Under-19", series: "Sri Lanka U19 tour of India — Youth ODIs", venue: "KSCA Stadium", city: "Alur", format: "Youth", formatLabel: "Youth ODI", offsetDays: 26, startHourUtc: 4 },
  { teamId: "india-u19-men", opponent: "Sri Lanka Under-19", series: "Sri Lanka U19 tour of India — Youth Test", venue: "Just Cricket Academy Ground", city: "Bengaluru", format: "Youth", formatLabel: "Youth Test", offsetDays: 31, startHourUtc: 4, spanDays: 4 },

  // India Women — T20 World Cup style block then ODIs
  { teamId: "india-women", opponent: "Pakistan Women", series: "ICC Women's T20 World Cup", venue: "Edgbaston", city: "Birmingham", format: "T20", formatLabel: "WT20I", offsetDays: 4, startHourUtc: 14 },
  { teamId: "india-women", opponent: "Australia Women", series: "ICC Women's T20 World Cup", venue: "Lord's", city: "London", format: "T20", formatLabel: "WT20I", offsetDays: 8, startHourUtc: 14 },
  { teamId: "india-women", opponent: "England Women", series: "ICC Women's T20 World Cup", venue: "The Oval", city: "London", format: "T20", formatLabel: "WT20I", offsetDays: 11, startHourUtc: 14 },
  { teamId: "india-women", opponent: "South Africa Women", series: "South Africa Women tour of India — ODI series", venue: "Holkar Stadium", city: "Indore", format: "ODI", formatLabel: "WODI", offsetDays: 52, startHourUtc: 8 },
  { teamId: "india-women", opponent: "South Africa Women", series: "South Africa Women tour of India — ODI series", venue: "Holkar Stadium", city: "Indore", format: "ODI", formatLabel: "WODI", offsetDays: 55, startHourUtc: 8 },

  // India A Women — emerging tour
  { teamId: "india-a-women", opponent: "Australia A Women", series: "India A Women tour of Australia — one-day series", venue: "Allan Border Field", city: "Brisbane", format: "List A", formatLabel: "List A", offsetDays: 64, startHourUtc: 0 },
  { teamId: "india-a-women", opponent: "Australia A Women", series: "India A Women tour of Australia — one-day series", venue: "Allan Border Field", city: "Brisbane", format: "List A", formatLabel: "List A", offsetDays: 67, startHourUtc: 0 },
  { teamId: "india-a-women", opponent: "Australia A Women", series: "India A Women tour of Australia — T20 series", venue: "Allan Border Field", city: "Brisbane", format: "T20", formatLabel: "T20", offsetDays: 71, startHourUtc: 3 },

  // Months 4-6 — home season block so the sample data spans the full window
  { teamId: "india-a-men", opponent: "South Africa A", series: "South Africa A tour of India — one-day series", venue: "Greenfield International Stadium", city: "Thiruvananthapuram", format: "List A", formatLabel: "List A", offsetDays: 100, startHourUtc: 4 },
  { teamId: "india-a-men", opponent: "South Africa A", series: "South Africa A tour of India — one-day series", venue: "Greenfield International Stadium", city: "Thiruvananthapuram", format: "List A", formatLabel: "List A", offsetDays: 102, startHourUtc: 4 },
  { teamId: "india-a-men", opponent: "South Africa A", series: "South Africa A tour of India — unofficial Test", venue: "Vidarbha CA Stadium", city: "Nagpur", format: "First-class", formatLabel: "First-class", offsetDays: 120, startHourUtc: 4, spanDays: 4 },
  { teamId: "india-women", opponent: "Australia Women", series: "Australia Women tour of India — T20I series", venue: "DY Patil Stadium", city: "Navi Mumbai", format: "T20", formatLabel: "WT20I", offsetDays: 110, startHourUtc: 13 },
  { teamId: "india-women", opponent: "Australia Women", series: "Australia Women tour of India — T20I series", venue: "DY Patil Stadium", city: "Navi Mumbai", format: "T20", formatLabel: "WT20I", offsetDays: 112, startHourUtc: 13 },
  { teamId: "india-women", opponent: "England Women", series: "England Women tour of India — one-off Test", venue: "Wankhede Stadium", city: "Mumbai", format: "Test", formatLabel: "WTest", offsetDays: 140, startHourUtc: 4, spanDays: 4 },
  { teamId: "india-men", opponent: "New Zealand", series: "New Zealand tour of India — Test series", venue: "M Chinnaswamy Stadium", city: "Bengaluru", format: "Test", formatLabel: "Test", offsetDays: 130, startHourUtc: 4, spanDays: 5 },
  { teamId: "india-men", opponent: "New Zealand", series: "New Zealand tour of India — Test series", venue: "Rajiv Gandhi International Stadium", city: "Hyderabad", format: "Test", formatLabel: "Test", offsetDays: 138, startHourUtc: 4, spanDays: 5 },
  { teamId: "india-men", opponent: "Australia", series: "Australia tour of India — T20I series", venue: "Eden Gardens", city: "Kolkata", format: "T20", formatLabel: "T20I", offsetDays: 160, startHourUtc: 13 },
  { teamId: "india-men", opponent: "Australia", series: "Australia tour of India — T20I series", venue: "Barabati Stadium", city: "Cuttack", format: "T20", formatLabel: "T20I", offsetDays: 163, startHourUtc: 13 },
  { teamId: "india-men", opponent: "Australia", series: "Australia tour of India — T20I series", venue: "HPCA Stadium", city: "Dharamsala", format: "T20", formatLabel: "T20I", offsetDays: 166, startHourUtc: 13 },
  { teamId: "india-u19-men", opponent: "Bangladesh Under-19", series: "ACC Under-19 Asia Cup", venue: "Dubai International Stadium", city: "Dubai", format: "Youth", formatLabel: "Youth ODI", offsetDays: 150, startHourUtc: 5 },
  { teamId: "india-u19-men", opponent: "Pakistan Under-19", series: "ACC Under-19 Asia Cup", venue: "Dubai International Stadium", city: "Dubai", format: "Youth", formatLabel: "Youth ODI", offsetDays: 153, startHourUtc: 5 },
  { teamId: "india-a-women", opponent: "England A Women", series: "England A Women tour of India — T20 series", venue: "NCA Ground", city: "Bengaluru", format: "T20", formatLabel: "T20", offsetDays: 145, startHourUtc: 8 },
  { teamId: "india-a-women", opponent: "England A Women", series: "England A Women tour of India — T20 series", venue: "NCA Ground", city: "Bengaluru", format: "T20", formatLabel: "T20", offsetDays: 147, startHourUtc: 8 },
];

export function getSeedFixtures(now: Date = new Date()): Fixture[] {
  return SPECS.map((s) => {
    const start = setHours(startOfDay(addDays(now, s.offsetDays)), s.startHourUtc);
    const team = TEAM_BY_ID.get(s.teamId)!;
    return {
      id: "", // assigned during dedupe
      teamId: s.teamId,
      teamName: team.name,
      opponent: s.opponent,
      startTimeUtc: start.toISOString(),
      hasStartTime: true,
      endTimeUtc: s.spanDays ? addDays(start, s.spanDays - 1).toISOString() : undefined,
      format: s.format,
      formatLabel: s.formatLabel,
      series: s.series,
      venue: s.venue,
      city: s.city,
      source: "seed" as const,
    };
  });
}
