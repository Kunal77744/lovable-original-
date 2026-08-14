import { describe, expect, it } from "vitest";
import { toggleEditorLineComments } from "./code-editor-comments";

describe("toggleEditorLineComments", () => {
  it("comments and uncomments the current line at its indentation", () => {
    const commented = toggleEditorLineComments("  return input;", 9, 9);

    expect(commented).toEqual({
      value: "  // return input;",
      selectionStart: 12,
      selectionEnd: 12,
    });
    expect(
      toggleEditorLineComments(
        commented.value,
        commented.selectionStart,
        commented.selectionEnd,
      ),
    ).toEqual({
      value: "  return input;",
      selectionStart: 9,
      selectionEnd: 9,
    });
  });

  it("toggles every selected nonblank line and preserves blank lines", () => {
    const value = "const a = 1;\n\n  return a;";

    expect(toggleEditorLineComments(value, 0, value.length)).toEqual({
      value: "// const a = 1;\n\n  // return a;",
      selectionStart: 3,
      selectionEnd: value.length + 6,
    });
  });

  it("uncomments a block only when every nonblank line is commented", () => {
    const value = "// first\n  // second\n\n";

    expect(toggleEditorLineComments(value, 0, value.length)).toEqual({
      value: "first\n  second\n\n",
      selectionStart: 0,
      selectionEnd: value.length - 6,
    });
  });

  it("does not include the next line when selection ends at its start", () => {
    expect(toggleEditorLineComments("first\nsecond\nthird", 0, 13)).toEqual({
      value: "// first\n// second\nthird",
      selectionStart: 3,
      selectionEnd: 19,
    });
  });

  it("keeps a blank current line unchanged", () => {
    expect(toggleEditorLineComments("first\n   \nthird", 7, 7)).toEqual({
      value: "first\n   \nthird",
      selectionStart: 7,
      selectionEnd: 7,
    });
  });
});
