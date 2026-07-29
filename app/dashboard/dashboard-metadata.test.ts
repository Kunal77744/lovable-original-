import { describe, expect, it, vi } from "vitest";

vi.mock("@/db/course", () => ({
  getOrCreateFirstCourseAssignment: vi.fn(),
}));

vi.mock("@/db/coding-practice", () => ({
  getCodingCatalogProgress: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

import { metadata } from "./page";

describe("student dashboard metadata", () => {
  it("keeps private learner progress out of search results and link discovery", () => {
    expect(metadata.robots).toEqual({
      index: false,
      follow: false,
    });
  });
});
