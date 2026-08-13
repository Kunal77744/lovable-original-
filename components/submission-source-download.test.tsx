import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  submissionSourceFileName,
  SubmissionSourceDownload,
} from "./submission-source-download";

describe("SubmissionSourceDownload", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("builds one problem-specific UTC filename for the selected attempt", () => {
    expect(
      submissionSourceFileName(
        "sum-two-numbers",
        "2026-08-04T10:30:00.123Z",
      ),
    ).toBe("sum-two-numbers.20260804-103000Z.js");
  });

  it("downloads the immutable submission source without changing it", () => {
    const createObjectURL = vi.fn().mockReturnValue("blob:submission-source");
    const revokeObjectURL = vi.fn();
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => undefined);
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: createObjectURL,
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: revokeObjectURL,
    });

    render(
      <SubmissionSourceDownload
        createdAt="2026-08-04T10:30:00.000Z"
        problemSlug="sum-two-numbers"
        problemTitle="Sum two numbers"
        source="function solve(input) { return input; }"
      />,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Download this submission .js",
      }),
    );

    expect(createObjectURL).toHaveBeenCalledOnce();
    expect(createObjectURL.mock.calls[0]?.[0]).toBeInstanceOf(Blob);
    expect(click).toHaveBeenCalledOnce();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:submission-source");
    expect(
      screen.getByText(
        "sum-two-numbers.20260804-103000Z.js downloaded.",
      ),
    ).toBeInTheDocument();
  });
});
