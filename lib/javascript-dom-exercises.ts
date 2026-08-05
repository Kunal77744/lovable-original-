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
  },
];
