import { describe, expect, it, vi } from "vitest";
import sitemap from "./sitemap";
import { metadata as certificateMetadata } from "./certificate/page";
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
  it("keeps settings, certificate, and submission pages out of search", () => {
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
  });
});
