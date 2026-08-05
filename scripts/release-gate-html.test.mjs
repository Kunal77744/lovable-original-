import { describe, expect, it } from "vitest";
import { elementTextByAttribute } from "./release-gate-html.mjs";

describe("learner release-gate HTML assertions", () => {
  it("recovers an exact multiline editor value from escaped server HTML", () => {
    const source = `function solve(input) {
  return "draft <ready> & exact";
}`;
    const html = `<textarea id="coding-solution">function solve(input) {
  return &quot;draft &lt;ready&gt; &amp; exact&quot;;
}</textarea>`;

    expect(
      elementTextByAttribute(html, {
        tagName: "textarea",
        attribute: "id",
        value: "coding-solution",
      }),
    ).toBe(source);
  });

  it("reads only the requested submitted-source element", () => {
    const html = `<script>"current draft"</script>
      <pre aria-label="Submitted JavaScript source"><code>const answer = &quot;saved&quot;;</code></pre>`;

    expect(
      elementTextByAttribute(html, {
        tagName: "pre",
        attribute: "aria-label",
        value: "Submitted JavaScript source",
      }),
    ).toBe('const answer = "saved";');
  });

  it("returns null when the expected editor is absent", () => {
    expect(
      elementTextByAttribute("<textarea id=\"other\">draft</textarea>", {
        tagName: "textarea",
        attribute: "id",
        value: "coding-solution",
      }),
    ).toBeNull();
  });
});
