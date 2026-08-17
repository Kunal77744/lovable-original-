"use client";

import { useState } from "react";

const INPUT_SIZES = [10, 100, 1_000, 10_000] as const;

type GrowthRow = {
  id: string;
  label: string;
  growth: string;
  operations: number;
};

function getGrowthRows(inputSize: number): GrowthRow[] {
  return [
    {
      id: "constant",
      label: "Go straight to one value",
      growth: "O(1)",
      operations: 1,
    },
    {
      id: "logarithmic",
      label: "Halve what remains",
      growth: "O(log n)",
      operations: Math.ceil(Math.log2(inputSize)),
    },
    {
      id: "linear",
      label: "Check every value once",
      growth: "O(n)",
      operations: inputSize,
    },
    {
      id: "quadratic",
      label: "Compare every value with every value",
      growth: "O(n²)",
      operations: inputSize * inputSize,
    },
  ];
}

function getBarWidth(operations: number, maximumOperations: number) {
  if (maximumOperations <= 1) return 100;
  const logRatio = Math.log10(Math.max(operations, 1)) / Math.log10(maximumOperations);
  return 8 + logRatio * 92;
}

export function AlgorithmComplexityGrowthExplorer() {
  const [inputSize, setInputSize] = useState<number>(INPUT_SIZES[0]);
  const rows = getGrowthRows(inputSize);
  const maximumOperations = inputSize * inputSize;

  return (
    <section
      className="complexity-growth-explorer"
      aria-labelledby="complexity-growth-title"
    >
      <div className="complexity-growth-heading">
        <div>
          <p className="eyebrow">Explore the scale</p>
          <h3 id="complexity-growth-title">Watch the work separate.</h3>
        </div>
        <p>
          Change the input size to see why code that feels fine with 10 values
          can become expensive at 10,000.
        </p>
      </div>

      <div
        className="complexity-size-options"
        aria-label="Choose an input size"
        role="group"
      >
        <span>Input size</span>
        <div>
          {INPUT_SIZES.map((size) => (
            <button
              aria-pressed={inputSize === size}
              key={size}
              onClick={() => setInputSize(size)}
              type="button"
            >
              {size.toLocaleString("en-US")}
            </button>
          ))}
        </div>
      </div>

      <div className="complexity-growth-chart" aria-live="polite">
        {rows.map((row) => (
          <div className="complexity-growth-row" key={row.id}>
            <div className="complexity-growth-label">
              <strong>{row.growth}</strong>
              <span>{row.label}</span>
            </div>
            <div className="complexity-growth-measure">
              <span
                aria-hidden="true"
                style={{ width: `${getBarWidth(row.operations, maximumOperations)}%` }}
              />
            </div>
            <output
              aria-label={`${row.growth}: ${row.operations.toLocaleString("en-US")} ${
                row.operations === 1 ? "operation" : "operations"
              }`}
            >
              {row.operations.toLocaleString("en-US")}
              <span>{row.operations === 1 ? " operation" : " operations"}</span>
            </output>
          </div>
        ))}
      </div>

      <p className="complexity-growth-note">
        These are growth estimates, not runtime seconds. Bar lengths use a log
        scale so the smaller counts stay visible.
      </p>
    </section>
  );
}
