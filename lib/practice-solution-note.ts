export const MAX_PRACTICE_SOLUTION_NOTE_LENGTH = 1_000;

export const MAX_PRACTICE_JOURNAL_FIELD_LENGTH = {
  inputShape: 180,
  edgeCase: 180,
  steps: 240,
  reflection: 280,
} as const;

export type PracticeJournal = {
  inputShape: string;
  edgeCase: string;
  steps: string;
  reflection: string;
};

export type SavedPracticeSolutionNote = {
  content: string;
  updatedAt: string;
};

const EMPTY_JOURNAL: PracticeJournal = {
  inputShape: "",
  edgeCase: "",
  steps: "",
  reflection: "",
};

export function parsePracticeJournal(content: string): PracticeJournal {
  try {
    const parsed = JSON.parse(content) as Record<string, unknown>;

    if (parsed.v !== 1) return { ...EMPTY_JOURNAL, reflection: content };

    return {
      inputShape: typeof parsed.i === "string" ? parsed.i : "",
      edgeCase: typeof parsed.e === "string" ? parsed.e : "",
      steps: typeof parsed.s === "string" ? parsed.s : "",
      reflection: typeof parsed.r === "string" ? parsed.r : "",
    };
  } catch {
    return { ...EMPTY_JOURNAL, reflection: content };
  }
}

export function serializePracticeJournal(journal: PracticeJournal) {
  return JSON.stringify({
    v: 1,
    i: journal.inputShape,
    e: journal.edgeCase,
    s: journal.steps,
    r: journal.reflection,
  });
}

export function validatePracticeSolutionNote(payload: unknown) {
  if (
    typeof payload !== "object" ||
    payload === null ||
    !("content" in payload) ||
    typeof payload.content !== "string"
  ) {
    return { valid: false as const, error: "Write a note before saving." };
  }

  if (payload.content.trim().length === 0) {
    return { valid: false as const, error: "Write a note before saving." };
  }

  if (payload.content.length > MAX_PRACTICE_SOLUTION_NOTE_LENGTH) {
    return {
      valid: false as const,
      error: `Keep your note within ${MAX_PRACTICE_SOLUTION_NOTE_LENGTH.toLocaleString()} characters.`,
    };
  }

  return { valid: true as const, content: payload.content };
}
