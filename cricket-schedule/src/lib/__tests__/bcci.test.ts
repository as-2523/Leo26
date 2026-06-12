import { describe, expect, it } from "vitest";
import { extractBcciFixtures, isPathAllowed } from "../sources/bcci";

const PAGE_URL = "https://www.bcci.tv/international/men/fixtures";

const futureIso = (days: number) =>
  new Date(Date.now() + days * 24 * 3_600_000).toISOString();

function pageWith(data: unknown): string {
  return `<html><body><script id="__NEXT_DATA__" type="application/json">${JSON.stringify(
    data
  )}</script></body></html>`;
}

describe("extractBcciFixtures", () => {
  it("extracts a tracked-team match from embedded JSON", () => {
    const html = pageWith({
      props: {
        matches: [
          {
            teamA: { name: "India" },
            teamB: { name: "England" },
            matchDate: futureIso(20),
            venueName: "Eden Gardens, Kolkata",
            seriesName: "England tour of India",
            matchType: "ODI",
          },
        ],
      },
    });
    const out = extractBcciFixtures(html, PAGE_URL);
    expect(out).toHaveLength(1);
    expect(out[0].teamId).toBe("india-men");
    expect(out[0].opponent).toBe("England");
    expect(out[0].format).toBe("ODI");
    expect(out[0].series).toBe("England tour of India");
    expect(out[0].source).toBe("bcci");
    expect(out[0].sourceUrl).toBe(PAGE_URL);
  });

  it("ignores matches without a tracked team and past matches", () => {
    const html = pageWith({
      matches: [
        { teamA: { name: "Australia" }, teamB: { name: "England" }, matchDate: futureIso(10) },
        { teamA: { name: "India" }, teamB: { name: "England" }, matchDate: "2020-01-01T10:00:00Z" },
      ],
    });
    expect(extractBcciFixtures(html, PAGE_URL)).toHaveLength(0);
  });

  it("returns nothing for pages without parsable embedded JSON", () => {
    expect(extractBcciFixtures("<html><body>fixtures</body></html>", PAGE_URL)).toHaveLength(0);
    expect(
      extractBcciFixtures(
        '<script id="__NEXT_DATA__">not json</script>',
        PAGE_URL
      )
    ).toHaveLength(0);
  });
});

describe("isPathAllowed", () => {
  const robots = [
    "User-agent: *",
    "Disallow: /admin",
    "Disallow: /api/",
    "",
    "User-agent: SomeBot",
    "Disallow: /",
  ].join("\n");

  it("honors wildcard-group disallow rules", () => {
    expect(isPathAllowed(robots, "/admin/page")).toBe(false);
    expect(isPathAllowed(robots, "/api/data")).toBe(false);
  });

  it("allows unlisted paths and ignores other bots' groups", () => {
    expect(isPathAllowed(robots, "/international/men/fixtures")).toBe(true);
  });

  it("allows everything when robots.txt is empty", () => {
    expect(isPathAllowed("", "/anything")).toBe(true);
  });
});
