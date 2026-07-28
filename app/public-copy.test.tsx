import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import AboutPage, { metadata as aboutMetadata } from "./about/page";
import CoursePage, {
  metadata as courseMetadata,
} from "./courses/web-development-foundations/page";
import { metadata as rootMetadata } from "./layout";
import { alt as socialImageAlt } from "./opengraph-image";
import Home from "./page";
import sitemap from "./sitemap";

afterEach(cleanup);

describe("public product promise", () => {
  it("keeps the homepage focused on the live first course", () => {
    render(<Home />);

    expect(
      screen.getByRole("link", {
        name: /start web development foundations/i,
      }),
    ).toHaveAttribute(
      "href",
      "/learn/web-development-foundations/semantic-html",
    );
    expect(
      screen.getByText(/build and save an article page/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/real projects|interview practice/i),
    ).not.toBeInTheDocument();
  });

  it("distinguishes the live course from planned breadth on About", () => {
    render(<AboutPage />);

    expect(
      screen.getByRole("link", {
        name: /start web development foundations/i,
      }),
    ).toHaveAttribute(
      "href",
      "/learn/web-development-foundations/semantic-html",
    );
    expect(
      screen.getByText(/the first focused course is live now/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/one complete 18-minute semantic HTML lesson/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/lesson-bound semantic HTML tutor/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/private course certificate/i)).toBeInTheDocument();
    expect(screen.getByText(/private learner profile/i)).toBeInTheDocument();
    expect(
      screen.getByText(/five-question JavaScript fundamentals interview drill/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/private saved JavaScript playground/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/six beginner JavaScript problems/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/guided semantic HTML field-guide project/i),
    ).toBeInTheDocument();
  });

  it("describes only live capability in page and share metadata", () => {
    const publicMetadata = JSON.stringify({
      rootMetadata,
      aboutMetadata,
      courseMetadata,
      socialImageAlt,
    });

    expect(publicMetadata).toContain("Web Development Foundations");
    expect(publicMetadata).toContain("Build and save a semantic HTML page");
    expect(publicMetadata).not.toMatch(
      /real projects|interview practice|flashcards|certificates|AI tutor/i,
    );
  });

  it("gives the course share image its own specific description", () => {
    expect(courseMetadata.openGraph?.images).toEqual([
      expect.objectContaining({
        url: "/opengraph-image",
        alt:
          "Web Development Foundations: build and save a semantic HTML article page in one 18-minute lesson.",
      }),
    ]);
    expect(courseMetadata.twitter?.images).toEqual([
      expect.objectContaining({
        url: "/opengraph-image",
        alt:
          "Web Development Foundations: build and save a semantic HTML article page in one 18-minute lesson.",
      }),
    ]);
    expect(rootMetadata.openGraph?.images).toEqual([
      expect.objectContaining({
        alt:
          "Lovable Original Web Development Foundations: learn semantic HTML, build and save a page, and check your recall.",
      }),
    ]);
  });

  it("publishes a focused, factual course overview", () => {
    render(<CoursePage />);

    expect(
      screen.getByRole("heading", {
        name: /build a semantic article page in 18 minutes/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /read the full lesson/i }),
    ).toHaveAttribute(
      "href",
      "/learn/web-development-foundations/semantic-html",
    );
    expect(screen.getByText("75% to pass")).toBeInTheDocument();
    expect(screen.getByText("Four recall questions")).toBeInTheDocument();
    expect(screen.getByText("1 saved page")).toBeInTheDocument();
    expect(screen.queryByText(/AI tutor|certificate/i)).not.toBeInTheDocument();
  });

  it("includes the public course page in the sitemap", () => {
    expect(sitemap()).toContainEqual(
      expect.objectContaining({
        url: expect.stringContaining("/courses/web-development-foundations"),
      }),
    );
  });
});
