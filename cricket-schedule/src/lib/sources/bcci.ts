/**
 * BCCI (bcci.tv) adapter — official fixtures pages.
 *
 * The BCCI site renders fixtures client-side from a JSON payload embedded in
 * the page (__NEXT_DATA__). Parsing that JSON is far more robust than
 * scraping markup, but the payload shape is not a published API, so the
 * extraction below is heuristic and fully defensive: anything that doesn't
 * look like a match is skipped, and any failure marks the source as down
 * without affecting other sources.
 *
 * robots.txt is fetched and honored before any page is requested; a
 * disallowed path simply skips that page.
 */
import type { Fixture } from "../types";
import { matchTrackedTeam } from "../teams";
import { normalizeFormat } from "../formats";

const BCCI_ORIGIN = "https://www.bcci.tv";

const FIXTURE_PAGES = [
  `${BCCI_ORIGIN}/international/men/fixtures`,
  `${BCCI_ORIGIN}/international/women/fixtures`,
];

const USER_AGENT =
  "IndiaCricketScheduleDashboard/1.0 (open-source fixture aggregator; respects robots.txt and rate limits)";

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "text/html,text/plain" },
    signal: AbortSignal.timeout(10_000),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${new URL(url).hostname}`);
  return res.text();
}

/** Minimal robots.txt evaluation for the wildcard user-agent group. */
export function isPathAllowed(robotsTxt: string, path: string): boolean {
  let inStarGroup = false;
  const disallows: string[] = [];
  for (const raw of robotsTxt.split("\n")) {
    const line = raw.replace(/#.*$/, "").trim();
    if (!line) continue;
    const [field, ...rest] = line.split(":");
    const value = rest.join(":").trim();
    switch (field.trim().toLowerCase()) {
      case "user-agent":
        inStarGroup = value === "*";
        break;
      case "disallow":
        if (inStarGroup && value) disallows.push(value);
        break;
    }
  }
  return !disallows.some((rule) => path.startsWith(rule));
}

interface Candidate {
  teams: string[];
  start: string;
  venue?: string;
  series?: string;
  format?: string;
}

const str = (v: unknown): string | undefined => (typeof v === "string" && v.trim() ? v : undefined);

const teamName = (v: unknown): string | undefined => {
  if (typeof v === "string") return str(v);
  if (v && typeof v === "object") {
    const o = v as Record<string, unknown>;
    return str(o.name) ?? str(o.fullName) ?? str(o.teamName);
  }
  return undefined;
};

function firstMatching(obj: Record<string, unknown>, pattern: RegExp): string | undefined {
  for (const [k, v] of Object.entries(obj)) {
    if (pattern.test(k)) {
      const s = str(v) ?? (v && typeof v === "object" ? str((v as Record<string, unknown>).name) : undefined);
      if (s) return s;
    }
  }
  return undefined;
}

/** Walk arbitrary JSON, collecting objects that plausibly describe a match. */
function harvest(node: unknown, out: Candidate[]): void {
  if (Array.isArray(node)) {
    for (const item of node) harvest(item, out);
    return;
  }
  if (!node || typeof node !== "object") return;
  const obj = node as Record<string, unknown>;

  const teams: string[] = [];
  for (const [k, v] of Object.entries(obj)) {
    if (/team/i.test(k)) {
      const name = teamName(v);
      if (name) teams.push(name);
    }
  }
  const startRaw = firstMatching(obj, /(match.*date|start.*(date|time)|date.*time|scheduledat)/i);

  if (teams.length >= 2 && startRaw) {
    out.push({
      teams,
      start: startRaw,
      venue: firstMatching(obj, /(venue|ground|stadium)/i),
      series: firstMatching(obj, /(series|tour|trophy|competition|event)/i),
      format: firstMatching(obj, /(format|match.?type)/i),
    });
  }
  for (const v of Object.values(obj)) harvest(v, out);
}

/**
 * Extract tracked-team fixtures from a BCCI fixtures page's HTML.
 * Exported separately so the heuristics are unit-testable.
 */
export function extractBcciFixtures(html: string, pageUrl: string): Fixture[] {
  const m = html.match(/<script[^>]*id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (!m) return [];
  let data: unknown;
  try {
    data = JSON.parse(m[1]);
  } catch {
    return [];
  }

  const candidates: Candidate[] = [];
  harvest(data, candidates);

  const fixtures: Fixture[] = [];
  for (const c of candidates) {
    const startDate = new Date(c.start);
    if (Number.isNaN(startDate.getTime())) continue;
    if (startDate.getTime() < Date.now() - 24 * 3_600_000) continue;

    const tracked = c.teams.map(matchTrackedTeam).find((t) => t !== null);
    if (!tracked) continue;
    const opponent = c.teams.find((n) => matchTrackedTeam(n)?.id !== tracked.id) ?? "TBC";

    const formatLabel = c.format ?? "Unknown";
    fixtures.push({
      id: "", // assigned during dedupe
      teamId: tracked.id,
      teamName: tracked.name,
      opponent,
      startTimeUtc: startDate.toISOString(),
      hasStartTime: /\d{1,2}:\d{2}/.test(c.start) || c.start.includes("T"),
      format: tracked.youth ? "Youth" : normalizeFormat(formatLabel),
      formatLabel,
      series: c.series ?? "—",
      venue: c.venue ?? "TBC",
      source: "bcci",
      sourceUrl: pageUrl,
    });
  }
  return fixtures;
}

/** Fetch and parse the BCCI fixtures pages, honoring robots.txt. */
export async function fetchBcciFixtures(): Promise<Fixture[]> {
  let robots = "";
  try {
    robots = await fetchText(`${BCCI_ORIGIN}/robots.txt`);
  } catch {
    // A missing/unreachable robots.txt is treated as no restrictions,
    // matching the standard convention for 404s.
    robots = "";
  }

  const results = await Promise.allSettled(
    FIXTURE_PAGES.filter((url) => isPathAllowed(robots, new URL(url).pathname)).map(
      async (url) => extractBcciFixtures(await fetchText(url), url)
    )
  );

  const fixtures = results
    .filter((r): r is PromiseFulfilledResult<Fixture[]> => r.status === "fulfilled")
    .flatMap((r) => r.value);

  if (fixtures.length === 0 && results.every((r) => r.status === "rejected")) {
    const first = results[0] as PromiseRejectedResult | undefined;
    throw new Error(first ? String(first.reason) : "All BCCI pages unreachable");
  }
  return fixtures;
}
