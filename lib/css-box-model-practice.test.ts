import { describe, expect, it } from "vitest";
import {
  buildCssBoxModelPreview,
  gradeCssBoxModel,
  hasValidCssPracticeLength,
  MAX_CSS_PRACTICE_LENGTH,
} from "./css-box-model-practice";

const passingCss = `.learning-card {
  width: 280px;
  box-sizing: border-box;
  padding: 24px;
  border: 2px solid #287652;
}

.learning-card strong {
  color: #175437;
}`;

describe("gradeCssBoxModel", () => {
  it("passes a scoped card with a predictable box", () => {
    const checks = gradeCssBoxModel(passingCss);

    expect(checks).toHaveLength(4);
    expect(checks.every((check) => check.passed)).toBe(true);
  });

  it("returns specific guidance for missing selector and box-model choices", () => {
    const checks = gradeCssBoxModel(".learning-card { width: 280px; }");

    expect(checks.map(({ id, passed }) => ({ id, passed }))).toEqual([
      { id: "card-selector", passed: true },
      { id: "descendant-selector", passed: false },
      { id: "border-box", passed: false },
      { id: "inner-space", passed: false },
    ]);
    expect(checks.every((check) => check.guidance.length > 20)).toBe(true);
  });
});

describe("CSS practice safety", () => {
  it("keeps saved practice within a bounded length", () => {
    expect(hasValidCssPracticeLength(passingCss)).toBe(true);
    expect(hasValidCssPracticeLength("")).toBe(false);
    expect(
      hasValidCssPracticeLength("x".repeat(MAX_CSS_PRACTICE_LENGTH + 1)),
    ).toBe(false);
  });

  it("blocks network-bearing CSS in the preview document", () => {
    const preview = buildCssBoxModelPreview(`
      @import "https://example.com/font.css";
      .learning-card { background: url(https://example.com/pixel.png); }
    `);

    expect(preview).toContain("default-src 'none'");
    expect(preview).not.toContain("example.com");
    expect(preview).not.toMatch(/@import|url\s*\(/i);
  });
});
