"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { FIRST_LESSON_REVISION } from "@/lib/first-course-content";

type RevisionPackProps = {
  lessonSlug: string;
  practiceHref?: string;
};

type StoredRevisionState = {
  cardIndex: number;
  checkedCardIds: string[];
};

function getStorageKey(lessonSlug: string) {
  return `lovable-original:revision:${lessonSlug}`;
}

export function RevisionPack({
  lessonSlug,
  practiceHref,
}: RevisionPackProps) {
  const cards = FIRST_LESSON_REVISION.flashcards;
  const [cardIndex, setCardIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [checkedCardIds, setCheckedCardIds] = useState<string[]>([]);
  const [hasRestored, setHasRestored] = useState(false);
  const revealButtonRef = useRef<HTMLButtonElement>(null);
  const shouldFocusCard = useRef(false);
  const currentCard = cards[cardIndex];

  useEffect(() => {
    let restoredIndex = 0;
    let restoredCheckedIds: string[] = [];

    try {
      const storedValue = window.localStorage.getItem(getStorageKey(lessonSlug));

      if (storedValue) {
        const storedState = JSON.parse(storedValue) as StoredRevisionState;
        restoredIndex =
          Number.isInteger(storedState.cardIndex) &&
          storedState.cardIndex >= 0 &&
          storedState.cardIndex < cards.length
            ? storedState.cardIndex
            : 0;
        const knownCardIds = new Set<string>(cards.map((card) => card.id));
        restoredCheckedIds = Array.isArray(storedState.checkedCardIds)
          ? storedState.checkedCardIds.filter((cardId) =>
              knownCardIds.has(cardId),
            )
          : [];
      }
    } catch {
      // Revision remains usable when browser storage is unavailable or invalid.
    }

    const restoreTimer = window.setTimeout(() => {
      setCardIndex(restoredIndex);
      setCheckedCardIds(restoredCheckedIds);
      setHasRestored(true);
    }, 0);

    return () => window.clearTimeout(restoreTimer);
  }, [cards, lessonSlug]);

  useEffect(() => {
    if (!hasRestored) {
      return;
    }

    try {
      window.localStorage.setItem(
        getStorageKey(lessonSlug),
        JSON.stringify({ cardIndex, checkedCardIds }),
      );
    } catch {
      // In-memory progress still works when browser storage is unavailable.
    }
  }, [cardIndex, checkedCardIds, hasRestored, lessonSlug]);

  useEffect(() => {
    if (!shouldFocusCard.current) {
      return;
    }

    revealButtonRef.current?.focus();
    shouldFocusCard.current = false;
  }, [cardIndex]);

  function revealAnswer() {
    setIsRevealed(true);
    setCheckedCardIds((current) =>
      current.includes(currentCard.id)
        ? current
        : [...current, currentCard.id],
    );
  }

  function moveToCard(nextIndex: number) {
    shouldFocusCard.current = true;
    setCardIndex(nextIndex);
    setIsRevealed(false);
  }

  const roundComplete = checkedCardIds.length === cards.length;

  return (
    <section
      className="revision-pack"
      id="revision-pack"
      aria-labelledby="revision-pack-title"
    >
      <header className="revision-heading">
        <div>
          <p className="quiz-kicker">Revision pack</p>
          <h3 id="revision-pack-title">{FIRST_LESSON_REVISION.title}</h3>
        </div>
        <span>{cards.length} self-check cards</span>
      </header>
      <p className="revision-intro">{FIRST_LESSON_REVISION.introduction}</p>

      <ol className="revision-summary" aria-label="Lesson summary">
        {FIRST_LESSON_REVISION.summary.map((item, index) => (
          <li key={item.label}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <div>
              <strong>{item.label}</strong>
              <p>{item.detail}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="flashcard-workbench">
        <div className="flashcard-progress">
          <p aria-live="polite">
            Card {cardIndex + 1} of {cards.length}
          </p>
          <span>
            {roundComplete
              ? "Revision round complete"
              : `${checkedCardIds.length} checked`}
          </span>
        </div>

        <article className="flashcard" aria-labelledby="flashcard-prompt">
          <p className="flashcard-label">
            {isRevealed ? "Answer" : "Recall before you reveal"}
          </p>
          <h4 id="flashcard-prompt">{currentCard.prompt}</h4>
          {isRevealed ? (
            <p className="flashcard-answer">{currentCard.answer}</p>
          ) : (
            <button
              className="flashcard-reveal"
              type="button"
              onClick={revealAnswer}
              ref={revealButtonRef}
            >
              Reveal answer
            </button>
          )}
        </article>

        <div className="flashcard-controls">
          <button
            className="flashcard-previous"
            type="button"
            disabled={cardIndex === 0}
            onClick={() => moveToCard(cardIndex - 1)}
          >
            <span aria-hidden="true">←</span>
            Previous
          </button>
          <div className="flashcard-dots" aria-hidden="true">
            {cards.map((card, index) => (
              <span
                className={[
                  index === cardIndex ? "is-current" : "",
                  checkedCardIds.includes(card.id) ? "is-checked" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                key={card.id}
              />
            ))}
          </div>
          <button
            className="flashcard-next"
            type="button"
            disabled={cardIndex === cards.length - 1}
            onClick={() => moveToCard(cardIndex + 1)}
          >
            Next card
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>

      {practiceHref ? (
        <div className="revision-next-step">
          <div>
            <p className="quiz-kicker">Next step</p>
            <p>Apply the habit across six beginner JavaScript problems.</p>
          </div>
          <Link className="revision-practice-link" href={practiceHref}>
            Continue to JavaScript practice
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      ) : null}
    </section>
  );
}
