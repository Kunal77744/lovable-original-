import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn().mockResolvedValue({
        user: {
          id: "learner-1",
        },
      }),
    },
  },
}));

vi.mock("@/db/javascript-playground", () => ({
  getPlaygroundWorkspace: vi.fn().mockResolvedValue({
    files: [{
      id: "file-1",
      name: "playground.js",
      code: "console.log('private');",
      quickChecks: "double(4) === 8",
      updatedAt: null,
      isActive: true,
    }],
    activeFileId: "file-1",
  }),
}));

vi.mock("@/db/coding-practice", () => ({
  getCodingProblemForStudent: vi.fn().mockResolvedValue({
    latestAcceptedCode:
      "function solve(input) { return String(Number(input) * 2); }",
  }),
}));

vi.mock("@/components/javascript-playground", () => ({
  JavaScriptPlayground: ({
    initialFiles,
    acceptedTransfer,
    guidedCopyRequested,
  }: {
    initialFiles: Array<{ code: string; quickChecks: string }>;
    acceptedTransfer?: {
      problemTitle: string;
      source: string;
    } | null;
    guidedCopyRequested?: boolean;
  }) => (
    <section aria-label="JavaScript playground editor">
      <pre>{initialFiles[0].code}</pre>
      <pre>{initialFiles[0].quickChecks}</pre>
      {acceptedTransfer ? (
        <div>
          <span>{acceptedTransfer.problemTitle}</span>
          <pre>{acceptedTransfer.source}</pre>
        </div>
      ) : null}
      {guidedCopyRequested ? <span>Guided copy requested</span> : null}
    </section>
  ),
}));

import { getCodingProblemForStudent } from "@/db/coding-practice";
import PlaygroundPage, { metadata } from "./page";

describe("PlaygroundPage", () => {
  afterEach(cleanup);

  beforeEach(() => {
    vi.mocked(getCodingProblemForStudent).mockReset();
    vi.mocked(getCodingProblemForStudent).mockResolvedValue({
      latestAcceptedCode:
        "function solve(input) { return String(Number(input) * 2); }",
    } as never);
  });

  it("labels the saved workspace as private beside the page heading", async () => {
    render(await PlaygroundPage());

    const heading = screen.getByRole("heading", {
      level: 1,
      name: "Keep your JavaScript ideas together.",
    });
    const titleRow = heading.closest(".playground-title-row");
    const privateCue = titleRow?.querySelector(".playground-private-badge");

    expect(titleRow).not.toBeNull();
    expect(privateCue).toContainElement(
      screen.getByText("Private playground", { selector: "[aria-hidden]" }),
    );
    expect(privateCue).toHaveTextContent(
      "Saved code belongs only to your signed-in account.",
    );
    expect(screen.getByText("console.log('private');")).toBeInTheDocument();
    expect(screen.getByText("double(4) === 8")).toBeInTheDocument();
  });

  it("keeps the account-only page out of search", () => {
    expect(metadata.robots).toEqual({
      index: false,
      follow: false,
    });
  });

  it("offers only the signed-in learner's exact Accepted source", async () => {
    render(
      await PlaygroundPage({
        searchParams: Promise.resolve({ accepted_from: "even-or-odd" }),
      }),
    );

    expect(getCodingProblemForStudent).toHaveBeenCalledWith(
      "learner-1",
      "even-or-odd",
    );
    expect(screen.getByText("Even or odd")).toBeInTheDocument();
    expect(
      screen.getByText(
        "function solve(input) { return String(Number(input) * 2); }",
      ),
    ).toBeInTheDocument();
  });

  it("ignores invalid and non-Accepted transfer requests", async () => {
    vi.mocked(getCodingProblemForStudent).mockResolvedValueOnce({
      latestAcceptedCode: null,
    } as never);

    const nonAcceptedView = render(
      await PlaygroundPage({
        searchParams: Promise.resolve({ accepted_from: "even-or-odd" }),
      }),
    );

    expect(screen.queryByText("Even or odd")).not.toBeInTheDocument();
    nonAcceptedView.unmount();

    render(
      await PlaygroundPage({
        searchParams: Promise.resolve({ accepted_from: "not-a-real-problem" }),
      }),
    );

    expect(getCodingProblemForStudent).toHaveBeenCalledTimes(1);
  });

  it("passes the bounded guided-copy request without reading judged practice", async () => {
    render(
      await PlaygroundPage({
        searchParams: Promise.resolve({ guided_copy: "1" }),
      }),
    );

    expect(screen.getByText("Guided copy requested")).toBeInTheDocument();
    expect(getCodingProblemForStudent).not.toHaveBeenCalled();
  });
});
