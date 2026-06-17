"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import posthog from "posthog-js";

let initialized = false;

function ensureInit() {
  if (initialized || typeof window === "undefined") return;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return;

  posthog.init(key, {
    // Proxied through our domain (see next.config.js rewrites) to dodge ad-blockers.
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "/ingest",
    ui_host: "https://us.posthog.com",
    // We capture pageviews manually below because the App Router does not trigger
    // full page loads on client-side navigation.
    capture_pageview: false,
    capture_pageleave: true,
    person_profiles: "identified_only",
  });
  initialized = true;
}

function PageviewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const qs = searchParams?.toString();
    const url = window.location.origin + pathname + (qs ? `?${qs}` : "");

    // GA4 — fired INDEPENDENTLY of PostHog (must not depend on PostHog being
    // configured/healthy, or the metric we're fixing silently records zero).
    // GA4 config sets send_page_view:false, so this manual fire on first render
    // + every client route change = exactly one pageview, fixing the UV>PV
    // undercount from missing SPA pageviews.
    if ((window as any).gtag) {
      (window as any).gtag("event", "page_view", {
        page_path: pathname + (qs ? `?${qs}` : ""),
        page_location: url,
      });
    }

    // PostHog — only when configured.
    ensureInit();
    if (process.env.NEXT_PUBLIC_POSTHOG_KEY) {
      posthog.capture("$pageview", { $current_url: url });
    }
  }, [pathname, searchParams]);

  return null;
}

export function PostHogAnalytics() {
  // useSearchParams must live inside a Suspense boundary in the App Router.
  return (
    <Suspense fallback={null}>
      <PageviewTracker />
    </Suspense>
  );
}
