import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { RevisionPack } from "./revision-pack";

describe("RevisionPack", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it("lets a learner reveal and work through every flashcard", async () => {
    render(<RevisionPack lessonSlug="semantic-html" />);

    expect(
      screen.getByRole("heading", { name: "How the structure connects" }),
    ).toBeInTheDocument();
    const outline = screen.getByRole("region", {
      name: "Trace the page from structure to self-check.",
    });
    expect(outline).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Return to your article" }),
    ).toHaveAttribute("href", "#semantic-workspace");
    expect(within(outline).getByText("Semantic landmarks")).toBeInTheDocument();
    expect(
      within(outline).getByText(
        "Is the article inside one clear <main> landmark?",
      ),
    ).toBeInTheDocument();
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
    expect(
      screen.getByRole("heading", { name: "How the structure connects" }),
    ).toBeInTheDocument();
  });

  it("gives the CSS lesson its own concept map, workspace return, and cards", async () => {
    render(<RevisionPack lessonSlug="css-selectors-box-model" />);

    expect(
      screen.getByRole("heading", {
        name: "CSS selectors and boxes, compressed",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "How the card stays predictable" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("region", {
        name: "Trace the card from selector to final width.",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Return to your card" }),
    ).toHaveAttribute("href", "#css-practice");
    expect(
      screen.getByRole("heading", { name: "What does .learning-card select?" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /semantic HTML field guide/i }),
    ).not.toBeInTheDocument();

    await waitFor(() =>
      expect(
        window.localStorage.getItem(
          "lovable-original:revision:css-selectors-box-model",
        ),
      ).not.toBeNull(),
    );
    fireEvent.click(screen.getByRole("button", { name: "Reveal answer" }));
    await waitFor(() =>
      expect(
        JSON.parse(
          window.localStorage.getItem(
            "lovable-original:revision:css-selectors-box-model",
          ) ?? "{}",
        ),
      ).toEqual({
        cardIndex: 0,
        checkedCardIds: ["class-syntax"],
      }),
    );
  });

  it("gives the responsive lesson its own concept map and workspace return", () => {
    render(<RevisionPack lessonSlug="responsive-css-grid" />);

    expect(
      screen.getByRole("heading", {
        name: "Responsive CSS Grid, compressed",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "How the layout adapts" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("region", {
        name: "Trace the grid from container to shrinking card.",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Return to your layout" }),
    ).toHaveAttribute("href", "#responsive-css-practice");
    expect(
      screen.getByRole("heading", {
        name: "What becomes a grid item after display: grid?",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("0 checked")).toBeInTheDocument();
  });

  it("connects a completed lesson to the semantic HTML field guide first", () => {
    render(
      <RevisionPack
        lessonSlug="semantic-html"
        practiceHref="/practice"
      />,
    );

    expect(
      screen.getByRole("link", { name: /Build the semantic HTML field guide/ }),
    ).toHaveAttribute("href", "/projects/semantic-html-article");
    expect(
      screen.getByRole("link", { name: /Continue to JavaScript practice/ }),
    ).toHaveAttribute("href", "/practice");
  });
});
