import { GuidedJavaScriptAttemptNote } from "./guided-javascript-attempt-note";

export type GuidedCheckResult = {
  label: string;
  passed: boolean;
  input?: string;
  expectedOutput?: string;
  actualOutput?: string;
};

type OutputTest = {
  input: string;
  expectedOutput: string;
};

function normalizeOutput(value: string) {
  return value.trim();
}

function displayOutput(value: string | undefined) {
  if (value === undefined || value.length === 0) return "(empty)";
  return value.length > 160 ? `${value.slice(0, 159)}…` : value;
}

export function buildGuidedCheckResults(
  tests: readonly OutputTest[],
  outputs: readonly string[],
): GuidedCheckResult[] {
  return tests.map((test, index) => {
    const actualOutput = outputs[index] ?? "";

    return {
      label: `Check ${String(index + 1).padStart(2, "0")}`,
      input: test.input,
      expectedOutput: test.expectedOutput,
      actualOutput,
      passed:
        normalizeOutput(actualOutput) === normalizeOutput(test.expectedOutput),
    };
  });
}

export function GuidedCheckResults({
  results,
  attemptNote,
}: {
  results: readonly GuidedCheckResult[];
  attemptNote?: {
    labSlug: string;
    exerciseId: string;
    showEmpty: boolean;
  };
}) {
  const note = attemptNote ? (
    <GuidedJavaScriptAttemptNote
      key={`${attemptNote.labSlug}:${attemptNote.exerciseId}`}
      {...attemptNote}
    />
  ) : null;

  if (results.length === 0) return note;

  return (
    <>
      <section className="guided-check-results" aria-label="Check details">
        <header>
          <strong>Check details</strong>
          <span>Browser only · not saved</span>
        </header>
        <ol>
          {results.map((result) => {
            const hasOutputDetails =
              result.input !== undefined ||
              result.expectedOutput !== undefined ||
              result.actualOutput !== undefined;

            return (
              <li
                className={result.passed ? "is-matched" : "is-revisit"}
                key={result.label}
              >
                <div className="guided-check-heading">
                  <span>{result.label}</span>
                  <strong>{result.passed ? "Matched" : "Revisit"}</strong>
                </div>
                {hasOutputDetails ? (
                  <dl>
                    <div>
                      <dt>Input</dt>
                      <dd>
                        <code>{displayOutput(result.input)}</code>
                      </dd>
                    </div>
                    <div>
                      <dt>Expected</dt>
                      <dd>
                        <code>{displayOutput(result.expectedOutput)}</code>
                      </dd>
                    </div>
                    <div>
                      <dt>Your result</dt>
                      <dd>
                        <code>{displayOutput(result.actualOutput)}</code>
                      </dd>
                    </div>
                  </dl>
                ) : null}
              </li>
            );
          })}
        </ol>
      </section>
      {note}
    </>
  );
}
