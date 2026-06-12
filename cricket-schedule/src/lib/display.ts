/**
 * Display helpers. All times are rendered in IST (Asia/Kolkata) — the
 * natural reference timezone for an Indian-teams dashboard — which also
 * keeps server and client rendering deterministic.
 */
import type { Fixture, SourceId } from "./types";

export const SOURCE_LABELS: Record<SourceId, string> = {
  espn: "ESPNcricinfo",
  bcci: "BCCI",
  cricapi: "CricAPI",
  manual: "Curated",
  seed: "Sample",
};

export const DISPLAY_TZ = "Asia/Kolkata";

const dateFmt = new Intl.DateTimeFormat("en-IN", {
  timeZone: DISPLAY_TZ,
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
});

const timeFmt = new Intl.DateTimeFormat("en-IN", {
  timeZone: DISPLAY_TZ,
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
});

const dayKeyFmt = new Intl.DateTimeFormat("en-CA", {
  // en-CA yields YYYY-MM-DD, ideal for grouping keys.
  timeZone: DISPLAY_TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function formatDateIst(isoUtc: string): string {
  return dateFmt.format(new Date(isoUtc));
}

export function formatTimeIst(fixture: Fixture): string {
  if (!fixture.hasStartTime) return "Time TBC";
  return `${timeFmt.format(new Date(fixture.startTimeUtc))} IST`;
}

/** YYYY-MM-DD key of the fixture's start date in IST, for calendar grouping. */
export function istDayKey(isoUtc: string): string {
  return dayKeyFmt.format(new Date(isoUtc));
}

export function groupByIstDay(fixtures: Fixture[]): Map<string, Fixture[]> {
  const map = new Map<string, Fixture[]>();
  for (const f of fixtures) {
    const key = istDayKey(f.startTimeUtc);
    const list = map.get(key);
    if (list) list.push(f);
    else map.set(key, [f]);
  }
  return map;
}
