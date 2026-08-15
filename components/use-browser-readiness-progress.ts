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
import type { JavaScriptReadinessQuestion } from "@/lib/javascript-readiness";

type StoredReadinessProgress = {
  version: 1;
  questionSignature: string;
  questionIndex: number;
  answers: Record<string, string>;
};

function getStorageKey(studentScope: string) {
  return [
    "lovable-original:private-javascript-readiness:v1",
    encodeURIComponent(studentScope),
  ].join(":");
}

function getQuestionSignature(
  questions: readonly JavaScriptReadinessQuestion[],
) {
  return JSON.stringify(
    questions.map((question) => ({
      id: question.id,
      optionIds: question.options.map((option) => option.id),
    })),
  );
}

function readStoredProgress({
  questionSignature,
  questions,
  storageKey,
}: {
  questionSignature: string;
  questions: readonly JavaScriptReadinessQuestion[];
  storageKey: string;
}) {
  try {
    const rawValue = window.localStorage.getItem(storageKey);
    if (!rawValue) return null;

    const stored = JSON.parse(rawValue) as Partial<StoredReadinessProgress>;
    if (
      stored.version !== 1 ||
      stored.questionSignature !== questionSignature ||
      !Number.isInteger(stored.questionIndex) ||
      stored.questionIndex! < 0 ||
      stored.questionIndex! >= questions.length ||
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
        new Set(question.options.map((option) => option.id)),
      ]),
    );
    const answers = Object.fromEntries(
      answerEntries.filter(([questionId, optionId]) =>
        choicesByQuestion.get(questionId)?.has(optionId),
      ),
    );

    if (Object.keys(answers).length !== answerEntries.length) return null;

    return {
      answers,
      questionIndex: stored.questionIndex!,
    };
  } catch {
    return null;
  }
}

export function useBrowserReadinessProgress({
  active,
  questions,
  studentScope,
}: {
  active: boolean;
  questions: readonly JavaScriptReadinessQuestion[];
  studentScope: string;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [questionIndex, setQuestionIndex] = useState(0);
  const [hasHydrated, setHasHydrated] = useState(false);
  const [recovered, setRecovered] = useState(false);
  const hasChangedProgress = useRef(false);
  const questionSignature = useMemo(
    () => getQuestionSignature(questions),
    [questions],
  );
  const storageKey = useMemo(
    () => getStorageKey(studentScope),
    [studentScope],
  );

  useEffect(() => {
    if (hasHydrated) return;

    const storedProgress = active
      ? readStoredProgress({ questionSignature, questions, storageKey })
      : null;
    const restoreTimer = window.setTimeout(() => {
      if (!hasChangedProgress.current && storedProgress) {
        setAnswers(storedProgress.answers);
        setQuestionIndex(storedProgress.questionIndex);
        setRecovered(true);
      }
      setHasHydrated(true);
    }, 0);

    return () => window.clearTimeout(restoreTimer);
  }, [active, hasHydrated, questionSignature, questions, storageKey]);

  useEffect(() => {
    if (!hasHydrated || active) return;

    try {
      window.localStorage.removeItem(storageKey);
    } catch {
      // The saved private result remains authoritative without browser storage.
    }
  }, [active, hasHydrated, storageKey]);

  useEffect(() => {
    if (!hasHydrated || !active) return;

    try {
      if (Object.keys(answers).length === 0) {
        window.localStorage.removeItem(storageKey);
        return;
      }

      const progress: StoredReadinessProgress = {
        version: 1,
        questionSignature,
        questionIndex,
        answers,
      };
      window.localStorage.setItem(storageKey, JSON.stringify(progress));
    } catch {
      // In-memory readiness choices remain usable without browser storage.
    }
  }, [active, answers, hasHydrated, questionIndex, questionSignature, storageKey]);

  const updateAnswers = useCallback<
    Dispatch<SetStateAction<Record<string, string>>>
  >((nextAnswers) => {
    hasChangedProgress.current = true;
    setRecovered(false);
    setAnswers(nextAnswers);
  }, []);

  const updateQuestionIndex = useCallback<Dispatch<SetStateAction<number>>>(
    (nextQuestionIndex) => {
      hasChangedProgress.current = true;
      setRecovered(false);
      setQuestionIndex(nextQuestionIndex);
    },
    [],
  );

  const resetProgress = useCallback(() => {
    hasChangedProgress.current = true;
    setAnswers({});
    setQuestionIndex(0);
    setRecovered(false);
  }, []);

  return {
    answers,
    questionIndex,
    recovered,
    resetProgress,
    setAnswers: updateAnswers,
    setQuestionIndex: updateQuestionIndex,
  };
}
