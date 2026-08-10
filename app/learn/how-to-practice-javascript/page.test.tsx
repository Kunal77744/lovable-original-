import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import sitemap from "../../sitemap";
import PracticeJavaScriptAnswerPage, { metadata } from "./page";

afterEach(cleanup);

describe("beginner JavaScript practice answer page", () => {
  it("answers the beginner question and opens the first live judged problem", () => {
    render(<PracticeJavaScriptAnswerPage />);

    expect(
      screen.getByRole("heading", {
        name: "How should a beginner practice JavaScript?",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(/read it, trace it, run it in the browser/i)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /start JavaScript problem 01/i }),
    ).toHaveAttribute("href", "/practice/sum-two-numbers");
    expect(document.querySelectorAll("[data-primary-action]")).toHaveLength(1);
  });

  it("teaches one repeatable loop without exposing a solved answer", () => {
    render(<PracticeJavaScriptAnswerPage />);

    expect(
      screen.getByRole("heading", { name: /four moves from prompt to verdict/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Run before you submit")).toBeInTheDocument();
    expect(screen.getByLabelText("An unsolved JavaScript scaffold")).toHaveTextContent(
      'return ""',
    );
    expect(screen.getByRole("link", { name: /see all 12 JavaScript problems/i })).toHaveAttribute(
      "href",
      "/learn/beginner-javascript-practice",
    );
  });

  it("publishes distinct metadata, structured data, and a sitemap entry", () => {
    render(<PracticeJavaScriptAnswerPage />);

    expect(metadata.title).toBe(
      "How to Practice JavaScript as a Beginner | Lovable Original",
    );
    expect(metadata.alternates).toEqual({ canonical: "/learn/how-to-practice-javascript" });
    expect(document.querySelector('script[type="application/ld+json"]')?.textContent).toContain(
      '"@type":"TechArticle"',
    );
    expect(sitemap().map(({ url }) => url)).toContain(
      "https://lovable-original-eight.vercel.app/learn/how-to-practice-javascript",
    );
  });
});
