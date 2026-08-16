import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { CODING_PROBLEMS } from "@/lib/coding-problems";
import {
  CodingInputInspector,
  getCodingInputAnatomy,
} from "./coding-input-inspector";

describe("CodingInputInspector", () => {
  afterEach(cleanup);

  it("maps a multi-line example into its exact string, lines, and tokens", () => {
    expect(getCodingInputAnatomy("5\r\n7 2 19 4 11")).toEqual({
      rawLiteral: '"5\\n7 2 19 4 11"',
      lines: ["5", "7 2 19 4 11"],
      tokens: ["5", "7", "2", "19", "4", "11"],
    });
  });

  it("renders an accessible, collapsed explanation for the authored input", () => {
    render(<CodingInputInspector input={"5\n7 2 19 4 11"} />);

    const disclosure = screen.getByText("Inspect how this input arrives").closest("details");

    expect(disclosure).not.toHaveAttribute("open");
    expect(screen.getByText("2 lines · 6 tokens")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "From one string to usable values." }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Raw string" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Numbered lines" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Whitespace tokens" }),
    ).toBeInTheDocument();
  });

  it("keeps punctuation attached when whitespace is the only separator", () => {
    expect(getCodingInputAnatomy("{[()]}").tokens).toEqual(["{[()]}"]);
  });

  it("maps the first authored example for all twelve judged problems", () => {
    expect(CODING_PROBLEMS).toHaveLength(12);

    for (const problem of CODING_PROBLEMS) {
      const exampleInput = problem.examples[0].input;
      const anatomy = getCodingInputAnatomy(exampleInput);

      expect(anatomy.rawLiteral).toBe(JSON.stringify(exampleInput));
      expect(anatomy.lines.length).toBeGreaterThan(0);
      expect(anatomy.tokens.length).toBeGreaterThan(0);
    }
  });
});
