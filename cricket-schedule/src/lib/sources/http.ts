/** Shared outbound-HTTP helper: identifies the app, times out, never throws raw. */

const USER_AGENT =
  "IndiaCricketScheduleDashboard/1.0 (open-source fixture aggregator; respects robots.txt and rate limits)";

const TIMEOUT_MS = 10_000;

export async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "application/json",
    },
    signal: AbortSignal.timeout(TIMEOUT_MS),
    // Source responses are cached by the aggregator, not by Next's fetch cache.
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} from ${new URL(url).hostname}`);
  }
  return (await res.json()) as T;
}
