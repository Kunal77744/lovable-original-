"use client";

import { useEffect, useRef, useState } from "react";
import type { LessonReadingSection } from "@/lib/lesson-reading-progress";

type LessonReadingProgressProps = {
  lessonSlug: string;
  sections: LessonReadingSection[];
  initialFurthestSection: number;
};

type SaveState = "idle" | "saving" | "saved" | "error";

export function LessonReadingProgress({
  lessonSlug,
  sections,
  initialFurthestSection,
}: LessonReadingProgressProps) {
  const [furthestSection, setFurthestSection] = useState(
    initialFurthestSection,
  );
  const [saveState, setSaveState] = useState<SaveState>(
    initialFurthestSection > 0 ? "saved" : "idle",
  );
  const [requestedSection, setRequestedSection] = useState(
    initialFurthestSection,
  );
  const [retryCount, setRetryCount] = useState(0);
  const persistedSection = useRef(initialFurthestSection);

  useEffect(() => {
    if (requestedSection <= persistedSection.current) return;

    let ignoreResult = false;
    setSaveState("saving");

    async function saveProgress() {
      try {
        const response = await fetch(
          `/api/lessons/${lessonSlug}/reading-progress`,
          {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ section: requestedSection }),
          },
        );

        if (!response.ok) {
          throw new Error("Reading progress could not be saved.");
        }

        const result = (await response.json()) as { furthestSection: number };
        if (ignoreResult) return;
        persistedSection.current = Math.max(
          persistedSection.current,
          result.furthestSection,
        );
        setFurthestSection(persistedSection.current);
        setSaveState("saved");
      } catch {
        if (!ignoreResult) setSaveState("error");
      }
    }

    void saveProgress();
    return () => {
      ignoreResult = true;
    };
  }, [lessonSlug, requestedSection, retryCount]);

  useEffect(() => {
    const sectionElements = sections
      .map((section, index) => {
        const element = document.getElementById(section.id);
        return element ? { element, number: index + 1 } : null;
      })
      .filter(
        (entry): entry is { element: HTMLElement; number: number } =>
          Boolean(entry),
      );

    if (sectionElements.length === 0 || !("IntersectionObserver" in window)) {
      return;
    }

    const sectionNumbers = new Map(
      sectionElements.map(({ element, number }) => [element, number]),
    );
    const observer = new IntersectionObserver(
      (entries) => {
        const reachedSection = entries.reduce((furthest, entry) => {
          if (!entry.isIntersecting) return furthest;
          return Math.max(
            furthest,
            sectionNumbers.get(entry.target as HTMLElement) ?? 0,
          );
        }, 0);

        setRequestedSection((currentSection) =>
          Math.max(currentSection, reachedSection),
        );
      },
      { rootMargin: "0px 0px -55% 0px", threshold: 0.1 },
    );

    sectionElements.forEach(({ element }) => observer.observe(element));
    return () => observer.disconnect();
  }, [sections]);

  const resumeSection =
    furthestSection > 0 ? sections[furthestSection - 1] : null;
  const statusMessage =
    saveState === "saving"
      ? "Saving your reading place…"
      : saveState === "error"
        ? "Your reading place wasn’t saved."
        : saveState === "saved"
          ? "Saved privately to your account."
          : "Your reading place saves as you move through the lesson.";

  return (
    <aside className="lesson-reading-progress" aria-label="Lesson reading progress">
      <div>
        <p className="lesson-reading-kicker">Private reading progress</p>
        <p className="lesson-reading-status" aria-live="polite">
          {statusMessage}
        </p>
      </div>
      <ol aria-label={`${furthestSection} of ${sections.length} sections reached`}>
        {sections.map((section, index) => (
          <li
            className={index < furthestSection ? "is-reached" : undefined}
            key={section.id}
          >
            <span aria-hidden="true">{index + 1}</span>
            <span className="sr-only">{section.label}</span>
          </li>
        ))}
      </ol>
      {saveState === "error" ? (
        <button type="button" onClick={() => setRetryCount((count) => count + 1)}>
          Retry save
        </button>
      ) : resumeSection ? (
        <a href={`#${resumeSection.id}`}>
          Continue: {resumeSection.label} <span aria-hidden="true">↓</span>
        </a>
      ) : null}
    </aside>
  );
}
