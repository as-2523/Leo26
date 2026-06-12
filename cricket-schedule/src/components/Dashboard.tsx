"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import type { FixturesPayload, FormatCategory, TeamId } from "../lib/types";
import Filters from "./Filters";
import CalendarView from "./CalendarView";
import FixtureTable from "./FixtureTable";
import { formatDateIst } from "../lib/display";

// Leaflet reads `window` at import time, so the map must never be prerendered.
const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => (
    <div className="rounded-lg border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
      Loading map…
    </div>
  ),
});

type ViewMode = "month" | "week" | "table" | "map";

const REFRESH_INTERVAL_MS = 30 * 60 * 1000;

const VIEWS: { id: ViewMode; label: string }[] = [
  { id: "month", label: "Month" },
  { id: "week", label: "Week" },
  { id: "table", label: "Table" },
  { id: "map", label: "Map" },
];

// Static deployments (GitHub Pages) have no API route; CI pre-generates
// fixtures.json on a schedule instead. Both env vars are inlined at build.
const STATIC_DATA = process.env.NEXT_PUBLIC_STATIC_DATA === "1";
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

async function fetchFixtures(force: boolean): Promise<FixturesPayload> {
  const url = STATIC_DATA
    ? `${BASE_PATH}/fixtures.json`
    : `/api/fixtures${force ? "?force=1" : ""}`;
  const res = await fetch(url, STATIC_DATA ? { cache: "no-cache" } : undefined);
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return (await res.json()) as FixturesPayload;
}

export default function Dashboard() {
  const [payload, setPayload] = useState<FixturesPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewMode>("month");
  const [selectedTeams, setSelectedTeams] = useState<Set<TeamId>>(new Set());
  const [selectedFormats, setSelectedFormats] = useState<Set<FormatCategory>>(new Set());

  // State updates happen only after the fetch settles, so background
  // refreshes never flash the loading state.
  const load = useCallback((force = false) => {
    fetchFixtures(force)
      .then((data) => {
        setPayload(data);
        setError(null);
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : "Failed to load fixtures");
      })
      .finally(() => setLoading(false));
  }, []);

  const refresh = useCallback(() => {
    setLoading(true);
    load(true);
  }, [load]);

  useEffect(() => {
    load();
    const timer = setInterval(() => load(), REFRESH_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [load]);

  const availableFormats = useMemo(() => {
    const s = new Set<FormatCategory>();
    for (const f of payload?.fixtures ?? []) s.add(f.format);
    return s;
  }, [payload]);

  const filtered = useMemo(() => {
    const fixtures = payload?.fixtures ?? [];
    return fixtures.filter(
      (f) =>
        (selectedTeams.size === 0 || selectedTeams.has(f.teamId)) &&
        (selectedFormats.size === 0 || selectedFormats.has(f.format))
    );
  }, [payload, selectedTeams, selectedFormats]);

  const toggle = <T,>(set: Set<T>, value: T): Set<T> => {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    return next;
  };

  return (
    <div className="space-y-4">
      {payload?.meta.usedFallback && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <strong>Sample data.</strong> Live fixture sources are currently unreachable, so
          illustrative sample fixtures are shown.{" "}
          {STATIC_DATA
            ? "Live sources are retried automatically when the site data is next regenerated."
            : "The dashboard retries live sources automatically every 30 minutes."}
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-900">
          Could not load fixtures: {error}{" "}
          <button onClick={() => load()} className="font-semibold underline underline-offset-2">
            Retry
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <Filters
          selectedTeams={selectedTeams}
          selectedFormats={selectedFormats}
          availableFormats={availableFormats}
          onToggleTeam={(id) => setSelectedTeams((s) => toggle(s, id))}
          onToggleFormat={(f) => setSelectedFormats((s) => toggle(s, f))}
          onReset={() => {
            setSelectedTeams(new Set());
            setSelectedFormats(new Set());
          }}
        />
        <div className="flex items-center gap-3">
          <div className="flex overflow-hidden rounded-lg border border-slate-300" role="tablist">
            {VIEWS.map((v) => (
              <button
                key={v.id}
                role="tab"
                aria-selected={view === v.id}
                onClick={() => setView(v.id)}
                className={`px-3.5 py-1.5 text-sm font-medium transition ${
                  view === v.id ? "bg-slate-900 text-white" : "bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
          <button
            onClick={refresh}
            disabled={loading}
            className="rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </div>

      {loading && !payload ? (
        <div className="rounded-lg border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
          Loading fixtures…
        </div>
      ) : payload ? (
        <>
          {view === "table" ? (
            <FixtureTable fixtures={filtered} />
          ) : view === "map" ? (
            <MapView
              fixtures={filtered}
              windowStart={payload.meta.windowStart}
              windowEnd={payload.meta.windowEnd}
            />
          ) : (
            <CalendarView
              fixtures={filtered}
              mode={view}
              windowStart={payload.meta.windowStart}
              windowEnd={payload.meta.windowEnd}
            />
          )}
          <p className="text-xs text-sky-50/80">
            Showing {filtered.length} of {payload.fixtures.length} fixtures from{" "}
            {formatDateIst(payload.meta.windowStart)} to {formatDateIst(payload.meta.windowEnd)} ·
            sources:{" "}
            {payload.meta.sources
              .map((s) => `${s.id} (${s.ok ? `${s.count} fixtures` : s.error ?? "error"})`)
              .join(" · ")}{" "}
            · updated {new Date(payload.meta.generatedAt).toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata" })} IST
          </p>
        </>
      ) : null}
    </div>
  );
}
