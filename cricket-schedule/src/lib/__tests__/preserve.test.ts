import { describe, expect, it } from "vitest";
import { choosePayload } from "../preserve";
import type { Fixture, FixturesPayload } from "../types";

const NOW = new Date("2026-06-12T00:00:00Z");

const fixture = (iso: string, i: number): Fixture => ({
  id: `fx-${i}`,
  teamId: "india-men",
  teamName: "India Men",
  opponent: "England",
  startTimeUtc: iso,
  hasStartTime: true,
  format: "ODI",
  formatLabel: "ODI",
  series: "India tour of England",
  venue: "Lord's",
  source: "cricapi",
});

const payload = (fixtures: Fixture[], usedFallback = false): FixturesPayload => ({
  fixtures,
  meta: {
    generatedAt: "2026-06-11T00:00:00.000Z",
    windowStart: "2026-06-11T00:00:00.000Z",
    windowEnd: "2026-12-11T00:00:00.000Z",
    sources: [{ id: "cricapi", ok: !usedFallback, count: fixtures.length }],
    usedFallback,
    expectedSeries: [],
  },
});

const healthy = payload(
  Array.from({ length: 40 }, (_, i) => fixture(`2026-0${(i % 6) + 7}-15T10:00:00.000Z`.slice(0, 24), i))
);

describe("choosePayload", () => {
  it("keeps the previous dataset when the fresh pull is degraded", () => {
    const degraded = payload([fixture("2026-06-20T10:00:00.000Z", 1)]);
    const { payload: out, preserved } = choosePayload(degraded, healthy, NOW);
    expect(preserved).toBe(true);
    expect(out.fixtures.length).toBeGreaterThan(10);
    expect(out.meta.usedFallback).toBe(false);
  });

  it("keeps the previous dataset when the fresh pull fell back to samples", () => {
    const fallback = payload(
      Array.from({ length: 30 }, (_, i) => fixture("2026-07-01T10:00:00.000Z", i)),
      true
    );
    const { preserved } = choosePayload(fallback, healthy, NOW);
    expect(preserved).toBe(true);
  });

  it("uses the fresh pull when it is healthy", () => {
    const { payload: out, preserved } = choosePayload(healthy, payload([fixture("2026-07-01T10:00:00.000Z", 1)]), NOW);
    expect(preserved).toBe(false);
    expect(out).toBe(healthy);
  });

  it("never preserves sample-data or missing previous payloads", () => {
    const degraded = payload([fixture("2026-06-20T10:00:00.000Z", 1)]);
    expect(choosePayload(degraded, null, NOW).preserved).toBe(false);
    const prevFallback = payload(healthy.fixtures, true);
    expect(choosePayload(degraded, prevFallback, NOW).preserved).toBe(false);
  });

  it("re-clamps preserved fixtures to the current rolling window", () => {
    const prev = payload([
      fixture("2026-06-01T10:00:00.000Z", 1), // now in the past
      ...Array.from({ length: 20 }, (_, i) => fixture("2026-08-15T10:00:00.000Z", i + 2)),
    ]);
    const degraded = payload([fixture("2026-06-20T10:00:00.000Z", 99)]);
    const { payload: out } = choosePayload(degraded, prev, NOW);
    expect(out.fixtures.some((f) => f.startTimeUtc.startsWith("2026-06-01"))).toBe(false);
    expect(out.meta.windowStart.slice(0, 10)).toBe("2026-06-12");
  });
});
