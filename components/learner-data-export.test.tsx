import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LearnerDataExport } from "./learner-data-export";

describe("LearnerDataExport", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(cleanup);

  it("downloads the private export with the server-provided filename", async () => {
    const blob = { size: 19, type: "application/json" } as Blob;
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      blob: async () => blob,
      headers: new Headers({
        "content-disposition":
          'attachment; filename="lovable-original-learning-data-2026-08-11.json"',
      }),
    });
    const createObjectUrl = vi.fn().mockReturnValue("blob:learning-data");
    const revokeObjectUrl = vi.fn();
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => undefined);
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("URL", {
      createObjectURL: createObjectUrl,
      revokeObjectURL: revokeObjectUrl,
    });

    render(<LearnerDataExport />);
    fireEvent.click(
      screen.getByRole("button", { name: "Download my learning data" }),
    );

    await waitFor(() =>
      expect(screen.getByText("Your private JSON file is ready.")).toBeInTheDocument(),
    );
    expect(fetchMock).toHaveBeenCalledWith("/api/settings/export", {
      headers: { accept: "application/json" },
    });
    expect(createObjectUrl).toHaveBeenCalledWith(blob);
    expect(click).toHaveBeenCalledOnce();
    expect(revokeObjectUrl).toHaveBeenCalledWith("blob:learning-data");
  });

  it("keeps a failed export retryable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 500 })),
    );

    render(<LearnerDataExport />);
    fireEvent.click(
      screen.getByRole("button", { name: "Download my learning data" }),
    );

    await waitFor(() =>
      expect(
        screen.getByText("The download didn’t finish. Try again."),
      ).toBeInTheDocument(),
    );
    expect(
      screen.getByRole("button", { name: "Download my learning data" }),
    ).toBeEnabled();
  });
});
