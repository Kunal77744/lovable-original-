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
      screen.getByRole("link", {
        name: /start web development foundations/i,
      }),
    ).toHaveAttribute(
      "href",
      "/learn/web-development-foundations/semantic-html",
    );
    expect(
      screen.getByText(/private field guide, revise it against six clear checks/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/six ordered JavaScript problems/i),
    ).toBeInTheDocument();
  });

  it("lists the guided project as live on About", () => {
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
      screen.getAllByText(/six beginner JavaScript problems/i),
    ).not.toHaveLength(0);
    expect(
      screen.getByText(/private semantic HTML field-guide project/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/saved drafts/i)).toHaveTextContent(
      /six-check review/i,
    );
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
          "Web Development Foundations: two practical lessons, a reviewed field guide, and six JavaScript problems.",
      }),
    ]);
    expect(courseMetadata.twitter?.images).toEqual([
      expect.objectContaining({
        url: "/opengraph-image",
        alt:
          "Web Development Foundations: two practical lessons, a reviewed field guide, and six JavaScript problems.",
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
        name: /build the page. then make its css predictable/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /read the full lesson/i }),
    ).toHaveAttribute(
      "href",
      "/learn/web-development-foundations/semantic-html",
    );
    expect(screen.getByText(/pass each four-question check at 75%/i)).toBeInTheDocument();
    expect(screen.getByText("2 saved builds")).toBeInTheDocument();
    expect(screen.getByText("HTML and CSS practice")).toBeInTheDocument();
    expect(screen.getByText("6 + 6")).toBeInTheDocument();
    expect(screen.getByText("Project checks and JS problems")).toBeInTheDocument();
    expect(
      screen.getByText(/private semantic HTML field guide/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/six ordered beginner problems/i),
    ).toBeInTheDocument();
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
