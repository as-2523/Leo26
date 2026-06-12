/**
 * Pre-generates public/fixtures.json for static (GitHub Pages) deployments.
 * Run by CI before `next build` with STATIC_EXPORT=1; the client then loads
 * fixtures.json instead of calling /api/fixtures. Never fails the build:
 * the aggregator falls back to bundled sample data when sources are down.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { getFixtures } from "../src/lib/aggregate";
import { choosePayload } from "../src/lib/preserve";
import type { FixturesPayload } from "../src/lib/types";

const outFile = join(dirname(fileURLToPath(import.meta.url)), "../public/fixtures.json");

/** Previously published fixtures.json (fetched by CI), for the quality gate. */
async function readPrevious(): Promise<FixturesPayload | null> {
  const path = process.env.PREVIOUS_FIXTURES_FILE;
  if (!path) return null;
  try {
    return JSON.parse(await readFile(path, "utf8")) as FixturesPayload;
  } catch {
    return null;
  }
}

async function main() {
  const fresh = await getFixtures(true);
  const previous = await readPrevious();
  const { payload, preserved } = choosePayload(fresh, previous);
  if (preserved) {
    console.warn(
      `[warn] Fresh pull looks degraded (${fresh.fixtures.length} fixtures vs ` +
        `${payload.fixtures.length} previously published; sources: ${fresh.meta.sources
          .map((s) => `${s.id}=${s.ok ? s.count : s.error ?? "down"}`)
          .join(", ")}). Keeping previously published data.`
    );
  }
  await mkdir(dirname(outFile), { recursive: true });
  await writeFile(outFile, JSON.stringify(payload, null, 2));

  console.log(
    `Wrote ${payload.fixtures.length} fixtures to public/fixtures.json ` +
      `(usedFallback=${payload.meta.usedFallback}; sources: ${payload.meta.sources
        .map((s) => `${s.id}=${s.ok ? s.count : "down"}`)
        .join(", ")})`
  );

  // Coverage self-check: report fixtures per month across the window and
  // flag empty months, so refresh logs make data gaps obvious.
  const counts = new Map<string, number>();
  for (const f of payload.fixtures) {
    const month = f.startTimeUtc.slice(0, 7);
    counts.set(month, (counts.get(month) ?? 0) + 1);
  }
  const months: string[] = [];
  const cursor = new Date(payload.meta.windowStart);
  const end = new Date(payload.meta.windowEnd);
  while (cursor <= end) {
    months.push(cursor.toISOString().slice(0, 7));
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  console.log(
    `Coverage by month: ${months.map((m) => `${m}=${counts.get(m) ?? 0}`).join(", ")}`
  );
  const empty = months.filter((m) => !counts.get(m));
  if (empty.length > 0) {
    console.warn(
      `[warn] No fixtures found for: ${empty.join(", ")}. ` +
        "Either upstream sources have not published schedules that far out, " +
        "or source coverage needs attention (see README data sources)."
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
