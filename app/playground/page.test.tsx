import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn().mockResolvedValue({
        user: {
          id: "learner-1",
        },
      }),
    },
  },
}));

vi.mock("@/db/javascript-playground", () => ({
  getPlaygroundFile: vi.fn().mockResolvedValue({
    code: "console.log('private');",
    updatedAt: null,
  }),
}));

vi.mock("@/components/javascript-playground", () => ({
  JavaScriptPlayground: () => (
    <section aria-label="JavaScript playground editor" />
  ),
}));

import PlaygroundPage, { metadata } from "./page";

describe("PlaygroundPage", () => {
  it("labels the saved workspace as private beside the page heading", async () => {
    render(await PlaygroundPage());

    const heading = screen.getByRole("heading", {
      level: 1,
      name: "Try one idea. Keep the file.",
    });
    const titleRow = heading.closest(".playground-title-row");
    const privateCue = titleRow?.querySelector(".playground-private-badge");

    expect(titleRow).not.toBeNull();
    expect(privateCue).toContainElement(
      screen.getByText("Private playground", { selector: "[aria-hidden]" }),
    );
    expect(privateCue).toHaveTextContent(
      "Saved code belongs only to your signed-in account.",
    );
  });

  it("keeps the account-only page out of search", () => {
    expect(metadata.robots).toEqual({
      index: false,
      follow: false,
    });
  });
});
