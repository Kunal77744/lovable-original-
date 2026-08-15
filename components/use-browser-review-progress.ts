"use client";

import { useEffect, useMemo, useState } from "react";

type ReviewItem = {
  id: string;
  options: Array<{ id: string }>;
};

type StoredReviewProgress = {
  version: 1;
  itemSignature: string;
  questionIndex: number;
  selectedOptionId: string | null;
  checkedOptionId: string | null;
  correctCount: number;
};

function getStorageKey(reviewId: string, studentScope: string) {
  return `lovable-original:private-review:v1:${encodeURIComponent(studentScope)}:${reviewId}`;
}

function getItemSignature(items: ReviewItem[]) {
  return items
    .map((item) => `${item.id}:${item.options.map((option) => option.id).join(",")}`)
    .join("|");
}

function readStoredProgress(
  storageKey: string,
  itemSignature: string,
  items: ReviewItem[],
): StoredReviewProgress | null {
  try {
    const rawValue = window.localStorage.getItem(storageKey);
    if (!rawValue) return null;

    const stored = JSON.parse(rawValue) as Partial<StoredReviewProgress>;
    if (
      stored.version !== 1 ||
      stored.itemSignature !== itemSignature ||
      !Number.isInteger(stored.questionIndex) ||
      typeof stored.questionIndex !== "number" ||
      stored.questionIndex < 0 ||
      stored.questionIndex >= items.length ||
      !Number.isInteger(stored.correctCount) ||
      typeof stored.correctCount !== "number" ||
      stored.correctCount < 0 ||
      stored.correctCount > stored.questionIndex + 1
    ) {
      return null;
    }

    const currentOptions = new Set(
      items[stored.questionIndex].options.map((option) => option.id),
    );
    const selectedOptionId =
      typeof stored.selectedOptionId === "string" &&
      currentOptions.has(stored.selectedOptionId)
        ? stored.selectedOptionId
        : null;
    const checkedOptionId =
      typeof stored.checkedOptionId === "string" &&
      stored.checkedOptionId === selectedOptionId
        ? stored.checkedOptionId
        : null;

    if (stored.checkedOptionId && !checkedOptionId) return null;

    return {
      version: 1,
      itemSignature,
      questionIndex: stored.questionIndex,
      selectedOptionId,
      checkedOptionId,
      correctCount: stored.correctCount,
    };
  } catch {
    return null;
  }
}

export function useBrowserReviewProgress({
  reviewId,
  studentScope,
  items,
  completed,
}: {
  reviewId: string;
  studentScope: string;
  items: ReviewItem[];
  completed: boolean;
}) {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [checkedOptionId, setCheckedOptionId] = useState<string | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const [recovered, setRecovered] = useState(false);
  const itemSignature = useMemo(() => getItemSignature(items), [items]);
  const storageKey = useMemo(
    () => getStorageKey(reviewId, studentScope),
    [reviewId, studentScope],
  );

  useEffect(() => {
    if (completed) {
      try {
        window.localStorage.removeItem(storageKey);
      } catch {
        // A saved review remains complete when browser storage is unavailable.
      }
      return;
    }

    const stored = readStoredProgress(storageKey, itemSignature, items);
    const restoreTimer = window.setTimeout(() => {
      if (stored) {
        setQuestionIndex(stored.questionIndex);
        setSelectedOptionId(stored.selectedOptionId);
        setCheckedOptionId(stored.checkedOptionId);
        setCorrectCount(stored.correctCount);
        setRecovered(
          stored.questionIndex > 0 || stored.selectedOptionId !== null,
        );
      }
      setHydrated(true);
    }, 0);

    return () => window.clearTimeout(restoreTimer);
  }, [completed, itemSignature, items, storageKey]);

  useEffect(() => {
    if (!hydrated || completed) return;

    try {
      const isPristine =
        questionIndex === 0 &&
        selectedOptionId === null &&
        checkedOptionId === null &&
        correctCount === 0;
      if (isPristine) {
        window.localStorage.removeItem(storageKey);
        return;
      }

      const progress: StoredReviewProgress = {
        version: 1,
        itemSignature,
        questionIndex,
        selectedOptionId,
        checkedOptionId,
        correctCount,
      };
      window.localStorage.setItem(storageKey, JSON.stringify(progress));
    } catch {
      // The in-memory review remains usable when browser storage is unavailable.
    }
  }, [
    checkedOptionId,
    completed,
    correctCount,
    hydrated,
    itemSignature,
    questionIndex,
    selectedOptionId,
    storageKey,
  ]);

  return {
    checkedOptionId,
    correctCount,
    questionIndex,
    recovered,
    selectedOptionId,
    setCheckedOptionId,
    setCorrectCount,
    setQuestionIndex,
    setSelectedOptionId,
  };
}
