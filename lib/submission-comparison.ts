export type SubmissionDiffRow = {
  kind: "same" | "added" | "removed";
  previousLineNumber: number | null;
  currentLineNumber: number | null;
  previous: string | null;
  current: string | null;
};

type RawDiffRow = Omit<SubmissionDiffRow, "previousLineNumber" | "currentLineNumber">;

const MAX_LCS_CELLS = 40_000;

function alignByPosition(previousLines: string[], currentLines: string[]) {
  const rowCount = Math.max(previousLines.length, currentLines.length);
  const diff: RawDiffRow[] = [];

  for (let index = 0; index < rowCount; index += 1) {
    const previous = previousLines[index] ?? null;
    const current = currentLines[index] ?? null;

    if (previous === current) {
      diff.push({ kind: "same", previous, current });
      continue;
    }
    if (previous === null) {
      diff.push({ kind: "added", previous, current });
      continue;
    }
    if (current === null) {
      diff.push({ kind: "removed", previous, current });
      continue;
    }

    diff.push(
      { kind: "removed" as const, previous, current: null },
      { kind: "added" as const, previous: null, current },
    );
  }

  return diff;
}

function alignWithLongestCommonSubsequence(
  previousLines: string[],
  currentLines: string[],
) {
  const rows = previousLines.length + 1;
  const columns = currentLines.length + 1;
  const scores = Array.from({ length: rows }, () =>
    new Uint16Array(columns),
  );

  for (let previousIndex = previousLines.length - 1; previousIndex >= 0; previousIndex -= 1) {
    for (let currentIndex = currentLines.length - 1; currentIndex >= 0; currentIndex -= 1) {
      scores[previousIndex][currentIndex] =
        previousLines[previousIndex] === currentLines[currentIndex]
          ? scores[previousIndex + 1][currentIndex + 1] + 1
          : Math.max(
              scores[previousIndex + 1][currentIndex],
              scores[previousIndex][currentIndex + 1],
            );
    }
  }

  const diff: RawDiffRow[] = [];
  let previousIndex = 0;
  let currentIndex = 0;

  while (
    previousIndex < previousLines.length ||
    currentIndex < currentLines.length
  ) {
    if (
      previousIndex < previousLines.length &&
      currentIndex < currentLines.length &&
      previousLines[previousIndex] === currentLines[currentIndex]
    ) {
      diff.push({
        kind: "same",
        previous: previousLines[previousIndex],
        current: currentLines[currentIndex],
      });
      previousIndex += 1;
      currentIndex += 1;
      continue;
    }

    if (
      currentIndex < currentLines.length &&
      (previousIndex === previousLines.length ||
        scores[previousIndex][currentIndex + 1] >
          scores[previousIndex + 1][currentIndex])
    ) {
      diff.push({
        kind: "added",
        previous: null,
        current: currentLines[currentIndex],
      });
      currentIndex += 1;
      continue;
    }

    diff.push({
      kind: "removed",
      previous: previousLines[previousIndex],
      current: null,
    });
    previousIndex += 1;
  }

  return diff;
}

export function buildSubmissionLineDiff(
  previousSource: string,
  currentSource: string,
): SubmissionDiffRow[] {
  const previousLines = previousSource.split("\n");
  const currentLines = currentSource.split("\n");
  const rawDiff =
    previousLines.length * currentLines.length <= MAX_LCS_CELLS
      ? alignWithLongestCommonSubsequence(previousLines, currentLines)
      : alignByPosition(previousLines, currentLines);
  let previousLineNumber = 0;
  let currentLineNumber = 0;

  return rawDiff.map((row) => {
    if (row.previous !== null) previousLineNumber += 1;
    if (row.current !== null) currentLineNumber += 1;

    return {
      ...row,
      previousLineNumber: row.previous === null ? null : previousLineNumber,
      currentLineNumber: row.current === null ? null : currentLineNumber,
    };
  });
}

export function summarizeSubmissionDiff(diff: SubmissionDiffRow[]) {
  return diff.reduce(
    (summary, row) => {
      if (row.kind === "added") summary.added += 1;
      if (row.kind === "removed") summary.removed += 1;
      return summary;
    },
    { added: 0, removed: 0 },
  );
}
