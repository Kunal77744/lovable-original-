import { describe, expect, it } from "vitest";
import { formatCodingRunnerError } from "./coding-runner";

describe("formatCodingRunnerError", () => {
  it("maps a runtime stack back to the learner editor line", () => {
    expect(
      formatCodingRunnerError(
        "missingTotal is not defined",
        [
          "ReferenceError: missingTotal is not defined",
          "    at solve (learner-solution.js:7:3)",
          "    at self.onmessage (blob:http://localhost/runner:52:44)",
        ].join("\n"),
      ),
    ).toBe("Line 4, column 3: missingTotal is not defined");
  });

  it("keeps syntax failures truthful when the engine supplies no source line", () => {
    expect(
      formatCodingRunnerError(
        "Unexpected token ';'",
        "SyntaxError: Unexpected token ';'\n    at new Function (<anonymous>)",
      ),
    ).toBe("Unexpected token ';'");
  });

  it("does not expose locations from the generated wrapper", () => {
    expect(
      formatCodingRunnerError(
        "Runner setup failed",
        "Error: Runner setup failed\n    at learner-solution.js:2:1",
      ),
    ).toBe("Runner setup failed");
  });

  it("keeps the original message when no stack is available", () => {
    expect(formatCodingRunnerError("The solution stopped.", undefined)).toBe(
      "The solution stopped.",
    );
  });
});
