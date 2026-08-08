import { describe, expect, it } from "vitest";
import {
  buildHtmlCssCapstonePreview,
  gradeHtmlCssCapstone,
  parseHtmlCssCapstoneSource,
  serializeHtmlCssCapstoneSource,
} from "./html-css-capstone";

const completeHtml = `<!doctype html><html><body><header>Library</header><main><article><h1>Resources</h1><div class="resource-grid">${[1, 2, 3]
  .map((number) => `<section class="resource-card"><h2>Resource ${number}</h2><p>Useful.</p><a class="resource-link" href="#${number}">Open</a></section>`)
  .join("")}</div></article></main><footer>Done</footer></body></html>`;
const completeCss = `.resource-grid { display: grid; gap: 1rem; }
.resource-card { box-sizing: border-box; padding: 1rem; border: 1px solid #17231e; }
.resource-card .resource-link { display: inline-block; padding: .5rem; background: #287652; }`;

describe("HTML and CSS capstone", () => {
  it("passes all six integrated outcomes for a complete project", () => {
    expect(gradeHtmlCssCapstone(completeHtml, completeCss)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ passed: true }),
      ]),
    );
    expect(gradeHtmlCssCapstone(completeHtml, completeCss).every((check) => check.passed)).toBe(true);
  });

  it("keeps every outcome open when the starter contract is unfinished", () => {
    const checks = gradeHtmlCssCapstone("<main></main>", ".resource-grid {}");
    expect(checks).toHaveLength(6);
    expect(checks.every((check) => !check.passed)).toBe(true);
  });

  it("blocks scripts, remote URLs, imports, and style escapes in preview", () => {
    const preview = buildHtmlCssCapstonePreview(
      `<main><script>alert(1)</script><img src="https://example.com/a.png"></main>`,
      `@import "https://example.com/a.css"; main { background: url(https://example.com/a.png); }</style><script>alert(2)</script>`,
    );
    expect(preview).not.toContain("@import");
    expect(preview).not.toContain("https://example.com");
    expect(preview).not.toContain("<script>");
    expect(preview).toContain("connect-src 'none'");
  });

  it("round trips both private source files together", () => {
    expect(parseHtmlCssCapstoneSource(serializeHtmlCssCapstoneSource("<main />", "main {}"))).toEqual({
      html: "<main />",
      css: "main {}",
    });
  });
});
