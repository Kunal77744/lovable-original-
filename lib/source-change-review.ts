export type SourceChange = {
  kind: "added" | "removed";
  lineNumber: number;
  content: string;
};

export type SourceChangeReview = {
  additions: number;
  removals: number;
  changes: SourceChange[];
  hiddenChangeCount: number;
  tooLarge: boolean;
};

const MAX_DIFF_LINES = 240;
const MAX_VISIBLE_CHANGES = 80;

function splitSourceLines(source: string) {
  return source.replace(/\r\n/g, "\n").split("\n");
}

export function getSourceChangeReview(
  originalSource: string,
  currentSource: string,
): SourceChangeReview {
  const originalLines = splitSourceLines(originalSource);
  const currentLines = splitSourceLines(currentSource);

  if (
    originalLines.length > MAX_DIFF_LINES ||
    currentLines.length > MAX_DIFF_LINES
  ) {
    return {
      additions: 0,
      removals: 0,
      changes: [],
      hiddenChangeCount: 0,
      tooLarge: true,
    };
  }

  const longestCommonSequence = Array.from(
    { length: originalLines.length + 1 },
    () => new Uint16Array(currentLines.length + 1),
  );

  for (let originalIndex = originalLines.length - 1; originalIndex >= 0; originalIndex -= 1) {
    for (let currentIndex = currentLines.length - 1; currentIndex >= 0; currentIndex -= 1) {
      longestCommonSequence[originalIndex][currentIndex] =
        originalLines[originalIndex] === currentLines[currentIndex]
          ? longestCommonSequence[originalIndex + 1][currentIndex + 1] + 1
          : Math.max(
              longestCommonSequence[originalIndex + 1][currentIndex],
              longestCommonSequence[originalIndex][currentIndex + 1],
            );
    }
  }

  const allChanges: SourceChange[] = [];
  let additions = 0;
  let removals = 0;
  let originalIndex = 0;
  let currentIndex = 0;

  while (
    originalIndex < originalLines.length ||
    currentIndex < currentLines.length
  ) {
    if (
      originalIndex < originalLines.length &&
      currentIndex < currentLines.length &&
      originalLines[originalIndex] === currentLines[currentIndex]
    ) {
      originalIndex += 1;
      currentIndex += 1;
      continue;
    }

    if (
      currentIndex < currentLines.length &&
      (originalIndex === originalLines.length ||
        longestCommonSequence[originalIndex][currentIndex + 1] >
          longestCommonSequence[originalIndex + 1][currentIndex])
    ) {
      additions += 1;
      allChanges.push({
        kind: "added",
        lineNumber: currentIndex + 1,
        content: currentLines[currentIndex],
      });
      currentIndex += 1;
      continue;
    }

    removals += 1;
    allChanges.push({
      kind: "removed",
      lineNumber: originalIndex + 1,
      content: originalLines[originalIndex],
    });
    originalIndex += 1;
  }

  return {
    additions,
    removals,
    changes: allChanges.slice(0, MAX_VISIBLE_CHANGES),
    hiddenChangeCount: Math.max(0, allChanges.length - MAX_VISIBLE_CHANGES),
    tooLarge: false,
  };
}
