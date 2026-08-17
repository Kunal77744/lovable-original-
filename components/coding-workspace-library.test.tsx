import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { CodingWorkspaceLibrary } from "./coding-workspace-library";

afterEach(cleanup);

describe("CodingWorkspaceLibrary", () => {
  it("renders the exact continuation and keeps source off the collection", () => {
    render(
      <CodingWorkspaceLibrary
        library={{
          totalCount: 2,
          acceptedCount: 1,
          inProgressCount: 1,
          nextAction: {
            eyebrow: "Newest unfinished workspace",
            title: "Reverse a string",
            description: "Your latest saved source is ready.",
            label: "Continue Reverse a string",
            href: "/practice/reverse-a-string",
          },
          items: [
            {
              slug: "reverse-a-string",
              number: 2,
              title: "Reverse a string",
              skill: "String traversal",
              status: "In progress",
              lineCount: 3,
              updatedAt: "2026-08-12T10:30:00.000Z",
              href: "/practice/reverse-a-string",
            },
          ],
        }}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Return to the code you last touched." }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Continue Reverse a string" }),
    ).toHaveAttribute("href", "/practice/reverse-a-string");
    expect(screen.getByText("Best result: In progress")).toBeInTheDocument();
    expect(screen.getByText("3 lines saved")).toBeInTheDocument();
    expect(screen.queryByText("function solve(input)")).not.toBeInTheDocument();
  });

  it("shows a truthful empty collection", () => {
    render(
      <CodingWorkspaceLibrary
        library={{
          totalCount: 0,
          acceptedCount: 0,
          inProgressCount: 0,
          items: [],
          nextAction: {
            eyebrow: "First saved workspace",
            title: "Sum two numbers",
            description: "Open problem 01.",
            label: "Start problem 01",
            href: "/practice/sum-two-numbers",
          },
        }}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Your first saved workspace starts here." }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Workspace summary")).toHaveTextContent(
      "0workspaces across 12 judged problems",
    );
  });
});
