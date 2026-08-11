import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import sitemap from "../../sitemap";
import CssBoxModelAnswerPage, { metadata } from "./page";

afterEach(cleanup);

describe("CSS box model answer page", () => {
  it("answers the beginner question and opens the first live CSS challenge", () => {
    render(<CssBoxModelAnswerPage />);

    expect(
      screen.getByRole("heading", { name: "What is the CSS box model?" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/content, padding, border, and margin/i)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /practice CSS in 6 challenges/i }),
    ).toHaveAttribute("href", "/practice/css/class-selector");
    expect(document.querySelectorAll("[data-primary-action]")).toHaveLength(1);
  });

  it("teaches the sizing distinction without inventing a product claim", () => {
    render(<CssBoxModelAnswerPage />);

    expect(
      screen.getByRole("heading", {
        name: /a selector finds the element. the box model sizes it/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/box-sizing: border-box/i)).toHaveLength(2);
    expect(screen.getByRole("link", { name: /complete CSS lesson/i })).toHaveAttribute(
      "href",
      "/learn/web-development-foundations/css-selectors-box-model",
    );
  });

  it("publishes distinct metadata, structured data, and a sitemap entry", () => {
    render(<CssBoxModelAnswerPage />);

    expect(metadata.title).toBe(
      "What Is the CSS Box Model? A Beginner Guide | Lovable Original",
    );
    expect(metadata.alternates).toEqual({ canonical: "/learn/what-is-the-css-box-model" });
    expect(document.querySelector('script[type="application/ld+json"]')?.textContent).toContain(
      '"@type":"TechArticle"',
    );
    expect(sitemap().map(({ url }) => url)).toContain(
      "https://lovable-original-eight.vercel.app/learn/what-is-the-css-box-model",
    );
  });
});
