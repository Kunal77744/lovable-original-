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

export const SECOND_LESSON = {
  id: "web-development-foundations-css-selectors-box-model",
  slug: "css-selectors-box-model",
  title: "Style a card without guessing",
  description:
    "Use CSS selectors and the box model to style a predictable learning card, then return to your saved practice after sign-in.",
  moduleTitle: "Module 2 · CSS foundations",
  position: 2,
  estimatedMinutes: 16,
} as const;

export const THIRD_LESSON = {
  id: "web-development-foundations-responsive-css-grid",
  slug: "responsive-css-grid",
  title: "Build a layout that adapts",
  description:
    "Use CSS Grid, minmax(), and gap to make a resource layout respond to available space, then recover the exact saved practice after sign-in.",
  moduleTitle: "Module 3 · Responsive layout",
  position: 3,
  estimatedMinutes: 17,
} as const;

export const FIRST_COURSE_LESSONS = [
  FIRST_LESSON,
  SECOND_LESSON,
  THIRD_LESSON,
] as const;

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
    prompt: "When is <article> a better choice than a generic <div>?",
    choices: [
      {
        id: "standalone",
        label:
          "When the content can stand on its own or be reused independently",
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

export const SECOND_LESSON_QUIZ: readonly GradedQuizQuestion[] = [
  {
    id: "class-selector",
    prompt: 'Which selector targets every element with class="learning-card"?',
    choices: [
      { id: "class", label: ".learning-card" },
      { id: "element", label: "learning-card" },
      { id: "id", label: "#learning-card" },
    ],
    correctChoiceId: "class",
    explanation:
      "A leading dot targets a class, so .learning-card matches every element carrying that class name.",
  },
  {
    id: "descendant-selector",
    prompt: "What does .learning-card strong select?",
    choices: [
      {
        id: "nested-strong",
        label: "Every <strong> element inside .learning-card",
      },
      {
        id: "both-classes",
        label: "Elements with both learning-card and strong classes",
      },
      { id: "next-strong", label: "Only the next <strong> sibling" },
    ],
    correctChoiceId: "nested-strong",
    explanation:
      "The space creates a descendant selector: strong elements anywhere inside .learning-card are matched.",
  },
  {
    id: "box-width",
    prompt: "With box-sizing: border-box, what does width: 280px include?",
    choices: [
      {
        id: "whole-box",
        label: "Content, padding, and border inside the declared width",
      },
      { id: "content-only", label: "Only the content width" },
      { id: "margin", label: "Content, padding, border, and margin" },
    ],
    correctChoiceId: "whole-box",
    explanation:
      "border-box keeps padding and border inside the declared width; margin always remains outside it.",
  },
  {
    id: "spacing-choice",
    prompt: "Which property creates space between a card’s content and border?",
    choices: [
      { id: "padding", label: "padding" },
      { id: "margin", label: "margin" },
      { id: "outline", label: "outline" },
    ],
    correctChoiceId: "padding",
    explanation:
      "Padding creates inner space between content and border; margin separates the entire element from its neighbours.",
  },
] as const;

export const THIRD_LESSON_QUIZ: readonly GradedQuizQuestion[] = [
  {
    id: "grid-container",
    prompt: "What does display: grid change on .resource-grid?",
    choices: [
      {
        id: "children",
        label: "It arranges the container’s direct children as grid items",
      },
      { id: "text", label: "It turns every child into inline text" },
      { id: "viewport", label: "It fixes the page to one viewport width" },
    ],
    correctChoiceId: "children",
    explanation:
      "display: grid creates a grid formatting context for the container’s direct children.",
  },
  {
    id: "minmax-purpose",
    prompt: "What does minmax(14rem, 1fr) describe?",
    choices: [
      {
        id: "range",
        label: "A track that stays at least 14rem and can share extra space",
      },
      { id: "fixed", label: "A track that is always exactly 14rem" },
      { id: "margin", label: "A 14rem margin around every card" },
    ],
    correctChoiceId: "range",
    explanation:
      "minmax() gives the track a readable minimum while 1fr lets it grow with available space.",
  },
  {
    id: "auto-fit-purpose",
    prompt: "Why combine repeat() with auto-fit?",
    choices: [
      {
        id: "available-space",
        label:
          "The browser can fit as many useful tracks as the container allows",
      },
      { id: "three", label: "The layout always creates exactly three columns" },
      { id: "animation", label: "The cards animate when the page loads" },
    ],
    correctChoiceId: "available-space",
    explanation:
      "auto-fit responds to the container by adding or collapsing tracks as room changes.",
  },
  {
    id: "gap-choice",
    prompt: "Why is gap a strong choice for space between grid cards?",
    choices: [
      {
        id: "container-rule",
        label: "One container rule spaces every row and column consistently",
      },
      { id: "content", label: "It adds padding inside each card’s content" },
      { id: "width", label: "It sets the minimum width of each card" },
    ],
    correctChoiceId: "container-rule",
    explanation:
      "gap belongs to the layout relationship, so it spaces tracks without per-card edge exceptions.",
  },
] as const;

export const FIRST_LESSON_PASS_PERCENT = 75;

export type LessonRevision = {
  title: string;
  introduction: string;
  outlineTitle: string;
  workspaceLink: {
    href: string;
    label: string;
  };
  mindMap: {
    title: string;
    introduction: string;
    center: {
      label: string;
      detail: string;
    };
    branches: readonly {
      id: string;
      label: string;
      detail: string;
      concepts: readonly string[];
      selfCheck: string;
    }[];
  };
  summary: readonly {
    label: string;
    detail: string;
  }[];
  flashcards: readonly {
    id: string;
    prompt: string;
    answer: string;
  }[];
};

export const FIRST_LESSON_REVISION = {
  title: "Semantic HTML, compressed",
  introduction:
    "A strong page has a readable outline before it has a visual design. Revisit the four decisions that make that outline useful.",
  outlineTitle: "Trace the page from structure to self-check.",
  workspaceLink: {
    href: "#semantic-workspace",
    label: "Return to your article",
  },
  mindMap: {
    title: "How the structure connects",
    introduction:
      "Start with a page the browser understands, then trace each decision back to the article you built.",
    center: {
      label: "Semantic HTML",
      detail: "A page the browser understands",
    },
    branches: [
      {
        id: "document-structure",
        label: "Document structure",
        detail:
          "The page establishes its language and separates metadata from visible content.",
        concepts: ['<html lang="en">', "<head> metadata", "<body> content"],
        selfCheck: "Can a browser identify the language and visible document?",
      },
      {
        id: "semantic-landmarks",
        label: "Semantic landmarks",
        detail: "Major regions name their purpose before styling is applied.",
        concepts: [
          "<header> introduces",
          "<main> focuses",
          "<footer> supports",
        ],
        selfCheck: "Is the article inside one clear <main> landmark?",
      },
      {
        id: "heading-outline",
        label: "Heading outline",
        detail:
          "Headings turn the page topic and its direct sections into a readable hierarchy.",
        concepts: [
          "One page <h1>",
          "Direct sections use <h2>",
          "Levels show hierarchy",
        ],
        selfCheck: "Can someone scan the headings and understand the article?",
      },
      {
        id: "article-assignment",
        label: "Article assignment",
        detail:
          "The saved build combines standalone content with themed sections.",
        concepts: [
          "<article> stands alone",
          "<section> groups a theme",
          "Each element has a job",
        ],
        selfCheck: "Can you explain why every structural element is there?",
      },
    ],
  },
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
      detail: "Use one clear <h1>, then <h2> headings for its direct sections.",
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
      prompt: 'Why add lang="en" to the <html> element?',
      answer:
        "It tells assistive technology which pronunciation rules to use, making the page easier to understand.",
    },
  ],
} as const satisfies LessonRevision;

export const SECOND_LESSON_REVISION = {
  title: "CSS selectors and boxes, compressed",
  introduction:
    "Predictable CSS starts with two questions: what does this rule target, and which part of the box does it change? Revisit both before styling by feel.",
  outlineTitle: "Trace the card from selector to final width.",
  workspaceLink: {
    href: "#css-practice",
    label: "Return to your card",
  },
  mindMap: {
    title: "How the card stays predictable",
    introduction:
      "Start with the element you mean to change, then trace how each spacing layer contributes to the box you see.",
    center: {
      label: "Predictable CSS",
      detail: "Target the right element and account for its box",
    },
    branches: [
      {
        id: "class-selector",
        label: "Class selector",
        detail:
          "A leading dot matches every element carrying that class name.",
        concepts: [".learning-card", "class=\"learning-card\"", "Reusable target"],
        selfCheck: "Can you point to every element this class selector matches?",
      },
      {
        id: "descendant-selector",
        label: "Descendant scope",
        detail:
          "A space limits the right-hand selector to elements inside the left-hand match.",
        concepts: [
          ".learning-card strong",
          "Read right to left",
          "Keep rules local",
        ],
        selfCheck: "Will this rule leave strong elements outside the card alone?",
      },
      {
        id: "inner-spacing",
        label: "Inner spacing",
        detail:
          "Padding sits between content and border; the border marks the box edge.",
        concepts: ["content", "padding", "border"],
        selfCheck: "Which property creates space inside the card edge?",
      },
      {
        id: "outer-size",
        label: "Outer size",
        detail:
          "Margin separates boxes, while border-box keeps padding and border inside the declared width.",
        concepts: ["margin", "box-sizing: border-box", "width: 280px"],
        selfCheck: "Does the declared width include the padding and border?",
      },
    ],
  },
  summary: [
    {
      label: "Target",
      detail:
        "Use .learning-card to match the class instead of styling every article or relying on an id.",
    },
    {
      label: "Scope",
      detail:
        "Use a descendant selector when a rule should apply only inside one component.",
    },
    {
      label: "Space",
      detail:
        "Padding creates inner space; margin separates the complete box from its neighbours.",
    },
    {
      label: "Size",
      detail:
        "Use border-box when padding and border must remain inside the declared width.",
    },
  ],
  flashcards: [
    {
      id: "class-syntax",
      prompt: "What does .learning-card select?",
      answer:
        "Every element whose class list includes learning-card. The leading dot identifies a class selector.",
    },
    {
      id: "descendant-scope",
      prompt: "How do you read .learning-card strong?",
      answer:
        "Find a strong element, then confirm it sits anywhere inside an element with the learning-card class.",
    },
    {
      id: "padding-margin",
      prompt: "When should you use padding instead of margin?",
      answer:
        "Use padding for space between content and its border. Use margin to separate the entire box from neighbouring boxes.",
    },
    {
      id: "border-box",
      prompt: "What changes when box-sizing is border-box?",
      answer:
        "The declared width includes content, padding, and border. Margin still remains outside that width.",
    },
    {
      id: "selector-debug",
      prompt: "What should you check first when a CSS rule affects the wrong element?",
      answer:
        "Trace the selector from right to left and identify every element it can match before changing any property values.",
    },
  ],
} as const satisfies LessonRevision;

export const THIRD_LESSON_REVISION = {
  title: "Responsive CSS Grid, compressed",
  introduction:
    "A responsive layout describes how cards share available space. Revisit the four rules that let one grid adapt without a device list.",
  outlineTitle: "Trace the grid from container to shrinking card.",
  workspaceLink: {
    href: "#responsive-css-practice",
    label: "Return to your layout",
  },
  mindMap: {
    title: "How the layout adapts",
    introduction:
      "Start with the grid container, then trace how track bounds, available space, and spacing work together.",
    center: {
      label: "Responsive grid",
      detail: "Let the container decide how many useful tracks fit",
    },
    branches: [
      {
        id: "grid-container",
        label: "Grid container",
        detail:
          "display: grid arranges the container’s direct children as grid items.",
        concepts: ["display: grid", ".resource-grid", "Direct children"],
        selfCheck: "Which element owns the layout relationship?",
      },
      {
        id: "track-range",
        label: "Track range",
        detail:
          "minmax() protects a readable minimum while 1fr shares extra inline space.",
        concepts: ["minmax(14rem, 1fr)", "Readable minimum", "Flexible maximum"],
        selfCheck: "Can each track shrink safely and still use spare space?",
      },
      {
        id: "available-tracks",
        label: "Available tracks",
        detail:
          "repeat() with auto-fit adds or collapses tracks as the container changes.",
        concepts: ["repeat()", "auto-fit", "No fixed column count"],
        selfCheck: "Will the browser choose the number of columns from available space?",
      },
      {
        id: "grid-spacing",
        label: "Grid spacing",
        detail:
          "gap spaces rows and columns consistently; min-width: 0 lets long content shrink.",
        concepts: ["gap: 1rem", "min-width: 0", "No overflow pressure"],
        selfCheck: "Can long card content shrink without widening the track?",
      },
    ],
  },
  summary: [
    {
      label: "Container",
      detail:
        "Apply display: grid to the parent whose direct children should become grid items.",
    },
    {
      label: "Tracks",
      detail:
        "Use minmax(14rem, 1fr) to pair a readable minimum with a flexible maximum.",
    },
    {
      label: "Fit",
      detail:
        "Combine repeat() and auto-fit so the container chooses how many useful tracks fit.",
    },
    {
      label: "Spacing",
      detail:
        "Use gap for the relationship between cards and min-width: 0 when content must shrink.",
    },
  ],
  flashcards: [
    {
      id: "grid-ownership",
      prompt: "What becomes a grid item after display: grid?",
      answer:
        "Each direct child of the grid container. Descendants inside those children keep their own layout unless another rule changes it.",
    },
    {
      id: "minmax-range",
      prompt: "What promise does minmax(14rem, 1fr) make?",
      answer:
        "A track should stay at least 14rem wide and may grow to share the available row space.",
    },
    {
      id: "auto-fit",
      prompt: "Why use auto-fit instead of choosing three columns?",
      answer:
        "auto-fit lets the browser add or collapse tracks from the container’s actual space instead of assuming one screen size.",
    },
    {
      id: "gap",
      prompt: "Why is gap better than adding a margin to every card?",
      answer:
        "The container applies one consistent rule between rows and columns without creating outer-edge exceptions.",
    },
    {
      id: "min-width-zero",
      prompt: "When does a grid item need min-width: 0?",
      answer:
        "Use it when long content might preserve its intrinsic width and force the track wider instead of shrinking inside the grid.",
    },
  ],
} as const satisfies LessonRevision;

export function getLessonRevision(lessonSlug: string): LessonRevision | null {
  if (lessonSlug === FIRST_LESSON.slug) {
    return FIRST_LESSON_REVISION;
  }

  if (lessonSlug === SECOND_LESSON.slug) {
    return SECOND_LESSON_REVISION;
  }

  if (lessonSlug === THIRD_LESSON.slug) {
    return THIRD_LESSON_REVISION;
  }

  return null;
}

export type QuizAnswers = Record<string, string>;

export type QuizAttemptReviewItem = {
  questionId: string;
  correct: boolean;
  explanation: string;
};

function getGradedLessonQuiz(lessonSlug: string) {
  if (lessonSlug === FIRST_LESSON.slug) {
    return FIRST_LESSON_QUIZ;
  }

  if (lessonSlug === SECOND_LESSON.slug) {
    return SECOND_LESSON_QUIZ;
  }

  if (lessonSlug === THIRD_LESSON.slug) {
    return THIRD_LESSON_QUIZ;
  }

  return null;
}

export function gradeLessonQuiz(lessonSlug: string, answers: QuizAnswers) {
  const quiz = getGradedLessonQuiz(lessonSlug);

  if (!quiz) {
    return {
      valid: false as const,
      error: "Lesson not found.",
    };
  }

  const answeredQuestionIds = Object.keys(answers);
  const knownQuestionIds = new Set(quiz.map((question) => question.id));

  if (
    answeredQuestionIds.length !== quiz.length ||
    answeredQuestionIds.some((questionId) => !knownQuestionIds.has(questionId))
  ) {
    return {
      valid: false as const,
      error: "Answer every question before checking your work.",
    };
  }

  const review: QuizAttemptReviewItem[] = quiz.map((question) => ({
    questionId: question.id,
    correct: answers[question.id] === question.correctChoiceId,
    explanation: question.explanation,
  }));
  const correctCount = review.filter((item) => item.correct).length;
  const score = Math.round((correctCount / quiz.length) * 100);

  return {
    valid: true as const,
    score,
    passed: score >= FIRST_LESSON_PASS_PERCENT,
    correctCount,
    totalCount: quiz.length,
    review,
  };
}

export function gradeFirstLessonQuiz(answers: QuizAnswers) {
  return gradeLessonQuiz(FIRST_LESSON.slug, answers);
}

export function getPublicLessonQuiz(
  lessonSlug: string,
): readonly QuizQuestion[] | null {
  const quiz = getGradedLessonQuiz(lessonSlug);

  return (
    quiz?.map(({ id, prompt, choices }) => ({
      id,
      prompt,
      choices,
    })) ?? null
  );
}

export function getPublicFirstLessonQuiz(): readonly QuizQuestion[] {
  return getPublicLessonQuiz(FIRST_LESSON.slug) ?? [];
}
