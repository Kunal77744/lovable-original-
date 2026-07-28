import { randomBytes } from "node:crypto";
import { spawn } from "node:child_process";

import postgres from "postgres";

const COURSE_TITLE = "Web Development Foundations";
const COURSE_SLUG = "web-development-foundations";
const LESSON_SLUG = "semantic-html";
const LESSON_TITLE = "Build a page the browser understands";
const CERTIFICATE_TITLE = "Private course certificate";
const QUIZ_ANSWERS = {
  "main-landmark": "main",
  "heading-order": "h2",
  "article-choice": "standalone",
  "semantic-benefit": "meaning",
};
const DEFAULT_APP_URL = "http://127.0.0.1:3210";
const DATABASE_PREFIX = "lovable_release_gate_";
const WAIT_TIMEOUT_MS = 60_000;

const steps = [
  "Account creation",
  "Initial dashboard",
  "Lesson workspace",
  "Workspace save and checks",
  "Quiz completion and feedback",
  "Saved progress, workspace, and feedback after reload",
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
  return spawn(
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
      stdio: "ignore",
    },
  );
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
  let savedFeedbackComment = "";
  let savedLessonNote = "";
  let savedCertificateName = "";
  let savedCertificateId = "";
  let savedCertificateAwardedAt = "";

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
    assertStep(Boolean(jar.header()), step, "Account creation returned no session.");
  });

  await runStep(2, async (step) => {
    const response = await request("/dashboard");
    const text = pageText(await response.text());
    assertStep(response.status === 200, step, "Dashboard did not load.");
    assertStep(text.includes(COURSE_TITLE), step, "First course was not visible.");
    assertStep(
      /0\s*\/\s*1 lessons/.test(text),
      step,
      "Initial progress was not 0/1.",
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
      /1\s*\/\s*1 lessons/.test(text),
      step,
      "Saved progress was not 1/1.",
    );
    assertStep(
      /Quiz score\s*·\s*100%/.test(text),
      step,
      "Saved score was not 100%.",
    );
    assertStep(
      /aria-valuenow="100"/.test(html),
      step,
      "Progress percentage was not 100%.",
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
    const response = await request(
      `/learn/${COURSE_SLUG}/${LESSON_SLUG}`,
    );
    const location = response.headers.get("location") ?? "";
    assertStep(
      [302, 303, 307, 308].includes(response.status),
      step,
      "Protected lesson did not redirect after sign out.",
    );
    assertStep(
      location.includes("/account?mode=signin"),
      step,
      "Protected lesson did not redirect to sign in.",
    );
    const workspaceResponse = await request(
      `/api/lessons/${LESSON_SLUG}/workspace`,
    );
    assertStep(
      workspaceResponse.status === 401,
      step,
      "Signed-out workspace access was not rejected.",
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
    const certificatePageResponse = await request("/certificate");
    assertStep(
      [302, 303, 307, 308].includes(certificatePageResponse.status) &&
        (certificatePageResponse.headers.get("location") ?? "").includes(
          "/account?mode=signin",
        ),
      step,
      "The signed-out certificate page did not redirect to sign in.",
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
      /1\s*\/\s*1 lessons/.test(text) && /Quiz score\s*·\s*100%/.test(text),
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
