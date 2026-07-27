import { CODING_RUN_TIMEOUT_MS } from "./coding-problems";

type RunnerResult =
  | { status: "finished"; outputs: string[] }
  | { status: "error"; message: string }
  | { status: "timeout"; message: string };

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
