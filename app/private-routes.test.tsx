import { describe, expect, it, vi } from "vitest";
import sitemap from "./sitemap";
import { metadata as certificateMetadata } from "./certificate/page";
import { metadata as codingActivityMetadata } from "./practice/activity/page";
import { metadata as settingsMetadata } from "./settings/page";
import { metadata as tracingMetadata } from "./practice/tracing/page";

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

describe("private learner routes", () => {
  it("keeps settings, certificate, activity, and timed challenge pages out of search", () => {
    expect(settingsMetadata.robots).toEqual({
      index: false,
      follow: false,
    });
    expect(certificateMetadata.robots).toEqual({
      index: false,
      follow: false,
    });
    expect(tracingMetadata.robots).toEqual({
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
      "https://lovable-original-eight.vercel.app/practice/tracing",
    );
  });
});
