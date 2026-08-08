import { describe, expect, it } from "vitest";
import {
  gradeJavaScriptReadiness,
  JAVASCRIPT_READINESS_QUESTIONS,
} from "./javascript-readiness";

function correctAnswers() {
  return JAVASCRIPT_READINESS_QUESTIONS.map((question) => ({
    questionId: question.id,
    optionId: question.correctOptionId,
  }));
}

describe("JavaScript readiness grading", () => {
  it("routes to the lab for the first weak concept", () => {
    const answers = correctAnswers();
    answers[1] = {
      questionId: JAVASCRIPT_READINESS_QUESTIONS[1].id,
      optionId: "seven",
    };
    answers[3] = {
      questionId: JAVASCRIPT_READINESS_QUESTIONS[3].id,
      optionId: "positive",
    };

    expect(gradeJavaScriptReadiness(answers)).toEqual({
      correctCount: 4,
      totalCount: 6,
      recommendedLabSlug: "tracing",
    });
  });

  it("routes a fully ready learner to algorithm patterns", () => {
    expect(gradeJavaScriptReadiness(correctAnswers())).toEqual({
      correctCount: 6,
      totalCount: 6,
      recommendedLabSlug: "algorithm-patterns",
    });
  });

  it("rejects missing, duplicate, and invented answers", () => {
    expect(gradeJavaScriptReadiness(correctAnswers().slice(0, 5))).toBeNull();

    const duplicate = correctAnswers();
    duplicate[5] = duplicate[0];
    expect(gradeJavaScriptReadiness(duplicate)).toBeNull();

    const invented = correctAnswers();
    invented[0] = { questionId: "parse-input", optionId: "invented" };
    expect(gradeJavaScriptReadiness(invented)).toBeNull();
  });
});
