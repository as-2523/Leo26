import { NextRequest, NextResponse } from "next/server";
import { getFixtures } from "../../../lib/aggregate";

// Route handlers run at request time by default in Next 16; fixture data is
// served from the aggregator's own in-process cache.
export async function GET(request: NextRequest) {
  const force = request.nextUrl.searchParams.get("force") === "1";
  try {
    const payload = await getFixtures(force);
    return NextResponse.json(payload, {
      headers: {
        // Let CDNs/browsers reuse responses briefly; the server cache is 30 min.
        "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load fixtures" },
      { status: 502 }
    );
  }
}
