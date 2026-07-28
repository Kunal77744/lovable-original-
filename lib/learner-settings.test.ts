import { describe, expect, it } from "vitest";
import {
  MAX_CERTIFICATE_DISPLAY_NAME_LENGTH,
  validateLearnerSettings,
} from "./learner-settings";

describe("validateLearnerSettings", () => {
  it("normalizes a bounded certificate name", () => {
    expect(
      validateLearnerSettings({
        certificateDisplayName: "  Asha   O’Neil-Singh  ",
      }),
    ).toEqual({
      valid: true,
      certificateDisplayName: "Asha O’Neil-Singh",
    });
  });

  it("rejects markup and names longer than the limit", () => {
    expect(
      validateLearnerSettings({
        certificateDisplayName: "<script>alert(1)</script>",
      }),
    ).toMatchObject({ valid: false });
    expect(
      validateLearnerSettings({
        certificateDisplayName: "A".repeat(
          MAX_CERTIFICATE_DISPLAY_NAME_LENGTH + 1,
        ),
      }),
    ).toMatchObject({ valid: false });
  });
});
