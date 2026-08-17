import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  getGuidedLineNumberTransform,
  GuidedCodeEditor,
} from "@/components/guided-code-editor";

describe("GuidedCodeEditor", () => {
  it("keeps line numbers visual-only while the labelled editor remains accessible", () => {
    render(
      <>
        <label htmlFor="guided-source">Guided JavaScript source</label>
        <GuidedCodeEditor
          id="guided-source"
          onChange={() => undefined}
          value={"const total = 2;\n\nreturn total;"}
        />
      </>,
    );

    expect(screen.getByLabelText("Guided JavaScript source")).toHaveValue(
      "const total = 2;\n\nreturn total;",
    );

    const gutter = document.querySelector(
      ".guided-code-editor-line-numbers",
    );
    expect(gutter).toHaveAttribute("aria-hidden", "true");
    expect(gutter).toHaveTextContent("123");
  });

  it("updates the gutter with edits and calculates the matching scroll offset", () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <GuidedCodeEditor
        aria-label="JavaScript source"
        onChange={onChange}
        value={"first line"}
      />,
    );

    const editor = screen.getByLabelText("JavaScript source");
    fireEvent.change(editor, { target: { value: "first line\nsecond line" } });
    expect(onChange).toHaveBeenCalledOnce();

    rerender(
      <GuidedCodeEditor
        aria-label="JavaScript source"
        onChange={onChange}
        value={"first line\nsecond line"}
      />,
    );
    const gutter = document.querySelector(
      ".guided-code-editor-line-numbers",
    ) as HTMLDivElement;
    expect(gutter).toHaveTextContent("12");

    expect(getGuidedLineNumberTransform(42)).toBe("translateY(-42px)");
  });
});
