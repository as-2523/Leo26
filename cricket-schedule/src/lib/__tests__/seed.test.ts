import { describe, expect, it } from "vitest";
import { getSeedFixtures } from "../sources/seed";
import { clampToWindow, dedupeFixtures } from "../normalize";
import { getScheduleWindow } from "../window";
import { TEAMS } from "../teams";

describe("seed fixtures", () => {
  it("covers all five tracked teams inside the schedule window", () => {
    const now = new Date();
    const fixtures = clampToWindow(dedupeFixtures(getSeedFixtures(now)), getScheduleWindow(now));
    const teamsCovered = new Set(fixtures.map((f) => f.teamId));
    for (const team of TEAMS) {
      expect(teamsCovered).toContain(team.id);
    }
  });

  it("contains no duplicate fixtures", () => {
    const fixtures = getSeedFixtures();
    expect(dedupeFixtures(fixtures)).toHaveLength(fixtures.length);
  });

  it("spans multiple formats", () => {
    const formats = new Set(getSeedFixtures().map((f) => f.format));
    expect(formats.size).toBeGreaterThanOrEqual(5);
  });
});
