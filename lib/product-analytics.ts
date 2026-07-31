import posthog, { type CaptureResult } from "posthog-js";

const POSTHOG_KEY =
  "phc_mKF4BaB7MLJ2KcvCU3xqCpHLZoPZ6k5ZrYQyxKD2NXor";
const POSTHOG_HOST = "https://us.i.posthog.com";
const TEST_CAPTURE_URL =
  process.env.NEXT_PUBLIC_ANALYTICS_TEST_CAPTURE_URL;
const PRODUCTION_HOST = "lovable-original-eight.vercel.app";
const VERCEL_PREVIEW_HOST = /\.vercel\.app$/;
const JOURNEY_ID_KEY = "lovable_original_journey_id";
const E2E_RUN_KEY = "lovable_original_e2e_run";
const CAPTURED_EVENTS_KEY = "lovable_original_captured_events";

const queryDerivedProperty =
  /^\$(?:initial_)?(?:utm_.+|gclid|gad_source|gbraid|wbraid|fbclid|msclkid|twclid|li_fat_id|mc_cid|igshid|ttclid|rdt_cid|dclid)$/;

type AnalyticsEnvironment = "production" | "preview" | "test";

type LearnerEventProperties = {
  course_slug?: string;
  lesson_slug?: string;
  passed?: boolean;
};

type LessonCompletedProperties = {
  courseSlug: string;
  completionState: "completed";
};

type ProjectCompletedProperties = {
  projectSlug: string;
  passedCheckCount: number;
};

type PracticeAcceptedProperties = {
  problemSlug: string;
  passedCheckCount: number;
};

type PracticeStartedProperties = {
  problemSlug: string;
};

type PracticeFeedbackProperties = {
  usefulness: string;
};

let initialized = false;
let fallbackJourneyId: string | null = null;
const fallbackCapturedEvents = new Set<string>();

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

export function sanitizeAnalyticsEvent(event: CaptureResult | null) {
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

function getAnalyticsEnvironment(): AnalyticsEnvironment | null {
  if (window.location.hostname === PRODUCTION_HOST) {
    return "production";
  }

  if (process.env.NEXT_PUBLIC_ANALYTICS_TEST === "true") {
    return "test";
  }

  if (VERCEL_PREVIEW_HOST.test(window.location.hostname)) {
    return "preview";
  }

  return null;
}

function initializePostHog() {
  if (initialized) {
    return getAnalyticsEnvironment();
  }

  const environment = getAnalyticsEnvironment();

  if (!environment) {
    return null;
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
    before_send: sanitizeAnalyticsEvent,
  });

  initialized = true;
  return environment;
}

function makeId() {
  if (typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function getJourneyId() {
  try {
    const existingId = window.sessionStorage.getItem(JOURNEY_ID_KEY);

    if (existingId) {
      return existingId;
    }

    const journeyId = makeId();
    window.sessionStorage.setItem(JOURNEY_ID_KEY, journeyId);
    return journeyId;
  } catch {
    fallbackJourneyId ??= makeId();
    return fallbackJourneyId;
  }
}

function getCapturedEvents() {
  try {
    const captured = window.sessionStorage.getItem(CAPTURED_EVENTS_KEY);
    const parsed = captured ? (JSON.parse(captured) as unknown) : [];
    return new Set(
      Array.isArray(parsed)
        ? parsed.filter((key) => typeof key === "string")
        : [],
    );
  } catch {
    return new Set(fallbackCapturedEvents);
  }
}

function rememberCapturedEvent(key: string, capturedEvents: Set<string>) {
  capturedEvents.add(key);

  try {
    window.sessionStorage.setItem(
      CAPTURED_EVENTS_KEY,
      JSON.stringify([...capturedEvents]),
    );
  } catch {
    fallbackCapturedEvents.add(key);
  }
}

function getCommonProperties(environment: AnalyticsEnvironment) {
  let e2eRun: string | null = null;

  try {
    e2eRun = window.sessionStorage.getItem(E2E_RUN_KEY);
  } catch {
    e2eRun = null;
  }

  return {
    deployment_environment: environment,
    is_test: environment !== "production",
    journey_id: getJourneyId(),
    ...(e2eRun ? { e2e_run: e2eRun } : {}),
  };
}

function capture(
  eventName:
    | "$pageview"
    | "account_created"
    | "lesson_started"
    | "lesson_completed"
    | "quiz_completed"
    | "feedback_submitted"
    | "project_completed"
    | "practice_problem_started"
    | "practice_problem_accepted"
    | "practice_feedback_submitted",
  properties: Record<string, string | number | boolean>,
) {
  const environment = initializePostHog();

  if (!environment) {
    return false;
  }

  const eventProperties = {
    ...getCommonProperties(environment),
    ...properties,
  };

  if (environment === "test" && TEST_CAPTURE_URL) {
    void fetch(TEST_CAPTURE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: eventName,
        properties: eventProperties,
      }),
    }).catch(() => undefined);
  } else {
    posthog.capture(eventName, eventProperties);
  }

  return true;
}

export function capturePublicPageview(routeName: string, pathname: string) {
  const currentUrl = `${window.location.origin}${pathname}`;

  return capture("$pageview", {
    route_name: routeName,
    pathname,
    $current_url: currentUrl,
    $pathname: pathname,
  });
}

export function captureAccountCreated() {
  return capture("account_created", {});
}

export function captureLearnerEventOnce(
  eventName: "lesson_started" | "quiz_completed" | "feedback_submitted",
  properties: LearnerEventProperties,
) {
  const dedupeKey = [
    eventName,
    properties.course_slug,
    properties.lesson_slug,
  ]
    .filter(Boolean)
    .join(":");
  const capturedEvents = getCapturedEvents();

  if (capturedEvents.has(dedupeKey)) {
    return false;
  }

  const didCapture = capture(
    eventName,
    properties as Record<string, string | number | boolean>,
  );

  if (didCapture) {
    rememberCapturedEvent(dedupeKey, capturedEvents);
  }

  return didCapture;
}

export function captureLessonCompleted({
  courseSlug,
  completionState,
}: LessonCompletedProperties) {
  const dedupeKey = `lesson_completed:${courseSlug}`;
  const capturedEvents = getCapturedEvents();

  if (capturedEvents.has(dedupeKey)) {
    return false;
  }

  const didCapture = capture("lesson_completed", {
    course_slug: courseSlug,
    completion_state: completionState,
  });

  if (didCapture) {
    rememberCapturedEvent(dedupeKey, capturedEvents);
  }

  return didCapture;
}

export function captureProjectCompleted({
  projectSlug,
  passedCheckCount,
}: ProjectCompletedProperties) {
  const dedupeKey = `project_completed:${projectSlug}`;
  const capturedEvents = getCapturedEvents();

  if (capturedEvents.has(dedupeKey)) {
    return false;
  }

  const didCapture = capture("project_completed", {
    project_slug: projectSlug,
    passed_check_count: passedCheckCount,
  });

  if (didCapture) {
    rememberCapturedEvent(dedupeKey, capturedEvents);
  }

  return didCapture;
}

export function capturePracticeProblemAccepted({
  problemSlug,
  passedCheckCount,
}: PracticeAcceptedProperties) {
  const dedupeKey = `practice_problem_accepted:${problemSlug}`;
  const capturedEvents = getCapturedEvents();

  if (capturedEvents.has(dedupeKey)) {
    return false;
  }

  const didCapture = capture("practice_problem_accepted", {
    problem_slug: problemSlug,
    passed_check_count: passedCheckCount,
  });

  if (didCapture) {
    rememberCapturedEvent(dedupeKey, capturedEvents);
  }

  return didCapture;
}

export function capturePracticeFeedbackSubmitted(
  usefulness: PracticeFeedbackProperties["usefulness"],
) {
  return capture("practice_feedback_submitted", { usefulness });
}

export function capturePracticeProblemStarted({
  problemSlug,
}: PracticeStartedProperties) {
  const dedupeKey = `practice_problem_started:${problemSlug}`;
  const capturedEvents = getCapturedEvents();

  if (capturedEvents.has(dedupeKey)) {
    return false;
  }

  const didCapture = capture("practice_problem_started", {
    problem_slug: problemSlug,
  });

  if (didCapture) {
    rememberCapturedEvent(dedupeKey, capturedEvents);
  }

  return didCapture;
}
