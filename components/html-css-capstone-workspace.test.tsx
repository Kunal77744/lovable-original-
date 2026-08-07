import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  HTML_CSS_CAPSTONE_STARTER_CSS,
  HTML_CSS_CAPSTONE_STARTER_HTML,
  type HtmlCssCapstoneRecord,
} from "@/lib/html-css-capstone";
import { HtmlCssCapstoneWorkspace } from "./html-css-capstone-workspace";

vi.mock("@/lib/product-analytics", () => ({ captureProjectCompleted: vi.fn() }));

const starter: HtmlCssCapstoneRecord = {
  html: HTML_CSS_CAPSTONE_STARTER_HTML,
  css: HTML_CSS_CAPSTONE_STARTER_CSS,
  saved: false,
  updatedAt: null,
  hasUnreviewedChanges: false,
  submission: null,
};

describe("HtmlCssCapstoneWorkspace", () => {
  beforeEach(() => vi.restoreAllMocks());
  afterEach(() => cleanup());

  it("keeps newer edits visibly unsaved when an older two-file save finishes", async () => {
    let resolveSave: ((value: Response) => void) | undefined;
    vi.stubGlobal("fetch", vi.fn().mockReturnValue(new Promise<Response>((resolve) => { resolveSave = resolve; })));
    render(<HtmlCssCapstoneWorkspace projectSlug="html-css-resource-library" initialProject={starter} />);
    const editor = screen.getByLabelText("Component CSS");
    fireEvent.change(editor, { target: { value: ".first {}" } });
    fireEvent.click(screen.getByRole("button", { name: "Save draft" }));
    fireEvent.change(editor, { target: { value: ".newer {}" } });
    resolveSave?.({
      ok: true,
      json: async () => ({ ...starter, css: ".first {}", saved: true }),
    } as Response);
    await waitFor(() => expect(screen.getByText("Your saved draft is safe. Newer edits are still unsaved.")).toBeInTheDocument());
    expect(editor).toHaveValue(".newer {}");
    expect(screen.getByRole("button", { name: "Save draft" })).toBeEnabled();
  });
});
