"use client";

import { useEffect, useMemo, useState } from "react";
import { addMonths, format, startOfMonth } from "date-fns";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import type { LatLngBoundsExpression } from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Fixture } from "../lib/types";
import { TEAM_BY_ID } from "../lib/teams";
import { locateFixture, type GeoPoint } from "../lib/geo";
import { formatDateIst, formatTimeIst, istDayKey } from "../lib/display";

interface MapViewProps {
  fixtures: Fixture[];
  windowStart: string;
  windowEnd: string;
}

interface VenueGroup {
  point: GeoPoint;
  city: string;
  fixtures: Fixture[];
}

/** Refit the map whenever the plotted venues change. */
function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 1) {
      map.setView(points[0], 6);
    } else if (points.length > 1) {
      map.fitBounds(points as LatLngBoundsExpression, { padding: [40, 40], maxZoom: 7 });
    }
  }, [map, points]);
  return null;
}

export default function MapView({ fixtures, windowStart, windowEnd }: MapViewProps) {
  const [anchor, setAnchor] = useState(() => startOfMonth(new Date()));
  const monthKey = format(anchor, "yyyy-MM");

  const monthFixtures = useMemo(
    () => fixtures.filter((f) => istDayKey(f.startTimeUtc).startsWith(monthKey)),
    [fixtures, monthKey]
  );

  const { groups, unmapped } = useMemo(() => {
    const byCity = new Map<string, VenueGroup>();
    const missing: Fixture[] = [];
    for (const f of monthFixtures) {
      const point = locateFixture(f);
      if (!point) {
        missing.push(f);
        continue;
      }
      const key = `${point.lat},${point.lng}`;
      const group = byCity.get(key);
      if (group) group.fixtures.push(f);
      else byCity.set(key, { point, city: f.city ?? f.venue, fixtures: [f] });
    }
    return { groups: [...byCity.values()], unmapped: missing };
  }, [monthFixtures]);

  const points = useMemo(
    () => groups.map((g): [number, number] => [g.point.lat, g.point.lng]),
    [groups]
  );

  const canGoBack = anchor > startOfMonth(new Date(windowStart));
  const canGoForward = anchor < startOfMonth(new Date(windowEnd));

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white drop-shadow-sm">
          Match venues — {format(anchor, "MMMM yyyy")}
        </h2>
        <div className="flex gap-1">
          <button
            onClick={() => setAnchor((a) => addMonths(a, -1))}
            disabled={!canGoBack}
            aria-label="Previous month"
            className="rounded-md border border-slate-300 bg-white px-3 py-1 text-sm hover:bg-slate-50 disabled:opacity-40"
          >
            ←
          </button>
          <button
            onClick={() => setAnchor(startOfMonth(new Date()))}
            className="rounded-md border border-slate-300 bg-white px-3 py-1 text-sm hover:bg-slate-50"
          >
            This month
          </button>
          <button
            onClick={() => setAnchor((a) => addMonths(a, 1))}
            disabled={!canGoForward}
            aria-label="Next month"
            className="rounded-md border border-slate-300 bg-white px-3 py-1 text-sm hover:bg-slate-50 disabled:opacity-40"
          >
            →
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <MapContainer
          center={[21.0, 78.0]}
          zoom={4}
          scrollWheelZoom={true}
          style={{ height: "540px", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitBounds points={points} />
          {groups.map((g) => {
            const teamIds = [...new Set(g.fixtures.map((f) => f.teamId))];
            const color =
              teamIds.length === 1 ? (TEAM_BY_ID.get(teamIds[0])?.color ?? "#334155") : "#334155";
            return (
              <CircleMarker
                key={`${g.point.lat},${g.point.lng}`}
                center={[g.point.lat, g.point.lng]}
                radius={9 + Math.min(g.fixtures.length, 5)}
                pathOptions={{ color: "#ffffff", weight: 2, fillColor: color, fillOpacity: 0.9 }}
              >
                <Popup>
                  <div className="min-w-52">
                    <div className="mb-1 font-semibold">{g.city}</div>
                    {g.fixtures.map((f) => (
                      <div key={f.id} className="mb-1.5 text-xs leading-snug">
                        <span
                          className="mr-1 inline-block h-2 w-2 rounded-full align-middle"
                          style={{ backgroundColor: TEAM_BY_ID.get(f.teamId)?.color }}
                        />
                        <strong>
                          {f.teamName} vs {f.opponent}
                        </strong>{" "}
                        ({f.formatLabel})
                        <br />
                        {formatDateIst(f.startTimeUtc)} · {formatTimeIst(f)}
                        <br />
                        {f.venue}
                      </div>
                    ))}
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>

      <p className="mt-2 text-xs text-sky-50/80">
        {monthFixtures.length === 0
          ? "No matches scheduled for the tracked teams this month."
          : `${monthFixtures.length} match${monthFixtures.length === 1 ? "" : "es"} at ${groups.length} venue${groups.length === 1 ? "" : "s"} this month — click a marker for details. Marker color = team (grey when multiple teams share a venue).`}
      </p>

      {unmapped.length > 0 && (
        <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-600">
          <strong className="text-slate-800">Not on the map</strong> (venue location unknown):{" "}
          {unmapped
            .map((f) => `${f.teamName} vs ${f.opponent} at ${f.venue} (${formatDateIst(f.startTimeUtc)})`)
            .join("; ")}
        </div>
      )}
    </div>
  );
}
