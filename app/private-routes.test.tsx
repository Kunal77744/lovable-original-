import { describe, expect, it, vi } from "vitest";
import sitemap from "./sitemap";
import { metadata as certificateMetadata } from "./certificate/page";
import { metadata as learningHistoryMetadata } from "./learning-history/page";
import { metadata as activityMetadata } from "./practice/activity/page";
import { metadata as challengeMetadata } from "./practice/challenge/page";
import { metadata as dataStructuresMetadata } from "./practice/data-structures/page";
import { metadata as debuggingMetadata } from "./practice/debugging/page";
import { metadata as domLabMetadata } from "./practice/dom/page";
import { metadata as efficiencyMetadata } from "./practice/efficiency/page";
import { metadata as foundationsMetadata } from "./practice/foundations/page";
import { metadata as functionsMetadata } from "./practice/functions/page";
import { metadata as judgeBasicsMetadata } from "./practice/judge-basics/page";
import { metadata as linkedListsMetadata } from "./practice/linked-lists/page";
import { metadata as mixedReviewMetadata } from "./practice/mixed-review/page";
import { metadata as webFoundationsReviewMetadata } from "./courses/web-development-foundations/review/page";
import { metadata as progressMetadata } from "./practice/progress/page";
import { metadata as recursionMetadata } from "./practice/recursion/page";
import { metadata as searchSortMetadata } from "./practice/search-sort/page";
import { metadata as stacksQueuesMetadata } from "./practice/stacks-queues/page";
import { metadata as testDesignMetadata } from "./practice/test-design/page";
import { metadata as tracingMetadata } from "./practice/tracing/page";
import { metadata as treesGraphsMetadata } from "./practice/trees-graphs/page";
import { metadata as settingsMetadata } from "./settings/page";
import { metadata as submissionsMetadata } from "./submissions/page";
import { metadata as submissionMetadata } from "./submissions/[submissionId]/page";
import { metadata as javascriptCapstoneMetadata } from "./projects/javascript-expense-report/page";
import { metadata as javascriptCapstoneDebriefMetadata } from "./projects/javascript-expense-report/debrief/page";
import { metadata as htmlCssCapstoneMetadata } from "./projects/html-css-resource-library/page";
import { metadata as htmlCssCapstoneDebriefMetadata } from "./projects/html-css-resource-library/debrief/page";

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

vi.mock("@/db/course", () => ({
  getFirstCourseCertificateForStudent: vi.fn(),
  getLearnerSettingsForStudent: vi.fn(),
}));

vi.mock("@/db/coding-practice", () => ({
  getCodingSubmissionHistoryForStudent: vi.fn(),
  getCodingSubmissionForStudent: vi.fn(),
}));

describe("private learner routes", () => {
  it("keeps settings, certificate, submission, and private lab pages out of search", () => {
    expect(settingsMetadata.robots).toEqual({
      index: false,
      follow: false,
    });
    expect(certificateMetadata.robots).toEqual({
      index: false,
      follow: false,
    });
    expect(learningHistoryMetadata.robots).toEqual({
      index: false,
      follow: false,
    });
    expect(submissionsMetadata.robots).toEqual({
      index: false,
      follow: false,
    });
    expect(submissionMetadata.robots).toEqual({
      index: false,
      follow: false,
    });
    expect(javascriptCapstoneMetadata.robots).toEqual({
      index: false,
      follow: false,
    });
    expect(javascriptCapstoneDebriefMetadata.robots).toEqual({
      index: false,
      follow: false,
    });
    expect(htmlCssCapstoneMetadata.robots).toEqual({
      index: false,
      follow: false,
    });
    expect(htmlCssCapstoneDebriefMetadata.robots).toEqual({
      index: false,
      follow: false,
    });
    expect(webFoundationsReviewMetadata.robots).toEqual({
      index: false,
      follow: false,
    });
    const privatePracticeMetadata = [
      activityMetadata,
      challengeMetadata,
      debuggingMetadata,
      foundationsMetadata,
      tracingMetadata,
      testDesignMetadata,
      dataStructuresMetadata,
      domLabMetadata,
      functionsMetadata,
      judgeBasicsMetadata,
      efficiencyMetadata,
      progressMetadata,
      recursionMetadata,
      searchSortMetadata,
      stacksQueuesMetadata,
      linkedListsMetadata,
      mixedReviewMetadata,
      treesGraphsMetadata,
    ];

    for (const metadata of privatePracticeMetadata) {
      expect(metadata.robots).toEqual({
        index: false,
        follow: false,
      });
    }
  });

  it("excludes private settings and certificate routes from the sitemap", () => {
    const urls = sitemap().map((entry) => entry.url);

    expect(urls).not.toContain(
      "https://lovable-original-eight.vercel.app/settings",
    );
    expect(urls).not.toContain(
      "https://lovable-original-eight.vercel.app/certificate",
    );
    expect(urls).not.toContain(
      "https://lovable-original-eight.vercel.app/learning-history",
    );
    expect(urls).not.toContain(
      "https://lovable-original-eight.vercel.app/submissions",
    );
    expect(urls).not.toContain(
      "https://lovable-original-eight.vercel.app/projects/javascript-expense-report",
    );
    expect(urls).not.toContain(
      "https://lovable-original-eight.vercel.app/projects/javascript-expense-report/debrief",
    );
    expect(urls).not.toContain(
      "https://lovable-original-eight.vercel.app/projects/html-css-resource-library",
    );
    expect(urls).not.toContain(
      "https://lovable-original-eight.vercel.app/projects/html-css-resource-library/debrief",
    );
    expect(urls).not.toContain(
      "https://lovable-original-eight.vercel.app/courses/web-development-foundations/review",
    );
    const privatePracticePaths = [
      "activity",
      "challenge",
      "debugging",
      "foundations",
      "tracing",
      "test-design",
      "data-structures",
      "dom",
      "functions",
      "judge-basics",
      "efficiency",
      "progress",
      "recursion",
      "search-sort",
      "stacks-queues",
      "linked-lists",
      "mixed-review",
      "trees-graphs",
    ];

    for (const path of privatePracticePaths) {
      expect(urls).not.toContain(
        `https://lovable-original-eight.vercel.app/practice/${path}`,
      );
    }
  });
});
