export const FIRST_COURSE = {
  id: "web-development-foundations",
  slug: "web-development-foundations",
  title: "Web Development Foundations",
  description:
    "Build the browser-first skills behind accessible, job-ready interfaces.",
  status: "live",
} as const;

export const FIRST_LESSON = {
  id: "web-development-foundations-semantic-html",
  slug: "semantic-html",
  title: "Build a page the browser understands",
  description:
    "Use semantic HTML to turn a blank document into an accessible article page.",
  moduleTitle: "Module 1 · HTML foundations",
  position: 1,
  estimatedMinutes: 18,
} as const;

export const FIRST_COURSE_LESSONS = [FIRST_LESSON] as const;

export type QuizChoice = {
  id: string;
  label: string;
};

export type QuizQuestion = {
  id: string;
  prompt: string;
  choices: readonly QuizChoice[];
};

type GradedQuizQuestion = QuizQuestion & {
  correctChoiceId: string;
  explanation: string;
};

export const FIRST_LESSON_QUIZ: readonly GradedQuizQuestion[] = [
  {
    id: "main-landmark",
    prompt:
      "Which element should wrap the unique, primary content of this article page?",
    choices: [
      { id: "div", label: "<div>" },
      { id: "main", label: "<main>" },
      { id: "section", label: "<section>" },
    ],
    correctChoiceId: "main",
    explanation:
      "<main> identifies the page’s unique primary content for browsers and assistive technology.",
  },
  {
    id: "heading-order",
    prompt:
      "The page title is an <h1>. What is the clearest heading level for its direct sections?",
    choices: [
      { id: "h2", label: "<h2>" },
      { id: "h4", label: "<h4>" },
      { id: "strong", label: "<strong>" },
    ],
    correctChoiceId: "h2",
    explanation:
      "<h2> creates a logical child level beneath the page’s <h1>; heading levels describe structure, not visual size.",
  },
  {
    id: "article-choice",
    prompt:
      "When is <article> a better choice than a generic <div>?",
    choices: [
      {
        id: "standalone",
        label: "When the content can stand on its own or be reused independently",
      },
      {
        id: "green",
        label: "When the content needs a green background",
      },
      {
        id: "layout",
        label: "Whenever CSS Grid is used",
      },
    ],
    correctChoiceId: "standalone",
    explanation:
      "<article> communicates that a block is independently meaningful, such as a post, story, or product review.",
  },
  {
    id: "semantic-benefit",
    prompt: "What is the strongest reason to prefer semantic HTML?",
    choices: [
      {
        id: "meaning",
        label:
          "It gives content useful meaning before visual styling or JavaScript runs",
      },
      {
        id: "shorter",
        label: "It always produces fewer lines of code",
      },
      {
        id: "framework",
        label: "It is required only when using React",
      },
    ],
    correctChoiceId: "meaning",
    explanation:
      "Semantic elements expose a meaningful structure to browsers, search engines, keyboards, and assistive technology.",
  },
] as const;

export const FIRST_LESSON_PASS_PERCENT = 75;

export const FIRST_LESSON_REVISION = {
  title: "Semantic HTML, compressed",
  introduction:
    "A strong page has a readable outline before it has a visual design. Revisit the four decisions that make that outline useful.",
  summary: [
    {
      label: "Document",
      detail:
        "Set the language, keep metadata in <head>, and place visible content in <body>.",
    },
    {
      label: "Landmarks",
      detail:
        "Use <header>, <main>, and <footer> to name the page’s major regions.",
    },
    {
      label: "Content",
      detail:
        "Choose <article> for standalone work, <section> for a themed group, and <div> only when no meaningful element fits.",
    },
    {
      label: "Outline",
      detail:
        "Use one clear <h1>, then <h2> headings for its direct sections.",
    },
  ],
  flashcards: [
    {
      id: "main-purpose",
      prompt: "What belongs inside <main>?",
      answer:
        "The page’s unique primary content. Repeated navigation, site identity, and global footer content usually sit outside it.",
    },
    {
      id: "article-section",
      prompt: "How do <article> and <section> differ?",
      answer:
        "An <article> can stand on its own. A <section> groups one themed part of a larger page or article.",
    },
    {
      id: "heading-level",
      prompt: "Why should an <h2> follow the page’s <h1>?",
      answer:
        "It creates a logical child level in the document outline. Heading levels describe hierarchy, not font size.",
    },
    {
      id: "semantic-test",
      prompt: "What is the quickest test for choosing an HTML element?",
      answer:
        "Ask what job the content performs. If you can name that job, choose the element that communicates it before styling.",
    },
    {
      id: "language",
      prompt: "Why add lang=\"en\" to the <html> element?",
      answer:
        "It tells assistive technology which pronunciation rules to use, making the page easier to understand.",
    },
  ],
} as const;

export type QuizAnswers = Record<string, string>;

export function gradeFirstLessonQuiz(answers: QuizAnswers) {
  const answeredQuestionIds = Object.keys(answers);
  const knownQuestionIds = new Set(
    FIRST_LESSON_QUIZ.map((question) => question.id),
  );

  if (
    answeredQuestionIds.length !== FIRST_LESSON_QUIZ.length ||
    answeredQuestionIds.some((questionId) => !knownQuestionIds.has(questionId))
  ) {
    return {
      valid: false as const,
      error: "Answer every question before checking your work.",
    };
  }

  const correctCount = FIRST_LESSON_QUIZ.filter(
    (question) => answers[question.id] === question.correctChoiceId,
  ).length;
  const score = Math.round((correctCount / FIRST_LESSON_QUIZ.length) * 100);

  return {
    valid: true as const,
    score,
    passed: score >= FIRST_LESSON_PASS_PERCENT,
    correctCount,
    totalCount: FIRST_LESSON_QUIZ.length,
  };
}

export function getPublicFirstLessonQuiz(): readonly QuizQuestion[] {
  return FIRST_LESSON_QUIZ.map(({ id, prompt, choices }) => ({
    id,
    prompt,
    choices,
  }));
}
