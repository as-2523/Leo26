import { addMonths, startOfDay } from "date-fns";

export interface ScheduleWindow {
  start: Date;
  end: Date;
}

/** The dashboard shows fixtures from today through three months out. */
export function getScheduleWindow(now: Date = new Date()): ScheduleWindow {
  const start = startOfDay(now);
  return { start, end: addMonths(start, 3) };
}

export function isWithinWindow(isoUtc: string, window: ScheduleWindow): boolean {
  const t = new Date(isoUtc).getTime();
  if (Number.isNaN(t)) return false;
  return t >= window.start.getTime() && t <= window.end.getTime();
}
