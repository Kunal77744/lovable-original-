import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { GuidedJavaScriptCodeEditor } from "@/components/guided-javascript-code-editor";

function EditorHarness({ initialValue = "" }: { initialValue?: string }) {
  const [value, setValue] = useState(initialValue);

  return (
    <GuidedJavaScriptCodeEditor
      id="guided-code"
      label="Guided JavaScript code"
      value={value}
      onChange={setValue}
      maxLength={20_000}
    />
  );
}

function getEditor() {
  return screen.getByRole("textbox", {
    name: "Guided JavaScript code",
  }) as HTMLTextAreaElement;
}

afterEach(cleanup);

describe("GuidedJavaScriptCodeEditor", () => {
  it("describes the keyboard model accessibly", () => {
    render(<EditorHarness />);

    expect(getEditor()).toHaveAccessibleDescription(
      "Tab/Shift+Tab indent · Ctrl/⌘ / comments · Smart pairs · Esc then Tab exits",
    );
    expect(getEditor()).toHaveAttribute("maxlength", "20000");
    expect(getEditor()).toHaveAttribute("spellcheck", "false");
  });

  it("indents and outdents a selected block", () => {
    render(<EditorHarness initialValue={"const one = 1;\nconst two = 2;"} />);
    const editor = getEditor();
    editor.setSelectionRange(0, editor.value.length);

    fireEvent.keyDown(editor, { key: "Tab" });
    expect(editor).toHaveValue("  const one = 1;\n  const two = 2;");

    editor.setSelectionRange(0, editor.value.length);
    fireEvent.keyDown(editor, { key: "Tab", shiftKey: true });
    expect(editor).toHaveValue("const one = 1;\nconst two = 2;");
  });

  it("toggles line comments with Control or Command slash", () => {
    render(<EditorHarness initialValue={"const answer = 42;"} />);
    const editor = getEditor();
    editor.setSelectionRange(0, 0);

    fireEvent.keyDown(editor, { key: "/", ctrlKey: true });
    expect(editor).toHaveValue("// const answer = 42;");

    fireEvent.keyDown(editor, { key: "/", metaKey: true });
    expect(editor).toHaveValue("const answer = 42;");
  });

  it("wraps selections and handles pairs, closer overtyping, and paired deletion", () => {
    render(<EditorHarness initialValue="total" />);
    const editor = getEditor();
    editor.setSelectionRange(0, editor.value.length);

    fireEvent.keyDown(editor, { key: "(" });
    expect(editor).toHaveValue("(total)");
    expect(editor.selectionStart).toBe(1);
    expect(editor.selectionEnd).toBe(6);

    editor.setSelectionRange(editor.value.length, editor.value.length);
    fireEvent.keyDown(editor, { key: "[" });
    expect(editor).toHaveValue("(total)[]");
    expect(editor.selectionStart).toBe(8);

    fireEvent.keyDown(editor, { key: "]" });
    expect(editor).toHaveValue("(total)[]");
    expect(editor.selectionStart).toBe(9);

    editor.setSelectionRange(8, 8);
    fireEvent.keyDown(editor, { key: "Backspace" });
    expect(editor).toHaveValue("(total)");
  });

  it("preserves indentation on Enter", () => {
    render(<EditorHarness initialValue={"  return answer;"} />);
    const editor = getEditor();
    editor.setSelectionRange(editor.value.length, editor.value.length);

    fireEvent.keyDown(editor, { key: "Enter" });

    expect(editor).toHaveValue("  return answer;\n  ");
    expect(editor.selectionStart).toBe(editor.value.length);
  });

  it("allows one native Tab after Escape", () => {
    render(<EditorHarness initialValue="const answer = 42;" />);
    const editor = getEditor();

    fireEvent.keyDown(editor, { key: "Escape" });
    const exitEvent = new KeyboardEvent("keydown", {
      bubbles: true,
      cancelable: true,
      key: "Tab",
    });
    editor.dispatchEvent(exitEvent);

    expect(exitEvent.defaultPrevented).toBe(false);
    expect(editor).toHaveValue("const answer = 42;");
  });

  it("leaves modified and repeated smart-editing keys to the browser", () => {
    render(<EditorHarness initialValue="const answer = 42;" />);
    const editor = getEditor();

    fireEvent.keyDown(editor, { key: "(", ctrlKey: true });
    fireEvent.keyDown(editor, { key: "[", repeat: true });

    expect(editor).toHaveValue("const answer = 42;");
  });

  it("keeps normal edits on the existing controlled change path", () => {
    render(<EditorHarness initialValue="const answer = 42;" />);

    fireEvent.change(getEditor(), {
      target: { value: "const answer = 43;" },
    });

    expect(getEditor()).toHaveValue("const answer = 43;");
  });
});
