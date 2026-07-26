import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import AboutPage, { metadata as aboutMetadata } from "./about/page";
import CoursePage, {
  metadata as courseMetadata,
} from "./courses/web-development-foundations/page";
import CoursesPage, { metadata as coursesMetadata } from "./courses/page";
import { metadata as rootMetadata } from "./layout";
import { alt as socialImageAlt } from "./opengraph-image";
import Home from "./page";
import sitemap from "./sitemap";
import { LEARNING_PATHS } from "@/lib/first-course-content";

afterEach(cleanup);

describe("public product promise", () => {
  it("keeps the homepage focused on the live first course", () => {
    render(<Home />);

    expect(
      screen.getByRole("link", {
        name: /explore the free learning path/i,
      }),
    ).toHaveAttribute("href", "/courses");
    expect(
      screen.getByText(/read every available course and lesson free/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/real projects|interview practice/i),
    ).not.toBeInTheDocument();
  });

  it("distinguishes the live course from planned breadth on About", () => {
    render(<AboutPage />);

    expect(
      screen.getByRole("link", {
        name: /explore free learning paths/i,
      }),
    ).toHaveAttribute("href", "/courses");
    expect(
      screen.getByText(/the first focused course is live now/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/projects, interview practice, certificates/i),
    ).toBeInTheDocument();
  });

  it("renders every shared learning path in the free public catalog", () => {
    render(<CoursesPage />);

    expect(
      screen.getByRole("heading", {
        name: /every learning path here is free/i,
      }),
    ).toBeInTheDocument();

    for (const path of LEARNING_PATHS) {
      expect(
        screen.getByRole("link", { name: path.title }),
      ).toHaveAttribute("href", `/courses/${path.slug}`);

      for (const lesson of path.lessons) {
        expect(screen.getByText(lesson.title)).toBeInTheDocument();
      }
    }

    expect(
      screen
        .getAllByRole("link", { name: /read the free lesson/i })
        .map((link) => link.getAttribute("href")),
    ).toEqual(
      LEARNING_PATHS.flatMap((path) =>
        path.lessons.map(
          (lesson) => `/learn/${path.slug}/${lesson.slug}`,
        ),
      ),
    );
  });

  it("describes only live capability in page and share metadata", () => {
    const publicMetadata = JSON.stringify({
      rootMetadata,
      aboutMetadata,
      coursesMetadata,
      courseMetadata,
      socialImageAlt,
    });

    expect(publicMetadata).toContain("Web Development Foundations");
    expect(publicMetadata).toContain(
      "Read every available course and lesson free",
    );
    expect(publicMetadata).not.toMatch(
      /real projects|interview practice|flashcards|certificates|AI tutor/i,
    );
  });

  it("publishes a focused, factual course overview", () => {
    render(<CoursePage />);

    expect(
      screen.getByRole("heading", {
        name: /build a semantic article page in 18 minutes/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /read the lesson free/i }),
    ).toHaveAttribute(
      "href",
      "/learn/web-development-foundations/semantic-html",
    );
    expect(screen.getByText("75% to pass")).toBeInTheDocument();
    expect(screen.getByText("Four recall questions")).toBeInTheDocument();
    expect(screen.getByText("100% free")).toBeInTheDocument();
    expect(screen.queryByText(/AI tutor|certificate/i)).not.toBeInTheDocument();
  });

  it("includes the public course page in the sitemap", () => {
    expect(sitemap()).toContainEqual(
      expect.objectContaining({
        url: expect.stringContaining("/courses/web-development-foundations"),
      }),
    );
    expect(sitemap()).toContainEqual(
      expect.objectContaining({
        url: expect.stringMatching(/\/courses$/),
      }),
    );
    expect(sitemap()).toContainEqual(
      expect.objectContaining({
        url: expect.stringContaining(
          "/learn/web-development-foundations/semantic-html",
        ),
      }),
    );
  });
});
