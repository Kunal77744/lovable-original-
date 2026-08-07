import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET, POST } from "./route";
import { getCssPracticeCatalogProgress } from "@/db/css-practice";
import {
  getHtmlCssCapstoneForStudent,
  saveHtmlCssCapstoneDraft,
  submitHtmlCssCapstone,
} from "@/db/html-css-capstone";
import { auth } from "@/lib/auth";

vi.mock("next/headers", () => ({ headers: vi.fn(async () => new Headers()) }));
vi.mock("@/lib/auth", () => ({ auth: { api: { getSession: vi.fn() } } }));
vi.mock("@/db/css-practice", () => ({ getCssPracticeCatalogProgress: vi.fn() }));
vi.mock("@/db/html-css-capstone", () => ({
  getHtmlCssCapstoneForStudent: vi.fn(),
  saveHtmlCssCapstoneDraft: vi.fn(),
  submitHtmlCssCapstone: vi.fn(),
}));

const getSession = vi.mocked(auth.api.getSession);
const completedCss = { completedCount: 6, totalCount: 6, completedSlugs: [], nextChallengeSlug: null };

describe("HTML and CSS capstone API", () => {
  beforeEach(() => vi.clearAllMocks());

  it("denies reads before sign in", async () => {
    getSession.mockResolvedValue(null);
    expect((await GET()).status).toBe(401);
    expect(getHtmlCssCapstoneForStudent).not.toHaveBeenCalled();
  });

  it("denies signed-in learners before all six CSS challenges", async () => {
    getSession.mockResolvedValue({ user: { id: "learner-1" } } as never);
    vi.mocked(getCssPracticeCatalogProgress).mockResolvedValue({ ...completedCss, completedCount: 5, nextChallengeSlug: "one" });
    expect((await GET()).status).toBe(403);
    expect(getHtmlCssCapstoneForStudent).not.toHaveBeenCalled();
  });

  it("saves both files only to the eligible signed-in account", async () => {
    getSession.mockResolvedValue({ user: { id: "learner-1" } } as never);
    vi.mocked(getCssPracticeCatalogProgress).mockResolvedValue(completedCss);
    vi.mocked(saveHtmlCssCapstoneDraft).mockResolvedValue({
      html: "<main></main>", css: "main {}", saved: true, updatedAt: null, hasUnreviewedChanges: false, submission: null,
    });
    const response = await POST(new Request("http://localhost/api/projects/html-css-resource-library", {
      method: "POST",
      body: JSON.stringify({ action: "save", html: "<main></main>", css: "main {}" }),
    }));
    expect(response.status).toBe(200);
    expect(saveHtmlCssCapstoneDraft).toHaveBeenCalledWith("learner-1", "<main></main>", "main {}");
    expect(submitHtmlCssCapstone).not.toHaveBeenCalled();
  });
});
