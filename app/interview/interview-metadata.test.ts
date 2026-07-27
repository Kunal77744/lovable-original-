import { describe, expect, it, vi } from "vitest";

vi.mock("@/db/interview-drill", () => ({
  getInterviewDrillForStudent: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

import { metadata } from "./javascript-fundamentals/page";

describe("JavaScript interview practice metadata", () => {
  it("names the practice and keeps saved work private", () => {
    const preview = JSON.stringify(metadata);

    expect(metadata.title).toBe(
      "Private JavaScript interview practice | Lovable Original",
    );
    expect(metadata.description).toContain("stay private");
    expect(preview).not.toMatch(
      /public answers|public profile|recruiter|hiring assessment|score|job placement/i,
    );
  });
});
