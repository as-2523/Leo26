"use client";

import { TEAM_BY_ID } from "../lib/teams";
import { formatDateIst, formatTimeIst } from "../lib/display";
import type { Fixture } from "../lib/types";

interface FixtureTableProps {
  fixtures: Fixture[];
  /** Series currently in progress — their rows are highlighted. */
  runningSeries?: Set<string>;
}

export default function FixtureTable({ fixtures, runningSeries }: FixtureTableProps) {
  if (fixtures.length === 0) {
    return (
      <p className="rounded-lg border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
        No fixtures match the current filters.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table className="w-full min-w-200 text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <th className="px-4 py-3 font-semibold">Date</th>
            <th className="px-4 py-3 font-semibold">Time (IST)</th>
            <th className="px-4 py-3 font-semibold">Team</th>
            <th className="px-4 py-3 font-semibold">Opponent</th>
            <th className="px-4 py-3 font-semibold">Format</th>
            <th className="px-4 py-3 font-semibold">Series / Competition</th>
            <th className="px-4 py-3 font-semibold">Venue</th>
          </tr>
        </thead>
        <tbody>
          {fixtures.map((f) => {
            const team = TEAM_BY_ID.get(f.teamId);
            const running = runningSeries?.has(f.series) ?? false;
            return (
              <tr
                key={f.id}
                className={`border-b border-slate-100 last:border-0 ${
                  running
                    ? "bg-emerald-50/80 hover:bg-emerald-50"
                    : "hover:bg-slate-50/60"
                }`}
              >
                <td className="whitespace-nowrap px-4 py-3 text-slate-900">
                  {formatDateIst(f.startTimeUtc)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatTimeIst(f)}</td>
                <td className="whitespace-nowrap px-4 py-3">
                  <span className="flex items-center gap-2">
                    <span
                      className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: team?.color }}
                    />
                    <span className="font-medium text-slate-900">{f.teamName}</span>
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-700">{f.opponent}</td>
                <td className="whitespace-nowrap px-4 py-3">
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-600">
                    {f.formatLabel}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {f.series}
                  {running && (
                    <span className="ml-2 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                      ● Ongoing
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {f.venue}
                  {f.city ? `, ${f.city}` : ""}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
