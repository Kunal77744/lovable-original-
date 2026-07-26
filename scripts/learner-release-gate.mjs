import { randomBytes } from "node:crypto";
import { spawn } from "node:child_process";

import postgres from "postgres";

const COURSE_TITLE = "Web Development Foundations";
const COURSE_SLUG = "web-development-foundations";
const LESSON_SLUG = "semantic-html";
const LESSON_TITLE = "Build a page the browser understands";
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
  "Lesson start",
  "Quiz completion",
  "Saved progress after reload",
  "Sign out",
  "Protected access",
  "Sign in and restored progress",
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

async function runJourney(baseUrl) {
  const jar = new CookieJar();
  const runId = randomBytes(8).toString("hex");
  const email = `release-gate-${runId}@example.test`;
  const password = `${randomBytes(24).toString("hex")}Aa1!`;
  const forcedFailure = process.env.LEARNER_GATE_TEST_FAIL_STEP?.trim();

  async function request(path, options = {}) {
    const headers = new Headers(options.headers);
    const cookie = jar.header();

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
    jar.update(response);
    return response;
  }

  async function jsonRequest(path, body) {
    return request(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
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
      console.log(`PASS ${number}/8 ${step}`);
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
  });

  await runStep(4, async (step) => {
    const response = await jsonRequest(
      `/api/lessons/${LESSON_SLUG}/complete`,
      { answers: QUIZ_ANSWERS },
    );
    assertStep(response.status === 200, step, "Quiz submission did not succeed.");
    const payload = await response.json();
    assertStep(payload.passed === true, step, "Quiz result did not pass.");
    assertStep(payload.completed === true, step, "Lesson was not completed.");
    assertStep(payload.savedScore === 100, step, "Best score was not saved.");
  });

  await runStep(5, async (step) => {
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
  });

  await runStep(6, async (step) => {
    const response = await request("/api/auth/sign-out", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    assertStep(response.status === 200, step, "Sign out did not succeed.");
  });

  await runStep(7, async (step) => {
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
  });

  await runStep(8, async (step) => {
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
    await runJourney(appUrl);
    console.log("Learner release gate passed: 8/8 checks.");
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
