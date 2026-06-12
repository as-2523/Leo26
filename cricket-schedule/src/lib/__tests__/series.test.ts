import { describe, expect, it } from "vitest";
import { groupBySeries, runningSeriesNames } from "../series";
import type { Fixture } from "../types";

const make = (over: Partial<Fixture>): Fixture => ({
  id: "x",
  teamId: "india-men",
  teamName: "India Men",
  opponent: "England",
  startTimeUtc: "2026-07-01T10:00:00.000Z",
  hasStartTime: true,
  format: "ODI",
  formatLabel: "ODI",
  series: "India tour of England",
  venue: "Lord's",
  source: "seed",
  ...over,
});

describe("groupBySeries", () => {
  it("groups fixtures under their series, sorted by start", () => {
    const now = new Date("2026-06-12T00:00:00Z");
    const groups = groupBySeries(
      [
        make({ startTimeUtc: "2026-07-04T10:00:00.000Z" }),
        make({ startTimeUtc: "2026-07-01T10:00:00.000Z" }),
        make({ series: "Asia Cup", startTimeUtc: "2026-08-01T10:00:00.000Z" }),
      ],
      now
    );
    expect(groups).toHaveLength(2);
    const tour = groups.find((g) => g.name === "India tour of England")!;
    expect(tour.fixtures.map((f) => f.startTimeUtc.slice(8, 10))).toEqual(["01", "04"]);
    expect(tour.running).toBe(false);
  });

  it("marks a series as running once its first match day arrives", () => {
    const now = new Date("2026-07-01T12:00:00Z");
    const groups = groupBySeries(
      [
        make({ startTimeUtc: "2026-07-01T10:00:00.000Z" }),
        make({ startTimeUtc: "2026-07-04T10:00:00.000Z" }),
      ],
      now
    );
    expect(groups[0].running).toBe(true);
  });

  it("does not mark a finished series as running", () => {
    const now = new Date("2026-08-20T00:00:00Z");
    const groups = groupBySeries([make({ startTimeUtc: "2026-07-01T10:00:00.000Z" })], now);
    expect(groups[0].running).toBe(false);
  });

  it("marks a mid-tour series as running via its series-level dates", () => {
    // Two matches already played (absent from upcoming-only data); the next
    // upcoming match is days away, but the series itself started June 12.
    const now = new Date("2026-06-20T12:00:00Z");
    const groups = groupBySeries(
      [
        make({
          startTimeUtc: "2026-06-24T10:00:00.000Z",
          seriesStartUtc: "2026-06-12T00:00:00.000Z",
          seriesEndUtc: "2026-07-05T00:00:00.000Z",
        }),
      ],
      now
    );
    expect(groups[0].running).toBe(true);
  });

  it("marks a known tournament as running even without source series dates", () => {
    // Data preserved from an older pull lacks seriesStartUtc; the curated
    // window for the Women's T20 World Cup (12 Jun – 5 Jul 2026) covers it.
    const now = new Date("2026-06-20T12:00:00Z");
    const groups = groupBySeries(
      [
        make({
          series: "ICC Womens T20 World Cup 2026",
          teamId: "india-women",
          startTimeUtc: "2026-06-24T14:00:00.000Z",
        }),
      ],
      now
    );
    expect(groups[0].running).toBe(true);
  });

  it("does not apply known windows to unrelated series", () => {
    const now = new Date("2026-06-20T12:00:00Z");
    const groups = groupBySeries(
      [make({ series: "India tour of England", startTimeUtc: "2026-06-24T10:00:00.000Z" })],
      now
    );
    expect(groups[0].running).toBe(false);
  });

  it("treats an in-progress multi-day match as running via its end time", () => {
    const now = new Date("2026-07-03T10:00:00Z");
    const groups = groupBySeries(
      [
        make({
          format: "Test",
          formatLabel: "Test",
          startTimeUtc: "2026-07-01T04:00:00.000Z",
          endTimeUtc: "2026-07-05T04:00:00.000Z",
        }),
      ],
      now
    );
    expect(groups[0].running).toBe(true);
  });

  it("sorts running series ahead of upcoming ones", () => {
    const now = new Date("2026-07-01T12:00:00Z");
    const groups = groupBySeries(
      [
        make({ series: "Later tour", startTimeUtc: "2026-08-01T10:00:00.000Z" }),
        make({ startTimeUtc: "2026-07-01T10:00:00.000Z" }),
      ],
      now
    );
    expect(groups[0].name).toBe("India tour of England");
  });
});

describe("runningSeriesNames", () => {
  it("returns only series in progress", () => {
    const now = new Date("2026-07-01T12:00:00Z");
    const names = runningSeriesNames(
      [
        make({ startTimeUtc: "2026-07-01T10:00:00.000Z" }),
        make({ series: "Asia Cup", startTimeUtc: "2026-08-01T10:00:00.000Z" }),
      ],
      now
    );
    expect(names).toEqual(new Set(["India tour of England"]));
  });
});
