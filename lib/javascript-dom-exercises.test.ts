import { describe, expect, it } from "vitest";
import { JAVASCRIPT_DOM_EXERCISES } from "./javascript-dom-exercises";

describe("JavaScript DOM exercises", () => {
  it("defines four ordered, unsolved DOM moves", () => {
    expect(JAVASCRIPT_DOM_EXERCISES.map((exercise) => exercise.concept)).toEqual([
      "Select",
      "Text",
      "Class",
      "Event",
    ]);
    expect(JAVASCRIPT_DOM_EXERCISES.map((exercise) => exercise.number)).toEqual([
      1, 2, 3, 4,
    ]);
    expect(JAVASCRIPT_DOM_EXERCISES[0].starterCode).toContain("return null");
    expect(JAVASCRIPT_DOM_EXERCISES[1].starterCode).not.toContain(
      '.textContent = "Ready"',
    );
    expect(JAVASCRIPT_DOM_EXERCISES[2].starterCode).not.toContain(
      '.toggle("is-open")',
    );
    expect(JAVASCRIPT_DOM_EXERCISES[3].starterCode).not.toContain(
      'addEventListener("click"',
    );
  });

  it("gives every exercise one cue and one takeaway", () => {
    for (const exercise of JAVASCRIPT_DOM_EXERCISES) {
      expect(exercise.recoveryCue.length).toBeGreaterThan(30);
      expect(exercise.takeaway.length).toBeGreaterThan(30);
      expect(exercise.recoveryCue).not.toContain("function ");
      expect(exercise.takeaway).not.toContain("function ");
    }
  });

  it("defines a complete DOM replay for every successful move", () => {
    expect(
      JAVASCRIPT_DOM_EXERCISES.map((exercise) => exercise.walkthrough.steps.length),
    ).toEqual([3, 3, 3, 4]);

    for (const exercise of JAVASCRIPT_DOM_EXERCISES) {
      expect(exercise.walkthrough.title.length).toBeGreaterThan(20);
      for (const step of exercise.walkthrough.steps) {
        expect(step.label).toBeTruthy();
        expect(step.command).toBeTruthy();
        expect(step.pageMarkup).toContain("<");
        expect(step.browserState).toBeTruthy();
        expect(step.explanation.length).toBeGreaterThan(30);
      }
    }
  });
});
