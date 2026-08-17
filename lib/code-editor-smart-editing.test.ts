import { describe, expect, it } from "vitest";
import { applyEditorSmartEditing } from "./code-editor-smart-editing";

describe("applyEditorSmartEditing", () => {
  it.each([
    ["(", ")"],
    ["[", "]"],
    ["{", "}"],
    ['"', '"'],
    ["'", "'"],
    ["`", "`"],
  ])("closes %s with %s and keeps the caret inside", (opener, closer) => {
    expect(applyEditorSmartEditing("return ", 7, 7, opener)).toEqual({
      value: `return ${opener}${closer}`,
      selectionStart: 8,
      selectionEnd: 8,
    });
  });

  it.each([
    ["(", ")"],
    ["[", "]"],
    ["{", "}"],
    ['"', '"'],
    ["'", "'"],
    ["`", "`"],
  ])("wraps a selection with %s and %s", (opener, closer) => {
    expect(applyEditorSmartEditing("return input;", 7, 12, opener)).toEqual({
      value: `return ${opener}input${closer};`,
      selectionStart: 8,
      selectionEnd: 13,
    });
  });

  it.each([")", "]", "}", '"', "'", "`"])(
    "moves over an existing %s without duplicating it",
    (closer) => {
      expect(applyEditorSmartEditing(`value${closer}`, 5, 5, closer)).toEqual({
        value: `value${closer}`,
        selectionStart: 6,
        selectionEnd: 6,
      });
    },
  );

  it.each([
    ["(", ")"],
    ["[", "]"],
    ["{", "}"],
    ['"', '"'],
    ["'", "'"],
    ["`", "`"],
  ])("removes an untouched %s%s pair together", (opener, closer) => {
    expect(
      applyEditorSmartEditing(`return ${opener}${closer};`, 8, 8, "Backspace"),
    ).toEqual({
      value: "return ;",
      selectionStart: 7,
      selectionEnd: 7,
    });
  });

  it("carries current-line spaces onto a new line", () => {
    expect(
      applyEditorSmartEditing("  return input;", 9, 9, "Enter"),
    ).toEqual({
      value: "  return \n  input;",
      selectionStart: 12,
      selectionEnd: 12,
    });
  });

  it("carries a current-line tab onto a new line", () => {
    expect(applyEditorSmartEditing("\treturn input;", 7, 7, "Enter")).toEqual({
      value: "\treturn\n\t input;",
      selectionStart: 9,
      selectionEnd: 9,
    });
  });

  it("leaves unindented Enter to the native textarea", () => {
    expect(applyEditorSmartEditing("return input;", 6, 6, "Enter")).toBeNull();
  });

  it("leaves ambiguous quotes inside identifiers to the native textarea", () => {
    expect(applyEditorSmartEditing("learner", 4, 4, "'")).toBeNull();
    expect(applyEditorSmartEditing("answer", 0, 0, '"')).toBeNull();
  });

  it("leaves destructive selection keys to the native textarea", () => {
    expect(
      applyEditorSmartEditing("return input;", 7, 12, "Backspace"),
    ).toBeNull();
    expect(applyEditorSmartEditing("  return input;", 2, 8, "Enter")).toBeNull();
  });
});
