"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  FIRST_LESSON,
  FIRST_LESSON_REVISION,
  getLessonRevision,
} from "@/lib/first-course-content";

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
  const revision = getLessonRevision(lessonSlug) ?? FIRST_LESSON_REVISION;
  const cards = revision.flashcards;
  const mindMap = revision.mindMap;
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
          <h3 id="revision-pack-title">{revision.title}</h3>
        </div>
        <span>{cards.length} self-check cards</span>
      </header>
      <p className="revision-intro">{revision.introduction}</p>

      <section
        className="revision-mind-map"
        aria-labelledby="revision-mind-map-title"
      >
        <header className="mind-map-heading">
          <div>
            <p className="quiz-kicker">Concept map</p>
            <h4 id="revision-mind-map-title">{mindMap.title}</h4>
          </div>
          <p>{mindMap.introduction}</p>
        </header>

        <div className="mind-map-canvas" aria-hidden="true">
          <div className="mind-map-center">
            <span>{mindMap.center.label}</span>
            <strong>{mindMap.center.detail}</strong>
          </div>
          {mindMap.branches.map((branch, index) => (
            <article
              className={`mind-map-node mind-map-node-${index + 1}`}
              key={branch.id}
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{branch.label}</strong>
              <small>{branch.concepts.join(" · ")}</small>
            </article>
          ))}
        </div>

        <section
          className="mind-map-outline"
          aria-labelledby="mind-map-outline-title"
        >
          <div className="mind-map-outline-heading">
            <div>
              <p className="quiz-kicker">Keyboard-readable outline</p>
              <h5 id="mind-map-outline-title">{revision.outlineTitle}</h5>
            </div>
            <a href={revision.workspaceLink.href}>
              {revision.workspaceLink.label}
              <span aria-hidden="true">↑</span>
            </a>
          </div>
          <ol>
            {mindMap.branches.map((branch, index) => (
              <li key={branch.id}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <strong>{branch.label}</strong>
                  <p>{branch.detail}</p>
                  <ul>
                    {branch.concepts.map((concept) => (
                      <li key={concept}>
                        <code>{concept}</code>
                      </li>
                    ))}
                  </ul>
                  <p className="mind-map-self-check">
                    <span>Self-check</span>
                    {branch.selfCheck}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </section>

      <ol className="revision-summary" aria-label="Lesson summary">
        {revision.summary.map((item, index) => (
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

      {lessonSlug === FIRST_LESSON.slug ? (
        <div className="revision-project-bridge">
          <div>
            <p className="quiz-kicker">Guided project</p>
            <h4>Turn the lesson into a complete field guide.</h4>
            <p>
              Build a longer semantic article, save the exact HTML to your
              account, and revise it against a six-check review.
            </p>
          </div>
          <nav
            className="revision-project-actions"
            aria-label="Continue after Web Development Foundations"
          >
            <Link
              className="revision-project-primary"
              href="/projects/semantic-html-article"
            >
              Build the semantic HTML field guide
              <span aria-hidden="true">→</span>
            </Link>
            {practiceHref ? (
              <Link
                className="revision-practice-secondary"
                href={practiceHref}
              >
                Continue to JavaScript practice
                <span aria-hidden="true">→</span>
              </Link>
            ) : null}
            <Link
              className="revision-practice-secondary"
              href="/interview/javascript-fundamentals"
            >
              Practice JavaScript interview questions
              <span aria-hidden="true">→</span>
            </Link>
          </nav>
        </div>
      ) : null}
    </section>
  );
}
