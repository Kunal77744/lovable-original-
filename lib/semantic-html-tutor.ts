import { FIRST_LESSON_REVISION } from "./first-course-content";

export const SEMANTIC_HTML_TUTOR_MAX_LENGTH = 280;

export const SEMANTIC_HTML_TUTOR_SUGGESTIONS = [
  "When should I use <article>?",
  "What belongs inside <main>?",
  'Why add lang="en"?',
] as const;

export type SemanticHtmlTutorResponse =
  | {
      status: "supported";
      answer: string;
      source: string;
      selfCheck: string;
    }
  | {
      status: "unsupported" | "unsafe";
      answer: string;
    };

type LessonTopic = {
  source: string;
  answer: string;
  selfCheck: string;
  phrases: readonly string[];
  keywords: readonly string[];
  strongKeywords: readonly string[];
};

const summary = FIRST_LESSON_REVISION.summary;
const flashcards = FIRST_LESSON_REVISION.flashcards;

const LESSON_TOPICS: readonly LessonTopic[] = [
  {
    source: "Lesson 02 · Choose elements by purpose",
    answer: `${flashcards[1].answer} ${summary[2].detail}`,
    selfCheck:
      "Could this content stand alone, or is it one themed part of a larger page?",
    phrases: [
      "when should i use article",
      "article vs section",
      "article or section",
      "section vs article",
      "section or article",
      "article vs div",
      "article or div",
    ],
    keywords: ["article", "section", "div", "standalone", "themed"],
    strongKeywords: ["article", "section", "div"],
  },
  {
    source: "Lesson 02 · Semantic landmarks",
    answer: flashcards[0].answer,
    selfCheck: "Is the article inside one clear <main> landmark?",
    phrases: ["what belongs inside main", "what goes in main", "main landmark"],
    keywords: ["main", "primary", "unique", "landmark", "content"],
    strongKeywords: ["main"],
  },
  {
    source: "Lesson 02 · Semantic landmarks",
    answer: summary[1].detail,
    selfCheck:
      "Can you point to the region that introduces, focuses, and supports the page?",
    phrases: ["semantic landmark", "page landmark", "header main footer"],
    keywords: ["header", "main", "footer", "landmark", "region", "purpose"],
    strongKeywords: ["header", "footer", "landmark"],
  },
  {
    source: "Lesson 03 · Build a heading outline",
    answer: `${summary[3].detail} ${flashcards[2].answer}`,
    selfCheck:
      "Can someone scan the headings and understand the article without seeing the styling?",
    phrases: [
      "heading hierarchy",
      "heading outline",
      "h1 and h2",
      "h1 vs h2",
      "heading level",
    ],
    keywords: ["heading", "h1", "h2", "hierarchy", "outline", "level"],
    strongKeywords: ["heading", "h1", "h2"],
  },
  {
    source: "Lesson 01 · Start with a valid document",
    answer: summary[0].detail,
    selfCheck:
      "Can a browser identify the language, metadata, and visible document content?",
    phrases: ["document structure", "html skeleton", "head and body"],
    keywords: ["document", "html", "head", "body", "metadata", "skeleton"],
    strongKeywords: ["head", "body", "metadata", "skeleton"],
  },
  {
    source: "Lesson 01 · Why the language matters",
    answer: flashcards[4].answer,
    selfCheck:
      'Does the opening <html> element declare the page language with lang="en"?',
    phrases: [
      "lang en",
      "language attribute",
      "why add lang",
      "why use lang",
    ],
    keywords: [
      "lang",
      "language",
      "pronunciation",
      "assistive",
      "screenreader",
      "screenreaders",
    ],
    strongKeywords: ["lang", "language"],
  },
  {
    source: "Lesson 01 · Meaning before styling",
    answer:
      "Semantic HTML gives the document useful meaning before visual styling or JavaScript runs. Browsers, search engines, keyboards, and assistive technology can use that structure.",
    selfCheck:
      "Can you name the job each structural element performs before thinking about how it looks?",
    phrases: [
      "why semantic html",
      "benefit of semantic html",
      "meaning before styling",
      "why use semantic",
    ],
    keywords: [
      "semantic",
      "meaning",
      "accessible",
      "accessibility",
      "browser",
      "search",
      "styling",
      "css",
    ],
    strongKeywords: ["semantic", "accessibility"],
  },
] as const;

const UNSAFE_PATTERNS = [
  /\bignore (all |the |your )?(previous|prior|course|system) (instructions|rules|boundary|prompt)\b/i,
  /\b(system prompt|hidden instructions|developer message|reveal your prompt)\b/i,
  /\b(bypass|jailbreak|override) (the |your )?(safety|guardrails|rules|boundary|filter)\b/i,
  /\b(run|execute|eval|install|download|fetch|open) (this |my |the )?(code|script|command|url|file|package)\b/i,
  /\b(steal|exfiltrate|leak|dump|hack) (a |the |my |user )?(password|credential|secret|token|account|database|data)\b/i,
] as const;

const OUT_OF_SCOPE_PATTERNS = [
  /\b(javascript|typescript|react|next\.?js|python|java|sql|database|backend|server|api)\b/i,
  /\b(weather|stock price|medical|legal|tax|password|credential)\b/i,
] as const;

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "can",
  "do",
  "does",
  "for",
  "how",
  "i",
  "in",
  "is",
  "it",
  "of",
  "on",
  "should",
  "the",
  "to",
  "use",
  "what",
  "when",
  "why",
  "with",
]);

function normalizeQuestion(question: string) {
  return question
    .toLowerCase()
    .replace(/<\s*([a-z0-9]+)[^>]*>/g, "$1")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function questionTokens(question: string) {
  return new Set(
    normalizeQuestion(question)
      .split(" ")
      .filter((token) => token.length > 1 && !STOP_WORDS.has(token)),
  );
}

function scoreTopic(
  normalizedQuestion: string,
  tokens: ReadonlySet<string>,
  topic: LessonTopic,
) {
  const phraseScore = topic.phrases.some((phrase) =>
    normalizedQuestion.includes(phrase),
  )
    ? 4
    : 0;
  const keywordScore = topic.keywords.reduce(
    (score, keyword) => score + (tokens.has(keyword) ? 1 : 0),
    0,
  );
  const strongKeywordScore = topic.strongKeywords.some((keyword) =>
    tokens.has(keyword),
  )
    ? 1
    : 0;

  return phraseScore + keywordScore + strongKeywordScore;
}

export function answerSemanticHtmlQuestion(
  question: string,
): SemanticHtmlTutorResponse {
  const trimmedQuestion = question.trim();

  if (UNSAFE_PATTERNS.some((pattern) => pattern.test(trimmedQuestion))) {
    return {
      status: "unsafe",
      answer:
        "I can’t help with bypassing safeguards, revealing hidden instructions, running code, or accessing systems. This tutor stays inside the semantic HTML lesson.",
    };
  }

  if (
    trimmedQuestion.length < 3 ||
    trimmedQuestion.length > SEMANTIC_HTML_TUTOR_MAX_LENGTH ||
    OUT_OF_SCOPE_PATTERNS.some((pattern) => pattern.test(trimmedQuestion))
  ) {
    return {
      status: "unsupported",
      answer:
        'I can only answer from this semantic HTML lesson. Try asking about document structure, landmarks, <article> versus <section>, heading hierarchy, or lang="en".',
    };
  }

  const normalizedQuestion = normalizeQuestion(trimmedQuestion);
  const tokens = questionTokens(trimmedQuestion);
  const rankedTopics = LESSON_TOPICS.map((topic) => ({
    topic,
    score: scoreTopic(normalizedQuestion, tokens, topic),
  })).sort((left, right) => right.score - left.score);
  const bestMatch = rankedTopics[0];

  if (!bestMatch || bestMatch.score < 2) {
    return {
      status: "unsupported",
      answer:
        'I can only answer from this semantic HTML lesson. Try asking about document structure, landmarks, <article> versus <section>, heading hierarchy, or lang="en".',
    };
  }

  return {
    status: "supported",
    answer: bestMatch.topic.answer,
    source: bestMatch.topic.source,
    selfCheck: bestMatch.topic.selfCheck,
  };
}
