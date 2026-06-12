/**
 * Pre-generates public/fixtures.json for static (GitHub Pages) deployments.
 * Run by CI before `next build` with STATIC_EXPORT=1; the client then loads
 * fixtures.json instead of calling /api/fixtures. Never fails the build:
 * the aggregator falls back to bundled sample data when sources are down.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { getFixtures } from "../src/lib/aggregate";

const outFile = join(dirname(fileURLToPath(import.meta.url)), "../public/fixtures.json");

async function main() {
  const payload = await getFixtures(true);
  await mkdir(dirname(outFile), { recursive: true });
  await writeFile(outFile, JSON.stringify(payload, null, 2));

  console.log(
    `Wrote ${payload.fixtures.length} fixtures to public/fixtures.json ` +
      `(usedFallback=${payload.meta.usedFallback}; sources: ${payload.meta.sources
        .map((s) => `${s.id}=${s.ok ? s.count : "down"}`)
        .join(", ")})`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
