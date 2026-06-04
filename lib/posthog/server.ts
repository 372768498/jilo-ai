import { PostHog } from "posthog-node";
import type { NextRequest } from "next/server";

let client: PostHog | null = null;

function getClient(): PostHog | null {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return null;

  if (!client) {
    client = new PostHog(key, {
      // Server talks to PostHog directly (not the /ingest proxy, which is browser-only).
      host: process.env.POSTHOG_HOST || "https://us.i.posthog.com",
      // Serverless-friendly: send each event right away instead of batching.
      flushAt: 1,
      flushInterval: 0,
    });
  }
  return client;
}

/**
 * Reads the PostHog distinct_id that posthog-js stored in the browser cookie, so a
 * server-side conversion event ties back to the same visitor's pageviews (funnels work).
 * Returns null when PostHog is unconfigured or the visitor has no PostHog cookie yet.
 */
function getDistinctId(request: NextRequest): string | null {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return null;

  const cookie = request.cookies.get(`ph_${key}_posthog`);
  if (!cookie?.value) return null;

  try {
    const data = JSON.parse(cookie.value) as { distinct_id?: string };
    return data.distinct_id || null;
  } catch {
    return null;
  }
}

/**
 * Fire-and-(awaited)-flush a server-side event. Never throws — analytics must not
 * break the outbound redirect. Returns silently when PostHog is not configured.
 */
export async function captureServerEvent(
  request: NextRequest,
  event: string,
  properties: Record<string, unknown>,
): Promise<void> {
  const ph = getClient();
  if (!ph) return;

  // An anonymous event (no person profile) when we can't link to a known visitor.
  const distinctId = getDistinctId(request);

  try {
    ph.capture({
      distinctId: distinctId || `anon_${crypto.randomUUID()}`,
      event,
      properties: {
        ...properties,
        // Keep anonymous hits from inflating the person count when uncorrelated.
        $process_person_profile: Boolean(distinctId),
      },
    });
    await ph.flush();
  } catch (error) {
    console.error("posthog_capture_failed", error instanceof Error ? error.message : error);
  }
}
