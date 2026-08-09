import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ProjectFeedback } from "./project-feedback";

const analyticsMocks = vi.hoisted(() => ({
  captureLearnerEventOnce: vi.fn(),
  captureProjectCompleted: vi.fn(),
}));

vi.mock("@/lib/product-analytics", () => analyticsMocks);

describe("ProjectFeedback", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    analyticsMocks.captureLearnerEventOnce.mockReset();
    analyticsMocks.captureProjectCompleted.mockReset();
  });

  afterEach(cleanup);

  it("saves private feedback without sending its text to analytics", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        feedback: {
          confidence: "confident",
          comment: "I hesitated on the aside.",
          updatedAt: "2026-07-28T16:00:00.000Z",
        },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <ProjectFeedback
        projectSlug="semantic-html-article"
        initialFeedback={null}
      />,
    );

    fireEvent.click(screen.getByLabelText("Confident"));
    fireEvent.change(
      screen.getByPlaceholderText("One step, check, or idea that felt unclear"),
      { target: { value: "I hesitated on the aside." } },
    );
    fireEvent.click(screen.getByRole("button", { name: "Save feedback" }));

    await waitFor(() =>
      expect(screen.getByText(/private feedback is saved/i)).toBeInTheDocument(),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/projects/semantic-html-article/feedback",
      expect.objectContaining({
        body: JSON.stringify({
          confidence: "confident",
          comment: "I hesitated on the aside.",
        }),
      }),
    );
    expect(analyticsMocks.captureLearnerEventOnce).not.toHaveBeenCalled();
    expect(analyticsMocks.captureProjectCompleted).not.toHaveBeenCalled();
    expect(
      JSON.stringify([
        analyticsMocks.captureLearnerEventOnce.mock.calls,
        analyticsMocks.captureProjectCompleted.mock.calls,
      ]),
    ).not.toContain("I hesitated on the aside.");
  });

  it("recovers and revises the saved account response", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        feedback: {
          confidence: "confident",
          comment: "Headings make sense now.",
          updatedAt: "2026-07-28T16:05:00.000Z",
        },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <ProjectFeedback
        projectSlug="semantic-html-article"
        initialFeedback={{
          confidence: "somewhat",
          comment: "Heading levels were unclear.",
          updatedAt: "2026-07-28T16:00:00.000Z",
        }}
      />,
    );

    expect(screen.getByLabelText("Somewhat")).toBeChecked();
    expect(
      screen.getByDisplayValue("Heading levels were unclear."),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("Confident"));
    fireEvent.change(screen.getByDisplayValue("Heading levels were unclear."), {
      target: { value: "Headings make sense now." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Update feedback" }));

    await waitFor(() =>
      expect(
        screen.getByDisplayValue("Headings make sense now."),
      ).toBeInTheDocument(),
    );
    expect(screen.getByText("Saved")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/projects/semantic-html-article/feedback",
      expect.objectContaining({
        body: JSON.stringify({
          confidence: "confident",
          comment: "Headings make sense now.",
        }),
      }),
    );
  });

  it("keeps newer project feedback unsaved when an older save finishes late", async () => {
    let resolveFirstSave: (response: Response) => void = () => undefined;
    const firstSave = new Promise<Response>((resolve) => {
      resolveFirstSave = resolve;
    });
    const fetchMock = vi
      .fn()
      .mockReturnValueOnce(firstSave)
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            feedback: {
              confidence: "confident",
              comment: "The updated structure is clear.",
              updatedAt: "2026-08-09T12:05:00.000Z",
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      );
    vi.stubGlobal("fetch", fetchMock);

    render(
      <ProjectFeedback
        projectSlug="semantic-html-article"
        initialFeedback={null}
      />,
    );

    const comment = screen.getByPlaceholderText(
      "One step, check, or idea that felt unclear",
    );
    fireEvent.click(screen.getByLabelText("Somewhat"));
    fireEvent.change(comment, {
      target: { value: "The first structure was confusing." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save feedback" }));

    fireEvent.click(screen.getByLabelText("Confident"));
    fireEvent.change(comment, {
      target: { value: "The updated structure is clear." },
    });
    resolveFirstSave(
      new Response(
        JSON.stringify({
          feedback: {
            confidence: "somewhat",
            comment: "The first structure was confusing.",
            updatedAt: "2026-08-09T12:04:00.000Z",
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    expect(
      await screen.findByText(
        "Your earlier feedback is saved. Newer changes are still unsaved.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Confident")).toBeChecked();
    expect(comment).toHaveValue("The updated structure is clear.");

    fireEvent.click(screen.getByRole("button", { name: "Update feedback" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "/api/projects/semantic-html-article/feedback",
      expect.objectContaining({
        body: JSON.stringify({
          confidence: "confident",
          comment: "The updated structure is clear.",
        }),
      }),
    );
  });
});
