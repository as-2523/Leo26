/** A tracked Indian team shown on the dashboard. */
export type TeamId =
  | "india-men"
  | "india-a-men"
  | "india-u19-men"
  | "india-women"
  | "india-a-women";

/** Normalized format buckets used for filtering. */
export type FormatCategory =
  | "Test"
  | "ODI"
  | "T20"
  | "First-class"
  | "List A"
  | "Youth"
  | "Other";

export type SourceId = "espn" | "bcci" | "cricapi" | "seed";

export interface Fixture {
  /** Stable id derived from team/opponent/date/format. */
  id: string;
  teamId: TeamId;
  teamName: string;
  opponent: string;
  /** ISO-8601 UTC start. When the source only provides a date, this is midnight UTC. */
  startTimeUtc: string;
  /** False when the source gave a date but no start time. */
  hasStartTime: boolean;
  endTimeUtc?: string;
  format: FormatCategory;
  /** Source-level label, e.g. "Youth ODI", "WT20I", "Tour match". */
  formatLabel: string;
  series: string;
  /**
   * Series-level window when the source provides it. Needed for ongoing-
   * series detection: fixture data is upcoming-only, so a mid-tour series'
   * own dates are the only evidence that it has already begun.
   */
  seriesStartUtc?: string;
  seriesEndUtc?: string;
  venue: string;
  city?: string;
  source: SourceId;
  sourceUrl?: string;
}

export interface SourceStatus {
  id: SourceId;
  ok: boolean;
  count: number;
  error?: string;
}

export interface FixturesPayload {
  fixtures: Fixture[];
  meta: {
    generatedAt: string;
    windowStart: string;
    windowEnd: string;
    sources: SourceStatus[];
    /** True when no live source responded and bundled sample data is shown. */
    usedFallback: boolean;
  };
}
