import { randomBytes } from "node:crypto";
import { spawn } from "node:child_process";

import postgres from "postgres";
import { elementTextByAttribute } from "./release-gate-html.mjs";

const COURSE_TITLE = "Web Development Foundations";
const COURSE_SLUG = "web-development-foundations";
const LESSON_SLUG = "semantic-html";
const SECOND_LESSON_SLUG = "css-selectors-box-model";
const PROJECT_SLUG = "semantic-html-article";
const LESSON_TITLE = "Build a page the browser understands";
const SECOND_LESSON_TITLE = "Style a card without guessing";
const CSS_CHALLENGES = [
  {
    slug: "class-selector",
    title: "Select one card",
    passedChecks: 3,
    completedCss: (runId) => `.learning-card {
  background: #ffffff;
  color: #17231e;
  --release-gate: "${runId}";
}`,
  },
  {
    slug: "descendant-selector",
    title: "Scope the lesson count",
    passedChecks: 3,
    completedCss: (runId) => `.learning-card strong {
  color: #175437;
  font-weight: 700;
  --release-gate: "${runId}";
}`,
  },
  {
    slug: "predictable-width",
    title: "Keep the width predictable",
    passedChecks: 3,
    completedCss: (runId) => `.learning-card {
  width: 280px;
  box-sizing: border-box;
  border: 2px solid #287652;
  --release-gate: "${runId}";
}`,
  },
  {
    slug: "inside-and-between",
    title: "Separate inside from between",
    passedChecks: 3,
    completedCss: (runId) => `.learning-card {
  padding: 24px;
  --release-gate: "${runId}";
}

.learning-card p { margin-top: 12px; }`,
  },
  {
    slug: "link-hit-area",
    title: "Build a clear link target",
    passedChecks: 4,
    completedCss: (runId) => `.learning-card .card-link {
  display: inline-block;
  padding: 12px 16px;
  border-radius: 8px;
  --release-gate: "${runId}";
}`,
  },
  {
    slug: "centered-card",
    title: "Center a reusable card",
    passedChecks: 3,
    completedCss: (runId) => `.stage .learning-card {
  max-width: 280px;
  margin-inline: auto;
  --release-gate: "${runId}";
}`,
  },
];
const INTERVIEW_DRILL_SLUG = "javascript-fundamentals";
const INTERVIEW_QUESTION_SLUG = "const-let-var";
const CERTIFICATE_TITLE = "Private course certificate";
const QUIZ_ANSWERS = {
  "main-landmark": "main",
  "heading-order": "h2",
  "article-choice": "standalone",
  "semantic-benefit": "meaning",
};
const SECOND_QUIZ_ANSWERS = {
  "class-selector": "class",
  "descendant-selector": "nested-strong",
  "box-width": "whole-box",
  "spacing-choice": "padding",
};
const DEFAULT_APP_URL = "http://127.0.0.1:3210";
const DATABASE_PREFIX = "lovable_release_gate_";
const WAIT_TIMEOUT_MS = 60_000;

const steps = [
  "Account creation",
  "Initial dashboard",
  "Two lesson workspaces",
  "Two workspace saves and checks",
  "Quiz, project, feedback, certificate, and interview",
  "Saved learner state after reload",
  "Sign out",
  "Protected access",
  "Sign in and restored learner state",
  "Learner data ownership",
];

class StepFailure extends Error {
  constructor(step, message) {
    super(message);
    this.name = "StepFailure";
    this.step = step;
  }
}

class CookieJar {
  #cookies = new Map();

  update(response) {
    for (const cookie of response.headers.getSetCookie()) {
      const [pair, ...attributes] = cookie.split(";");
      const separator = pair.indexOf("=");

      if (separator < 1) {
        continue;
      }

      const name = pair.slice(0, separator).trim();
      const value = pair.slice(separator + 1).trim();
      const expired = attributes.some((attribute) =>
        /^max-age=0$/i.test(attribute.trim()),
      );

      if (!value || expired) {
        this.#cookies.delete(name);
      } else {
        this.#cookies.set(name, value);
      }
    }
  }

  header() {
    return [...this.#cookies]
      .map(([name, value]) => `${name}=${value}`)
      .join("; ");
  }
}

function getOption(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? null : process.argv[index + 1] ?? null;
}

function getAppUrl() {
  const rawUrl =
    getOption("--app-url") ??
    process.env.LEARNER_GATE_APP_URL?.trim() ??
    DEFAULT_APP_URL;
  let appUrl;

  try {
    appUrl = new URL(rawUrl);
  } catch {
    throw new Error("--app-url must be a valid loopback HTTP URL.");
  }

  const isLoopback = ["127.0.0.1", "localhost", "::1"].includes(appUrl.hostname);

  if (
    appUrl.protocol !== "http:" ||
    !isLoopback ||
    appUrl.username ||
    appUrl.password ||
    (appUrl.pathname !== "/" && appUrl.pathname !== "")
  ) {
    throw new Error(
      "--app-url must be a root loopback HTTP URL so the gate cannot mutate a hosted environment.",
    );
  }

  appUrl.pathname = "/";
  appUrl.search = "";
  appUrl.hash = "";
  return appUrl;
}

function getAdminDatabaseUrl() {
  const rawUrl =
    process.env.LEARNER_GATE_DATABASE_URL?.trim() ??
    process.env.DATABASE_URL?.trim();

  if (!rawUrl) {
    throw new Error(
      "LEARNER_GATE_DATABASE_URL is required to create the isolated test database.",
    );
  }

  let databaseUrl;

  try {
    databaseUrl = new URL(rawUrl);
  } catch {
    throw new Error(
      "LEARNER_GATE_DATABASE_URL must be a valid PostgreSQL connection URL.",
    );
  }

  if (
    !["postgres:", "postgresql:"].includes(databaseUrl.protocol) ||
    !databaseUrl.hostname ||
    databaseUrl.pathname === "/"
  ) {
    throw new Error(
      "LEARNER_GATE_DATABASE_URL must identify a PostgreSQL host and database.",
    );
  }

  return rawUrl;
}

function databaseUrlFor(adminDatabaseUrl, databaseName) {
  const isolatedUrl = new URL(adminDatabaseUrl);
  isolatedUrl.pathname = `/${databaseName}`;
  return isolatedUrl.toString();
}

function safeMessage(error) {
  if (error instanceof StepFailure) {
    return error.message;
  }

  return "The gate could not finish. Review the named stage without printing credentials or connection details.";
}

function assertStep(condition, step, message) {
  if (!condition) {
    throw new StepFailure(step, message);
  }
}

function pageText(html) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&middot;|&#xb7;|&#183;/gi, "·")
    .replace(/&#x2f;|&#47;/gi, "/")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#x27;|&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function attributeValue(tag, attribute) {
  const match = tag.match(
    new RegExp(`\\b${attribute}\\s*=\\s*(["'])(.*?)\\1`, "i"),
  );

  return match?.[2]?.trim() ?? null;
}

function metaContent(html, name) {
  return [...html.matchAll(/<meta\b[^>]*>/gi)]
    .map(([tag]) => ({
      name: attributeValue(tag, "name"),
      content: attributeValue(tag, "content"),
    }))
    .filter((meta) => meta.name?.toLowerCase() === name.toLowerCase())
    .map((meta) => meta.content);
}

function streamedRedirectLocation(html) {
  for (const [tag] of html.matchAll(/<meta\b[^>]*>/gi)) {
    if (attributeValue(tag, "http-equiv")?.toLowerCase() !== "refresh") {
      continue;
    }

    const content = attributeValue(tag, "content");
    const location = content?.match(/^\s*\d+\s*;\s*url=(.+)$/i)?.[1];

    if (location) {
      return location.replace(/&amp;/gi, "&").trim();
    }
  }

  return "";
}

function childOutput(env, args) {
  return new Promise((resolve, reject) => {
    const processHandle = spawn(process.execPath, args, {
      env,
      stdio: ["ignore", "ignore", "pipe"],
    });
    let stderr = "";

    processHandle.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
      stderr = stderr.slice(-4_000);
    });
    processHandle.on("error", reject);
    processHandle.on("exit", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(stderr));
      }
    });
  });
}

async function createIsolatedDatabase(adminSql, databaseName) {
  await adminSql.unsafe(`create database "${databaseName}"`);
}

async function dropIsolatedDatabase(adminSql, databaseName) {
  if (!databaseName.startsWith(DATABASE_PREFIX)) {
    throw new Error("Refusing to drop a database outside the release-gate prefix.");
  }

  await adminSql`
    select pg_terminate_backend(pid)
    from pg_stat_activity
    where datname = ${databaseName}
      and pid <> pg_backend_pid()
  `;
  await adminSql.unsafe(`drop database if exists "${databaseName}"`);
}

async function waitForApp(baseUrl, child) {
  const deadline = Date.now() + WAIT_TIMEOUT_MS;

  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error("The local application exited before the gate began.");
    }

    try {
      const response = await fetch(new URL("/account", baseUrl), {
        signal: AbortSignal.timeout(2_000),
      });

      if (response.ok) {
        return;
      }
    } catch {
      // The application is still starting.
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error("The local application did not become ready within 60 seconds.");
}

function startApp(appUrl, env) {
  const port = appUrl.port || "80";
  const appProcess = spawn(
    process.execPath,
    [
      "node_modules/next/dist/bin/next",
      "start",
      "--hostname",
      appUrl.hostname,
      "--port",
      port,
    ],
    {
      detached: true,
      env,
      stdio: ["ignore", "ignore", "pipe"],
    },
  );
  appProcess.runtimeStderr = "";
  appProcess.stderr.on("data", (chunk) => {
    appProcess.runtimeStderr += chunk.toString();
    appProcess.runtimeStderr = appProcess.runtimeStderr.slice(-4_000);
  });
  return appProcess;
}

async function stopApp(child) {
  if (!child || child.exitCode !== null) {
    return;
  }

  try {
    process.kill(-child.pid, "SIGTERM");
  } catch {
    return;
  }

  await Promise.race([
    new Promise((resolve) => child.once("exit", resolve)),
    new Promise((resolve) => setTimeout(resolve, 5_000)),
  ]);

  if (child.exitCode === null) {
    try {
      process.kill(-child.pid, "SIGKILL");
    } catch {
      // The process ended between the status check and the signal.
    }
  }
}

async function runJourney(baseUrl, databaseUrl) {
  const jar = new CookieJar();
  const runId = randomBytes(8).toString("hex");
  const email = `release-gate-${runId}@example.test`;
  const password = `${randomBytes(24).toString("hex")}Aa1!`;
  const forcedFailure = process.env.LEARNER_GATE_TEST_FAIL_STEP?.trim();
  let savedWorkspaceHtml = "";
  let savedCssWorkspace = "";
  const savedCssChallenges = new Map();
  let savedProjectHtml = "";
  let savedFeedbackComment = "";
  let savedLessonNote = "";
  let savedInterviewAnswer = "";
  let savedCertificateName = "";
  let savedCertificateId = "";
  let savedCertificateAwardedAt = "";
  let learnerUserId = "";
  let savedCodingSubmissionId = "";
  let savedCodingSubmissionSource = "";
  let revisedCodingDraft = "";

  async function request(path, options = {}, requestJar = jar) {
    const headers = new Headers(options.headers);
    const cookie = requestJar.header();

    headers.set("Origin", baseUrl.origin);
    if (cookie) {
      headers.set("Cookie", cookie);
    }

    const response = await fetch(new URL(path, baseUrl), {
      ...options,
      headers,
      redirect: options.redirect ?? "manual",
      signal: AbortSignal.timeout(15_000),
    });
    requestJar.update(response);
    return response;
  }

  async function jsonRequest(path, body, requestJar = jar) {
    return request(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }, requestJar);
  }

  async function runStep(number, action) {
    const step = steps[number - 1];

    try {
      await action(step);
      assertStep(
        forcedFailure !== String(number),
        step,
        "Deliberate assertion failure.",
      );
      console.log(`PASS ${number}/${steps.length} ${step}`);
    } catch (error) {
      if (error instanceof StepFailure) {
        throw error;
      }
      throw new StepFailure(step, "Unexpected response from the learner journey.");
    }
  }

  await runStep(1, async (step) => {
    const response = await jsonRequest("/api/auth/sign-up/email", {
      name: "Release Gate Student",
      email,
      password,
      callbackURL: "/dashboard",
    });
    assertStep(response.status === 200, step, "Account creation did not succeed.");
    const payload = await response.json();
    assertStep(Boolean(payload.user?.id), step, "Account creation returned no user.");
    learnerUserId = payload.user.id;
    assertStep(Boolean(jar.header()), step, "Account creation returned no session.");
  });

  await runStep(2, async (step) => {
    const response = await request("/dashboard");
    const text = pageText(await response.text());
    assertStep(response.status === 200, step, "Dashboard did not load.");
    assertStep(text.includes(COURSE_TITLE), step, "First course was not visible.");
    assertStep(
      /Start here\s*·\s*34 minutes/.test(text),
      step,
      "Initial progress was not ready for both lessons.",
    );
    assertStep(
      text.includes("Certificate settings") &&
        text.includes("Certificate requirements"),
      step,
      "Private certificate entry points were not visible.",
    );
  });

  await runStep(3, async (step) => {
    const response = await request(
      `/learn/${COURSE_SLUG}/${LESSON_SLUG}`,
    );
    const text = pageText(await response.text());
    assertStep(response.status === 200, step, "Lesson did not load.");
    assertStep(text.includes(LESSON_TITLE), step, "Lesson title was not visible.");
    assertStep(
      /75\s*%\s*to complete/.test(text),
      step,
      "Lesson quiz was not ready.",
    );

    const workspaceResponse = await request(
      `/api/lessons/${LESSON_SLUG}/workspace`,
    );
    assertStep(
      workspaceResponse.status === 200,
      step,
      "Lesson workspace did not load.",
    );
    const workspace = await workspaceResponse.json();
    assertStep(
      workspace.saved === false,
      step,
      "A fresh learner did not receive a fresh workspace.",
    );
    assertStep(
      workspace.submission === null,
      step,
      "A fresh learner inherited an assignment submission.",
    );
    assertStep(
      typeof workspace.html === "string" && workspace.checks?.length === 5,
      step,
      "Starter code and five checks were not ready.",
    );

    const secondLessonResponse = await request(
      `/learn/${COURSE_SLUG}/${SECOND_LESSON_SLUG}`,
    );
    const secondLessonText = pageText(await secondLessonResponse.text());
    assertStep(
      secondLessonResponse.status === 200 &&
        secondLessonText.includes(SECOND_LESSON_TITLE) &&
        /75\s*%\s*to complete/.test(secondLessonText),
      step,
      "The second lesson and its recall check did not load.",
    );

    const secondWorkspaceResponse = await request(
      `/api/lessons/${SECOND_LESSON_SLUG}/workspace`,
    );
    assertStep(
      secondWorkspaceResponse.status === 200,
      step,
      "The second lesson workspace did not load.",
    );
    const secondWorkspace = await secondWorkspaceResponse.json();
    assertStep(
      secondWorkspace.saved === false &&
        secondWorkspace.submission === null &&
        typeof secondWorkspace.html === "string" &&
        secondWorkspace.checks?.length === 4,
      step,
      "A fresh learner did not receive the four-check CSS workspace.",
    );

    const practicePageResponse = await request("/practice/css");
    const practicePageText = pageText(await practicePageResponse.text());
    assertStep(
      practicePageResponse.status === 200 &&
        practicePageText.includes("six saved challenges") &&
        practicePageText.includes("Move from selector to reusable component."),
      step,
      "The six-challenge CSS practice path did not load.",
    );

    for (const challenge of CSS_CHALLENGES) {
      const challengePageResponse = await request(
        `/practice/css/${challenge.slug}`,
      );
      const challengePageText = pageText(await challengePageResponse.text());
      assertStep(
        challengePageResponse.status === 200 &&
          challengePageText.includes(challenge.title) &&
          challengePageText.includes("Check and save attempt"),
        step,
        `CSS practice challenge ${challenge.slug} did not load.`,
      );

      const challengeStateResponse = await request(
        `/api/practice/css/${challenge.slug}`,
      );
      const challengeState = await challengeStateResponse.json();
      assertStep(
        challengeStateResponse.status === 200 &&
          challengeState.bestVerdict === null &&
          challengeState.attempts?.length === 0 &&
          !challengeState.css.includes(runId),
        step,
        `A fresh learner inherited saved state for ${challenge.slug}.`,
      );
    }

    const noteResponse = await request(
      `/api/lessons/${LESSON_SLUG}/notes`,
    );
    const note = await noteResponse.json();
    assertStep(
      noteResponse.status === 200 && note.note === null,
      step,
      "A fresh learner inherited another learner’s note.",
    );

    const settingsResponse = await request("/settings");
    const settingsText = pageText(await settingsResponse.text());
    assertStep(
      settingsResponse.status === 200 &&
        settingsText.includes("Private learner settings") &&
        settingsText.includes("Certificate display name"),
      step,
      "Private learner settings did not load.",
    );

    const certificateResponse = await request("/certificate");
    const certificateText = pageText(await certificateResponse.text());
    assertStep(
      certificateResponse.status === 200 &&
        certificateText.includes(CERTIFICATE_TITLE) &&
        certificateText.includes("Finish the recall check first."),
      step,
      "The certificate was not locked before course completion.",
    );
    const certificateApiResponse = await request("/api/certificate");
    const certificateState = await certificateApiResponse.json();
    assertStep(
      certificateApiResponse.status === 200 &&
        certificateState.eligible === false &&
        certificateState.certificate === null,
      step,
      "A fresh learner inherited an earned certificate.",
    );
  });

  await runStep(4, async (step) => {
    const failingDraft = "<main><article></article></main>";
    const failingResponse = await jsonRequest(
      `/api/lessons/${LESSON_SLUG}/workspace`,
      { html: failingDraft },
    );
    assertStep(
      failingResponse.status === 200,
      step,
      "A failing draft was not saved.",
    );
    const failingWorkspace = await failingResponse.json();
    assertStep(
      failingWorkspace.html === failingDraft &&
        failingWorkspace.saved === true &&
        failingWorkspace.submission?.status === "needs-revision" &&
        failingWorkspace.submission?.passedChecks < 5 &&
        failingWorkspace.checks.some((check) => check.passed === false),
      step,
      "The revision submission or its rubric guidance was not preserved.",
    );

    const passingDraft = `<!doctype html>
<html lang="en">
  <body>
    <header>Release gate field notes</header>
    <main>
      <article data-release-gate="${runId}">
        <h1>How browsers read pages</h1>
        <section>
          <h2>Start with landmarks</h2>
          <p>Landmarks explain each region.</p>
        </section>
      </article>
    </main>
    <footer>Saved by the learner release gate</footer>
  </body>
</html>`;
    const passingResponse = await jsonRequest(
      `/api/lessons/${LESSON_SLUG}/workspace`,
      { html: passingDraft },
    );
    assertStep(
      passingResponse.status === 200,
      step,
      "A passing draft was not saved.",
    );
    const passingWorkspace = await passingResponse.json();
    assertStep(
      passingWorkspace.html === passingDraft &&
        passingWorkspace.checks.length === 5 &&
        passingWorkspace.submission?.status === "completed" &&
        passingWorkspace.submission?.passedChecks === 5 &&
        passingWorkspace.checks.every((check) => check.passed === true),
      step,
      "The assignment submission did not save a completed 5/5 result.",
    );
    savedWorkspaceHtml = passingDraft;

    const failingCss = `.learning-card { width: 280px; }
.learning-card strong { color: #175437; }`;
    const failingCssResponse = await jsonRequest(
      `/api/lessons/${SECOND_LESSON_SLUG}/workspace`,
      { html: failingCss },
    );
    const failingCssWorkspace = await failingCssResponse.json();
    assertStep(
      failingCssResponse.status === 200 &&
        failingCssWorkspace.html === failingCss &&
        failingCssWorkspace.submission?.status === "needs-revision" &&
        failingCssWorkspace.submission?.passedChecks < 4,
      step,
      "The CSS revision result was not saved.",
    );

    savedCssWorkspace = `.learning-card {
  width: 280px;
  box-sizing: border-box;
  padding: 24px;
  border: 2px solid #175437;
}

.learning-card strong {
  color: #175437;
}`;
    const passingCssResponse = await jsonRequest(
      `/api/lessons/${SECOND_LESSON_SLUG}/workspace`,
      { html: savedCssWorkspace },
    );
    const passingCssWorkspace = await passingCssResponse.json();
    assertStep(
      passingCssResponse.status === 200 &&
        passingCssWorkspace.html === savedCssWorkspace &&
        passingCssWorkspace.checks?.length === 4 &&
        passingCssWorkspace.submission?.status === "completed" &&
        passingCssWorkspace.submission?.passedChecks === 4 &&
        passingCssWorkspace.checks.every((check) => check.passed === true),
      step,
      "The CSS workspace did not save a completed 4/4 result.",
    );

    const failingChallengeResponse = await jsonRequest(
      `/api/practice/css/${CSS_CHALLENGES[0].slug}`,
      { mode: "submit", css: ".learning-card { color: #17231e; }" },
    );
    const failingChallenge = await failingChallengeResponse.json();
    assertStep(
      failingChallengeResponse.status === 200 &&
        failingChallenge.verdict === "Needs revision" &&
        failingChallenge.passedChecks < failingChallenge.totalChecks,
      step,
      "The CSS practice challenge did not save deterministic revision feedback.",
    );

    for (const [index, challenge] of CSS_CHALLENGES.entries()) {
      const savedCss = challenge.completedCss(runId);
      savedCssChallenges.set(challenge.slug, savedCss);
      const passingChallengeResponse = await jsonRequest(
        `/api/practice/css/${challenge.slug}`,
        { mode: "submit", css: savedCss },
      );
      const passingChallenge = await passingChallengeResponse.json();
      assertStep(
        passingChallengeResponse.status === 200 &&
          passingChallenge.verdict === "Completed" &&
          passingChallenge.passedChecks === challenge.passedChecks &&
          passingChallenge.totalChecks === challenge.passedChecks &&
          passingChallenge.completedCount === index + 1 &&
          passingChallenge.totalCount === CSS_CHALLENGES.length &&
          passingChallenge.nextChallengeSlug ===
            (CSS_CHALLENGES[index + 1]?.slug ?? null) &&
          passingChallenge.checks.every((check) => check.passed === true),
        step,
        `CSS practice challenge ${challenge.slug} did not save a completed result.`,
      );
    }

    savedCodingSubmissionSource = `function solve(input) {
  const [a, b] = input.trim().split(/\\s+/).map(Number);
  return String(a + b);
}
// immutable submission ${runId}`;
    const codingSubmissionResponse = await jsonRequest(
      "/api/practice/sum-two-numbers",
      {
        mode: "submit",
        code: savedCodingSubmissionSource,
        outputs: ["13", "-5", "0", "1000"],
      },
    );
    const codingSubmission = await codingSubmissionResponse.json();
    assertStep(
      codingSubmissionResponse.status === 200 &&
        codingSubmission.verdict === "Accepted" &&
        codingSubmission.passedTests === 4 &&
        typeof codingSubmission.id === "string",
      step,
      "The JavaScript submission was not saved with an Accepted result.",
    );
    savedCodingSubmissionId = codingSubmission.id;

    revisedCodingDraft = `function solve(input) {
  return "draft ${runId}";
}`;
    const revisedCodingDraftResponse = await jsonRequest(
      "/api/practice/sum-two-numbers",
      { mode: "draft", code: revisedCodingDraft },
    );
    assertStep(
      revisedCodingDraftResponse.status === 200,
      step,
      "The current JavaScript draft could not be revised after submission.",
    );

    const codingWorkspaceResponse = await request(
      "/practice/sum-two-numbers",
    );
    const codingWorkspaceHtml = await codingWorkspaceResponse.text();
    const renderedCodingDraft = elementTextByAttribute(codingWorkspaceHtml, {
      tagName: "textarea",
      attribute: "id",
      value: "coding-solution",
    });
    assertStep(
      codingWorkspaceResponse.status === 200 &&
        codingWorkspaceHtml.includes(
          `href="/submissions/${savedCodingSubmissionId}"`,
        ) &&
        codingWorkspaceHtml.includes("Review source") &&
        renderedCodingDraft === revisedCodingDraft,
      step,
      "The JavaScript workspace did not link its verdict to the saved source while preserving the current draft.",
    );

    const submissionPageResponse = await request(
      `/submissions/${savedCodingSubmissionId}`,
    );
    const submissionPageHtml = await submissionPageResponse.text();
    const renderedSubmissionSource = elementTextByAttribute(
      submissionPageHtml,
      {
        tagName: "pre",
        attribute: "aria-label",
        value: "Submitted JavaScript source",
      },
    );
    assertStep(
      submissionPageResponse.status === 200 &&
        renderedSubmissionSource === savedCodingSubmissionSource &&
        renderedSubmissionSource !== revisedCodingDraft &&
        submissionPageHtml.includes(
          `/practice/sum-two-numbers?submission=${savedCodingSubmissionId}`,
        ) &&
        submissionPageHtml.includes("Load this exact submission?"),
      step,
      "The immutable JavaScript source snapshot or its guarded editor action was not available.",
    );

    const reusedSubmissionResponse = await request(
      `/practice/sum-two-numbers?submission=${savedCodingSubmissionId}`,
    );
    const reusedSubmissionHtml = await reusedSubmissionResponse.text();
    const reusedSubmissionSource = elementTextByAttribute(
      reusedSubmissionHtml,
      {
        tagName: "textarea",
        attribute: "id",
        value: "coding-solution",
      },
    );
    assertStep(
      reusedSubmissionResponse.status === 200 &&
        reusedSubmissionSource === savedCodingSubmissionSource &&
        reusedSubmissionSource !== revisedCodingDraft &&
        reusedSubmissionHtml.includes("Past submission loaded") &&
        reusedSubmissionHtml.includes("Restore saved editor"),
      step,
      "The past JavaScript submission was not loaded as a clearly unsaved editor copy.",
    );

    const submissionSql = postgres(databaseUrl, {
      connect_timeout: 5,
      idle_timeout: 5,
      max: 1,
      onnotice: () => {},
      prepare: false,
    });
    try {
      const [savedSubmission] = await submissionSql`
        select code
        from coding_submission
        where id = ${savedCodingSubmissionId}
          and user_id = ${learnerUserId}
      `;
      const [currentProgress] = await submissionSql`
        select code
        from coding_problem_progress
        where user_id = ${learnerUserId}
          and problem_slug = 'sum-two-numbers'
      `;
      assertStep(
        savedSubmission?.code === savedCodingSubmissionSource &&
          currentProgress?.code === revisedCodingDraft,
        step,
        "The submission snapshot and current JavaScript draft were not stored independently.",
      );
    } finally {
      await submissionSql.end({ timeout: 5 });
    }

    const firstNoteResponse = await jsonRequest(
      `/api/lessons/${LESSON_SLUG}/notes`,
      { content: "Landmarks explain the purpose of each page region." },
    );
    assertStep(
      firstNoteResponse.status === 200,
      step,
      "A lesson note was not saved.",
    );

    savedLessonNote = `  Revised private note ${runId}.\n`;
    const revisedNoteResponse = await jsonRequest(
      `/api/lessons/${LESSON_SLUG}/notes`,
      { content: savedLessonNote },
    );
    const revisedNote = await revisedNoteResponse.json();
    assertStep(
      revisedNoteResponse.status === 200 &&
        revisedNote.note?.content === savedLessonNote,
      step,
      "The revised lesson note was not returned exactly.",
    );

    const firstSettingsResponse = await jsonRequest("/api/settings", {
      certificateDisplayName: "Release Gate Student",
    });
    assertStep(
      firstSettingsResponse.status === 200,
      step,
      "A certificate name was not saved.",
    );

    savedCertificateName = `Release Gate ${runId}`;
    const revisedSettingsResponse = await jsonRequest("/api/settings", {
      certificateDisplayName: savedCertificateName,
    });
    const revisedSettings = await revisedSettingsResponse.json();
    assertStep(
      revisedSettingsResponse.status === 200 &&
        revisedSettings.settings?.certificateDisplayName ===
          savedCertificateName,
      step,
      "The revised certificate name was not returned exactly.",
    );

    const startInterviewResponse = await jsonRequest(
      `/api/interview/${INTERVIEW_DRILL_SLUG}`,
      { action: "start" },
    );
    const startedInterview = await startInterviewResponse.json();
    assertStep(
      startInterviewResponse.status === 200 &&
        startedInterview.progress?.status === "in-progress" &&
        startedInterview.progress?.answers?.length === 0,
      step,
      "The private interview drill did not start cleanly.",
    );

    savedInterviewAnswer = `  const prevents reassignment, not object mutation ${runId}.  `;
    const interviewAnswerResponse = await jsonRequest(
      `/api/interview/${INTERVIEW_DRILL_SLUG}`,
      {
        action: "save-answer",
        questionSlug: INTERVIEW_QUESTION_SLUG,
        answer: savedInterviewAnswer,
        rating: "ready",
      },
    );
    const interviewAnswer = await interviewAnswerResponse.json();
    assertStep(
      interviewAnswerResponse.status === 200 &&
        interviewAnswer.progress?.answers?.[0]?.answer ===
          savedInterviewAnswer &&
        interviewAnswer.progress?.answers?.[0]?.rating === "ready",
      step,
      "The exact private interview answer was not saved.",
    );
  });

  await runStep(5, async (step) => {
    const response = await jsonRequest(
      `/api/lessons/${LESSON_SLUG}/complete`,
      { answers: QUIZ_ANSWERS },
    );
    assertStep(response.status === 200, step, "Quiz submission did not succeed.");
    const payload = await response.json();
    assertStep(payload.passed === true, step, "Quiz result did not pass.");
    assertStep(payload.completed === true, step, "Lesson was not completed.");
    assertStep(payload.savedScore === 100, step, "Best score was not saved.");

    const secondResponse = await jsonRequest(
      `/api/lessons/${SECOND_LESSON_SLUG}/complete`,
      { answers: SECOND_QUIZ_ANSWERS },
    );
    assertStep(
      secondResponse.status === 200,
      step,
      "The second lesson recall check did not succeed.",
    );
    const secondPayload = await secondResponse.json();
    assertStep(
      secondPayload.passed === true &&
        secondPayload.completed === true &&
        secondPayload.savedScore === 100,
      step,
      "The second lesson was not completed with a saved 100% score.",
    );

    const projectPageResponse = await request(`/projects/${PROJECT_SLUG}`);
    const projectPageHtml = await projectPageResponse.text();
    const projectPageText = pageText(projectPageHtml);
    assertStep(
      projectPageResponse.status === 200 &&
        projectPageText.includes("Semantic HTML field guide"),
      step,
      "The guided project did not open after course completion.",
    );
    assertStep(
      JSON.stringify(metaContent(projectPageHtml, "robots")) ===
        JSON.stringify(["noindex, nofollow"]),
      step,
      "The authenticated guided project did not render exactly one noindex, nofollow robots tag.",
    );

    const failingProjectHtml =
      "<header></header><main><article><h1>Draft guide</h1></article></main><footer></footer>";
    const failingProjectResponse = await jsonRequest(
      `/api/projects/${PROJECT_SLUG}`,
      { action: "submit", html: failingProjectHtml },
    );
    const failingProject = await failingProjectResponse.json();
    assertStep(
      failingProjectResponse.status === 200 &&
        failingProject.html === failingProjectHtml &&
        failingProject.submission?.status === "needs-revision" &&
        failingProject.submission?.passedChecks < 6,
      step,
      "The first bounded project review did not return a revision result.",
    );

    savedProjectHtml = `<!doctype html>
<html lang="en">
  <body>
    <header><p>Release gate field guide</p></header>
    <main>
      <article data-release-gate-project="${runId}">
        <h1>How a semantic page works</h1>
        <p>A field guide for structure before styling.</p>
        <section>
          <h2>Use landmarks</h2>
          <p>Landmarks name the purpose of each page region.</p>
        </section>
        <section>
          <h2>Keep a clear outline</h2>
          <p>Headings make the article easier to scan and understand.</p>
        </section>
        <aside>Choose elements by purpose, not appearance.</aside>
      </article>
    </main>
    <footer><p>Saved by the learner release gate.</p></footer>
  </body>
</html>`;
    const projectDraftResponse = await jsonRequest(
      `/api/projects/${PROJECT_SLUG}`,
      { action: "save", html: savedProjectHtml },
    );
    const projectDraft = await projectDraftResponse.json();
    assertStep(
      projectDraftResponse.status === 200 &&
        projectDraft.html === savedProjectHtml &&
        projectDraft.hasUnreviewedChanges === true &&
        projectDraft.submission?.status === "needs-revision",
      step,
      "Saving a revision did not preserve the prior review until resubmission.",
    );

    const completedProjectResponse = await jsonRequest(
      `/api/projects/${PROJECT_SLUG}`,
      { action: "submit", html: savedProjectHtml },
    );
    const completedProject = await completedProjectResponse.json();
    assertStep(
      completedProjectResponse.status === 200 &&
        completedProject.html === savedProjectHtml &&
        completedProject.hasUnreviewedChanges === false &&
        completedProject.submission?.status === "completed" &&
        completedProject.submission?.passedChecks === 6 &&
        completedProject.firstCompletedReview === true &&
        completedProject.submission?.checks.every(
          (check) => check.passed === true,
        ),
      step,
      "The revised project did not save a completed 6/6 review.",
    );
    const repeatedCompletedProjectResponse = await jsonRequest(
      `/api/projects/${PROJECT_SLUG}`,
      { action: "submit", html: savedProjectHtml },
    );
    const repeatedCompletedProject =
      await repeatedCompletedProjectResponse.json();
    assertStep(
      repeatedCompletedProjectResponse.status === 200 &&
        repeatedCompletedProject.submission?.passedChecks === 6 &&
        repeatedCompletedProject.firstCompletedReview === false,
      step,
      "A repeated completed project review was not suppressed.",
    );

    const firstFeedbackResponse = await jsonRequest(
      `/api/courses/${COURSE_SLUG}/feedback`,
      {
        usefulness: "somewhat",
        comment: "The first response from the learner release gate.",
      },
    );
    assertStep(
      firstFeedbackResponse.status === 200,
      step,
      "Course feedback was not saved.",
    );
    const firstFeedback = await firstFeedbackResponse.json();
    assertStep(
      firstFeedback.feedback?.usefulness === "somewhat",
      step,
      "The first usefulness choice was not returned.",
    );

    savedFeedbackComment = `The revised learner release feedback ${runId}.`;
    const revisedFeedbackResponse = await jsonRequest(
      `/api/courses/${COURSE_SLUG}/feedback`,
      {
        usefulness: "very",
        comment: savedFeedbackComment,
      },
    );
    assertStep(
      revisedFeedbackResponse.status === 200,
      step,
      "Course feedback could not be revised.",
    );
    const revisedFeedback = await revisedFeedbackResponse.json();
    assertStep(
      revisedFeedback.feedback?.usefulness === "very" &&
        revisedFeedback.feedback?.comment === savedFeedbackComment,
      step,
      "The revised course feedback was not returned exactly.",
    );

    const certificateResponse = await request("/api/certificate");
    const certificateState = await certificateResponse.json();
    assertStep(
      certificateResponse.status === 200 &&
        certificateState.eligible === true &&
        certificateState.certificate?.displayName === savedCertificateName &&
        certificateState.certificate?.courseTitle === COURSE_TITLE,
      step,
      "The saved 75% course rule did not award the private certificate.",
    );
    savedCertificateId = certificateState.certificate.id;
    savedCertificateAwardedAt = certificateState.certificate.awardedAt;
  });

  await runStep(6, async (step) => {
    const response = await request("/dashboard");
    const html = await response.text();
    const text = pageText(html);
    assertStep(response.status === 200, step, "Reloaded dashboard did not load.");
    assertStep(
      /Completed\s*·\s*2\s*\/\s*2 lessons/.test(text),
      step,
      "Saved progress was not 2/2.",
    );
    assertStep(
      text.includes("HTML and CSS foundations complete"),
      step,
      "The completed two-lesson milestone was not restored.",
    );
    assertStep(
      /1\s*\/\s*6 Accepted/.test(text),
      step,
      "The saved JavaScript submission was not restored after course completion.",
    );

    const workspaceResponse = await request(
      `/api/lessons/${LESSON_SLUG}/workspace`,
    );
    const workspace = await workspaceResponse.json();
    assertStep(
      workspaceResponse.status === 200 &&
        workspace.saved === true &&
        workspace.html === savedWorkspaceHtml &&
        workspace.submission?.status === "completed" &&
        workspace.submission?.passedChecks === 5,
      step,
      "The exact assignment and completed result were not restored after reload.",
    );

    const secondWorkspaceResponse = await request(
      `/api/lessons/${SECOND_LESSON_SLUG}/workspace`,
    );
    const secondWorkspace = await secondWorkspaceResponse.json();
    assertStep(
      secondWorkspaceResponse.status === 200 &&
        secondWorkspace.saved === true &&
        secondWorkspace.html === savedCssWorkspace &&
        secondWorkspace.submission?.status === "completed" &&
        secondWorkspace.submission?.passedChecks === 4,
      step,
      "The exact CSS workspace and 4/4 result were not restored after reload.",
    );

    for (const challenge of CSS_CHALLENGES) {
      const challengeStateResponse = await request(
        `/api/practice/css/${challenge.slug}`,
      );
      const challengeState = await challengeStateResponse.json();
      assertStep(
        challengeStateResponse.status === 200 &&
          challengeState.css === savedCssChallenges.get(challenge.slug) &&
          challengeState.bestVerdict === "Completed" &&
          challengeState.attempts?.[0]?.verdict === "Completed" &&
          challengeState.attempts?.[0]?.passedChecks === challenge.passedChecks,
        step,
        `The exact saved state for ${challenge.slug} was not restored after reload.`,
      );
    }

    const feedbackResponse = await request(
      `/api/courses/${COURSE_SLUG}/feedback`,
    );
    const feedback = await feedbackResponse.json();
    assertStep(
      feedbackResponse.status === 200 &&
        feedback.feedback?.usefulness === "very" &&
        feedback.feedback?.comment === savedFeedbackComment,
      step,
      "The revised feedback was not restored after reload.",
    );

    const noteResponse = await request(
      `/api/lessons/${LESSON_SLUG}/notes`,
    );
    const note = await noteResponse.json();
    assertStep(
      noteResponse.status === 200 &&
        note.note?.content === savedLessonNote,
      step,
      "The exact revised lesson note was not restored after reload.",
    );

    const projectResponse = await request(
      `/api/projects/${PROJECT_SLUG}`,
    );
    const project = await projectResponse.json();
    assertStep(
      projectResponse.status === 200 &&
        project.saved === true &&
        project.html === savedProjectHtml &&
        project.hasUnreviewedChanges === false &&
        project.submission?.status === "completed" &&
        project.submission?.passedChecks === 6,
      step,
      "The exact guided project and 6/6 review were not restored after reload.",
    );

    const settingsResponse = await request("/api/settings");
    const settings = await settingsResponse.json();
    assertStep(
      settingsResponse.status === 200 &&
        settings.settings?.certificateDisplayName === savedCertificateName,
      step,
      "The revised certificate name was not restored after reload.",
    );

    const certificateResponse = await request("/api/certificate");
    const certificateState = await certificateResponse.json();
    assertStep(
      certificateResponse.status === 200 &&
        certificateState.certificate?.id === savedCertificateId &&
        certificateState.certificate?.awardedAt === savedCertificateAwardedAt &&
        certificateState.certificate?.displayName === savedCertificateName,
      step,
      "The stable certificate award was not restored after reload.",
    );

    const interviewResponse = await request(
      `/api/interview/${INTERVIEW_DRILL_SLUG}`,
    );
    const interview = await interviewResponse.json();
    assertStep(
      interviewResponse.status === 200 &&
        interview.progress?.answers?.[0]?.answer === savedInterviewAnswer &&
        interview.progress?.answers?.[0]?.rating === "ready",
      step,
      "The exact private interview answer was not restored after reload.",
    );
  });

  await runStep(7, async (step) => {
    const response = await request("/api/auth/sign-out", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    assertStep(response.status === 200, step, "Sign out did not succeed.");
  });

  await runStep(8, async (step) => {
    const lessonResponse = await request(
      `/learn/${COURSE_SLUG}/${LESSON_SLUG}`,
    );
    const lessonText = pageText(await lessonResponse.text());
    assertStep(
      lessonResponse.status === 200 &&
        lessonText.includes(LESSON_TITLE) &&
        lessonText.includes("Full lesson · Free to read"),
      step,
      "The public lesson did not remain readable after sign out.",
    );
    assertStep(
      !lessonText.includes(savedWorkspaceHtml) &&
        !lessonText.includes(savedCssWorkspace) &&
        !lessonText.includes(savedProjectHtml) &&
        !lessonText.includes(savedLessonNote) &&
        !lessonText.includes(savedFeedbackComment) &&
        !lessonText.includes(savedInterviewAnswer) &&
        !lessonText.includes(savedCertificateName),
      step,
      "The signed-out lesson exposed private learner data.",
    );

    const secondLessonResponse = await request(
      `/learn/${COURSE_SLUG}/${SECOND_LESSON_SLUG}`,
    );
    const secondLessonText = pageText(await secondLessonResponse.text());
    assertStep(
      secondLessonResponse.status === 200 &&
        secondLessonText.includes(SECOND_LESSON_TITLE) &&
        !secondLessonText.includes(savedCssWorkspace),
      step,
      "The second public lesson was unavailable or exposed saved CSS after sign out.",
    );

    for (const challenge of CSS_CHALLENGES) {
      const challengePageResponse = await request(
        `/practice/css/${challenge.slug}`,
      );
      const challengePageHtml = await challengePageResponse.text();
      const challengePageText = pageText(challengePageHtml);
      assertStep(
        challengePageResponse.status === 200 &&
          challengePageText.includes(challenge.title) &&
          !challengePageHtml.includes(runId),
        step,
        `The signed-out ${challenge.slug} page exposed saved practice CSS.`,
      );
    }

    const protectedPages = [
      "/dashboard",
      `/projects/${PROJECT_SLUG}`,
      `/interview/${INTERVIEW_DRILL_SLUG}`,
      "/profile",
      "/settings",
      "/certificate",
      "/playground",
      "/submissions",
      `/submissions/${savedCodingSubmissionId}`,
    ];

    for (const path of protectedPages) {
      const pageResponse = await request(path);
      const html = await pageResponse.text();
      const location =
        pageResponse.headers.get("location") ?? streamedRedirectLocation(html);
      const visibleText = pageText(html);
      assertStep(
        ([302, 303, 307, 308].includes(pageResponse.status) ||
          (pageResponse.status === 200 &&
            Boolean(streamedRedirectLocation(html)))) &&
          location.includes("/account?mode=signin"),
        step,
        `Protected page ${path} did not redirect to sign in.`,
      );
      assertStep(
        !html.includes(runId) &&
          !visibleText.includes(savedLessonNote) &&
          !visibleText.includes(savedFeedbackComment) &&
          !visibleText.includes(savedInterviewAnswer) &&
          !visibleText.includes(savedCertificateName),
        step,
        `Protected page ${path} exposed private learner data after sign out.`,
      );
    }

    const workspaceResponse = await request(
      `/api/lessons/${LESSON_SLUG}/workspace`,
    );
    assertStep(
      workspaceResponse.status === 401,
      step,
      "Signed-out workspace access was not rejected.",
    );
    const secondWorkspaceResponse = await request(
      `/api/lessons/${SECOND_LESSON_SLUG}/workspace`,
    );
    assertStep(
      secondWorkspaceResponse.status === 401,
      step,
      "Signed-out CSS workspace access was not rejected.",
    );
    for (const challenge of CSS_CHALLENGES) {
      const challengeStateResponse = await request(
        `/api/practice/css/${challenge.slug}`,
      );
      assertStep(
        challengeStateResponse.status === 401,
        step,
        `Signed-out access to ${challenge.slug} state was not rejected.`,
      );
    }
    const projectResponse = await request(`/api/projects/${PROJECT_SLUG}`);
    assertStep(
      projectResponse.status === 401,
      step,
      "Signed-out guided project access was not rejected.",
    );
    const feedbackResponse = await request(
      `/api/courses/${COURSE_SLUG}/feedback`,
    );
    assertStep(
      feedbackResponse.status === 401,
      step,
      "Signed-out feedback access was not rejected.",
    );
    const noteResponse = await request(
      `/api/lessons/${LESSON_SLUG}/notes`,
    );
    assertStep(
      noteResponse.status === 401,
      step,
      "Signed-out lesson note access was not rejected.",
    );
    const settingsResponse = await request("/api/settings");
    assertStep(
      settingsResponse.status === 401,
      step,
      "Signed-out settings access was not rejected.",
    );
    const certificateApiResponse = await request("/api/certificate");
    assertStep(
      certificateApiResponse.status === 401,
      step,
      "Signed-out certificate access was not rejected.",
    );
    const interviewResponse = await request(
      `/api/interview/${INTERVIEW_DRILL_SLUG}`,
    );
    assertStep(
      interviewResponse.status === 401,
      step,
      "Signed-out interview answer access was not rejected.",
    );
  });

  await runStep(9, async (step) => {
    const signInResponse = await jsonRequest("/api/auth/sign-in/email", {
      email,
      password,
      callbackURL: "/dashboard",
    });
    assertStep(signInResponse.status === 200, step, "Sign in did not succeed.");

    const dashboardResponse = await request("/dashboard");
    const text = pageText(await dashboardResponse.text());
    assertStep(
      dashboardResponse.status === 200,
      step,
      "Dashboard did not load after sign in.",
    );
    assertStep(
      /Completed\s*·\s*2\s*\/\s*2 lessons/.test(text),
      step,
      "Saved result did not remain after sign in.",
    );

    const workspaceResponse = await request(
      `/api/lessons/${LESSON_SLUG}/workspace`,
    );
    const workspace = await workspaceResponse.json();
    assertStep(
      workspaceResponse.status === 200 &&
        workspace.html === savedWorkspaceHtml &&
        workspace.submission?.status === "completed" &&
        workspace.submission?.passedChecks === 5,
      step,
      "Saved assignment and result did not remain after sign in.",
    );

    const secondWorkspaceResponse = await request(
      `/api/lessons/${SECOND_LESSON_SLUG}/workspace`,
    );
    const secondWorkspace = await secondWorkspaceResponse.json();
    assertStep(
      secondWorkspaceResponse.status === 200 &&
        secondWorkspace.html === savedCssWorkspace &&
        secondWorkspace.submission?.status === "completed" &&
        secondWorkspace.submission?.passedChecks === 4,
      step,
      "The exact CSS workspace and 4/4 result did not remain after sign in.",
    );

    for (const challenge of CSS_CHALLENGES) {
      const challengeStateResponse = await request(
        `/api/practice/css/${challenge.slug}`,
      );
      const challengeState = await challengeStateResponse.json();
      assertStep(
        challengeStateResponse.status === 200 &&
          challengeState.css === savedCssChallenges.get(challenge.slug) &&
          challengeState.bestVerdict === "Completed" &&
          challengeState.attempts?.[0]?.passedChecks === challenge.passedChecks,
        step,
        `The exact ${challenge.slug} state did not remain after sign in.`,
      );
    }

    const feedbackResponse = await request(
      `/api/courses/${COURSE_SLUG}/feedback`,
    );
    const feedback = await feedbackResponse.json();
    assertStep(
      feedbackResponse.status === 200 &&
        feedback.feedback?.usefulness === "very" &&
        feedback.feedback?.comment === savedFeedbackComment,
      step,
      "Saved feedback did not remain after sign in.",
    );

    const noteResponse = await request(
      `/api/lessons/${LESSON_SLUG}/notes`,
    );
    const note = await noteResponse.json();
    assertStep(
      noteResponse.status === 200 &&
        note.note?.content === savedLessonNote,
      step,
      "The exact lesson note did not remain after sign in.",
    );

    const projectResponse = await request(`/api/projects/${PROJECT_SLUG}`);
    const project = await projectResponse.json();
    assertStep(
      projectResponse.status === 200 &&
        project.html === savedProjectHtml &&
        project.submission?.status === "completed" &&
        project.submission?.passedChecks === 6,
      step,
      "The exact guided project and review did not remain after sign in.",
    );

    const settingsResponse = await request("/api/settings");
    const settings = await settingsResponse.json();
    assertStep(
      settingsResponse.status === 200 &&
        settings.settings?.certificateDisplayName === savedCertificateName,
      step,
      "The certificate name did not remain after sign in.",
    );

    const certificateResponse = await request("/api/certificate");
    const certificateState = await certificateResponse.json();
    assertStep(
      certificateResponse.status === 200 &&
        certificateState.certificate?.id === savedCertificateId &&
        certificateState.certificate?.awardedAt === savedCertificateAwardedAt &&
        certificateState.certificate?.displayName === savedCertificateName,
      step,
      "The earned certificate did not remain after sign in.",
    );

    const interviewResponse = await request(
      `/api/interview/${INTERVIEW_DRILL_SLUG}`,
    );
    const interview = await interviewResponse.json();
    assertStep(
      interviewResponse.status === 200 &&
        interview.progress?.answers?.[0]?.answer === savedInterviewAnswer &&
        interview.progress?.answers?.[0]?.rating === "ready",
      step,
      "The exact interview answer did not remain after sign in.",
    );

    const submissionPageResponse = await request(
      `/submissions/${savedCodingSubmissionId}`,
    );
    const submissionPageHtml = await submissionPageResponse.text();
    const restoredSubmissionSource = elementTextByAttribute(
      submissionPageHtml,
      {
        tagName: "pre",
        attribute: "aria-label",
        value: "Submitted JavaScript source",
      },
    );
    assertStep(
      submissionPageResponse.status === 200 &&
        restoredSubmissionSource === savedCodingSubmissionSource &&
        restoredSubmissionSource !== revisedCodingDraft,
      step,
      "The exact JavaScript submission snapshot did not return after sign in.",
    );
  });

  await runStep(10, async (step) => {
    const secondJar = new CookieJar();
    const secondEmail = `release-gate-isolation-${runId}@example.test`;
    const accountResponse = await jsonRequest(
      "/api/auth/sign-up/email",
      {
        name: "Isolated Release Gate Student",
        email: secondEmail,
        password,
        callbackURL: "/dashboard",
      },
      secondJar,
    );
    assertStep(
      accountResponse.status === 200,
      step,
      "The isolation account could not be created.",
    );
    const account = await accountResponse.json();
    assertStep(
      Boolean(account.user?.id),
      step,
      "The isolation account returned no learner.",
    );

    const journeySql = postgres(databaseUrl, {
      connect_timeout: 5,
      idle_timeout: 5,
      max: 1,
      onnotice: () => {},
      prepare: false,
    });
    try {
      await journeySql`
        delete from course_assignment
        where user_id = ${account.user.id}
      `;
    } finally {
      await journeySql.end({ timeout: 5 });
    }

    const unassignedResponse = await request(
      `/api/lessons/${LESSON_SLUG}/workspace`,
      {},
      secondJar,
    );
    assertStep(
      unassignedResponse.status === 404,
      step,
      "An unassigned learner could open a workspace.",
    );

    const assignmentSql = postgres(databaseUrl, {
      connect_timeout: 5,
      idle_timeout: 5,
      max: 1,
      onnotice: () => {},
      prepare: false,
    });
    try {
      await assignmentSql`
        insert into course_assignment (
          id,
          user_id,
          course_id,
          assigned_at
        )
        values (
          ${`release-gate-assignment-${randomBytes(8).toString("hex")}`},
          ${account.user.id},
          ${COURSE_SLUG},
          now()
        )
      `;
    } finally {
      await assignmentSql.end({ timeout: 5 });
    }

    const workspaceResponse = await request(
      `/api/lessons/${LESSON_SLUG}/workspace`,
      {},
      secondJar,
    );
    const workspace = await workspaceResponse.json();
    assertStep(
      workspaceResponse.status === 200,
      step,
      "The isolation learner’s workspace did not load.",
    );
    assertStep(
      workspace.saved === false && workspace.submission === null,
      step,
      "The isolation learner inherited another learner’s submission state.",
    );
    assertStep(
      workspace.html !== savedWorkspaceHtml,
      step,
      "The isolation learner received another learner’s exact draft.",
    );
    assertStep(
      !workspace.html.includes(runId),
      step,
      "One learner could read another learner’s artifact.",
    );

    const secondWorkspaceResponse = await request(
      `/api/lessons/${SECOND_LESSON_SLUG}/workspace`,
      {},
      secondJar,
    );
    const secondWorkspace = await secondWorkspaceResponse.json();
    assertStep(
      secondWorkspaceResponse.status === 200 &&
        secondWorkspace.saved === false &&
        secondWorkspace.submission === null &&
        secondWorkspace.html !== savedCssWorkspace,
      step,
      "One learner could read another learner’s CSS workspace.",
    );

    const originalSecondWorkspaceResponse = await request(
      `/api/lessons/${SECOND_LESSON_SLUG}/workspace`,
    );
    const originalSecondWorkspace = await originalSecondWorkspaceResponse.json();
    assertStep(
      originalSecondWorkspaceResponse.status === 200 &&
        originalSecondWorkspace.html === savedCssWorkspace &&
        originalSecondWorkspace.submission?.passedChecks === 4,
      step,
      "The isolation learner changed the original CSS workspace.",
    );

    for (const challenge of CSS_CHALLENGES) {
      const isolationChallengeResponse = await request(
        `/api/practice/css/${challenge.slug}`,
        {},
        secondJar,
      );
      const isolationChallenge = await isolationChallengeResponse.json();
      assertStep(
        isolationChallengeResponse.status === 200 &&
          isolationChallenge.bestVerdict === null &&
          isolationChallenge.attempts?.length === 0 &&
          isolationChallenge.css !== savedCssChallenges.get(challenge.slug) &&
          !isolationChallenge.css.includes(runId),
        step,
        `One learner could read another learner's ${challenge.slug} state.`,
      );

      const isolationDraft = `${isolationChallenge.css}\n/* isolation ${runId} */`;
      const isolationSaveResponse = await jsonRequest(
        `/api/practice/css/${challenge.slug}`,
        { mode: "draft", css: isolationDraft },
        secondJar,
      );
      assertStep(
        isolationSaveResponse.status === 200,
        step,
        `The isolation learner could not save separate ${challenge.slug} work.`,
      );

      const originalChallengeResponse = await request(
        `/api/practice/css/${challenge.slug}`,
      );
      const originalChallenge = await originalChallengeResponse.json();
      assertStep(
        originalChallengeResponse.status === 200 &&
          originalChallenge.css === savedCssChallenges.get(challenge.slug) &&
          originalChallenge.bestVerdict === "Completed",
        step,
        `Another learner changed the original ${challenge.slug} state.`,
      );
    }

    const noteResponse = await request(
      `/api/lessons/${LESSON_SLUG}/notes`,
      {},
      secondJar,
    );
    const note = await noteResponse.json();
    assertStep(
      noteResponse.status === 200 && note.note === null,
      step,
      "One learner could read another learner’s note.",
    );

    const secondProjectResponse = await request(
      `/api/projects/${PROJECT_SLUG}`,
      {},
      secondJar,
    );
    const secondProject = await secondProjectResponse.json();
    assertStep(
      secondProjectResponse.status === 200 &&
        secondProject.saved === false &&
        secondProject.submission === null &&
        secondProject.html !== savedProjectHtml &&
        !secondProject.html.includes(runId),
      step,
      "One learner could read another learner’s guided project.",
    );

    const originalProjectResponse = await request(
      `/api/projects/${PROJECT_SLUG}`,
    );
    const originalProject = await originalProjectResponse.json();
    assertStep(
      originalProjectResponse.status === 200 &&
        originalProject.html === savedProjectHtml &&
        originalProject.submission?.passedChecks === 6,
      step,
      "Another learner changed the original learner’s guided project.",
    );

    const secondNote = "A separate note for the isolation learner.";
    const noteSaveResponse = await jsonRequest(
      `/api/lessons/${LESSON_SLUG}/notes`,
      { content: secondNote },
      secondJar,
    );
    const savedSecondNote = await noteSaveResponse.json();
    assertStep(
      noteSaveResponse.status === 200 &&
        savedSecondNote.note?.content === secondNote,
      step,
      "The isolation learner could not save a separate note.",
    );

    const originalNoteResponse = await request(
      `/api/lessons/${LESSON_SLUG}/notes`,
    );
    const originalNote = await originalNoteResponse.json();
    assertStep(
      originalNoteResponse.status === 200 &&
        originalNote.note?.content === savedLessonNote,
      step,
      "Another learner changed the original learner’s note.",
    );

    const feedbackResponse = await request(
      `/api/courses/${COURSE_SLUG}/feedback`,
      {},
      secondJar,
    );
    const feedback = await feedbackResponse.json();
    assertStep(
      feedbackResponse.status === 200 && feedback.feedback === null,
      step,
      "One learner could read another learner’s feedback.",
    );
    const feedbackSaveResponse = await jsonRequest(
      `/api/courses/${COURSE_SLUG}/feedback`,
      { usefulness: "very", comment: savedFeedbackComment },
      secondJar,
    );
    assertStep(
      feedbackSaveResponse.status === 403,
      step,
      "A learner without a saved quiz result could change course feedback.",
    );

    const secondSettingsResponse = await request(
      "/api/settings",
      {},
      secondJar,
    );
    const secondSettings = await secondSettingsResponse.json();
    assertStep(
      secondSettingsResponse.status === 200 &&
        secondSettings.settings?.certificateDisplayName !==
          savedCertificateName,
      step,
      "One learner could read another learner’s certificate name.",
    );

    const secondCertificateResponse = await request(
      "/api/certificate",
      {},
      secondJar,
    );
    const secondCertificate = await secondCertificateResponse.json();
    assertStep(
      secondCertificateResponse.status === 200 &&
        secondCertificate.eligible === false &&
        secondCertificate.certificate === null,
      step,
      "One learner inherited another learner’s certificate.",
    );

    const secondName = "Isolated Release Student";
    const secondSettingsSaveResponse = await jsonRequest(
      "/api/settings",
      { certificateDisplayName: secondName },
      secondJar,
    );
    const secondSavedSettings = await secondSettingsSaveResponse.json();
    assertStep(
      secondSettingsSaveResponse.status === 200 &&
        secondSavedSettings.settings?.certificateDisplayName === secondName,
      step,
      "The isolation learner could not save separate settings.",
    );

    const originalSettingsResponse = await request("/api/settings");
    const originalSettings = await originalSettingsResponse.json();
    assertStep(
      originalSettingsResponse.status === 200 &&
        originalSettings.settings?.certificateDisplayName ===
          savedCertificateName,
      step,
      "Another learner changed the original learner’s settings.",
    );

    const interviewResponse = await request(
      `/api/interview/${INTERVIEW_DRILL_SLUG}`,
      {},
      secondJar,
    );
    const interview = await interviewResponse.json();
    assertStep(
      interviewResponse.status === 200 &&
        interview.progress?.status === "not-started" &&
        interview.progress?.answers?.length === 0,
      step,
      "One learner could read another learner’s interview answer.",
    );

    const originalInterviewResponse = await request(
      `/api/interview/${INTERVIEW_DRILL_SLUG}`,
    );
    const originalInterview = await originalInterviewResponse.json();
    assertStep(
      originalInterviewResponse.status === 200 &&
        originalInterview.progress?.answers?.[0]?.answer ===
          savedInterviewAnswer,
      step,
      "The isolation learner changed the original interview answer.",
    );

    const isolatedSubmissionResponse = await request(
      `/submissions/${savedCodingSubmissionId}`,
      {},
      secondJar,
    );
    const isolatedSubmissionHtml = await isolatedSubmissionResponse.text();
    assertStep(
      isolatedSubmissionResponse.status === 404 &&
        !isolatedSubmissionHtml.includes(savedCodingSubmissionSource) &&
        !isolatedSubmissionHtml.includes(runId),
      step,
      "One learner could read another learner’s JavaScript submission snapshot.",
    );

    const isolatedReuseResponse = await request(
      `/practice/sum-two-numbers?submission=${savedCodingSubmissionId}`,
      {},
      secondJar,
    );
    const isolatedReuseHtml = await isolatedReuseResponse.text();
    assertStep(
      isolatedReuseResponse.status === 200 &&
        !isolatedReuseHtml.includes(savedCodingSubmissionSource) &&
        !isolatedReuseHtml.includes("Past submission loaded") &&
        !isolatedReuseHtml.includes(runId),
      step,
      "One learner could load another learner’s JavaScript source into the editor.",
    );

    const originalSubmissionResponse = await request(
      `/submissions/${savedCodingSubmissionId}`,
    );
    const originalSubmissionHtml = await originalSubmissionResponse.text();
    const originalSubmissionSource = elementTextByAttribute(
      originalSubmissionHtml,
      {
        tagName: "pre",
        attribute: "aria-label",
        value: "Submitted JavaScript source",
      },
    );
    assertStep(
      originalSubmissionResponse.status === 200 &&
        originalSubmissionSource === savedCodingSubmissionSource &&
        originalSubmissionSource !== revisedCodingDraft,
      step,
      "The isolation check changed the original JavaScript submission snapshot.",
    );
  });
}

async function main() {
  let appUrl;
  let adminDatabaseUrl;

  try {
    appUrl = getAppUrl();
    adminDatabaseUrl = getAdminDatabaseUrl();
  } catch (error) {
    console.error(`SETUP FAILED: ${error.message}`);
    return 1;
  }

  const databaseName = `${DATABASE_PREFIX}${randomBytes(8).toString("hex")}`;
  const isolatedDatabaseUrl = databaseUrlFor(adminDatabaseUrl, databaseName);
  const authSecret = randomBytes(48).toString("base64url");
  const adminSql = postgres(adminDatabaseUrl, {
    connect_timeout: 5,
    idle_timeout: 5,
    max: 1,
    onnotice: () => {},
    prepare: false,
  });
  const appEnv = {
    ...process.env,
    DATABASE_URL: isolatedDatabaseUrl,
    BETTER_AUTH_SECRET: authSecret,
    BETTER_AUTH_URL: appUrl.origin,
    NEXT_PUBLIC_APP_URL: appUrl.origin,
    NODE_ENV: "production",
  };
  let databaseCreated = false;
  let appProcess;
  let result = 1;

  try {
    console.log("Preparing an isolated learner-release environment.");
    await createIsolatedDatabase(adminSql, databaseName);
    databaseCreated = true;

    await childOutput(
      { ...appEnv, DATABASE_URL: isolatedDatabaseUrl },
      ["scripts/database-release.mjs"],
    );
    await childOutput(appEnv, [
      "node_modules/next/dist/bin/next",
      "build",
    ]);

    appProcess = startApp(appUrl, appEnv);
    await waitForApp(appUrl, appProcess);
    await runJourney(appUrl, isolatedDatabaseUrl);
    if (appProcess.runtimeStderr.trim()) {
      throw new Error(
        "The local application emitted stderr during the learner journey.",
      );
    }
    console.log(`Learner release gate passed: ${steps.length}/${steps.length} checks.`);
    result = 0;
  } catch (error) {
    const stage =
      error instanceof StepFailure ? `STEP FAILED ${error.step}` : "SETUP FAILED";
    console.error(`${stage}: ${safeMessage(error)}`);
  } finally {
    await stopApp(appProcess);

    if (databaseCreated) {
      try {
        await dropIsolatedDatabase(adminSql, databaseName);
      } catch {
        console.error(
          "CLEANUP FAILED: the generated release-gate database needs manual removal.",
        );
        result = 1;
      }
    }

    await adminSql.end({ timeout: 5 }).catch(() => {});
  }

  return result;
}

process.exitCode = await main();
