import { describe, expect, it } from "vitest";
import { getManualFixtures } from "../sources/manual";
import { dedupeFixtures } from "../normalize";
import { TEAM_BY_ID } from "../teams";

describe("manual curated fixtures", () => {
  const fixtures = getManualFixtures();

  it("entries are well-formed with valid teams, dates and sources", () => {
    for (const f of fixtures) {
      expect(TEAM_BY_ID.has(f.teamId)).toBe(true);
      expect(Number.isNaN(new Date(f.startTimeUtc).getTime())).toBe(false);
      expect(f.source).toBe("manual");
      expect(f.sourceUrl).toMatch(/^https:\/\//);
      expect(f.series.length).toBeGreaterThan(0);
      expect(f.venue.length).toBeGreaterThan(0);
    }
  });

  it("contains no duplicate entries", () => {
    expect(dedupeFixtures(fixtures)).toHaveLength(fixtures.length);
  });

  it("loses to live-source records for the same match in dedupe", () => {
    const manual = fixtures[0];
    const live = { ...manual, source: "cricapi" as const, venue: "API venue" };
    const out = dedupeFixtures([manual, live]);
    expect(out).toHaveLength(1);
    expect(out[0].source).toBe("cricapi");
  });
});
