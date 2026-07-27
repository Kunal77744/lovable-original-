import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { RevisionPack } from "./revision-pack";

describe("RevisionPack", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it("lets a learner reveal and work through every flashcard", async () => {
    render(<RevisionPack lessonSlug="semantic-html" />);

    expect(screen.getByText("Card 1 of 5")).toBeInTheDocument();
    expect(screen.getByText("0 checked")).toBeInTheDocument();
    await waitFor(() =>
      expect(
        window.localStorage.getItem(
          "lovable-original:revision:semantic-html",
        ),
      ).not.toBeNull(),
    );

    for (let cardNumber = 1; cardNumber <= 5; cardNumber += 1) {
      fireEvent.click(screen.getByRole("button", { name: "Reveal answer" }));
      expect(
        screen.getByText(
          cardNumber === 5
            ? "Revision round complete"
            : `${cardNumber} checked`,
        ),
      ).toBeInTheDocument();

      if (cardNumber < 5) {
        fireEvent.click(screen.getByRole("button", { name: "Next card" }));
        expect(
          screen.getByText(`Card ${cardNumber + 1} of 5`),
        ).toBeInTheDocument();
        expect(
          screen.getByRole("button", { name: "Reveal answer" }),
        ).toHaveFocus();
      }
    }

    await waitFor(() =>
      expect(
        JSON.parse(
          window.localStorage.getItem(
            "lovable-original:revision:semantic-html",
          ) ?? "{}",
        ),
      ).toEqual({
        cardIndex: 4,
        checkedCardIds: [
          "main-purpose",
          "article-section",
          "heading-level",
          "semantic-test",
          "language",
        ],
      }),
    );
  }, 10_000);

  it("restores the learner's last card and checked progress", async () => {
    window.localStorage.setItem(
      "lovable-original:revision:semantic-html",
      JSON.stringify({
        cardIndex: 2,
        checkedCardIds: ["main-purpose", "article-section"],
      }),
    );

    render(<RevisionPack lessonSlug="semantic-html" />);

    await waitFor(() =>
      expect(screen.getByText("Card 3 of 5")).toBeInTheDocument(),
    );
    expect(screen.getByText("2 checked")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "Why should an <h2> follow the page’s <h1>?",
      }),
    ).toBeInTheDocument();
  });

  it("connects a completed lesson to the guided semantic HTML project", () => {
    render(<RevisionPack lessonSlug="semantic-html" />);

    expect(
      screen.getByRole("link", { name: /Build the guided project/ }),
    ).toHaveAttribute("href", "/projects/semantic-html-article");
  });
});
