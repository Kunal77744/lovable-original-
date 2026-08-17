import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { GuidedSourceChangeReview } from "./guided-source-change-review";

describe("GuidedSourceChangeReview", () => {
  afterEach(cleanup);

  it("stays absent while the authored starter is unchanged", () => {
    render(
      <GuidedSourceChangeReview
        currentSource="return input;"
        starterSource="return input;"
      />,
    );

    expect(
      screen.queryByText("Review changes from starter"),
    ).not.toBeInTheDocument();
  });

  it("reveals a bounded browser-only line review", () => {
    render(
      <GuidedSourceChangeReview
        starterSource={'function solve(input) {\n  return "";\n}'}
        currentSource={
          "function solve(input) {\n  return input.trim();\n}"
        }
      />,
    );

    const summary = screen.getByText("Review changes from starter");
    fireEvent.click(summary);

    expect(screen.getByText("1 added")).toBeInTheDocument();
    expect(screen.getByText("1 removed")).toBeInTheDocument();
    expect(
      screen.getByRole("list", { name: "Changes from the authored starter" }),
    ).toHaveTextContent('return "";');
    expect(
      screen.getByRole("list", { name: "Changes from the authored starter" }),
    ).toHaveTextContent("return input.trim();");
  });

  it("compares a revised draft with either the last saved check or starter", () => {
    render(
      <GuidedSourceChangeReview
        starterSource={'function solve(input) {\n  return "";\n}'}
        savedSource={
          "function solve(input) {\n  return input.trim();\n}"
        }
        currentSource={
          "function solve(input) {\n  return input.trim().toUpperCase();\n}"
        }
      />,
    );

    fireEvent.click(screen.getByText("Review code changes"));

    expect(
      screen.getByRole("button", { name: "Last saved check" }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      screen.getByRole("list", { name: "Changes from the last saved check" }),
    ).toHaveTextContent("return input.trim().toUpperCase();");

    fireEvent.click(screen.getByRole("button", { name: "Authored starter" }));

    expect(
      screen.getByRole("button", { name: "Authored starter" }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      screen.getByRole("list", { name: "Changes from the authored starter" }),
    ).toHaveTextContent('return "";');
  });

  it("keeps unusually long code out of the line renderer", () => {
    const starterSource = Array.from(
      { length: 241 },
      (_, index) => `line ${index}`,
    ).join("\n");
    render(
      <GuidedSourceChangeReview
        currentSource={`${starterSource}\nnew line`}
        starterSource={starterSource}
      />,
    );

    fireEvent.click(screen.getByText("Review changes from starter"));
    expect(
      screen.getByText(/too long for the line review/i),
    ).toBeInTheDocument();
  });
});
