import { CODING_RUN_TIMEOUT_MS } from "./coding-problems";

export type DomLabRunnerResult =
  | { status: "finished"; checks: boolean[] }
  | { status: "error"; message: string }
  | { status: "timeout"; message: string };

const DOM_LAB_WORKER_SOURCE = `
const blocked = () => {
  throw new Error("Network access is disabled inside the DOM practice runner.");
};

self.fetch = blocked;
self.XMLHttpRequest = undefined;
self.WebSocket = undefined;
self.EventSource = undefined;
self.importScripts = blocked;

class VirtualClassList {
  constructor(initial = []) {
    this.values = new Set(initial);
  }

  add(value) {
    this.values.add(value);
  }

  remove(value) {
    this.values.delete(value);
  }

  contains(value) {
    return this.values.has(value);
  }

  toggle(value) {
    if (this.values.has(value)) {
      this.values.delete(value);
      return false;
    }

    this.values.add(value);
    return true;
  }
}

class VirtualElement {
  constructor({ id = "", classes = [], tagName = "div", text = "" } = {}) {
    this.id = id;
    this.tagName = tagName.toUpperCase();
    this.textContent = text;
    this.classList = new VirtualClassList(classes);
    this.listeners = new Map();
  }

  addEventListener(type, listener) {
    const listeners = this.listeners.get(type) || [];
    listeners.push(listener);
    this.listeners.set(type, listeners);
  }

  click() {
    const listeners = this.listeners.get("click") || [];
    listeners.forEach((listener) => listener.call(this, { type: "click", target: this }));
  }
}

class VirtualDocument {
  constructor(elements) {
    this.elements = elements;
  }

  querySelector(selector) {
    if (selector.startsWith("#")) {
      return this.elements.find((element) => element.id === selector.slice(1)) || null;
    }

    if (selector.startsWith(".")) {
      return this.elements.find((element) => element.classList.contains(selector.slice(1))) || null;
    }

    return this.elements.find((element) => element.tagName.toLowerCase() === selector.toLowerCase()) || null;
  }
}

const createFunction = (source, functionName) => {
  const factory = new Function(
    "fetch",
    "XMLHttpRequest",
    "WebSocket",
    "EventSource",
    "importScripts",
    "indexedDB",
    "caches",
    "\\"use strict\\";\\n" + source + "\\nreturn typeof " + functionName + " === \\\"function\\\" ? " + functionName + " : null;",
  );
  const learnerFunction = factory(
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
  );

  if (!learnerFunction) {
    throw new Error("Keep the provided function name so the checks can call it.");
  }

  return learnerFunction;
};

const runSelectionChecks = (learnerFunction) => ["DOM basics", "Selectors", "Events"].map((text) => {
  const target = new VirtualElement({ id: "lesson-title", tagName: "h2", text });
  const document = new VirtualDocument([
    new VirtualElement({ classes: ["intro"], tagName: "p", text: "Read first" }),
    target,
    new VirtualElement({ id: "continue-button", tagName: "button", text: "Continue" }),
  ]);
  return learnerFunction(document) === target;
});

const runTextChecks = (learnerFunction) => ["Waiting", "Loading", "Not ready"].map((text) => {
  const status = new VirtualElement({ classes: ["status"], tagName: "p", text });
  const document = new VirtualDocument([
    new VirtualElement({ classes: ["label"], tagName: "span", text: "State" }),
    status,
  ]);
  learnerFunction(document);
  return status.textContent === "Ready";
});

const runClassChecks = (learnerFunction) => [false, true, false].map((startsOpen, index) => {
  const classes = ["details", ...(startsOpen ? ["is-open"] : []), ...(index === 2 ? ["card"] : [])];
  const details = new VirtualElement({ classes, tagName: "section" });
  const document = new VirtualDocument([details]);
  learnerFunction(document);
  return details.classList.contains("is-open") === !startsOpen && (index !== 2 || details.classList.contains("card"));
});

const runEventChecks = (learnerFunction) => ["Waiting", "Unsaved", "Draft"].map((text) => {
  const button = new VirtualElement({ id: "save-button", tagName: "button", text: "Save" });
  const message = new VirtualElement({ classes: ["message"], tagName: "p", text });
  const document = new VirtualDocument([button, message]);
  learnerFunction(document);
  const unchangedBeforeClick = message.textContent === text;
  button.click();
  return unchangedBeforeClick && message.textContent === "Saved";
});

self.onmessage = ({ data }) => {
  const functions = {
    "select-an-element": ["findLessonTitle", runSelectionChecks],
    "change-text": ["updateStatus", runTextChecks],
    "toggle-a-class": ["toggleDetails", runClassChecks],
    "respond-to-a-click": ["connectSaveButton", runEventChecks],
  };
  const definition = functions[data.exerciseSlug];

  try {
    if (!definition) {
      throw new Error("This DOM exercise is unavailable.");
    }
    const learnerFunction = createFunction(data.source, definition[0]);
    const checks = definition[1](learnerFunction);
    self.postMessage({ status: "finished", checks });
  } catch (error) {
    self.postMessage({
      status: "error",
      message: error instanceof Error ? error.message : "The DOM code could not be evaluated.",
    });
  }
};
`;

export async function runDomLabCode(
  source: string,
  exerciseSlug: string,
  timeoutMs = CODING_RUN_TIMEOUT_MS,
): Promise<DomLabRunnerResult> {
  if (typeof Worker === "undefined") {
    return {
      status: "error",
      message: "The browser runner is unavailable. Try a current browser.",
    };
  }

  const workerUrl = URL.createObjectURL(
    new Blob([DOM_LAB_WORKER_SOURCE], { type: "text/javascript" }),
  );
  const worker = new Worker(workerUrl);

  return new Promise((resolve) => {
    let settled = false;
    const finish = (result: DomLabRunnerResult) => {
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
      });
    }, timeoutMs);

    worker.onmessage = (event: MessageEvent<DomLabRunnerResult>) => {
      window.clearTimeout(timeout);
      finish(event.data);
    };
    worker.onerror = () => {
      window.clearTimeout(timeout);
      finish({
        status: "error",
        message: "The DOM code stopped before the checks finished.",
      });
    };
    worker.postMessage({ source, exerciseSlug });
  });
}
