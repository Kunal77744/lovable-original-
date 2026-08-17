import { describe, expect, it } from "vitest";
import {
  getAccountHref,
  getSafeAccountDestination,
  getSignInHref,
} from "./account-destination";

describe("account destination", () => {
  it("keeps a learner on a safe private route after sign-in", () => {
    expect(getSafeAccountDestination("/playground?from=practice#editor")).toBe(
      "/playground?from=practice#editor",
    );
    expect(getSignInHref("/projects/semantic-html-article")).toBe(
      "/account?mode=signin&next=%2Fprojects%2Fsemantic-html-article",
    );
    expect(
      getAccountHref(
        "/learn/web-development-foundations/css-selectors-box-model",
      ),
    ).toBe(
      "/account?next=%2Flearn%2Fweb-development-foundations%2Fcss-selectors-box-model",
    );
  });

  it.each([
    "https://example.com/collect",
    "//example.com/collect",
    "javascript:alert(1)",
    "dashboard",
    null,
  ])("falls back to the dashboard for an unsafe destination", (destination) => {
    expect(getSafeAccountDestination(destination)).toBe("/dashboard");
  });
});
