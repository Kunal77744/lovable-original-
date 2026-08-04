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

function testCaseRequest(inputs: unknown) {
  return new Request(
    "http://localhost/api/practice/sum-two-numbers/test-cases",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inputs }),
    },
  );
}

describe("practice test case route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects signed-out saves before touching private cases", async () => {
    mocks.getSession.mockResolvedValue(null);

    const response = await POST(testCaseRequest(["19 23"]), routeContext);

    expect(response.status).toBe(401);
    expect(mocks.saveCodingProblemTestCases).not.toHaveBeenCalled();
  });

  it("scopes exact cases to the current account", async () => {
    const inputs = ["  19 23\n", "-8 3"];
    mocks.getSession.mockResolvedValue({ user: { id: "student-a" } });
    mocks.saveCodingProblemTestCases.mockResolvedValue({
      inputs,
      updatedAt: "2026-08-04T10:00:00.000Z",
    });

    const response = await POST(testCaseRequest(inputs), routeContext);

    expect(response.status).toBe(200);
    expect(mocks.saveCodingProblemTestCases).toHaveBeenCalledWith(
      "student-a",
      "sum-two-numbers",
      inputs,
    );
    await expect(response.json()).resolves.toEqual({
      testCases: {
        inputs,
        updatedAt: "2026-08-04T10:00:00.000Z",
      },
    });
  });

  it("accepts an empty set to remove all saved cases", async () => {
    mocks.getSession.mockResolvedValue({ user: { id: "student-a" } });
    mocks.saveCodingProblemTestCases.mockResolvedValue({
      inputs: [],
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

  it("rejects invalid cases before private storage", async () => {
    mocks.getSession.mockResolvedValue({ user: { id: "student-a" } });

    const response = await POST(
      testCaseRequest(Array.from({ length: 7 }, (_, index) => `${index}`)),
      routeContext,
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Save up to 6 test cases per problem.",
    });
    expect(mocks.saveCodingProblemTestCases).not.toHaveBeenCalled();
  });
});
