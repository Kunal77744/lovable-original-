import { describe, expect, it } from "vitest";
import {
  buildCssBoxModelPreview,
  explainCssBoxModel,
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

  it("keeps the preview on the browser's content-box default", () => {
    const preview = buildCssBoxModelPreview(passingCss);

    expect(preview).not.toContain("* { box-sizing: border-box; }");
    expect(preview).toContain("body { box-sizing: border-box; }");
  });
});

describe("explainCssBoxModel", () => {
  it("shows padding and border expanding a content-box card", () => {
    const explanation = explainCssBoxModel(`.learning-card {
      width: 280px;
      padding: 24px;
      border: 2px solid #287652;
    }`);

    expect(explanation).toMatchObject({
      boxSizing: "content-box",
      widthPx: 280,
      paddingInlinePx: 48,
      borderInlinePx: 4,
      contentWidthPx: 280,
      renderedWidthPx: 332,
    });
  });

  it("shows border-box keeping padding and border inside the declared width", () => {
    const explanation = explainCssBoxModel(passingCss);

    expect(explanation).toMatchObject({
      boxSizing: "border-box",
      widthPx: 280,
      paddingInlinePx: 48,
      borderInlinePx: 4,
      contentWidthPx: 228,
      renderedWidthPx: 280,
    });
  });

  it("handles horizontal overrides and reports unsupported percentages honestly", () => {
    expect(
      explainCssBoxModel(`.learning-card {
        width: 320px;
        padding: 8px 12px;
        padding-left: 20px;
        border-width: 1px 3px;
        border-style: solid;
      }`),
    ).toMatchObject({
      widthPx: 320,
      paddingInlinePx: 32,
      borderInlinePx: 6,
      renderedWidthPx: 358,
    });

    expect(
      explainCssBoxModel(`.learning-card {
        width: 80%;
        padding: 24px;
      }`).renderedWidthPx,
    ).toBeNull();

    expect(
      explainCssBoxModel(`.learning-card {
        width: 280;
        padding: 24px;
      }`).renderedWidthPx,
    ).toBeNull();
  });
});
