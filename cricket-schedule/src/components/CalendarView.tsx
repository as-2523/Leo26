"use client";

import { useMemo, useState } from "react";
import {
  addDays,
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import type { Fixture } from "../lib/types";
import { groupByIstDay, istDayKey } from "../lib/display";
import FixtureChip from "./FixtureChip";
import FixtureCard from "./FixtureCard";

interface CalendarViewProps {
  fixtures: Fixture[];
  mode: "month" | "week";
  windowStart: string;
  windowEnd: string;
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function CalendarView({ fixtures, mode, windowStart, windowEnd }: CalendarViewProps) {
  const [anchor, setAnchor] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const byDay = useMemo(() => groupByIstDay(fixtures), [fixtures]);

  const days = useMemo(() => {
    if (mode === "month") {
      const gridStart = startOfWeek(startOfMonth(anchor), { weekStartsOn: 1 });
      const gridEnd = endOfWeek(endOfMonth(anchor), { weekStartsOn: 1 });
      return eachDayOfInterval({ start: gridStart, end: gridEnd });
    }
    const weekStart = startOfWeek(anchor, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 6) });
  }, [anchor, mode]);

  const navigate = (dir: -1 | 1) =>
    setAnchor((a) => (mode === "month" ? addMonths(a, dir) : addWeeks(a, dir)));

  // Keep navigation inside the 3-month data window (with a little slack).
  const canGoBack = days[0] > addDays(new Date(windowStart), -35);
  const canGoForward = days[days.length - 1] < addDays(new Date(windowEnd), 35);

  const heading =
    mode === "month"
      ? format(anchor, "MMMM yyyy")
      : `Week of ${format(startOfWeek(anchor, { weekStartsOn: 1 }), "d MMM yyyy")}`;

  const todayKey = istDayKey(new Date().toISOString());
  const selectedFixtures = selectedDay ? (byDay.get(selectedDay) ?? []) : [];

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">{heading}</h2>
        <div className="flex gap-1">
          <button
            onClick={() => navigate(-1)}
            disabled={!canGoBack}
            aria-label="Previous"
            className="rounded-md border border-slate-300 bg-white px-3 py-1 text-sm hover:bg-slate-50 disabled:opacity-40"
          >
            ←
          </button>
          <button
            onClick={() => setAnchor(new Date())}
            className="rounded-md border border-slate-300 bg-white px-3 py-1 text-sm hover:bg-slate-50"
          >
            Today
          </button>
          <button
            onClick={() => navigate(1)}
            disabled={!canGoForward}
            aria-label="Next"
            className="rounded-md border border-slate-300 bg-white px-3 py-1 text-sm hover:bg-slate-50 disabled:opacity-40"
          >
            →
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border border-slate-200 bg-slate-200">
        {WEEKDAYS.map((d) => (
          <div key={d} className="bg-slate-50 px-2 py-1.5 text-center text-xs font-semibold text-slate-500">
            {d}
          </div>
        ))}
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const dayFixtures = byDay.get(key) ?? [];
          const inMonth = mode === "week" || isSameMonth(day, anchor);
          const isToday = key === todayKey;
          const isSelected = key === selectedDay;
          return (
            <button
              key={key}
              onClick={() => setSelectedDay(isSelected ? null : key)}
              className={`flex min-h-20 flex-col gap-1 p-1.5 text-left align-top transition ${
                inMonth ? "bg-white" : "bg-slate-50/70"
              } ${isSelected ? "ring-2 ring-inset ring-slate-700" : "hover:bg-slate-50"} ${
                mode === "week" ? "min-h-44" : ""
              }`}
            >
              <span
                className={`self-start rounded-full px-1.5 text-xs leading-5 ${
                  isToday
                    ? "bg-slate-900 font-semibold text-white"
                    : inMonth
                      ? "text-slate-700"
                      : "text-slate-400"
                }`}
              >
                {format(day, "d")}
              </span>
              {(mode === "week" ? dayFixtures : dayFixtures.slice(0, 3)).map((f) => (
                <FixtureChip key={f.id} fixture={f} />
              ))}
              {mode === "month" && dayFixtures.length > 3 && (
                <span className="text-[11px] text-slate-500">+{dayFixtures.length - 3} more</span>
              )}
            </button>
          );
        })}
      </div>

      {selectedDay && (
        <div className="mt-4">
          <h3 className="mb-2 text-sm font-semibold text-slate-700">
            Matches on {format(new Date(`${selectedDay}T00:00:00`), "EEEE, d MMMM yyyy")}
          </h3>
          {selectedFixtures.length === 0 ? (
            <p className="text-sm text-slate-500">No matches scheduled for the tracked teams.</p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {selectedFixtures.map((f) => (
                <FixtureCard key={f.id} fixture={f} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
