export type JavaScriptDomExercise = {
  slug: string;
  number: number;
  title: string;
  concept: "Select" | "Text" | "Class" | "Event";
  prompt: string;
  previewLabel: string;
  previewMarkup: string;
  starterCode: string;
  functionName: string;
  recoveryCue: string;
  takeaway: string;
  walkthrough: {
    title: string;
    steps: {
      label: string;
      command: string;
      pageMarkup: string;
      browserState: string;
      explanation: string;
    }[];
  };
};

export const JAVASCRIPT_DOM_EXERCISES: JavaScriptDomExercise[] = [
  {
    slug: "select-an-element",
    number: 1,
    title: "Find one element on the page",
    concept: "Select",
    prompt:
      'Return the heading whose id is "lesson-title". The page also contains a paragraph and a button.',
    previewLabel: "Target element",
    previewMarkup: '<h2 id="lesson-title">DOM basics</h2>',
    functionName: "findLessonTitle",
    starterCode: `function findLessonTitle(document) {
  // Select #lesson-title and return that element.

  return null;
}`,
    recoveryCue:
      'Ask document for the selector "#lesson-title", then return the element it gives you.',
    takeaway:
      "querySelector connects JavaScript to the first page element that matches a CSS selector.",
    walkthrough: {
      title: "Watch the selector find its match",
      steps: [
        {
          label: "Page is ready",
          command: "document",
          pageMarkup: '<h2 id="lesson-title">DOM basics</h2>',
          browserState: "No element selected",
          explanation:
            "The browser has already turned the page markup into a document tree JavaScript can search.",
        },
        {
          label: "Selector runs",
          command: 'document.querySelector("#lesson-title")',
          pageMarkup: '<h2 id="lesson-title">DOM basics</h2>',
          browserState: "Checking id: lesson-title",
          explanation:
            "querySelector reads the CSS selector and checks the document for the first matching element.",
        },
        {
          label: "Element returns",
          command: "return heading",
          pageMarkup: '<h2 id="lesson-title">DOM basics</h2>',
          browserState: "HTMLHeadingElement selected",
          explanation:
            "The returned value is the live heading element, so later JavaScript can read or change it.",
        },
      ],
    },
  },
  {
    slug: "change-text",
    number: 2,
    title: "Replace an element's text",
    concept: "Text",
    prompt:
      'Select the element with the class "status", then change its text to "Ready".',
    previewLabel: "Expected page change",
    previewMarkup: '<p class="status">Waiting</p> → <p class="status">Ready</p>',
    functionName: "updateStatus",
    starterCode: `function updateStatus(document) {
  // Select .status and change its text to "Ready".
}`,
    recoveryCue:
      "Keep the selected element in a variable, then assign the new words to its textContent property.",
    takeaway:
      "textContent reads or replaces an element's plain text without rebuilding the whole page.",
    walkthrough: {
      title: "Watch text move from old to new",
      steps: [
        {
          label: "Before the change",
          command: 'document.querySelector(".status")',
          pageMarkup: '<p class="status">Waiting</p>',
          browserState: "Text is Waiting",
          explanation:
            "The selector connects the variable to the existing status paragraph in the document.",
        },
        {
          label: "Property updates",
          command: 'status.textContent = "Ready"',
          pageMarkup: '<p class="status">Waiting</p>',
          browserState: "Replacing textContent",
          explanation:
            "Assigning textContent changes the words inside the selected element, not the surrounding page.",
        },
        {
          label: "Page repaints",
          command: 'status.textContent // "Ready"',
          pageMarkup: '<p class="status">Ready</p>',
          browserState: "Text is Ready",
          explanation:
            "The document and visible page now agree on the new text without a reload.",
        },
      ],
    },
  },
  {
    slug: "toggle-a-class",
    number: 3,
    title: "Switch a class on and off",
    concept: "Class",
    prompt:
      'Select the element with the class "details", then toggle the class "is-open".',
    previewLabel: "Class change",
    previewMarkup: '<section class="details"> + is-open',
    functionName: "toggleDetails",
    starterCode: `function toggleDetails(document) {
  // Select .details and toggle the "is-open" class.
}`,
    recoveryCue:
      'Use the selected element\'s classList, then ask it to toggle "is-open".',
    takeaway:
      "classList.toggle adds a missing class and removes that same class when it is already present.",
    walkthrough: {
      title: "Watch one class switch page state",
      steps: [
        {
          label: "Closed state",
          command: 'document.querySelector(".details")',
          pageMarkup: '<section class="details">Details</section>',
          browserState: "is-open is absent",
          explanation:
            "The element starts with its base class, so the open-state styles do not apply.",
        },
        {
          label: "Toggle checks",
          command: 'details.classList.toggle("is-open")',
          pageMarkup: '<section class="details">Details</section>',
          browserState: "Checking class list",
          explanation:
            "toggle looks for is-open. Because it is missing, the browser chooses to add it.",
        },
        {
          label: "Open state",
          command: 'details.classList.contains("is-open") // true',
          pageMarkup: '<section class="details is-open">Details</section>',
          browserState: "is-open is present",
          explanation:
            "The same element now carries both classes, making the open-state CSS available immediately.",
        },
      ],
    },
  },
  {
    slug: "respond-to-a-click",
    number: 4,
    title: "Run code after a click",
    concept: "Event",
    prompt:
      'Listen for a click on the button with id "save-button". After the click, change ".message" to "Saved".',
    previewLabel: "Interaction",
    previewMarkup: '<button id="save-button">Save</button> → <p class="message">Saved</p>',
    functionName: "connectSaveButton",
    starterCode: `function connectSaveButton(document) {
  const button = document.querySelector("#save-button");
  const message = document.querySelector(".message");

  // Listen for the button click, then change the message.
}`,
    recoveryCue:
      "Attach a click listener to the button. Put the textContent change inside the listener function.",
    takeaway:
      "addEventListener keeps setup separate from the code that should run when an interaction happens.",
    walkthrough: {
      title: "Watch a click reach its handler",
      steps: [
        {
          label: "Listener attaches",
          command: 'button.addEventListener("click", handler)',
          pageMarkup: '<button id="save-button">Save</button>  <p class="message"></p>',
          browserState: "Click listener ready",
          explanation:
            "The handler is registered now, but its text-changing code has not run yet.",
        },
        {
          label: "Browser waits",
          command: "waiting for click",
          pageMarkup: '<button id="save-button">Save</button>  <p class="message"></p>',
          browserState: "Message is still empty",
          explanation:
            "Setup finishes and the browser keeps listening while the rest of the page remains usable.",
        },
        {
          label: "Click dispatches",
          command: 'button.dispatchEvent(new Event("click"))',
          pageMarkup: '<button id="save-button">Save</button>  <p class="message"></p>',
          browserState: "Running click handler",
          explanation:
            "The click event finds the registered listener and starts the handler function.",
        },
        {
          label: "Handler updates",
          command: 'message.textContent = "Saved"',
          pageMarkup: '<button id="save-button">Save</button>  <p class="message">Saved</p>',
          browserState: "Message is Saved",
          explanation:
            "Only after the click does the handler replace the message text in the document.",
        },
      ],
    },
  },
];
