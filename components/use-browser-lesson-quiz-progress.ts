"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import type { QuizQuestion } from "@/lib/first-course-content";

type StoredLessonQuizProgress = {
  version: 1;
  questionSignature: string;
  answers: Record<string, string>;
};

function getStorageKey({
  courseSlug,
  lessonSlug,
  studentScope,
}: {
  courseSlug: string;
  lessonSlug: string;
  studentScope: string;
}) {
  return [
    "lovable-original:private-lesson-quiz:v1",
    encodeURIComponent(studentScope),
    encodeURIComponent(courseSlug),
    encodeURIComponent(lessonSlug),
  ].join(":");
}

function getQuestionSignature(questions: readonly QuizQuestion[]) {
  return JSON.stringify(
    questions.map((question) => ({
      id: question.id,
      choiceIds: question.choices.map((choice) => choice.id),
    })),
  );
}

function readStoredAnswers({
  questionSignature,
  questions,
  storageKey,
}: {
  questionSignature: string;
  questions: readonly QuizQuestion[];
  storageKey: string;
}) {
  try {
    const rawValue = window.localStorage.getItem(storageKey);
    if (!rawValue) return null;

    const stored = JSON.parse(rawValue) as Partial<StoredLessonQuizProgress>;
    if (
      stored.version !== 1 ||
      stored.questionSignature !== questionSignature ||
      !stored.answers ||
      typeof stored.answers !== "object" ||
      Array.isArray(stored.answers)
    ) {
      return null;
    }

    const answerEntries = Object.entries(stored.answers);
    if (answerEntries.length === 0 || answerEntries.length > questions.length) {
      return null;
    }

    const choicesByQuestion = new Map(
      questions.map((question) => [
        question.id,
        new Set(question.choices.map((choice) => choice.id)),
      ]),
    );
    const answers = Object.fromEntries(
      answerEntries.filter(([questionId, choiceId]) =>
        choicesByQuestion.get(questionId)?.has(choiceId),
      ),
    );

    return Object.keys(answers).length === answerEntries.length
      ? answers
      : null;
  } catch {
    return null;
  }
}

export function useBrowserLessonQuizProgress({
  courseSlug,
  lessonSlug,
  questions,
  studentScope,
  hasGradedResult,
}: {
  courseSlug: string;
  lessonSlug: string;
  questions: readonly QuizQuestion[];
  studentScope: string | null;
  hasGradedResult: boolean;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [hasHydrated, setHasHydrated] = useState(false);
  const [recovered, setRecovered] = useState(false);
  const hasChangedAnswers = useRef(false);
  const questionSignature = useMemo(
    () => getQuestionSignature(questions),
    [questions],
  );
  const storageKey = useMemo(
    () =>
      studentScope
        ? getStorageKey({ courseSlug, lessonSlug, studentScope })
        : null,
    [courseSlug, lessonSlug, studentScope],
  );

  useEffect(() => {
    if (hasHydrated) return;

    const storedAnswers =
      storageKey && !hasGradedResult
        ? readStoredAnswers({ questionSignature, questions, storageKey })
        : null;

    const restoreTimer = window.setTimeout(() => {
      if (!hasChangedAnswers.current) {
        setAnswers(storedAnswers ?? {});
        setRecovered(Boolean(storedAnswers));
      }
      setHasHydrated(true);
    }, 0);

    return () => window.clearTimeout(restoreTimer);
  }, [hasGradedResult, hasHydrated, questionSignature, questions, storageKey]);

  useEffect(() => {
    if (!storageKey || !hasGradedResult) return;

    try {
      window.localStorage.removeItem(storageKey);
    } catch {
      // The saved private result remains authoritative without browser storage.
    }
  }, [hasGradedResult, storageKey]);

  useEffect(() => {
    if (!hasHydrated || !storageKey || hasGradedResult) return;

    try {
      if (Object.keys(answers).length === 0) {
        window.localStorage.removeItem(storageKey);
        return;
      }

      const progress: StoredLessonQuizProgress = {
        version: 1,
        questionSignature,
        answers,
      };
      window.localStorage.setItem(storageKey, JSON.stringify(progress));
    } catch {
      // In-memory quiz choices remain usable without browser storage.
    }
  }, [answers, hasGradedResult, hasHydrated, questionSignature, storageKey]);

  const updateAnswers = useCallback<
    Dispatch<SetStateAction<Record<string, string>>>
  >((nextAnswers) => {
    hasChangedAnswers.current = true;
    setRecovered(false);
    setAnswers(nextAnswers);
  }, []);

  return { answers, recovered, setAnswers: updateAnswers };
}
