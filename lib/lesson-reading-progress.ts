export type LessonReadingSection = {
  id: string;
  label: string;
};

const SHARED_SECTION_IDS = [
  "lesson-idea",
  "lesson-section-2",
  "lesson-section-3",
] as const;

const SECTION_LABELS: Record<string, readonly [string, string, string]> = {
  "semantic-html": [
    "Document structure",
    "Semantic landmarks",
    "Heading hierarchy",
  ],
  "css-selectors-box-model": [
    "Class selectors",
    "Scoped selectors",
    "The box model",
  ],
  "responsive-css-grid": [
    "Layout relationships",
    "Flexible columns",
    "Grid spacing",
  ],
};

export const LESSON_READING_SECTION_COUNT = SHARED_SECTION_IDS.length;

export function getLessonReadingSections(
  lessonSlug: string,
): LessonReadingSection[] | null {
  const labels = SECTION_LABELS[lessonSlug];

  if (!labels) {
    return null;
  }

  return labels.map((label, index) => ({
    id: SHARED_SECTION_IDS[index],
    label,
  }));
}

export function isValidLessonReadingSection(section: unknown) {
  return (
    Number.isInteger(section) &&
    Number(section) >= 1 &&
    Number(section) <= LESSON_READING_SECTION_COUNT
  );
}
