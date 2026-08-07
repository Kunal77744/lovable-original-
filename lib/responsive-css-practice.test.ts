import { describe, expect, it } from "vitest";
import {
  buildResponsiveCssPreview,
  gradeResponsiveCss,
  RESPONSIVE_CSS_STARTER,
} from "./responsive-css-practice";

describe("responsive CSS practice", () => {
  it("starts incomplete and accepts one fluid grid rule", () => {
    expect(
      gradeResponsiveCss(RESPONSIVE_CSS_STARTER).filter(
        (check) => check.passed,
      ),
    ).toHaveLength(2);

    const completedCss = `.resource-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
      gap: 1rem;
    }
    .resource-card { min-width: 0; }`;

    expect(
      gradeResponsiveCss(completedCss).every((check) => check.passed),
    ).toBe(true);
  });

  it("rejects fixed columns and a zero gap", () => {
    const checks = gradeResponsiveCss(`.resource-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0;
    }
    .resource-card { min-width: 0; }`);

    expect(checks.find((check) => check.id === "fluid-columns")?.passed).toBe(
      false,
    );
    expect(checks.find((check) => check.id === "grid-gap")?.passed).toBe(false);
  });

  it("blocks remote preview resources", () => {
    const preview = buildResponsiveCssPreview(
      `@import "https://example.com/styles.css"; .resource-card { background: url(https://example.com/a.png); }`,
    );

    expect(preview).toContain("connect-src 'none'");
    expect(preview).not.toContain("https://example.com");
  });
});
