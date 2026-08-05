import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import sitemap from "../../sitemap";
import SemanticHtmlCheatSheetPage, { metadata } from "./page";

afterEach(cleanup);

describe("HTML semantic tags cheat sheet", () => {
  it("publishes a complete reference with one primary learning action", () => {
    render(<SemanticHtmlCheatSheetPage />);

    expect(
      screen.getByRole("heading", {
        name: /choose the tag that explains the job/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: /learn semantic html in 18 minutes/i,
      }),
    ).toHaveAttribute("href", "/courses/web-development-foundations");
    expect(screen.getAllByText("<main>")).not.toHaveLength(0);
    expect(screen.getAllByText("<article>")).not.toHaveLength(0);
    expect(
      screen.getByRole("heading", { name: /article, section, or div/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /review the page in six checks/i }),
    ).toBeInTheDocument();
    expect(document.querySelectorAll(".primary-action")).toHaveLength(1);
  });

  it("uses distinct metadata and a canonical public URL", () => {
    expect(metadata.title).toBe(
      "HTML Semantic Tags Cheat Sheet | Lovable Original",
    );
    expect(metadata.description).toContain(
      "header, nav, main, article, section, aside, and footer",
    );
    expect(metadata.alternates).toEqual({
      canonical: "/learn/semantic-html-cheat-sheet",
    });
    expect(sitemap().map(({ url }) => url)).toContain(
      "https://lovable-original-eight.vercel.app/learn/semantic-html-cheat-sheet",
    );
  });

  it("keeps every reference section reachable from the page index", () => {
    render(<SemanticHtmlCheatSheetPage />);

    expect(
      screen.getByRole("navigation", { name: /on this page/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Tag reference" }),
    ).toHaveAttribute("href", "#tag-reference");
    expect(
      screen.getByRole("link", { name: "Complete example" }),
    ).toHaveAttribute("href", "#complete-example");
    expect(screen.getAllByRole("listitem")).toHaveLength(9);
  });
});
