export type EditorCommentResult = {
  value: string;
  selectionStart: number;
  selectionEnd: number;
};

type LineChange = {
  index: number;
  removed: number;
  inserted: number;
};

function clampSelection(value: string, position: number) {
  return Math.max(0, Math.min(position, value.length));
}

function mapPosition(position: number, changes: LineChange[]) {
  let delta = 0;

  for (const change of changes) {
    if (change.removed === 0) {
      if (position >= change.index) {
        delta += change.inserted;
      }
      continue;
    }

    if (position < change.index) continue;

    if (position <= change.index + change.removed) {
      return change.index + delta + change.inserted;
    }

    delta += change.inserted - change.removed;
  }

  return position + delta;
}

export function toggleEditorLineComments(
  value: string,
  selectionStart: number,
  selectionEnd: number,
): EditorCommentResult {
  const start = clampSelection(value, Math.min(selectionStart, selectionEnd));
  const end = clampSelection(value, Math.max(selectionStart, selectionEnd));
  const lineStart = value.lastIndexOf("\n", start - 1) + 1;
  const blockEnd = end > lineStart && value[end - 1] === "\n" ? end - 1 : end;
  const nextLineBreak = value.indexOf("\n", blockEnd);
  const replacementEnd =
    nextLineBreak === -1 ? value.length : nextLineBreak;
  const lines = value.slice(lineStart, replacementEnd).split("\n");
  const nonBlankLines = lines.filter((line) => !/^\s*$/.test(line));

  if (nonBlankLines.length === 0) {
    return { value, selectionStart: start, selectionEnd: end };
  }

  const shouldUncomment = nonBlankLines.every((line) =>
    /^[ \t]*\/\//.test(line),
  );
  const changes: LineChange[] = [];
  let sourceOffset = lineStart;

  const nextLines = lines.map((line) => {
    if (/^\s*$/.test(line)) {
      sourceOffset += line.length + 1;
      return line;
    }

    if (shouldUncomment) {
      const match = line.match(/^([ \t]*)\/\//);
      const indentation = match?.[1] ?? "";
      const commentStart = indentation.length;
      const hasFollowingSpace = line[commentStart + 2] === " ";
      const removed = hasFollowingSpace ? 3 : 2;

      changes.push({
        index: sourceOffset + commentStart,
        removed,
        inserted: 0,
      });
      sourceOffset += line.length + 1;
      return `${indentation}${line.slice(commentStart + removed)}`;
    }

    const indentation = line.match(/^[ \t]*/)?.[0] ?? "";
    changes.push({
      index: sourceOffset + indentation.length,
      removed: 0,
      inserted: 3,
    });
    sourceOffset += line.length + 1;
    return `${indentation}// ${line.slice(indentation.length)}`;
  });

  return {
    value: `${value.slice(0, lineStart)}${nextLines.join("\n")}${value.slice(replacementEnd)}`,
    selectionStart: mapPosition(start, changes),
    selectionEnd: mapPosition(end, changes),
  };
}
