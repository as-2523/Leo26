"use client";

import { TEAM_BY_ID } from "../lib/teams";
import { formatTimeIst } from "../lib/display";
import type { Fixture } from "../lib/types";

interface FixtureChipProps {
  fixture: Fixture;
  /** Highlighted with a bright ring when the fixture's series is in progress. */
  running?: boolean;
}

/** Compact colored chip used inside calendar day cells. */
export default function FixtureChip({ fixture, running }: FixtureChipProps) {
  const team = TEAM_BY_ID.get(fixture.teamId);
  return (
    <div
      className={`truncate rounded px-1.5 py-0.5 text-[11px] font-medium leading-4 text-white ${
        running ? "ring-2 ring-amber-300" : ""
      }`}
      style={{ backgroundColor: team?.color ?? "#475569" }}
      title={`${fixture.teamName} vs ${fixture.opponent} · ${fixture.formatLabel} · ${formatTimeIst(
        fixture
      )} · ${fixture.venue}${fixture.city ? `, ${fixture.city}` : ""} · ${fixture.series}`}
    >
      {team?.shortName} v {fixture.opponent}
    </div>
  );
}
