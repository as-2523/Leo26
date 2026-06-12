import { describe, expect, it } from "vitest";
import { mergeExpectedSeries } from "../expected";
import type { ExpectedSeries } from "../types";

// The curated list contains the India tour of Sri Lanka (Aug 2026);
// these tests pin the merge/retire behavior around it.
const NOW = new Date("2026-06-12T00:00:00Z");

describe("mergeExpectedSeries", () => {
  it("adds curated potential matches when nothing covers them", () => {
    const out = mergeExpectedSeries([], [], NOW);
    expect(out.some((s) => s.name.includes("Sri Lanka"))).toBe(true);
    const sl = out.find((s) => s.name.includes("Sri Lanka"))!;
    expect(sl.sourceUrl).toBeTruthy();
  });

  it("hides a curated entry once confirmed fixtures mention its teams", () => {
    const out = mergeExpectedSeries([], ["Sri Lanka vs India Test Series"], NOW);
    expect(out.some((s) => s.name.includes("Sri Lanka"))).toBe(false);
  });

  it("hides a curated entry once the source catalog lists the series", () => {
    const dynamic: ExpectedSeries[] = [
      { name: "India tour of Sri Lanka, 2026", startUtc: "2026-08-05T00:00:00.000Z" },
    ];
    const out = mergeExpectedSeries(dynamic, [], NOW);
    expect(out.filter((s) => /sri lanka/i.test(s.name))).toHaveLength(1);
    expect(out[0].name).toBe("India tour of Sri Lanka, 2026");
  });

  it("drops curated entries outside the rolling window", () => {
    const past = new Date("2027-01-15T00:00:00Z");
    const out = mergeExpectedSeries([], [], past);
    expect(out.some((s) => s.name.includes("Sri Lanka"))).toBe(false);
  });

  it("keeps results sorted by start date", () => {
    const dynamic: ExpectedSeries[] = [
      { name: "India tour of New Zealand", startUtc: "2026-10-01T00:00:00.000Z" },
    ];
    const out = mergeExpectedSeries(dynamic, [], NOW);
    const starts = out.map((s) => s.startUtc);
    expect([...starts].sort()).toEqual(starts);
  });
});
