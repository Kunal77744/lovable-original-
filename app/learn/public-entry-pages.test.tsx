import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { CODING_PROBLEMS } from "@/lib/coding-problems";
import JavaScriptEntryPage, {
  metadata as javascriptMetadata,
} from "./beginner-javascript-practice/page";
import SemanticHtmlEntryPage, {
  metadata as semanticMetadata,
} from "./semantic-html/page";
import sitemap from "../sitemap";

afterEach(cleanup);

describe("focused public learner entry pages", () => {
  it("connects semantic HTML intent to the verified course outcome", () => {
    render(<SemanticHtmlEntryPage />);

    expect(
      screen.getByRole("heading", {
        name: /give every part of a page a clear job/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /read the full 18-minute lesson/i }),
    ).toHaveAttribute(
      "href",
      "/learn/web-development-foundations/semantic-html",
    );
    expect(screen.getByText(/free to read/i)).toBeInTheDocument();
    expect(screen.getByText("5/5 checks")).toBeInTheDocument();
    expect(screen.getByText(/75% quiz pass mark/i)).toBeInTheDocument();
    expect(document.querySelectorAll(".primary-action")).toHaveLength(1);
  });

  it("connects beginner JavaScript intent to the first runnable problem", () => {
    render(<JavaScriptEntryPage />);

    expect(
      screen.getByRole("heading", {
        name: /make your first six problems count/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Six problems, one beginner path"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /start problem 01/i }),
    ).toHaveAttribute("href", `/practice/${CODING_PROBLEMS[0].slug}`);
    expect(screen.getByText("4 of 4 passed")).toBeInTheDocument();
    expect(screen.getAllByText("Beginner")).toHaveLength(6);
    expect(document.querySelectorAll(".primary-action")).toHaveLength(1);
  });

  it("gives both pages distinct, factual search and sharing previews", () => {
    expect(semanticMetadata.title).toBe(
      "Learn Semantic HTML by Building a Page | Lovable Original",
    );
    expect(semanticMetadata.alternates).toEqual({
      canonical: "/learn/semantic-html",
    });
    expect(javascriptMetadata.title).toBe(
      "Beginner JavaScript Practice: 6 Free Problems | Lovable Original",
    );
    expect(javascriptMetadata.alternates).toEqual({
      canonical: "/learn/beginner-javascript-practice",
    });

    const previews = JSON.stringify({ semanticMetadata, javascriptMetadata });
    expect(previews).toContain("18-minute lesson");
    expect(previews).toContain("six free problems");
    expect(previews).not.toMatch(
      /AI tutor|certificate|contest|job placement|recruiter/i,
    );
  });

  it("publishes both entry pages in the public sitemap", () => {
    const urls = sitemap().map((entry) => entry.url);

    expect(urls).toContain(
      "https://lovable-original-eight.vercel.app/learn/semantic-html",
    );
    expect(urls).toContain(
      "https://lovable-original-eight.vercel.app/learn/beginner-javascript-practice",
    );
  });
});
