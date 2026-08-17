import { describe, expect, it } from "vitest";
import {
  buildAccessibleFormsPreview,
  gradeAccessibleForms,
  hasValidAccessibleFormsLength,
  MAX_ACCESSIBLE_FORMS_LENGTH,
} from "./accessible-forms-practice";

const passingForm = `<!doctype html>
<html lang="en">
  <body>
    <form>
      <label for="workshop-email">Email address</label>
      <p id="email-help">We will send one reminder.</p>
      <input id="workshop-email" name="email" type="email" aria-describedby="email-help" />
      <fieldset>
        <legend>Choose a workshop time</legend>
        <label><input type="radio" name="time" value="morning" /> Morning</label>
        <label><input type="radio" name="time" value="evening" /> Evening</label>
      </fieldset>
      <button type="submit">Join the workshop</button>
    </form>
  </body>
</html>`;

describe("gradeAccessibleForms", () => {
  it("passes all five authored checks for a connected form", () => {
    const checks = gradeAccessibleForms(passingForm);

    expect(checks).toHaveLength(5);
    expect(checks.every((check) => check.passed)).toBe(true);
  });

  it("keeps each accessibility requirement independent", () => {
    const checks = gradeAccessibleForms(`
      <form>
        <label>Email address</label>
        <input name="email" type="text" />
        <fieldset>
          <p>Choose a time</p>
          <input type="radio" name="morning" />
          <input type="radio" name="evening" />
        </fieldset>
        <button>Join</button>
      </form>
    `);

    expect(checks.map(({ id, passed }) => ({ id, passed }))).toEqual([
      { id: "form-purpose", passed: true },
      { id: "email-label", passed: false },
      { id: "email-input", passed: false },
      { id: "choice-group", passed: false },
      { id: "submit-action", passed: false },
    ]);
  });
});

describe("hasValidAccessibleFormsLength", () => {
  it("accepts bounded work and rejects empty or oversized drafts", () => {
    expect(hasValidAccessibleFormsLength(passingForm)).toBe(true);
    expect(hasValidAccessibleFormsLength("")).toBe(false);
    expect(
      hasValidAccessibleFormsLength(
        "x".repeat(MAX_ACCESSIBLE_FORMS_LENGTH + 1),
      ),
    ).toBe(false);
  });
});

describe("buildAccessibleFormsPreview", () => {
  it("keeps form semantics while blocking submission, scripts, and network URLs", () => {
    const preview = buildAccessibleFormsPreview(`
      <form action="https://example.com/collect" onsubmit="steal()">
        <label for="email">Email</label>
        <input id="email" type="email" />
        <button type="submit" formaction="https://example.com/other">Join</button>
      </form>
      <script>fetch("https://example.com")</script>
    `);

    expect(preview).toContain("form-action 'none'");
    expect(preview).toContain("<form>");
    expect(preview).toContain('<label for="email">Email</label>');
    expect(preview).not.toMatch(/example\.com|onsubmit|formaction|<script/i);
  });
});
