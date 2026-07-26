import { describe, expect, it } from "vitest";
import {
  buildSandboxedPreviewDocument,
  gradeSemanticHtml,
  hasValidSemanticHtmlLength,
  MAX_SEMANTIC_HTML_LENGTH,
} from "./semantic-html-workspace";

const passingDocument = `<!doctype html>
<html lang="en">
  <body>
    <header>Field notes</header>
    <main>
      <article>
        <h1>How browsers read pages</h1>
        <section>
          <h2>Start with landmarks</h2>
          <p>Landmarks explain each region.</p>
        </section>
      </article>
    </main>
    <footer>Written by a learner</footer>
  </body>
</html>`;

describe("gradeSemanticHtml", () => {
  it("passes all five semantic structure checks for a complete page", () => {
    const checks = gradeSemanticHtml(passingDocument);

    expect(checks).toHaveLength(5);
    expect(checks.every((check) => check.passed)).toBe(true);
  });

  it("returns specific guidance for every missing structure", () => {
    const checks = gradeSemanticHtml("<main><article></article></main>");

    expect(checks.map(({ id, passed }) => ({ id, passed }))).toEqual([
      { id: "page-header", passed: false },
      { id: "main-article", passed: true },
      { id: "article-heading", passed: false },
      { id: "article-section", passed: false },
      { id: "page-footer", passed: false },
    ]);
    expect(checks.every((check) => check.guidance.length > 20)).toBe(true);
  });

  it("requires the semantic elements to have the taught nesting and order", () => {
    const checks = gradeSemanticHtml(`
      <footer>Too early</footer>
      <header>Too late</header>
      <article><h1>Outside main</h1></article>
      <main><section><h2>Outside article</h2></section></main>
    `);

    expect(checks.find((check) => check.id === "main-article")?.passed).toBe(false);
    expect(checks.find((check) => check.id === "article-heading")?.passed).toBe(
      false,
    );
    expect(checks.find((check) => check.id === "article-section")?.passed).toBe(
      false,
    );
  });
});

describe("hasValidSemanticHtmlLength", () => {
  it("accepts a draft within the stored artifact limit", () => {
    expect(hasValidSemanticHtmlLength("<main></main>")).toBe(true);
  });

  it("rejects empty and oversized drafts", () => {
    expect(hasValidSemanticHtmlLength("")).toBe(false);
    expect(hasValidSemanticHtmlLength("x".repeat(MAX_SEMANTIC_HTML_LENGTH + 1))).toBe(
      false,
    );
  });
});

describe("buildSandboxedPreviewDocument", () => {
  it("removes executable and network-bearing markup before adding a deny-first policy", () => {
    const preview = buildSandboxedPreviewDocument(`
      <meta http-equiv="refresh" content="0; https://example.com" />
      <main onclick="alert(1)">
        <img src="https://example.com/pixel.png" />
        <script>fetch("https://example.com")</script>
        <form action="https://example.com"><button>Send</button></form>
        <iframe src="https://example.com"></iframe>
      </main>
    `);

    expect(preview).toContain("default-src 'none'");
    expect(preview).toContain("<main>");
    expect(preview).not.toMatch(/example\.com|onclick|<script|<form|<iframe/i);
  });
});
