export type CodeEditorLocation = {
  line: number;
  column: number;
  cursorOffset: number;
};

const CODING_RUNNER_LOCATION_PATTERN = /^Line (\d+), column (\d+):/;

export function getCodeEditorLocation(
  source: string,
  message: string,
): CodeEditorLocation | null {
  const match = CODING_RUNNER_LOCATION_PATTERN.exec(message);
  if (!match) return null;

  const line = Number(match[1]);
  const column = Number(match[2]);
  const lines = source.split("\n");

  if (
    !Number.isSafeInteger(line) ||
    !Number.isSafeInteger(column) ||
    line < 1 ||
    column < 1 ||
    line > lines.length
  ) {
    return null;
  }

  const lineStart = lines
    .slice(0, line - 1)
    .reduce((offset, currentLine) => offset + currentLine.length + 1, 0);
  const lineLength = lines[line - 1]?.length ?? 0;
  const cursorOffset = lineStart + Math.min(column - 1, lineLength);

  return { line, column, cursorOffset };
}
