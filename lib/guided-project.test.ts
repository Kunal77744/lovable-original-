import { describe, expect, it } from "vitest";
import {
  gradeGuidedProject,
  GUIDED_PROJECT_STARTER,
  hasValidGuidedProjectHtml,
} from "./guided-project";

const passingProject = `<!doctype html>
<html lang="en">
  <body>
    <header>Field guide</header>
    <main>
      <article>
        <h1>How I structure an article</h1>
        <p>Semantic landmarks give every region a purpose.</p>
        <section>
          <h2>Start with the outline</h2>
          <p>A readable outline should work before visual styling.</p>
        </section>
        <section>
          <h2>Add supporting detail</h2>
          <p>Each section develops one part of the main idea.</p>
        </section>
        <aside>Tip: say each element’s job aloud.</aside>
      </article>
    </main>
    <footer>Written by a learner</footer>
  </body>
</html>`;

describe("gradeGuidedProject", () => {
  it("passes all six bounded review checks for a complete project", () => {
    const checks = gradeGuidedProject(passingProject);

    expect(checks).toHaveLength(6);
    expect(checks.every((check) => check.passed)).toBe(true);
  });

  it("returns specific revision guidance for an incomplete article", () => {
    const checks = gradeGuidedProject(
      "<main><article><h1>Field guide</h1></article></main>",
    );

    expect(checks.filter((check) => check.passed)).toHaveLength(1);
    expect(checks.find((check) => check.id === "single-article")?.passed).toBe(
      true,
    );
    expect(
      checks.find((check) => check.id === "article-introduction")?.guidance,
    ).toContain("opening <p>");
    expect(checks.find((check) => check.id === "two-sections")?.passed).toBe(
      false,
    );
  });

  it("requires landmarks to be direct body children in the taught order", () => {
    const checks = gradeGuidedProject(`
      <body>
        <main>
          <header>Nested</header>
          <article>
            <h1>Field guide</h1>
            <p>Opening copy</p>
            <section><h2>One</h2><p>Copy</p></section>
            <section><h2>Two</h2><p>Copy</p></section>
            <aside>Tip</aside>
          </article>
          <footer>Nested</footer>
        </main>
      </body>
    `);

    expect(
      checks.find((check) => check.id === "ordered-landmarks")?.passed,
    ).toBe(false);
  });
});

describe("guided project validation", () => {
  it("ships a bounded starter and rejects empty or oversized files", () => {
    expect(GUIDED_PROJECT_STARTER).toContain("<article>");
    expect(GUIDED_PROJECT_STARTER).toContain(
      "Add one aside with a useful tip",
    );
    expect(hasValidGuidedProjectHtml(GUIDED_PROJECT_STARTER)).toBe(true);
    expect(hasValidGuidedProjectHtml("")).toBe(false);
    expect(hasValidGuidedProjectHtml("x".repeat(50_001))).toBe(false);
  });
});
