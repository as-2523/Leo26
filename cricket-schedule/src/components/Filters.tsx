"use client";

import { TEAMS } from "../lib/teams";
import { ALL_FORMATS } from "../lib/formats";
import type { FormatCategory, TeamId } from "../lib/types";

interface FiltersProps {
  selectedTeams: Set<TeamId>;
  selectedFormats: Set<FormatCategory>;
  availableFormats: Set<FormatCategory>;
  onToggleTeam: (id: TeamId) => void;
  onToggleFormat: (f: FormatCategory) => void;
  onReset: () => void;
}

export default function Filters({
  selectedTeams,
  selectedFormats,
  availableFormats,
  onToggleTeam,
  onToggleFormat,
  onReset,
}: FiltersProps) {
  const hasActiveFilter = selectedTeams.size > 0 || selectedFormats.size > 0;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="w-16 shrink-0 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Teams
        </span>
        {TEAMS.map((team) => {
          const active = selectedTeams.size === 0 || selectedTeams.has(team.id);
          return (
            <button
              key={team.id}
              onClick={() => onToggleTeam(team.id)}
              aria-pressed={selectedTeams.has(team.id)}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition ${
                selectedTeams.has(team.id)
                  ? "border-transparent text-white"
                  : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"
              } ${active ? "" : "opacity-60"}`}
              style={selectedTeams.has(team.id) ? { backgroundColor: team.color } : undefined}
            >
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: selectedTeams.has(team.id) ? "white" : team.color }}
              />
              {team.name}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="w-16 shrink-0 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Formats
        </span>
        {ALL_FORMATS.filter((f) => availableFormats.has(f)).map((format) => (
          <button
            key={format}
            onClick={() => onToggleFormat(format)}
            aria-pressed={selectedFormats.has(format)}
            className={`rounded-full border px-3 py-1 text-sm transition ${
              selectedFormats.has(format)
                ? "border-transparent bg-slate-800 text-white"
                : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"
            }`}
          >
            {format}
          </button>
        ))}
        {hasActiveFilter && (
          <button
            onClick={onReset}
            className="ml-1 text-sm text-slate-500 underline-offset-2 hover:text-slate-800 hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}
