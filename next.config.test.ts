import { describe, expect, it } from "vitest";
import nextConfig from "./next.config";

describe("learner entry link", () => {
  it("keeps one stable public path for the founder's warm learner group", async () => {
    expect(nextConfig.rewrites).toBeTypeOf("function");

    const rewrites = await nextConfig.rewrites!();

    expect(Array.isArray(rewrites)).toBe(true);
    expect(rewrites).toContainEqual({
      source: "/start/web-foundations",
      destination:
        "/learn/web-development-foundations/semantic-html?entry_source=founder_warm",
    });
  });

  it("keeps stable privacy-safe entry paths for learner outreach channels", async () => {
    expect(nextConfig.rewrites).toBeTypeOf("function");

    const rewrites = await nextConfig.rewrites!();

    expect(rewrites).toEqual(
      expect.arrayContaining([
        {
          source: "/start/web-foundations/directory",
          destination:
            "/learn/web-development-foundations/semantic-html?entry_source=directory",
        },
        {
          source: "/start/web-foundations/community",
          destination:
            "/learn/web-development-foundations/semantic-html?entry_source=community",
        },
        {
          source: "/start/web-foundations/walkthrough",
          destination:
            "/learn/web-development-foundations/semantic-html?entry_source=walkthrough",
        },
      ]),
    );
  });
});
