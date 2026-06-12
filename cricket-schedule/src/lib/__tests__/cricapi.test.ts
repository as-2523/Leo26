import { describe, expect, it } from "vitest";
import {
  fallbackSeriesName,
  selectCandidateSeries,
  type CricApiSeries,
} from "../sources/cricapi";

const NOW = new Date("2026-06-12T00:00:00Z");

const series = (over: Partial<CricApiSeries>): CricApiSeries => ({
  id: "s1",
  name: "England tour of India",
  startDate: "2026-07-01",
  endDate: "2026-07-30",
  ...over,
});

describe("selectCandidateSeries", () => {
  it("keeps India-related series inside the window", () => {
    const out = selectCandidateSeries([series({})], NOW);
    expect(out).toHaveLength(1);
  });

  it("keeps major tournaments even without 'India' in the name", () => {
    const out = selectCandidateSeries(
      [series({ name: "ICC Women's T20 World Cup", startDate: "2026-06-12", endDate: "2026-07-05" })],
      NOW
    );
    expect(out).toHaveLength(1);
  });

  it("drops irrelevant or out-of-window series", () => {
    const out = selectCandidateSeries(
      [
        series({ name: "County Championship Division One" }),
        series({ name: "Australia tour of India", startDate: "2027-02-01", endDate: "2027-03-01" }),
        series({ name: "India tour of England", startDate: "2025-06-01", endDate: "2025-08-01" }),
        series({ id: undefined }),
      ],
      NOW
    );
    expect(out).toHaveLength(0);
  });

  it("resolves year-less end dates against the start year", () => {
    // Ended May 2026 — should be dropped even though "May 30" alone parses oddly.
    const ended = series({ startDate: "2026-04-01", endDate: "May 30" });
    // Ongoing — started before the window but still running.
    const ongoing = series({ id: "s2", startDate: "2026-06-01", endDate: "Jun 30" });
    const out = selectCandidateSeries([ended, ongoing], NOW);
    expect(out.map((s) => s.id)).toEqual(["s2"]);
  });

  it("prioritizes India-named series over big tournaments for the call budget", () => {
    const tournament = series({
      id: "wc",
      name: "ICC Men's T20 World Cup",
      startDate: "2026-06-15",
      endDate: "2026-07-10",
    });
    const lateTour = series({
      id: "tour",
      name: "Australia tour of India",
      startDate: "2026-10-01",
      endDate: "2026-11-15",
    });
    const out = selectCandidateSeries([tournament, lateTour], NOW);
    expect(out.map((s) => s.id)).toEqual(["tour", "wc"]);
  });

  it("caps the number of detail calls and sorts by start date", () => {
    const many = Array.from({ length: 30 }, (_, i) =>
      series({ id: `s${i}`, startDate: `2026-0${(i % 6) + 6}-15`.slice(0, 10) })
    );
    const out = selectCandidateSeries(many, NOW);
    expect(out.length).toBeLessThanOrEqual(17);
    expect(out.length).toBeLessThan(many.length);
    const starts = out.map((s) => s.startDate ?? "");
    expect([...starts].sort()).toEqual(starts);
  });
});

describe("fallbackSeriesName", () => {
  it("strips the match-number suffix so a tour's matches group together", () => {
    expect(fallbackSeriesName("India vs England, 3rd ODI")).toBe("India vs England");
    expect(fallbackSeriesName("India Women vs Australia Women, 1st T20I")).toBe(
      "India Women vs Australia Women"
    );
  });

  it("returns names without a suffix unchanged, and a dash for missing names", () => {
    expect(fallbackSeriesName("Asia Cup Final")).toBe("Asia Cup Final");
    expect(fallbackSeriesName(undefined)).toBe("—");
  });
});
