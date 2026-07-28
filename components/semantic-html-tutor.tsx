"use client";

import { type FormEvent, useId, useState } from "react";
import {
  answerSemanticHtmlQuestion,
  SEMANTIC_HTML_TUTOR_MAX_LENGTH,
  SEMANTIC_HTML_TUTOR_SUGGESTIONS,
  type SemanticHtmlTutorResponse,
} from "@/lib/semantic-html-tutor";

export function SemanticHtmlTutor() {
  const questionId = useId();
  const [question, setQuestion] = useState("");
  const [response, setResponse] =
    useState<SemanticHtmlTutorResponse | null>(null);

  function askTutor(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResponse(answerSemanticHtmlQuestion(question));
  }

  function selectSuggestion(suggestion: string) {
    setQuestion(suggestion);
    setResponse(answerSemanticHtmlQuestion(suggestion));
  }

  return (
    <section
      className="semantic-tutor"
      aria-labelledby="semantic-tutor-title"
    >
      <div className="semantic-tutor-heading">
        <div>
          <p className="quiz-kicker">Course tutor · Semantic HTML only</p>
          <h2 id="semantic-tutor-title">Ask while the structure is fresh.</h2>
          <p>
            Get a short answer grounded in this lesson. If the course does not
            cover it, the tutor will say so instead of guessing.
          </p>
        </div>
        <span aria-label="This tutor uses only the current lesson">
          Lesson-bound
        </span>
      </div>

      <form className="semantic-tutor-form" onSubmit={askTutor}>
        <label htmlFor={questionId}>Your question</label>
        <div className="semantic-tutor-field">
          <input
            id={questionId}
            name="semantic-html-question"
            type="text"
            value={question}
            maxLength={SEMANTIC_HTML_TUTOR_MAX_LENGTH}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="For example: When should I use <article>?"
            autoComplete="off"
          />
          <button type="submit" disabled={question.trim().length < 3}>
            Ask tutor
            <span aria-hidden="true">↗</span>
          </button>
        </div>
        <div className="semantic-tutor-suggestions">
          <span>Try a lesson question</span>
          <div>
            {SEMANTIC_HTML_TUTOR_SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => selectSuggestion(suggestion)}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </form>

      <div
        className={[
          "semantic-tutor-response",
          response ? `is-${response.status}` : "is-empty",
        ].join(" ")}
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {response ? (
          <>
            <p className="semantic-tutor-response-label">
              {response.status === "supported"
                ? "From this lesson"
                : response.status === "unsafe"
                  ? "Course boundary"
                  : "Not covered here"}
            </p>
            <p className="semantic-tutor-answer">{response.answer}</p>
            {response.status === "supported" ? (
              <div className="semantic-tutor-source">
                <span>{response.source}</span>
                <p>
                  <strong>Check your understanding:</strong>{" "}
                  {response.selfCheck}
                </p>
              </div>
            ) : null}
          </>
        ) : (
          <>
            <p className="semantic-tutor-response-label">Ready when you are</p>
            <p>
              Ask about the document, landmarks, semantic elements, headings, or
              language.
            </p>
          </>
        )}
      </div>
    </section>
  );
}
