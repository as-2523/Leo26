"use client";

import { useMemo } from "react";
import type { Fixture } from "../lib/types";
import { groupBySeries } from "../lib/series";
import { TEAM_BY_ID } from "../lib/teams";
import { formatDateIst, formatTimeIst } from "../lib/display";

export default function SeriesView({ fixtures }: { fixtures: Fixture[] }) {
  const groups = useMemo(() => groupBySeries(fixtures), [fixtures]);

  if (groups.length === 0) {
    return (
      <p className="rounded-lg border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
        No series match the current filters.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {groups.map((g) => (
        <section
          key={g.name}
          className={`overflow-hidden rounded-lg border bg-white shadow-sm ${
            g.running ? "border-emerald-400 ring-1 ring-emerald-300" : "border-slate-200"
          }`}
        >
          <header className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-slate-100 px-4 py-3">
            <h3 className="text-sm font-semibold text-slate-900">{g.name}</h3>
            {g.running && (
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
                ● Ongoing
              </span>
            )}
            <span className="ml-auto text-xs text-slate-500">
              {formatDateIst(g.start)}
              {g.end !== g.start && ` – ${formatDateIst(g.end)}`}
            </span>
          </header>
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-4 py-2">
            {g.teamIds.map((id) => {
              const team = TEAM_BY_ID.get(id);
              return (
                <span
                  key={id}
                  className="flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
                  style={{ backgroundColor: team?.color }}
                >
                  {team?.name}
                </span>
              );
            })}
            {g.formatLabels.map((fmt) => (
              <span
                key={fmt}
                className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-600"
              >
                {fmt}
              </span>
            ))}
            <span className="ml-auto text-xs text-slate-400">
              {g.fixtures.length} match{g.fixtures.length === 1 ? "" : "es"}
            </span>
          </div>
          <ul className="divide-y divide-slate-100">
            {g.fixtures.map((f, i) => (
              <li key={f.id} className="flex flex-wrap items-center gap-x-3 gap-y-0.5 px-4 py-2.5 text-sm">
                <span className="w-6 shrink-0 text-xs font-semibold text-slate-400">{i + 1}.</span>
                <span
                  className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: TEAM_BY_ID.get(f.teamId)?.color }}
                />
                <span className="font-medium text-slate-900">
                  {f.teamName} vs {f.opponent}
                </span>
                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-600">
                  {f.formatLabel}
                </span>
                <span className="text-xs text-slate-500">
                  {formatDateIst(f.startTimeUtc)} · {formatTimeIst(f)}
                </span>
                <span className="text-xs text-slate-400">
                  {f.venue}
                  {f.city ? `, ${f.city}` : ""}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
