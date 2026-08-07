import { beforeEach, describe, expect, it, vi } from "vitest";
import * as courseDb from "@/db/course";
import * as projectDb from "@/db/guided-project";
import * as practiceDb from "@/db/coding-practice";
import * as labProgressDb from "@/db/javascript-lab-progress";
import * as readinessDb from "@/db/javascript-readiness";
import * as mixedReviewDb from "@/db/javascript-mixed-review";
import { auth } from "@/lib/auth";
import { GET as getCertificate } from "./certificate/route";
import {
  GET as getFeedback,
  POST as saveFeedback,
} from "./courses/[courseSlug]/feedback/route";
import { POST as saveQuiz } from "./lessons/[lessonSlug]/complete/route";
import {
  GET as getNote,
  POST as saveNote,
} from "./lessons/[lessonSlug]/notes/route";
import {
  GET as getWorkspace,
  POST as saveWorkspace,
} from "./lessons/[lessonSlug]/workspace/route";
import {
  GET as getSettings,
  POST as saveSettings,
} from "./settings/route";
import {
  GET as getProjectFeedback,
  POST as saveProjectFeedback,
} from "./projects/[projectSlug]/feedback/route";
import {
  GET as getPracticeFeedback,
  POST as savePracticeFeedback,
} from "./practice/feedback/route";
import { POST as saveLabProgress } from "./practice/labs/[labSlug]/progress/route";
import { POST as saveReadiness } from "./practice/readiness/route";
import { POST as saveMixedReview } from "./practice/mixed-review/route";

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

vi.mock("@/db/course", () => ({
  getCourseFeedbackForStudent: vi.fn(),
  getFirstCourseCertificateForStudent: vi.fn(),
  getFirstLessonArtifact: vi.fn(),
  getFirstLessonNote: vi.fn(),
  getLearnerSettingsForStudent: vi.fn(),
  saveCourseFeedbackForStudent: vi.fn(),
  saveFirstLessonArtifact: vi.fn(),
  saveFirstLessonNote: vi.fn(),
  saveFirstLessonQuizResult: vi.fn(),
  saveLearnerSettingsForStudent: vi.fn(),
}));

vi.mock("@/db/guided-project", () => ({
  getGuidedProjectFeedbackForStudent: vi.fn(),
  saveGuidedProjectFeedbackForStudent: vi.fn(),
}));
vi.mock("@/db/javascript-lab-progress", () => ({ saveJavaScriptLabExerciseCompletion: vi.fn() }));
vi.mock("@/db/javascript-readiness", () => ({ saveJavaScriptReadinessResultForStudent: vi.fn() }));
vi.mock("@/db/javascript-mixed-review", () => ({
  getJavaScriptMixedReviewResultForStudent: vi.fn(),
  saveJavaScriptMixedReviewResultForStudent: vi.fn(),
}));

vi.mock("@/db/coding-practice", () => ({
  getPracticeFeedbackForStudent: vi.fn(),
  savePracticeFeedbackForStudent: vi.fn(),
}));

const getSession = vi.mocked(auth.api.getSession);

describe("signed-out private learning boundary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSession.mockResolvedValue(null);
  });

  it("rejects every private read and write before touching learner data", async () => {
    const lessonContext = {
      params: Promise.resolve({ lessonSlug: "semantic-html" }),
    };
    const courseContext = {
      params: Promise.resolve({ courseSlug: "web-development-foundations" }),
    };
    const projectContext = {
      params: Promise.resolve({ projectSlug: "semantic-html-article" }),
    };
    const labContext = { params: Promise.resolve({ labSlug: "tracing" }) };
    const request = new Request("http://localhost/private", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{}",
    });

    const responses = await Promise.all([
      getNote(new Request("http://localhost/private"), lessonContext),
      saveNote(request.clone(), lessonContext),
      getWorkspace(new Request("http://localhost/private"), lessonContext),
      saveWorkspace(request.clone(), lessonContext),
      saveQuiz(request.clone(), lessonContext),
      getFeedback(new Request("http://localhost/private"), courseContext),
      saveFeedback(request.clone(), courseContext),
      getCertificate(),
      getSettings(),
      saveSettings(request.clone()),
      getProjectFeedback(
        new Request("http://localhost/private"),
        projectContext,
      ),
      saveProjectFeedback(request.clone(), projectContext),
      getPracticeFeedback(
        new Request(
          "http://localhost/api/practice/feedback?problemSlug=sum-two-numbers",
        ),
      ),
      savePracticeFeedback(request.clone()),
      saveLabProgress(request.clone(), labContext),
      saveReadiness(request.clone()),
      saveMixedReview(request.clone()),
    ]);

    expect(responses.map((response) => response.status)).toEqual(
      Array(17).fill(401),
    );
    expect(courseDb.getFirstLessonNote).not.toHaveBeenCalled();
    expect(courseDb.saveFirstLessonNote).not.toHaveBeenCalled();
    expect(courseDb.getFirstLessonArtifact).not.toHaveBeenCalled();
    expect(courseDb.saveFirstLessonArtifact).not.toHaveBeenCalled();
    expect(courseDb.saveFirstLessonQuizResult).not.toHaveBeenCalled();
    expect(courseDb.getCourseFeedbackForStudent).not.toHaveBeenCalled();
    expect(courseDb.saveCourseFeedbackForStudent).not.toHaveBeenCalled();
    expect(courseDb.getFirstCourseCertificateForStudent).not.toHaveBeenCalled();
    expect(courseDb.getLearnerSettingsForStudent).not.toHaveBeenCalled();
    expect(courseDb.saveLearnerSettingsForStudent).not.toHaveBeenCalled();
    expect(
      projectDb.getGuidedProjectFeedbackForStudent,
    ).not.toHaveBeenCalled();
    expect(
      projectDb.saveGuidedProjectFeedbackForStudent,
    ).not.toHaveBeenCalled();
    expect(practiceDb.getPracticeFeedbackForStudent).not.toHaveBeenCalled();
    expect(practiceDb.savePracticeFeedbackForStudent).not.toHaveBeenCalled();
    expect(labProgressDb.saveJavaScriptLabExerciseCompletion).not.toHaveBeenCalled();
    expect(readinessDb.saveJavaScriptReadinessResultForStudent).not.toHaveBeenCalled();
    expect(mixedReviewDb.getJavaScriptMixedReviewResultForStudent).not.toHaveBeenCalled();
    expect(mixedReviewDb.saveJavaScriptMixedReviewResultForStudent).not.toHaveBeenCalled();
  });
});
