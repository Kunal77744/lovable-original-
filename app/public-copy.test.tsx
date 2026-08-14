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
  it("connects the homepage to the live lesson, project, and practice path", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", { name: /learn coding by doing/i }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("link", {
        name: /start web development foundations/i,
      }),
    ).toHaveAttribute(
      "href",
      "/learn/web-development-foundations/semantic-html",
    );
    expect(
      screen.getByText(/take a short lesson, build and check real work/i),
    ).toBeInTheDocument();
    expect(screen.getByText("Course preview · 3 lessons")).toBeInTheDocument();
    expect(
      screen.getByText("Read 3 complete lessons · 51 min"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/build and check a guided project/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/12 browser-run JavaScript problems/i),
    ).toBeInTheDocument();
  });

  it("frames the live lesson, project, and practice as one path on About", () => {
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
      screen.getByText(/the first learner path is live now/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/take a short lesson, build and check real work/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/read one complete 18-minute semantic HTML lesson/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/a lesson-bound semantic HTML tutor/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/private course certificate/i)).toBeInTheDocument();
    expect(screen.getByText(/private learner profile/i)).toBeInTheDocument();
    expect(
      screen.getByText(
        /five-question JavaScript fundamentals interview drill/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/private saved JavaScript playground/i),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(/12 browser-run JavaScript problems/i),
    ).toHaveLength(2);
    expect(
      screen.getByText(/private semantic HTML field guide/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/planned next|not live yet/i),
    ).not.toBeInTheDocument();
  });

  it("describes only live capability in page and share metadata", () => {
    const publicMetadata = JSON.stringify({
      rootMetadata,
      aboutMetadata,
      courseMetadata,
      socialImageAlt,
    });

    expect(publicMetadata).toContain("Learn coding by doing");
    expect(rootMetadata.description).toContain(
      "3 Web Foundations lessons totaling 51 minutes",
    );
    expect(publicMetadata).not.toMatch(
      /real projects|interview practice|flashcards|certificates|AI tutor/i,
    );
  });

  it("gives the course share image its own specific description", () => {
    expect(courseMetadata.openGraph?.images).toEqual([
      expect.objectContaining({
        url: "/opengraph-image",
        alt: "Web Development Foundations: three practical lessons, a reviewed field guide, 12 JavaScript problems, and six CSS challenges.",
      }),
    ]);
    expect(courseMetadata.twitter?.images).toEqual([
      expect.objectContaining({
        url: "/opengraph-image",
        alt: "Web Development Foundations: three practical lessons, a reviewed field guide, 12 JavaScript problems, and six CSS challenges.",
      }),
    ]);
    expect(rootMetadata.openGraph?.images).toEqual([
      expect.objectContaining({
        alt: "Lovable Original: learn coding through 3 Web Foundations lessons, saved project work, and 12 JavaScript problems.",
      }),
    ]);
  });

  it("publishes a focused, factual course overview", () => {
    render(<CoursePage />);

    expect(
      screen.getByRole("heading", {
        name: /one beginner path from page structure to working code/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /start the beginner path/i }),
    ).toHaveAttribute(
      "href",
      "/learn/web-development-foundations/semantic-html",
    );
    expect(
      screen.getByText(/12 JavaScript problems and six CSS challenges/i),
    ).toBeInTheDocument();
    expect(screen.getByText("3 saved builds")).toBeInTheDocument();
    expect(screen.getByText("HTML and CSS practice")).toBeInTheDocument();
    expect(screen.getByText("6 + 12 + 6")).toBeInTheDocument();
    expect(
      screen.getByText("Project checks, JS problems, and CSS challenges"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/private semantic HTML field guide/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/12 ordered beginner problems/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /preview the guided project/i }),
    ).toHaveAttribute("href", "/learn/semantic-html-project");
    expect(
      screen.getByRole("link", { name: /see the JavaScript path/i }),
    ).toHaveAttribute("href", "/learn/beginner-javascript-practice");
    expect(
      screen.getByRole("link", { name: /see the CSS path/i }),
    ).toHaveAttribute("href", "/practice/css");
    expect(
      screen.getByRole("navigation", { name: /beginner concept answers/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /why use semantic HTML/i }),
    ).toHaveAttribute("href", "/learn/why-use-semantic-html");
    expect(
      screen.getByRole("link", { name: /what is the CSS box model/i }),
    ).toHaveAttribute("href", "/learn/what-is-the-css-box-model");
    expect(
      screen.getByRole("link", {
        name: /how should a beginner practice JavaScript/i,
      }),
    ).toHaveAttribute("href", "/learn/how-to-practice-javascript");
    expect(document.querySelectorAll(".primary-action")).toHaveLength(1);
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
