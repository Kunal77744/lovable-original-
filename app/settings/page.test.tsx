import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getFirstCourseCertificateForStudent,
  getLearnerSettingsForStudent,
} from "@/db/course";
import { auth } from "@/lib/auth";
import SettingsPage, { metadata } from "./page";

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

vi.mock("@/db/course", () => ({
  getFirstCourseCertificateForStudent: vi.fn(),
  getLearnerSettingsForStudent: vi.fn(),
}));

const getSession = vi.mocked(auth.api.getSession);
const getSettings = vi.mocked(getLearnerSettingsForStudent);
const getCertificate = vi.mocked(getFirstCourseCertificateForStudent);

describe("SettingsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSession.mockResolvedValue({
      user: {
        id: "learner-a",
        name: "Asha",
        email: "asha@example.com",
      },
    } as Awaited<ReturnType<typeof auth.api.getSession>>);
    getSettings.mockResolvedValue({
      certificateDisplayName: "Asha",
      updatedAt: "2026-08-11T00:00:00.000Z",
    });
    getCertificate.mockResolvedValue({
      certificate: null,
      eligible: false,
    });
  });

  afterEach(cleanup);

  it("keeps the private export on the noindex account settings page", async () => {
    render(await SettingsPage());

    expect(metadata.robots).toEqual({ index: false, follow: false });
    expect(
      screen.getByRole("heading", { name: "Take your work with you." }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Download my learning data" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Passwords, sessions, and sign-in details are never included/),
    ).toBeInTheDocument();
  });
});
