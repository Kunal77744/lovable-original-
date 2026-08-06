import { describe, expect, it, vi } from "vitest";
import sitemap from "./sitemap";
import { metadata as certificateMetadata } from "./certificate/page";
import { metadata as activityMetadata } from "./practice/activity/page";
import { metadata as challengeMetadata } from "./practice/challenge/page";
import { metadata as dataStructuresMetadata } from "./practice/data-structures/page";
import { metadata as debuggingMetadata } from "./practice/debugging/page";
import { metadata as domLabMetadata } from "./practice/dom/page";
import { metadata as efficiencyMetadata } from "./practice/efficiency/page";
import { metadata as foundationsMetadata } from "./practice/foundations/page";
import { metadata as functionsMetadata } from "./practice/functions/page";
import { metadata as progressMetadata } from "./practice/progress/page";
import { metadata as recursionMetadata } from "./practice/recursion/page";
import { metadata as searchSortMetadata } from "./practice/search-sort/page";
import { metadata as stacksQueuesMetadata } from "./practice/stacks-queues/page";
import { metadata as testDesignMetadata } from "./practice/test-design/page";
import { metadata as tracingMetadata } from "./practice/tracing/page";
import { metadata as settingsMetadata } from "./settings/page";
import { metadata as submissionsMetadata } from "./submissions/page";
import { metadata as submissionMetadata } from "./submissions/[submissionId]/page";

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
    expect(submissionsMetadata.robots).toEqual({
      index: false,
      follow: false,
    });
    expect(submissionMetadata.robots).toEqual({
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
      efficiencyMetadata,
      progressMetadata,
      recursionMetadata,
      searchSortMetadata,
      stacksQueuesMetadata,
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
      "https://lovable-original-eight.vercel.app/submissions",
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
      "efficiency",
      "progress",
      "recursion",
      "search-sort",
      "stacks-queues",
    ];

    for (const path of privatePracticePaths) {
      expect(urls).not.toContain(
        `https://lovable-original-eight.vercel.app/practice/${path}`,
      );
    }
  });
});
