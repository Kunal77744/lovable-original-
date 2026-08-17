export type EditorSmartEditingResult = {
  value: string;
  selectionStart: number;
  selectionEnd: number;
};

const PAIRS = {
  "(": ")",
  "[": "]",
  "{": "}",
  '"': '"',
  "'": "'",
  "`": "`",
} as const;

const CLOSERS = new Set<string>(Object.values(PAIRS));
const QUOTES = new Set(['"', "'", "`"]);
const QUOTE_BOUNDARY = /[\s()[\]{}=,:;!?+\-*/%&|^~<>]/;

function clampSelection(value: string, position: number) {
  return Math.max(0, Math.min(position, value.length));
}

function canOpenQuote(value: string, position: number) {
  const previous = value[position - 1];
  const next = value[position];

  return (
    (previous === undefined || QUOTE_BOUNDARY.test(previous)) &&
    (next === undefined || QUOTE_BOUNDARY.test(next))
  );
}

export function applyEditorSmartEditing(
  value: string,
  selectionStart: number,
  selectionEnd: number,
  key: string,
): EditorSmartEditingResult | null {
  const start = clampSelection(value, Math.min(selectionStart, selectionEnd));
  const end = clampSelection(value, Math.max(selectionStart, selectionEnd));
  const hasSelection = start !== end;

  if (
    !hasSelection &&
    CLOSERS.has(key) &&
    value[start] === key
  ) {
    return {
      value,
      selectionStart: start + 1,
      selectionEnd: start + 1,
    };
  }

  if (key === "Backspace" && !hasSelection && start > 0) {
    const opener = value[start - 1] as keyof typeof PAIRS | undefined;

    if (opener && PAIRS[opener] === value[start]) {
      return {
        value: `${value.slice(0, start - 1)}${value.slice(start + 1)}`,
        selectionStart: start - 1,
        selectionEnd: start - 1,
      };
    }

    return null;
  }

  if (key === "Enter" && !hasSelection) {
    const lineStart = value.lastIndexOf("\n", start - 1) + 1;
    const indentation = value.slice(lineStart, start).match(/^[\t ]+/)?.[0];

    if (!indentation) return null;

    const nextValue = `${value.slice(0, start)}\n${indentation}${value.slice(start)}`;
    const nextPosition = start + indentation.length + 1;

    return {
      value: nextValue,
      selectionStart: nextPosition,
      selectionEnd: nextPosition,
    };
  }

  if (!(key in PAIRS)) return null;

  const opener = key as keyof typeof PAIRS;
  const closer = PAIRS[opener];

  if (hasSelection) {
    return {
      value: `${value.slice(0, start)}${opener}${value.slice(start, end)}${closer}${value.slice(end)}`,
      selectionStart: start + 1,
      selectionEnd: end + 1,
    };
  }

  if (QUOTES.has(opener) && !canOpenQuote(value, start)) return null;

  return {
    value: `${value.slice(0, start)}${opener}${closer}${value.slice(start)}`,
    selectionStart: start + 1,
    selectionEnd: start + 1,
  };
}
