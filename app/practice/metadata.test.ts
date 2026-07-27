import { describe, expect, it } from "vitest";
import { PRACTICE_METADATA } from "./metadata";

describe("practice search preview", () => {
  it("describes the exact six-problem offer without unshipped claims", () => {
    expect(PRACTICE_METADATA.title).toBe(
      "JavaScript practice: 6 free problems | Lovable Original",
    );
    expect(PRACTICE_METADATA.description).toBe(
      "Solve six free JavaScript problems and save your code, attempts, and accepted results with a free account.",
    );

    const preview = JSON.stringify(PRACTICE_METADATA);

    expect(preview).not.toMatch(
      /contest|rating|multiple languages|AI judging|public community/i,
    );
  });
});
