import { parse, serialize } from "parse5";

export const ACCESSIBLE_FORMS_STARTER = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Workshop interest form</title>
    <style>
      body {
        margin: 0;
        padding: 2rem;
        color: #17231e;
        background: #f6f7f2;
        font: 16px/1.6 system-ui, sans-serif;
      }

      main {
        max-width: 34rem;
        margin-inline: auto;
      }

      form {
        display: grid;
        gap: 1rem;
        padding: 1.5rem;
        border: 1px solid #c8cec7;
        border-radius: 1rem;
        background: #ffffff;
      }

      input, button {
        font: inherit;
      }
    </style>
  </head>
  <body>
    <main>
      <h1>Join a beginner workshop</h1>
      <form>
        <!-- Connect a visible label and the help text to this email input. -->
        <p id="email-help">We will send one workshop reminder.</p>
        <input name="email" />

        <!-- Group these related choices with fieldset and legend. -->
        <div>
          <p>Choose a workshop time</p>
          <label><input type="radio" name="time" value="morning" /> Morning</label>
          <label><input type="radio" name="time" value="evening" /> Evening</label>
        </div>

        <button>Join the workshop</button>
      </form>
    </main>
  </body>
</html>`;

export const MAX_ACCESSIBLE_FORMS_LENGTH = 50_000;

export type AccessibleFormsCheck = {
  id:
    | "form-purpose"
    | "email-label"
    | "email-input"
    | "choice-group"
    | "submit-action";
  label: string;
  guidance: string;
  passed: boolean;
};

type HtmlNode = {
  nodeName?: string;
  tagName?: string;
  value?: string;
  childNodes?: HtmlNode[];
  attrs?: Array<{ name: string; value: string }>;
};

const PREVIEW_CSP = [
  "default-src 'none'",
  "base-uri 'none'",
  "connect-src 'none'",
  "font-src 'none'",
  "form-action 'none'",
  "frame-src 'none'",
  "img-src data:",
  "media-src 'none'",
  "object-src 'none'",
  "script-src 'none'",
  "style-src 'unsafe-inline'",
].join("; ");
const BLOCKED_PREVIEW_ELEMENTS = new Set([
  "base",
  "embed",
  "frame",
  "frameset",
  "iframe",
  "link",
  "object",
  "portal",
  "script",
]);
const BLOCKED_PREVIEW_ATTRIBUTES = new Set([
  "action",
  "data",
  "formaction",
  "href",
  "poster",
  "src",
  "srcset",
  "xlink:href",
]);

function descendants(node: HtmlNode): HtmlNode[] {
  const nodes: HtmlNode[] = [];

  for (const child of node.childNodes ?? []) {
    nodes.push(child, ...descendants(child));
  }

  return nodes;
}

function attribute(node: HtmlNode | undefined, name: string) {
  return node?.attrs?.find(
    (item) => item.name.toLowerCase() === name.toLowerCase(),
  )?.value;
}

function normalizedText(node: HtmlNode | undefined): string {
  if (!node) return "";
  return [node.value ?? "", ...(node.childNodes ?? []).map(normalizedText)]
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function hasLabelFor(elements: HtmlNode[], inputId: string) {
  return elements.some(
    (node) =>
      node.tagName === "label" &&
      attribute(node, "for") === inputId &&
      normalizedText(node).length > 0,
  );
}

export function gradeAccessibleForms(html: string): AccessibleFormsCheck[] {
  const document = parse(html) as HtmlNode;
  const elements = descendants(document).filter((node) => Boolean(node.tagName));
  const form = elements.find((node) => node.tagName === "form");
  const formElements = form ? descendants(form).filter((node) => Boolean(node.tagName)) : [];
  const emailInput = formElements.find(
    (node) =>
      node.tagName === "input" &&
      (attribute(node, "type")?.toLowerCase() === "email" ||
        attribute(node, "name")?.toLowerCase() === "email"),
  );
  const emailId = attribute(emailInput, "id") ?? "";
  const descriptionId = attribute(emailInput, "aria-describedby") ?? "";
  const fieldset = formElements.find((node) => node.tagName === "fieldset");
  const fieldsetElements = fieldset ? descendants(fieldset) : [];
  const radioInputs = fieldsetElements.filter(
    (node) =>
      node.tagName === "input" &&
      attribute(node, "type")?.toLowerCase() === "radio",
  );
  const radioNames = new Set(
    radioInputs.map((node) => attribute(node, "name")).filter(Boolean),
  );
  const submitButton = formElements.find(
    (node) =>
      node.tagName === "button" &&
      attribute(node, "type")?.toLowerCase() === "submit",
  );

  return [
    {
      id: "form-purpose",
      label: "Put the controls inside one form",
      guidance:
        "Use one <form> around the related controls so the browser understands they belong to one task.",
      passed: Boolean(form),
    },
    {
      id: "email-label",
      label: "Connect a visible label to the email field",
      guidance:
        "Give the email input an id, then match it with a label’s for attribute.",
      passed: emailId.length > 0 && hasLabelFor(formElements, emailId),
    },
    {
      id: "email-input",
      label: "Describe the email field precisely",
      guidance:
        "Use type=\"email\" and aria-describedby pointing to the existing help text.",
      passed:
        attribute(emailInput, "type")?.toLowerCase() === "email" &&
        descriptionId.length > 0 &&
        formElements.some((node) => attribute(node, "id") === descriptionId),
    },
    {
      id: "choice-group",
      label: "Name the related radio choices as one group",
      guidance:
        "Wrap the choices in <fieldset>, introduce them with <legend>, and keep one shared radio name.",
      passed:
        Boolean(fieldsetElements.find((node) => node.tagName === "legend" && normalizedText(node))) &&
        radioInputs.length >= 2 &&
        radioNames.size === 1,
    },
    {
      id: "submit-action",
      label: "Make the form action explicit",
      guidance:
        "Set type=\"submit\" on the button so its behavior stays clear when the form grows.",
      passed: Boolean(submitButton && normalizedText(submitButton)),
    },
  ];
}

export function hasValidAccessibleFormsLength(html: string) {
  return html.length > 0 && html.length <= MAX_ACCESSIBLE_FORMS_LENGTH;
}

function sanitizePreviewNode(node: HtmlNode) {
  node.attrs = node.attrs?.filter((item) => {
    const name = item.name.toLowerCase();
    const isRefreshMeta =
      node.tagName === "meta" &&
      name === "http-equiv" &&
      item.value.toLowerCase() === "refresh";

    return (
      !name.startsWith("on") &&
      !BLOCKED_PREVIEW_ATTRIBUTES.has(name) &&
      !isRefreshMeta
    );
  });
  node.childNodes = node.childNodes
    ?.filter((child) => {
      if (!child.tagName) return true;
      const tagName = child.tagName.toLowerCase();
      const isHttpEquivMeta =
        tagName === "meta" &&
        child.attrs?.some(
          (item) => item.name.toLowerCase() === "http-equiv",
        );

      return !BLOCKED_PREVIEW_ELEMENTS.has(tagName) && !isHttpEquivMeta;
    })
    .map((child) => sanitizePreviewNode(child));

  return node;
}

export function buildAccessibleFormsPreview(html: string) {
  const document = parse(html);
  sanitizePreviewNode(document as HtmlNode);
  const serialized = serialize(document);

  return serialized.replace(
    "<head>",
    `<head><meta http-equiv="Content-Security-Policy" content="${PREVIEW_CSP}">`,
  );
}
