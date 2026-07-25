"use client";

import { usePathname } from "next/navigation";
import posthog, { type CaptureResult } from "posthog-js";
import { useEffect } from "react";

const POSTHOG_KEY =
  "phc_mKF4BaB7MLJ2KcvCU3xqCpHLZoPZ6k5ZrYQyxKD2NXor";
const POSTHOG_HOST = "https://us.i.posthog.com";
const PRODUCTION_HOST = "lovable-original-eight.vercel.app";

const publicRoutes = new Map([
  ["/", "homepage"],
  ["/about", "about"],
]);

const queryDerivedProperty =
  /^\$(?:initial_)?(?:utm_.+|gclid|gad_source|gbraid|wbraid|fbclid|msclkid|twclid|li_fat_id|mc_cid|igshid|ttclid|rdt_cid|dclid)$/;

let initialized = false;
let lastCapturedPath: string | null = null;

function stripQueryString(value: unknown) {
  if (typeof value !== "string") {
    return value;
  }

  try {
    const url = new URL(value);
    return `${url.origin}${url.pathname}`;
  } catch {
    return value.split(/[?#]/, 1)[0];
  }
}

function keepPageviewsPrivate(event: CaptureResult | null) {
  if (!event) {
    return null;
  }

  for (const property of Object.keys(event.properties ?? {})) {
    if (queryDerivedProperty.test(property)) {
      delete event.properties[property];
      continue;
    }

    if (/url|referrer/i.test(property)) {
      event.properties[property] = stripQueryString(event.properties[property]);
    }
  }

  return event;
}

function initializePostHog() {
  if (initialized || window.location.hostname !== PRODUCTION_HOST) {
    return;
  }

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    autocapture: false,
    capture_pageview: false,
    capture_pageleave: false,
    capture_exceptions: false,
    capture_performance: false,
    disable_session_recording: true,
    disable_surveys: true,
    disable_surveys_automatic_display: true,
    disable_product_tours: true,
    disable_conversations: true,
    advanced_disable_flags: true,
    person_profiles: "never",
    cookieless_mode: "always",
    before_send: keepPageviewsPrivate,
  });

  initialized = true;
}

export function PublicPageviews() {
  const pathname = usePathname();

  useEffect(() => {
    const routeName = publicRoutes.get(pathname);

    if (!routeName || lastCapturedPath === pathname) {
      return;
    }

    initializePostHog();

    if (!initialized) {
      return;
    }

    const currentUrl = `${window.location.origin}${pathname}`;

    posthog.capture("$pageview", {
      route_name: routeName,
      pathname,
      $current_url: currentUrl,
      $pathname: pathname,
    });

    lastCapturedPath = pathname;
  }, [pathname]);

  return null;
}
