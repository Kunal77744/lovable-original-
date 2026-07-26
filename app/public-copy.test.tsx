import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import AboutPage, { metadata as aboutMetadata } from "./about/page";
import { metadata as rootMetadata } from "./layout";
import { alt as socialImageAlt } from "./opengraph-image";
import Home from "./page";

afterEach(cleanup);

describe("public product promise", () => {
  it("keeps the homepage focused on the live first course", () => {
    render(<Home />);

    expect(
      screen.getByRole("link", {
        name: /start web development foundations/i,
      }),
    ).toHaveAttribute("href", "/account");
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
    ).toHaveAttribute("href", "/account");
    expect(
      screen.getByText(/the first focused course is live now/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/are planned, not part of this first course/i),
    ).toBeInTheDocument();
  });

  it("describes only live capability in page and share metadata", () => {
    const publicMetadata = JSON.stringify({
      rootMetadata,
      aboutMetadata,
      socialImageAlt,
    });

    expect(publicMetadata).toContain("Web Development Foundations");
    expect(publicMetadata).toContain("Build and save a semantic HTML page");
    expect(publicMetadata).not.toMatch(
      /real projects|interview practice|flashcards|certificates|AI tutor/i,
    );
  });
});
