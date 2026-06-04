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
    ensureInit();
    if (!process.env.NEXT_PUBLIC_POSTHOG_KEY || typeof window === "undefined") return;

    let url = window.location.origin + pathname;
    const qs = searchParams?.toString();
    if (qs) url += `?${qs}`;

    posthog.capture("$pageview", { $current_url: url });
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
