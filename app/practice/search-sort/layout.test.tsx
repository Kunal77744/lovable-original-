import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import SearchSortLayout from "./layout";

describe("SearchSortLayout", () => {
  afterEach(cleanup);

  it("adds the search comparison without changing the lesson child", () => {
    render(
      <SearchSortLayout>
        <div>Private search and sort lesson</div>
      </SearchSortLayout>,
    );

    expect(screen.getByText("Private search and sort lesson")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Compare searches" }),
    ).toBeInTheDocument();
  });
});
