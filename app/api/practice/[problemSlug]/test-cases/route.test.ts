import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  saveCodingProblemTestCases: vi.fn(),
}));

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers()),
}));

vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: mocks.getSession } },
}));

vi.mock("@/db/coding-practice", () => ({
  saveCodingProblemTestCases: mocks.saveCodingProblemTestCases,
}));

import { POST } from "./route";

const routeContext = {
  params: Promise.resolve({ problemSlug: "sum-two-numbers" }),
};

function testCaseRequest(cases: unknown, legacy = false) {
  return new Request(
    "http://localhost/api/practice/sum-two-numbers/test-cases",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(legacy ? { inputs: cases } : { cases }),
    },
  );
}

describe("practice test case route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects signed-out saves before touching private cases", async () => {
    mocks.getSession.mockResolvedValue(null);

    const response = await POST(
      testCaseRequest([{ input: "19 23", expectedOutput: null }]),
      routeContext,
    );

    expect(response.status).toBe(401);
    expect(mocks.saveCodingProblemTestCases).not.toHaveBeenCalled();
  });

  it("scopes exact cases to the current account", async () => {
    const cases = [
      { input: "  19 23\n", expectedOutput: "42" },
      { input: "-8 3", expectedOutput: null },
    ];
    mocks.getSession.mockResolvedValue({ user: { id: "student-a" } });
    mocks.saveCodingProblemTestCases.mockResolvedValue({
      cases,
      updatedAt: "2026-08-04T10:00:00.000Z",
    });

    const response = await POST(testCaseRequest(cases), routeContext);

    expect(response.status).toBe(200);
    expect(mocks.saveCodingProblemTestCases).toHaveBeenCalledWith(
      "student-a",
      "sum-two-numbers",
      cases,
    );
    await expect(response.json()).resolves.toEqual({
      testCases: {
        cases,
        updatedAt: "2026-08-04T10:00:00.000Z",
      },
    });
  });

  it("accepts an empty set to remove all saved cases", async () => {
    mocks.getSession.mockResolvedValue({ user: { id: "student-a" } });
    mocks.saveCodingProblemTestCases.mockResolvedValue({
      cases: [],
      updatedAt: "2026-08-04T10:01:00.000Z",
    });

    const response = await POST(testCaseRequest([]), routeContext);

    expect(response.status).toBe(200);
    expect(mocks.saveCodingProblemTestCases).toHaveBeenCalledWith(
      "student-a",
      "sum-two-numbers",
      [],
    );
  });

  it("keeps input-only requests compatible without adding expectations", async () => {
    mocks.getSession.mockResolvedValue({ user: { id: "student-a" } });
    mocks.saveCodingProblemTestCases.mockResolvedValue({
      cases: [{ input: "19 23", expectedOutput: null }],
      updatedAt: "2026-08-04T10:01:00.000Z",
    });

    const response = await POST(testCaseRequest(["19 23"], true), routeContext);

    expect(response.status).toBe(200);
    expect(mocks.saveCodingProblemTestCases).toHaveBeenCalledWith(
      "student-a",
      "sum-two-numbers",
      [{ input: "19 23", expectedOutput: null }],
    );
  });

  it("rejects invalid cases before private storage", async () => {
    mocks.getSession.mockResolvedValue({ user: { id: "student-a" } });

    const response = await POST(
      testCaseRequest(
        Array.from({ length: 7 }, (_, index) => ({
          input: `${index}`,
          expectedOutput: null,
        })),
      ),
      routeContext,
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Save up to 6 test cases per problem.",
    });
    expect(mocks.saveCodingProblemTestCases).not.toHaveBeenCalled();
  });
});
