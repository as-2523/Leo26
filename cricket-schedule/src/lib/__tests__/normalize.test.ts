import { describe, expect, it } from "vitest";
import { clampToWindow, dedupeFixtures, fixtureKey } from "../normalize";
import { getScheduleWindow } from "../window";
import type { Fixture } from "../types";

const base: Fixture = {
  id: "",
  teamId: "india-men",
  teamName: "India Men",
  opponent: "England",
  startTimeUtc: "2026-07-01T10:00:00.000Z",
  hasStartTime: true,
  format: "ODI",
  formatLabel: "ODI",
  series: "India tour of England",
  venue: "Lord's",
  source: "espn",
};

describe("dedupeFixtures", () => {
  it("collapses the same match reported by two sources", () => {
    const fromCricApi: Fixture = {
      ...base,
      source: "cricapi",
      startTimeUtc: "2026-07-01T09:30:00.000Z", // same UTC day, slightly different time
      venue: "Lord's Cricket Ground",
    };
    const out = dedupeFixtures([fromCricApi, base]);
    expect(out).toHaveLength(1);
    expect(out[0].source).toBe("espn"); // higher priority wins
    expect(out[0].venue).toBe("Lord's");
  });

  it("keeps distinct matches apart", () => {
    const secondOdi: Fixture = { ...base, startTimeUtc: "2026-07-04T10:00:00.000Z" };
    const t20SameDay: Fixture = { ...base, format: "T20", formatLabel: "T20I" };
    const out = dedupeFixtures([base, secondOdi, t20SameDay]);
    expect(out).toHaveLength(3);
  });

  it("assigns stable ids and sorts by start time", () => {
    const later: Fixture = { ...base, startTimeUtc: "2026-08-01T10:00:00.000Z" };
    const out = dedupeFixtures([later, base]);
    expect(out[0].startTimeUtc < out[1].startTimeUtc).toBe(true);
    expect(out[0].id).toMatch(/^fx-/);
    expect(dedupeFixtures([later, base]).map((f) => f.id)).toEqual(out.map((f) => f.id));
  });

  it("treats opponent names case- and whitespace-insensitively", () => {
    const variant: Fixture = { ...base, opponent: "  ENGLAND ", source: "cricapi" };
    expect(fixtureKey(variant)).toBe(fixtureKey(base));
  });
});

describe("clampToWindow", () => {
  it("keeps only fixtures within the rolling 6-month window", () => {
    const now = new Date("2026-06-12T00:00:00Z");
    const window = getScheduleWindow(now);
    const past: Fixture = { ...base, startTimeUtc: "2026-06-01T10:00:00.000Z" };
    const inWindow: Fixture = { ...base, startTimeUtc: "2026-08-15T10:00:00.000Z" };
    const nearEnd: Fixture = { ...base, startTimeUtc: "2026-12-01T10:00:00.000Z" };
    const tooFar: Fixture = { ...base, startTimeUtc: "2027-01-01T10:00:00.000Z" };
    const out = clampToWindow([past, inWindow, nearEnd, tooFar], window);
    expect(out).toEqual([inWindow, nearEnd]);
  });
});
