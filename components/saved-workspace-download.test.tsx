import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  savedWorkspaceFileContents,
  SavedWorkspaceDownload,
} from "./saved-workspace-download";

describe("SavedWorkspaceDownload", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("normalizes a saved source file with one trailing newline", () => {
    expect(savedWorkspaceFileContents("<main>Saved</main>")).toBe(
      "<main>Saved</main>\n",
    );
    expect(savedWorkspaceFileContents(".card {}\n")).toBe(".card {}\n");
  });

  it("downloads the exact saved source with the authored filename", () => {
    const createObjectURL = vi.fn().mockReturnValue("blob:saved-workspace");
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
      <SavedWorkspaceDownload
        fileName="semantic-html-article.html"
        label="Download saved .html"
        mimeType="text/html"
        source="<main>Saved article</main>"
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Download saved .html" }),
    );

    expect(createObjectURL).toHaveBeenCalledOnce();
    expect(createObjectURL.mock.calls[0]?.[0]).toBeInstanceOf(Blob);
    expect(click).toHaveBeenCalledOnce();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:saved-workspace");
    expect(
      screen.getByText("semantic-html-article.html downloaded."),
    ).toBeInTheDocument();
  });
});
