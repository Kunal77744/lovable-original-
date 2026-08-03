import { describe, expect, it } from "vitest";
import {
  buildCssChallengePreview,
  CSS_PRACTICE_CHALLENGES,
  getCssPracticeChallenge,
  gradeCssPracticeChallenge,
  hasValidCssChallengeLength,
  MAX_CSS_CHALLENGE_LENGTH,
} from "./css-practice-challenges";

const completedCssBySlug: Record<string, string> = {
  "class-selector": `.learning-card {
    background: #ffffff;
    color: #17231e;
  }`,
  "descendant-selector": `.learning-card strong {
    color: #175437;
    font-weight: 700;
  }`,
  "predictable-width": `.learning-card {
    width: 280px;
    box-sizing: border-box;
    border: 2px solid #287652;
  }`,
  "inside-and-between": `.learning-card { padding: 24px; }
  .learning-card p { margin-top: 12px; }`,
  "link-hit-area": `.learning-card .card-link {
    display: inline-block;
    padding: 12px 16px;
    border-radius: 8px;
  }`,
  "centered-card": `.stage .learning-card {
    max-width: 280px;
    margin-inline: auto;
  }`,
};

describe("CSS practice challenge catalog", () => {
  it("ships six ordered selector and box-model challenges", () => {
    expect(CSS_PRACTICE_CHALLENGES).toHaveLength(6);
    expect(CSS_PRACTICE_CHALLENGES.map((challenge) => challenge.number)).toEqual([
      1, 2, 3, 4, 5, 6,
    ]);
    expect(new Set(CSS_PRACTICE_CHALLENGES.map((challenge) => challenge.slug)).size)
      .toBe(6);
  });

  it.each(CSS_PRACTICE_CHALLENGES.map((challenge) => challenge.slug))(
    "grades %s with deterministic challenge checks",
    (slug) => {
      const checks = gradeCssPracticeChallenge(slug, completedCssBySlug[slug]);

      expect(checks).not.toBeNull();
      expect(checks?.every((check) => check.passed)).toBe(true);
      expect(checks?.every((check) => check.concept.length > 40)).toBe(true);
      expect(checks?.every((check) => check.nextAttempt.length > 40)).toBe(true);
    },
  );

  it("gives every failed check distinct recovery guidance without finished code", () => {
    const failedChecks = CSS_PRACTICE_CHALLENGES.flatMap((challenge) =>
      gradeCssPracticeChallenge(challenge.slug, "/* try again */") ?? [],
    );

    expect(failedChecks).toHaveLength(19);
    expect(failedChecks.every((check) => !check.passed)).toBe(true);
    expect(new Set(failedChecks.map((check) => check.nextAttempt)).size).toBe(19);

    for (const check of failedChecks) {
      expect(`${check.concept} ${check.nextAttempt}`).not.toMatch(
        /\{\s*\.?.+\}|(?:background|color|width|box-sizing|border|padding|margin|display|border-radius)\s*:/i,
      );
    }
  });

  it("returns exact feedback instead of accepting a nearby selector", () => {
    const checks = gradeCssPracticeChallenge(
      "descendant-selector",
      `strong { color: #175437; font-weight: 700; }`,
    );

    expect(checks?.map(({ id, passed }) => ({ id, passed }))).toEqual([
      { id: "descendant-selector", passed: false },
      { id: "count-color", passed: false },
      { id: "count-weight", passed: false },
    ]);
  });

  it("rejects missing challenges and oversized drafts", () => {
    expect(getCssPracticeChallenge("missing")).toBeNull();
    expect(gradeCssPracticeChallenge("missing", ".x {}" )).toBeNull();
    expect(hasValidCssChallengeLength(".x {}" )).toBe(true);
    expect(hasValidCssChallengeLength("" )).toBe(false);
    expect(
      hasValidCssChallengeLength("x".repeat(MAX_CSS_CHALLENGE_LENGTH + 1)),
    ).toBe(false);
  });

  it("keeps the live preview network-blocked", () => {
    const preview = buildCssChallengePreview(`
      @import "https://example.com/font.css";
      .learning-card { background: url(https://example.com/pixel.png); }
    `);

    expect(preview).toContain("default-src 'none'");
    expect(preview).not.toContain("example.com");
    expect(preview).not.toMatch(/@import|url\s*\(/i);
  });
});
