import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import Link from "next/link";
import { afterEach, describe, expect, it } from "vitest";
import {
  PracticeCatalogSearchControl,
  PracticeCatalogSearchGroup,
  PracticeCatalogSearchItem,
  PracticeCatalogSearchProvider,
} from "./practice-catalog-search";

afterEach(cleanup);

function CatalogSearchFixture() {
  return (
    <PracticeCatalogSearchProvider>
      <PracticeCatalogSearchControl
        problemSearchTexts={[
          "Sum two numbers Input handling Parse text before arithmetic",
          "Find a value Binary search Discard half of a sorted range",
        ]}
        labSearchTexts={[
          "Practice recursion Base cases Recursive steps",
          "Search and sort values Linear search Binary search",
        ]}
      />
      <PracticeCatalogSearchGroup
        searchTexts={[
          "Sum two numbers Input handling Parse text before arithmetic",
          "Find a value Binary search Discard half of a sorted range",
        ]}
      >
        <section aria-label="Judged problems">
          <PracticeCatalogSearchItem searchText="Sum two numbers Input handling Parse text before arithmetic">
            <Link href="/practice/sum-two-numbers">Sum two numbers</Link>
          </PracticeCatalogSearchItem>
          <PracticeCatalogSearchItem searchText="Find a value Binary search Discard half of a sorted range">
            <Link href="/practice/binary-search">Find a value</Link>
          </PracticeCatalogSearchItem>
        </section>
      </PracticeCatalogSearchGroup>
      <PracticeCatalogSearchGroup
        searchTexts={[
          "Practice recursion Base cases Recursive steps",
          "Search and sort values Linear search Binary search",
        ]}
      >
        <section aria-label="Guided labs">
          <PracticeCatalogSearchItem searchText="Practice recursion Base cases Recursive steps">
            <Link href="/practice/recursion">Practice recursion</Link>
          </PracticeCatalogSearchItem>
          <PracticeCatalogSearchItem searchText="Search and sort values Linear search Binary search">
            <Link href="/practice/search-sort">Search and sort values</Link>
          </PracticeCatalogSearchItem>
        </section>
      </PracticeCatalogSearchGroup>
    </PracticeCatalogSearchProvider>
  );
}

describe("PracticeCatalogSearch", () => {
  it("matches title and concept text across judged problems and guided labs", () => {
    render(<CatalogSearchFixture />);

    const search = screen.getByRole("searchbox", {
      name: "Find a practice activity",
    });
    fireEvent.change(search, { target: { value: "binary SEARCH" } });

    expect(screen.getByText("Find a value")).toBeInTheDocument();
    expect(screen.getByText("Search and sort values")).toBeInTheDocument();
    expect(screen.queryByText("Sum two numbers")).not.toBeInTheDocument();
    expect(screen.queryByText("Practice recursion")).not.toBeInTheDocument();
    expect(
      screen.getByText("1 judged problem and 1 guided lab match."),
    ).toBeInTheDocument();
  });

  it("clears a no-results search without changing destinations", () => {
    render(<CatalogSearchFixture />);

    const search = screen.getByRole("searchbox", {
      name: "Find a practice activity",
    });
    fireEvent.change(search, { target: { value: "closures" } });

    expect(
      screen.getByText(
        "No judged problems or guided labs match “closures”.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Clear" }));

    expect(screen.getByText("Sum two numbers")).toHaveAttribute(
      "href",
      "/practice/sum-two-numbers",
    );
    expect(screen.getByText("Practice recursion")).toHaveAttribute(
      "href",
      "/practice/recursion",
    );
  });
});
