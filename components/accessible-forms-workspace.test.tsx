import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AccessibleFormsWorkspace } from "./accessible-forms-workspace";

const initialChecks = [
  {
    id: "form-purpose" as const,
    label: "Put the controls inside one form",
    guidance: "Use one form.",
    passed: true,
  },
  {
    id: "email-label" as const,
    label: "Connect a visible label to the email field",
    guidance: "Match for and id.",
    passed: false,
  },
  {
    id: "email-input" as const,
    label: "Describe the email field precisely",
    guidance: "Use email and describedby.",
    passed: false,
  },
  {
    id: "choice-group" as const,
    label: "Name the related radio choices as one group",
    guidance: "Use fieldset and legend.",
    passed: false,
  },
  {
    id: "submit-action" as const,
    label: "Make the form action explicit",
    guidance: "Use a submit button.",
    passed: false,
  },
];

describe("AccessibleFormsWorkspace", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    window.localStorage.clear();
  });

  it("shows a sandboxed form preview without a working submission destination", () => {
    render(
      <AccessibleFormsWorkspace
        lessonSlug="accessible-html-forms"
        initialHtml='<form action="https://example.com"><input type="email" /></form>'
        initialChecks={initialChecks}
        initiallySaved={false}
      />,
    );

    const preview = screen.getByTitle("Accessible form live preview");
    expect(preview).toHaveAttribute("sandbox", "");
    expect(preview.getAttribute("srcdoc")).toContain("<form>");
    expect(preview.getAttribute("srcdoc")).not.toContain("example.com");
  });

  it("saves the exact source and replaces the rubric with the server result", async () => {
    const savedChecks = initialChecks.map((check) => ({ ...check, passed: true }));
    const source = '<form><button type="submit">Join</button></form>';
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        html: source,
        checks: savedChecks,
        saved: true,
        updatedAt: "2026-08-17T00:00:00.000Z",
        submission: {
          status: "completed",
          passedChecks: 5,
          totalChecks: 5,
          submittedAt: "2026-08-17T00:00:00.000Z",
        },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <AccessibleFormsWorkspace
        lessonSlug="accessible-html-forms"
        initialHtml="<form></form>"
        initialChecks={initialChecks}
        initiallySaved={false}
      />,
    );

    fireEvent.change(screen.getByLabelText("Accessible form HTML"), {
      target: { value: source },
    });
    fireEvent.click(screen.getByRole("button", { name: "Submit assignment" }));

    await waitFor(() =>
      expect(
        screen.getByText("Assignment complete. Your HTML and 5/5 result are saved."),
      ).toBeInTheDocument(),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/lessons/accessible-html-forms/workspace",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ html: source }),
      }),
    );
    expect(screen.getByLabelText("5 of 5 checks pass")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Download saved .html" }),
    ).toBeInTheDocument();
  });

  it("keeps signed-out work in the browser through exact account entry", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    render(
      <AccessibleFormsWorkspace
        lessonSlug="accessible-html-forms"
        initialHtml="<form></form>"
        initialChecks={initialChecks}
        initiallySaved={false}
        isSignedIn={false}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Submit assignment" }));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getByText(/draft has not left this browser/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Create account" })).toHaveAttribute(
      "href",
      "/account?next=%2Flearn%2Fweb-development-foundations%2Faccessible-html-forms",
    );
  });
});
