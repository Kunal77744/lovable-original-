import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import WhyUseSemanticHtmlPage, { metadata } from "./page";
import sitemap from "../../sitemap";

afterEach(cleanup);

describe("why use semantic HTML answer page", () => {
  it("answers the beginner question and opens the complete public lesson", () => {
    render(<WhyUseSemanticHtmlPage />);

    expect(
      screen.getByRole("heading", { name: "Why use semantic HTML?" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/tells the browser what content does/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: /learn semantic html in 18 minutes/i,
      }),
    ).toHaveAttribute(
      "href",
      "/learn/web-development-foundations/semantic-html",
    );
    expect(screen.getByText(/five structure checks/i)).toBeInTheDocument();
    expect(document.querySelectorAll(".primary-action")).toHaveLength(1);
  });

  it("keeps the answer and the tag reference distinct", () => {
    render(<WhyUseSemanticHtmlPage />);

    expect(
      screen.getByRole("heading", {
        name: /three reasons meaning beats another div/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("The structure explains itself")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /compare eight semantic tags/i }),
    ).toHaveAttribute("href", "/learn/semantic-html-cheat-sheet");
  });

  it("publishes factual metadata and a canonical sitemap entry", () => {
    expect(metadata.title).toBe(
      "Why Use Semantic HTML? A Beginner Guide | Lovable Original",
    );
    expect(metadata.alternates).toEqual({
      canonical: "/learn/why-use-semantic-html",
    });
    expect(JSON.stringify(metadata)).toContain("free 18-minute lesson");
    expect(JSON.stringify(metadata)).not.toMatch(
      /certificate|job placement|recruiter|accredited/i,
    );
    expect(sitemap().map(({ url }) => url)).toContain(
      "https://lovable-original-eight.vercel.app/learn/why-use-semantic-html",
    );
  });
});
