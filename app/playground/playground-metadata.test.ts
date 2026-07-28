import { describe, expect, it, vi } from "vitest";

vi.mock("@/db/javascript-playground", () => ({
  getPlaygroundFile: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

import { metadata } from "./page";

describe("JavaScript playground metadata", () => {
  it("names the private saved workspace and prevents indexing", () => {
    const preview = JSON.stringify(metadata);

    expect(metadata.title).toBe(
      "Private saved JavaScript playground | Lovable Original",
    );
    expect(metadata.description).toBe(
      "Write, run, save, and restore one private JavaScript file in your account-only workspace.",
    );
    expect(metadata.robots).toEqual({
      index: false,
      follow: false,
    });
    expect(preview).not.toMatch(
      /packages|sharing|collaboration|public code|recruiter|hiring assessment/i,
    );
  });
});
