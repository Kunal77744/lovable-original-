import { describe, expect, it } from "vitest";
import { applyEditorIndentation } from "./code-editor-indentation";

describe("applyEditorIndentation", () => {
  it("inserts two spaces at a collapsed caret", () => {
    expect(applyEditorIndentation("return input;", 7, 7)).toEqual({
      value: "return   input;",
      selectionStart: 9,
      selectionEnd: 9,
    });
  });

  it("indents every selected line and preserves the selected source", () => {
    expect(applyEditorIndentation("const a = 1;\nreturn a;", 0, 22)).toEqual({
      value: "  const a = 1;\n  return a;",
      selectionStart: 2,
      selectionEnd: 26,
    });
  });

  it("does not indent the next line when a selection ends at its start", () => {
    expect(applyEditorIndentation("first\nsecond\nthird", 0, 13)).toEqual({
      value: "  first\n  second\nthird",
      selectionStart: 2,
      selectionEnd: 17,
    });
  });

  it("outdents spaces and tabs across a selected block", () => {
    expect(
      applyEditorIndentation("  const a = 1;\n\treturn a;", 2, 26, true),
    ).toEqual({
      value: "const a = 1;\nreturn a;",
      selectionStart: 0,
      selectionEnd: 22,
    });
  });

  it("outdents the current line without moving the caret before its start", () => {
    expect(applyEditorIndentation("  return input;", 1, 1, true)).toEqual({
      value: "return input;",
      selectionStart: 0,
      selectionEnd: 0,
    });
  });

  it("keeps unindented source unchanged", () => {
    expect(applyEditorIndentation("return input;", 6, 6, true)).toEqual({
      value: "return input;",
      selectionStart: 6,
      selectionEnd: 6,
    });
  });
});
