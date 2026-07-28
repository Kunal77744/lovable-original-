import { CODING_RUN_TIMEOUT_MS } from "./coding-problems";

type RunnerResult =
  | { status: "finished"; outputs: string[] }
  | { status: "error"; message: string }
  | { status: "timeout"; message: string };

export type PlaygroundRunnerResult =
  | { status: "finished"; output: string[] }
  | { status: "error"; message: string; output: string[] }
  | { status: "timeout"; message: string; output: string[] };

const WORKER_SOURCE = `
const blocked = () => {
  throw new Error("Network access is disabled inside the practice runner.");
};

self.fetch = blocked;
self.XMLHttpRequest = undefined;
self.WebSocket = undefined;
self.EventSource = undefined;
self.importScripts = blocked;

self.onmessage = ({ data }) => {
  const { source, inputs } = data;

  try {
    const createSolve = new Function(
      "fetch",
      "XMLHttpRequest",
      "WebSocket",
      "EventSource",
      "importScripts",
      "\\"use strict\\";\\n" + source + "\\nreturn typeof solve === \\"function\\" ? solve : null;",
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
    self.postMessage({ status: "finished", outputs });
  } catch (error) {
    self.postMessage({
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "The solution could not be evaluated.",
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

export async function runCodingSolution(
  source: string,
  inputs: string[],
  timeoutMs = CODING_RUN_TIMEOUT_MS,
): Promise<RunnerResult> {
  if (typeof Worker === "undefined") {
    return {
      status: "error",
      message: "The browser runner is unavailable. Try a current browser.",
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
      });
    }, timeoutMs);

    worker.onmessage = (event: MessageEvent<RunnerResult>) => {
      window.clearTimeout(timeout);
      finish(event.data);
    };
    worker.onerror = () => {
      window.clearTimeout(timeout);
      finish({
        status: "error",
        message: "The solution stopped before producing an answer.",
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
