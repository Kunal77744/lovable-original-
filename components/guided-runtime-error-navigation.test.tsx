import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { GuidedRuntimeErrorNavigation } from "@/components/guided-runtime-error-navigation";

const source = [
  "function solve(input) {",
  "  const value = Number(input);",
  "  return missing(value);",
  "}",
].join("\n");

afterEach(cleanup);

describe("GuidedRuntimeErrorNavigation", () => {
  it("focuses the exact learner offset from a current runtime failure", () => {
    render(
      <>
        <textarea aria-label="Guided JavaScript source" id="guided-source" value={source} readOnly />
        <GuidedRuntimeErrorNavigation
          currentSource={source}
          editorId="guided-source"
          failedSource={source}
          message="Line 3, column 10: missing is not defined"
        />
      </>,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Open line 3, column 10 in the editor",
      }),
    );

    const editor = screen.getByLabelText("Guided JavaScript source");
    expect(editor).toHaveFocus();
    expect(editor).toHaveProperty("selectionStart", source.indexOf("missing"));
    expect(editor).toHaveProperty("selectionEnd", source.indexOf("missing"));
  });

  it.each([
    ["a generic runner failure", source, "The browser runner is unavailable."],
    ["an invalid location", source, "Line 99, column 1: stopped"],
    ["a stale result", `${source}\n// newer edit`, "Line 3, column 10: stopped"],
  ])("keeps %s non-actionable", (_, currentSource, message) => {
    render(
      <GuidedRuntimeErrorNavigation
        currentSource={currentSource}
        editorId="guided-source"
        failedSource={source}
        message={message}
      />,
    );

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
