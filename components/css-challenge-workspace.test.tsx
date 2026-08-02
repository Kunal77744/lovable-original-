import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getCssPracticeChallenge,
  gradeCssPracticeChallenge,
} from "@/lib/css-practice-challenges";
import { CssChallengeWorkspace } from "./css-challenge-workspace";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const challenge = getCssPracticeChallenge("class-selector")!;

describe("CssChallengeWorkspace", () => {
  it("keeps a signed-out attempt local and offers account creation", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    render(
      <CssChallengeWorkspace
        attempts={[]}
        bestVerdict={null}
        challenge={{
          slug: challenge.slug,
          title: challenge.title,
          checks: gradeCssPracticeChallenge(challenge.slug, challenge.starterCss)!,
        }}
        initialCss={challenge.starterCss}
        isSignedIn={false}
        nextChallengeSlug="class-selector"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Check and save attempt" }));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getByText(/create a free account to check and save/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Create account" })).toHaveAttribute(
      "href",
      "/account",
    );
  });

  it("saves an attempt, renders exact checks, and continues to the next step", async () => {
    const completedCss = `.learning-card {
      background: #ffffff;
      color: #17231e;
    }`;
    const checks = gradeCssPracticeChallenge(challenge.slug, completedCss)!;
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: "attempt-one",
        verdict: "Completed",
        bestVerdict: "Completed",
        checks,
        passedChecks: 3,
        totalChecks: 3,
        completedCount: 1,
        totalCount: 6,
        nextChallengeSlug: "descendant-selector",
        createdAt: "2026-08-02T00:00:00.000Z",
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <CssChallengeWorkspace
        attempts={[]}
        bestVerdict={null}
        challenge={{
          slug: challenge.slug,
          title: challenge.title,
          checks: gradeCssPracticeChallenge(challenge.slug, completedCss)!,
        }}
        initialCss={completedCss}
        isSignedIn
        nextChallengeSlug="class-selector"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Check and save attempt" }));

    await waitFor(() =>
      expect(screen.getByText(/CSS and result are saved/i)).toBeInTheDocument(),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/practice/css/class-selector",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ mode: "submit", css: completedCss }),
      }),
    );
    expect(screen.getAllByText("Completed")).toHaveLength(2);
    expect(
      screen.getByRole("link", { name: /continue to the next unfinished challenge/i }),
    ).toHaveAttribute("href", "/practice/css/descendant-selector");
  });
});
