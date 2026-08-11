import { CODING_RUN_TIMEOUT_MS } from "./coding-problems";

type RunnerResult =
  | { status: "finished"; outputs: string[]; debugOutput: string[] }
  | { status: "error"; message: string; debugOutput: string[] }
  | { status: "timeout"; message: string; debugOutput: string[] };

type WorkerRunnerResult =
  | { status: "finished"; outputs: string[]; debugOutput: string[] }
  | {
      status: "error";
      message: string;
      stack?: string;
      debugOutput: string[];
    }
  | { status: "timeout"; message: string; debugOutput: string[] };

export type PlaygroundRunnerResult =
  | { status: "finished"; output: string[] }
  | { status: "error"; message: string; output: string[] }
  | { status: "timeout"; message: string; output: string[] };

export type PlaygroundCheckResult = {
  expression: string;
  passed: boolean;
  message: string | null;
};

export type PlaygroundCheckRunnerResult =
  | { status: "finished"; checks: PlaygroundCheckResult[] }
  | { status: "error"; message: string; checks: PlaygroundCheckResult[] }
  | { status: "timeout"; message: string; checks: PlaygroundCheckResult[] };

const CODING_SOURCE_URL = "learner-solution.js";
const NEW_FUNCTION_SOURCE_LINE_OFFSET = 3;

export function formatCodingRunnerError(
  message: string,
  stack: string | undefined,
) {
  const location = stack?.match(/learner-solution\.js:(\d+):(\d+)/);

  if (!location) return message;

  const generatedLine = Number(location[1]);
  const column = Number(location[2]);
  const sourceLine = generatedLine - NEW_FUNCTION_SOURCE_LINE_OFFSET;

  if (!Number.isInteger(sourceLine) || sourceLine < 1) return message;
  if (!Number.isInteger(column) || column < 1) return message;

  return `Line ${sourceLine}, column ${column}: ${message}`;
}

const WORKER_SOURCE = `
const blocked = () => {
  throw new Error("Network access is disabled inside the practice runner.");
};

self.fetch = blocked;
self.XMLHttpRequest = undefined;
self.WebSocket = undefined;
self.EventSource = undefined;
self.importScripts = blocked;

const debugOutput = [];
const MAX_DEBUG_LINES = 80;
const MAX_DEBUG_LINE_LENGTH = 500;
const formatDebugValue = (value) => {
  if (typeof value === "string") return value;
  if (typeof value === "undefined") return "undefined";
  if (typeof value === "bigint") return value.toString() + "n";

  try {
    const serialized = JSON.stringify(value);
    return typeof serialized === "string" ? serialized : String(value);
  } catch {
    return String(value);
  }
};
const writeDebug = (...values) => {
  if (debugOutput.length >= MAX_DEBUG_LINES) return;

  const line = values.map(formatDebugValue).join(" ");
  debugOutput.push(
    line.length > MAX_DEBUG_LINE_LENGTH
      ? line.slice(0, MAX_DEBUG_LINE_LENGTH) + "…"
      : line,
  );
};

self.console = {
  log: writeDebug,
  info: writeDebug,
  warn: writeDebug,
  error: writeDebug,
};

self.onmessage = ({ data }) => {
  const { source, inputs } = data;

  try {
    const createSolve = new Function(
      "fetch",
      "XMLHttpRequest",
      "WebSocket",
      "EventSource",
      "importScripts",
      "\\"use strict\\";\\n" +
        source +
        "\\nreturn typeof solve === \\"function\\" ? solve : null;\\n//# sourceURL=${CODING_SOURCE_URL}",
    );
    const solve = createSolve(
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
    );

    if (!solve) {
      throw new Error("Define a function named solve(input).");
    }

    const outputs = inputs.map((input) => String(solve(input) ?? ""));
    self.postMessage({ status: "finished", outputs, debugOutput });
  } catch (error) {
    self.postMessage({
      status: "error",
      debugOutput,
      message:
        error instanceof Error
          ? error.message
          : "The solution could not be evaluated.",
      stack: error instanceof Error ? error.stack : undefined,
    });
  }
};
`;

const PLAYGROUND_WORKER_SOURCE = `
const blocked = () => {
  throw new Error("Network access is disabled inside the playground.");
};

self.fetch = blocked;
self.XMLHttpRequest = undefined;
self.WebSocket = undefined;
self.EventSource = undefined;
self.importScripts = blocked;

const output = [];
const format = (value) => {
  if (typeof value === "string") return value;
  if (typeof value === "undefined") return "undefined";
  if (typeof value === "bigint") return value.toString() + "n";

  try {
    const serialized = JSON.stringify(value);
    return typeof serialized === "string" ? serialized : String(value);
  } catch {
    return String(value);
  }
};

const write = (...values) => {
  output.push(values.map(format).join(" "));
};

self.console = {
  log: write,
  info: write,
  warn: write,
  error: write,
};

self.onmessage = ({ data }) => {
  try {
    const run = new Function(
      "fetch",
      "XMLHttpRequest",
      "WebSocket",
      "EventSource",
      "importScripts",
      "\\"use strict\\";\\n" + data.source,
    );
    run(undefined, undefined, undefined, undefined, undefined);
    self.postMessage({ status: "finished", output });
  } catch (error) {
    self.postMessage({
      status: "error",
      output,
      message:
        error instanceof Error
          ? error.message
          : "playground.js stopped before it finished.",
    });
  }
};
`;

const PLAYGROUND_CHECK_WORKER_SOURCE = `
const blocked = () => {
  throw new Error("Network access is disabled inside the playground.");
};

self.fetch = blocked;
self.XMLHttpRequest = undefined;
self.WebSocket = undefined;
self.EventSource = undefined;
self.importScripts = blocked;

self.onmessage = ({ data }) => {
  try {
    const runChecks = new Function(
      "fetch",
      "XMLHttpRequest",
      "WebSocket",
      "EventSource",
      "importScripts",
      "checkExpressions",
      "\\"use strict\\";\\n" +
        data.source +
        "\\nreturn checkExpressions.map((expression) => {" +
        "try {" +
        "return { expression, passed: Boolean(eval(expression)), message: null };" +
        "} catch (error) {" +
        "return { expression, passed: false, message: error instanceof Error ? error.message : 'Check could not run.' };" +
        "}" +
        "});",
    );
    const checks = runChecks(
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      data.checks,
    );
    self.postMessage({ status: "finished", checks });
  } catch (error) {
    self.postMessage({
      status: "error",
      checks: [],
      message:
        error instanceof Error
          ? error.message
          : "The quick checks stopped before they finished.",
    });
  }
};
`;

export async function runCodingSolution(
  source: string,
  inputs: string[],
  timeoutMs = CODING_RUN_TIMEOUT_MS,
): Promise<RunnerResult> {
  if (typeof Worker === "undefined") {
    return {
      status: "error",
      message: "The browser runner is unavailable. Try a current browser.",
      debugOutput: [],
    };
  }

  const workerUrl = URL.createObjectURL(
    new Blob([WORKER_SOURCE], { type: "text/javascript" }),
  );
  const worker = new Worker(workerUrl);

  return new Promise((resolve) => {
    let settled = false;
    const finish = (result: RunnerResult) => {
      if (settled) return;
      settled = true;
      worker.terminate();
      URL.revokeObjectURL(workerUrl);
      resolve(result);
    };
    const timeout = window.setTimeout(() => {
      finish({
        status: "timeout",
        message: `Time limit exceeded after ${timeoutMs.toLocaleString()} ms.`,
        debugOutput: [],
      });
    }, timeoutMs);

    worker.onmessage = (event: MessageEvent<WorkerRunnerResult>) => {
      window.clearTimeout(timeout);

      if (event.data.status === "error") {
        finish({
          status: "error",
          message: formatCodingRunnerError(event.data.message, event.data.stack),
          debugOutput: event.data.debugOutput,
        });
        return;
      }

      finish(event.data);
    };
    worker.onerror = () => {
      window.clearTimeout(timeout);
      finish({
        status: "error",
        message: "The solution stopped before producing an answer.",
        debugOutput: [],
      });
    };
    worker.postMessage({ source, inputs });
  });
}

export async function runPlaygroundCode(
  source: string,
  timeoutMs = CODING_RUN_TIMEOUT_MS,
): Promise<PlaygroundRunnerResult> {
  if (typeof Worker === "undefined") {
    return {
      status: "error",
      message: "The browser runner is unavailable. Try a current browser.",
      output: [],
    };
  }

  const workerUrl = URL.createObjectURL(
    new Blob([PLAYGROUND_WORKER_SOURCE], { type: "text/javascript" }),
  );
  const worker = new Worker(workerUrl);

  return new Promise((resolve) => {
    let settled = false;
    const finish = (result: PlaygroundRunnerResult) => {
      if (settled) return;
      settled = true;
      worker.terminate();
      URL.revokeObjectURL(workerUrl);
      resolve(result);
    };
    const timeout = window.setTimeout(() => {
      finish({
        status: "timeout",
        message: `Execution stopped after ${timeoutMs.toLocaleString()} ms.`,
        output: [],
      });
    }, timeoutMs);

    worker.onmessage = (event: MessageEvent<PlaygroundRunnerResult>) => {
      window.clearTimeout(timeout);
      finish(event.data);
    };
    worker.onerror = () => {
      window.clearTimeout(timeout);
      finish({
        status: "error",
        message: "playground.js stopped before it finished.",
        output: [],
      });
    };
    worker.postMessage({ source });
  });
}

export async function runPlaygroundChecks(
  source: string,
  checks: string[],
  timeoutMs = CODING_RUN_TIMEOUT_MS,
): Promise<PlaygroundCheckRunnerResult> {
  if (typeof Worker === "undefined") {
    return {
      status: "error",
      message: "The browser runner is unavailable. Try a current browser.",
      checks: [],
    };
  }

  const workerUrl = URL.createObjectURL(
    new Blob([PLAYGROUND_CHECK_WORKER_SOURCE], { type: "text/javascript" }),
  );
  const worker = new Worker(workerUrl);

  return new Promise((resolve) => {
    let settled = false;
    const finish = (result: PlaygroundCheckRunnerResult) => {
      if (settled) return;
      settled = true;
      worker.terminate();
      URL.revokeObjectURL(workerUrl);
      resolve(result);
    };
    const timeout = window.setTimeout(() => {
      finish({
        status: "timeout",
        message: `Quick checks stopped after ${timeoutMs.toLocaleString()} ms.`,
        checks: [],
      });
    }, timeoutMs);

    worker.onmessage = (event: MessageEvent<PlaygroundCheckRunnerResult>) => {
      window.clearTimeout(timeout);
      finish(event.data);
    };
    worker.onerror = () => {
      window.clearTimeout(timeout);
      finish({
        status: "error",
        message: "The quick checks stopped before they finished.",
        checks: [],
      });
    };
    worker.postMessage({ source, checks });
  });
}
