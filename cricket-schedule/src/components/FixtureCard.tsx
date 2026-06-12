"use client";

import { TEAM_BY_ID } from "../lib/teams";
import { formatDateIst, formatTimeIst, SOURCE_LABELS } from "../lib/display";
import type { Fixture } from "../lib/types";

/** Full-detail card used in the week view and day detail panel. */
export default function FixtureCard({ fixture }: { fixture: Fixture }) {
  const team = TEAM_BY_ID.get(fixture.teamId);
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <div className="mb-1.5 flex items-center gap-2">
        <span
          className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: team?.color }}
        />
        <span className="text-sm font-semibold text-slate-900">
          {fixture.teamName} vs {fixture.opponent}
        </span>
        <span className="ml-auto shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-600">
          {fixture.formatLabel}
        </span>
      </div>
      <div className="space-y-0.5 text-xs text-slate-600">
        <div>
          {formatDateIst(fixture.startTimeUtc)} · {formatTimeIst(fixture)}
        </div>
        <div>
          {fixture.venue}
          {fixture.city ? `, ${fixture.city}` : ""}
        </div>
        <div className="text-slate-500">{fixture.series}</div>
        {fixture.sourceUrl && (
          <a
            href={fixture.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-blue-600 hover:underline"
          >
            Schedule on {SOURCE_LABELS[fixture.source]} ↗
          </a>
        )}
      </div>
    </div>
  );
}
