import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import CertificateError from "./certificate/error";
import WebFoundationsError from "./courses/web-development-foundations/error";
import InterviewError from "./interview/error";
import PlaygroundError from "./playground/error";
import ProjectsError from "./projects/error";
import SettingsError from "./settings/error";
import SubmissionsError from "./submissions/error";

const routes = [
  {
    ErrorBoundary: CertificateError,
    title: "We couldn’t load your course certificate.",
    returnLabel: "Return to dashboard",
    returnHref: "/dashboard",
  },
  {
    ErrorBoundary: WebFoundationsError,
    title: "We couldn’t load Web Development Foundations.",
    returnLabel: "Return to dashboard",
    returnHref: "/dashboard",
  },
  {
    ErrorBoundary: InterviewError,
    title: "We couldn’t load your private interview practice.",
    returnLabel: "Return to dashboard",
    returnHref: "/dashboard",
  },
  {
    ErrorBoundary: PlaygroundError,
    title: "We couldn’t load your private playground.",
    returnLabel: "Return to practice",
    returnHref: "/practice",
  },
  {
    ErrorBoundary: ProjectsError,
    title: "We couldn’t load your private project work.",
    returnLabel: "Return to profile",
    returnHref: "/profile",
  },
  {
    ErrorBoundary: SettingsError,
    title: "We couldn’t load your learner settings.",
    returnLabel: "Return to dashboard",
    returnHref: "/dashboard",
  },
  {
    ErrorBoundary: SubmissionsError,
    title: "We couldn’t load your private submission history.",
    returnLabel: "Return to practice",
    returnHref: "/practice",
  },
];

afterEach(() => {
  cleanup();
});

describe("private learning route errors", () => {
  it.each(routes)("protects $title with retry and a safe return", ({
    ErrorBoundary,
    title,
    returnLabel,
    returnHref,
  }) => {
    render(<ErrorBoundary reset={vi.fn()} />);

    expect(screen.getByRole("heading", { name: title })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: returnLabel })).toHaveAttribute(
      "href",
      returnHref,
    );
  });
});
