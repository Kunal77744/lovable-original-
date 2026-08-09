import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LearnerSettingsForm } from "./learner-settings-form";

describe("LearnerSettingsForm", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(cleanup);

  it("restores and revises the private certificate name", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        settings: {
          certificateDisplayName: "Asha Singh",
          updatedAt: "2026-07-28T02:00:00.000Z",
        },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <LearnerSettingsForm
        initialSettings={{
          certificateDisplayName: "Asha",
          updatedAt: "2026-07-28T01:00:00.000Z",
        }}
      />,
    );

    expect(screen.getByDisplayValue("Asha")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Save certificate name" }),
    ).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Certificate display name"), {
      target: { value: "Asha Singh" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Save certificate name" }),
    );

    await waitFor(() =>
      expect(
        screen.getByText(
          "Certificate name saved. It will return with your account.",
        ),
      ).toBeInTheDocument(),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/settings",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ certificateDisplayName: "Asha Singh" }),
      }),
    );
  });

  it("announces a failed save without replacing the learner's input", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ error: "Keep your certificate name to 60 characters or fewer." }),
      }),
    );

    render(
      <LearnerSettingsForm
        initialSettings={{
          certificateDisplayName: "Asha",
          updatedAt: null,
        }}
      />,
    );

    fireEvent.change(screen.getByLabelText("Certificate display name"), {
      target: { value: "Asha!" },
    });
    fireEvent.submit(
      screen.getByRole("button", { name: "Save certificate name" }),
    );

    await waitFor(() =>
      expect(
        screen.getByText(
          "Keep your certificate name to 60 characters or fewer.",
        ),
      ).toBeInTheDocument(),
    );
    expect(screen.getByDisplayValue("Asha!")).toBeInTheDocument();
  });

  it("keeps a newer certificate name visibly unsaved when an older save finishes", async () => {
    let finishSave: ((value: unknown) => void) | undefined;
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            finishSave = resolve;
          }),
      )
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          settings: {
            certificateDisplayName: "Asha Singh Patel",
            updatedAt: "2026-07-28T03:00:00.000Z",
          },
        }),
      });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <LearnerSettingsForm
        initialSettings={{
          certificateDisplayName: "Asha",
          updatedAt: "2026-07-28T01:00:00.000Z",
        }}
      />,
    );

    const nameInput = screen.getByLabelText("Certificate display name");
    fireEvent.change(nameInput, { target: { value: "Asha Singh" } });
    fireEvent.click(
      screen.getByRole("button", { name: "Save certificate name" }),
    );

    fireEvent.change(nameInput, { target: { value: "Asha Singh Patel" } });

    await act(async () => {
      finishSave?.({
        ok: true,
        json: async () => ({
          settings: {
            certificateDisplayName: "Asha Singh",
            updatedAt: "2026-07-28T02:00:00.000Z",
          },
        }),
      });
    });

    expect(nameInput).toHaveValue("Asha Singh Patel");
    expect(
      screen.getByText(
        "Certificate name saved. Your newer changes are still unsaved.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Save certificate name" }),
    ).toBeEnabled();

    fireEvent.click(
      screen.getByRole("button", { name: "Save certificate name" }),
    );

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(fetchMock).toHaveBeenLastCalledWith(
      "/api/settings",
      expect.objectContaining({
        body: JSON.stringify({
          certificateDisplayName: "Asha Singh Patel",
        }),
      }),
    );
  });
});
