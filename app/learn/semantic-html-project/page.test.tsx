import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { GUIDED_PROJECT_TOTAL_CHECKS } from "@/lib/guided-project";
import sitemap from "../../sitemap";
import SemanticHtmlProjectEntryPage, { metadata } from "./page";

afterEach(cleanup);

describe("semantic HTML project discovery page", () => {
  it("presents one concrete project outcome and one primary course action", () => {
    render(<SemanticHtmlProjectEntryPage />);

    expect(
      screen.getByRole("heading", {
        name: /turn one lesson into a field guide of your own/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        `${GUIDED_PROJECT_TOTAL_CHECKS} of ${GUIDED_PROJECT_TOTAL_CHECKS} checks pass`,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: /explore web development foundations/i,
      }),
    ).toHaveAttribute("href", "/courses/web-development-foundations");
    expect(document.querySelectorAll(".primary-action")).toHaveLength(1);
  });

  it("keeps the project promise private and bounded", () => {
    render(<SemanticHtmlProjectEntryPage />);

    expect(
      screen.getByText(/project work saved privately/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/starts after course completion/i)).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(
      /accredit|job placement|recruiter|multiple projects/i,
    );
    expect(document.querySelector('a[href="/projects/semantic-html-article"]')).toBeNull();
  });

  it("publishes factual search and sharing metadata", () => {
    expect(metadata.title).toBe(
      "Semantic HTML Project: Build a Field Guide | Lovable Original",
    );
    expect(metadata.description).toContain(
      "revise it against six clear structure checks",
    );
    expect(metadata.alternates).toEqual({
      canonical: "/learn/semantic-html-project",
    });

    const previews = JSON.stringify(metadata);
    expect(previews).toContain("/learn/semantic-html-project");
    expect(previews).toContain("saved semantic HTML field guide");
    expect(previews).not.toMatch(/accredit|job placement|recruiter/i);
  });

  it("adds only the public discovery route to the sitemap", () => {
    const urls = sitemap().map(({ url }) => url);

    expect(urls).toContain(
      "https://lovable-original-eight.vercel.app/learn/semantic-html-project",
    );
    expect(urls).not.toContain(
      "https://lovable-original-eight.vercel.app/projects/semantic-html-article",
    );
  });
});
