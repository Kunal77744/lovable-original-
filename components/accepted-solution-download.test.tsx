import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  acceptedSolutionFileContents,
  AcceptedSolutionDownload,
} from "./accepted-solution-download";

describe("AcceptedSolutionDownload", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("normalizes a downloaded source file with one trailing newline", () => {
    expect(acceptedSolutionFileContents("return 42;")).toBe("return 42;\n");
    expect(acceptedSolutionFileContents("return 42;\n")).toBe("return 42;\n");
  });

  it("downloads the latest Accepted source without changing it", () => {
    const createObjectURL = vi.fn().mockReturnValue("blob:accepted-source");
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
      <AcceptedSolutionDownload
        problemSlug="sum-two-numbers"
        problemTitle="Sum two numbers"
        source="function solve(input) { return input; }"
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Download Accepted .js" }),
    );

    expect(createObjectURL).toHaveBeenCalledOnce();
    expect(createObjectURL.mock.calls[0]?.[0]).toBeInstanceOf(Blob);
    expect(click).toHaveBeenCalledOnce();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:accepted-source");
    expect(
      screen.getByText("sum-two-numbers.accepted.js downloaded."),
    ).toBeInTheDocument();
  });
});
