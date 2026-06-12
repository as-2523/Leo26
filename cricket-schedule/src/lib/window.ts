import { addMonths, startOfDay } from "date-fns";

export interface ScheduleWindow {
  start: Date;
  end: Date;
}

/** Rolling window length shown on the dashboard, in months. */
export const WINDOW_MONTHS = 6;

/** The dashboard shows fixtures from today through WINDOW_MONTHS out. */
export function getScheduleWindow(now: Date = new Date()): ScheduleWindow {
  const start = startOfDay(now);
  return { start, end: addMonths(start, WINDOW_MONTHS) };
}

export function isWithinWindow(isoUtc: string, window: ScheduleWindow): boolean {
  const t = new Date(isoUtc).getTime();
  if (Number.isNaN(t)) return false;
  return t >= window.start.getTime() && t <= window.end.getTime();
}
