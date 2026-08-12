export type EditorIndentationResult = {
  value: string;
  selectionStart: number;
  selectionEnd: number;
};

const INDENT = "  ";

function clampSelection(value: string, position: number) {
  return Math.max(0, Math.min(position, value.length));
}

function removeLineIndent(line: string) {
  if (line.startsWith("\t")) {
    return { line: line.slice(1), removed: 1 };
  }

  const spaces = line.match(/^ {1,2}/)?.[0].length ?? 0;
  return { line: line.slice(spaces), removed: spaces };
}

export function applyEditorIndentation(
  value: string,
  selectionStart: number,
  selectionEnd: number,
  outdent = false,
): EditorIndentationResult {
  const start = clampSelection(value, Math.min(selectionStart, selectionEnd));
  const end = clampSelection(value, Math.max(selectionStart, selectionEnd));

  if (!outdent && start === end) {
    return {
      value: `${value.slice(0, start)}${INDENT}${value.slice(end)}`,
      selectionStart: start + INDENT.length,
      selectionEnd: start + INDENT.length,
    };
  }

  const lineStart = value.lastIndexOf("\n", start - 1) + 1;
  const blockEnd = end > lineStart && value[end - 1] === "\n" ? end - 1 : end;
  const nextLineBreak = outdent ? value.indexOf("\n", blockEnd) : -1;
  const replacementEnd =
    outdent && nextLineBreak !== blockEnd
      ? nextLineBreak === -1
        ? value.length
        : nextLineBreak
      : blockEnd;
  const selectedBlock = value.slice(lineStart, replacementEnd);
  const lines = selectedBlock.split("\n");

  if (!outdent) {
    const nextBlock = lines.map((line) => `${INDENT}${line}`).join("\n");
    const addedCharacters = INDENT.length * lines.length;

    return {
      value: `${value.slice(0, lineStart)}${nextBlock}${value.slice(blockEnd)}`,
      selectionStart: start + INDENT.length,
      selectionEnd: end + addedCharacters,
    };
  }

  const outdentedLines = lines.map(removeLineIndent);
  const removedCharacters = outdentedLines.reduce(
    (total, result) => total + result.removed,
    0,
  );

  if (removedCharacters === 0) {
    return { value, selectionStart: start, selectionEnd: end };
  }

  const firstLineRemoved = outdentedLines[0]?.removed ?? 0;
  return {
    value: `${value.slice(0, lineStart)}${outdentedLines
      .map((result) => result.line)
      .join("\n")}${value.slice(replacementEnd)}`,
    selectionStart: Math.max(lineStart, start - firstLineRemoved),
    selectionEnd: Math.max(lineStart, end - removedCharacters),
  };
}
