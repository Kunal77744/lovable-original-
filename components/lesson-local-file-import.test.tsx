import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { LessonLocalFileImport } from "./lesson-local-file-import";

function createLocalFile(name: string, source: string) {
  const file = new File([source], name, { type: "text/plain" });
  Object.defineProperty(file, "text", {
    configurable: true,
    value: vi.fn().mockResolvedValue(source),
  });
  return file;
}

afterEach(cleanup);

it("waits for confirmation before replacing lesson work", async () => {
  const onImport = vi.fn();
  render(
    <LessonLocalFileImport
      accept=".html,text/html"
      extension=".html"
      fileLabel="HTML"
      maxLength={100}
      onImport={onImport}
      titleId="import-title"
    />,
  );

  fireEvent.change(screen.getByLabelText("Choose HTML file to import"), {
    target: { files: [createLocalFile("lesson.html", "<main>Local</main>")] },
  });
  await act(async () => Promise.resolve());

  expect(screen.getByText("Import lesson.html?")).toBeInTheDocument();
  expect(onImport).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Import file" }));

  expect(onImport).toHaveBeenCalledWith("<main>Local</main>");
  expect(
    screen.getByText("lesson.html imported as unsaved lesson work."),
  ).toBeInTheDocument();
});

it("keeps the editor unchanged when confirmation is cancelled", async () => {
  const onImport = vi.fn();
  render(
    <LessonLocalFileImport
      accept=".css,text/css"
      extension=".css"
      fileLabel="CSS"
      maxLength={100}
      onImport={onImport}
      titleId="import-title"
    />,
  );

  fireEvent.change(screen.getByLabelText("Choose CSS file to import"), {
    target: { files: [createLocalFile("lesson.css", "main { color: red; }")] },
  });
  await act(async () => Promise.resolve());
  fireEvent.click(screen.getByRole("button", { name: "Keep editor" }));

  expect(onImport).not.toHaveBeenCalled();
  expect(
    screen.getByText("Import cancelled. Your editor was not changed."),
  ).toBeInTheDocument();
});

it("rejects missing, wrong-type, oversized, and empty files", async () => {
  const onImport = vi.fn();
  render(
    <LessonLocalFileImport
      accept=".css,text/css"
      extension=".css"
      fileLabel="CSS"
      maxLength={12}
      onImport={onImport}
      titleId="import-title"
    />,
  );
  const input = screen.getByLabelText("Choose CSS file to import");

  fireEvent.change(input, { target: { files: [] } });
  expect(
    screen.getByText("No file selected. Your editor was not changed."),
  ).toBeInTheDocument();

  fireEvent.change(input, {
    target: { files: [createLocalFile("notes.txt", "hello")] },
  });
  expect(screen.getByText("Choose a file ending in .css.")).toBeInTheDocument();

  fireEvent.change(input, {
    target: { files: [createLocalFile("large.css", "x".repeat(13))] },
  });
  expect(
    screen.getByText("Keep imported CSS to 12 bytes or fewer."),
  ).toBeInTheDocument();

  fireEvent.change(input, {
    target: { files: [createLocalFile("empty.css", "")] },
  });
  await act(async () => Promise.resolve());
  expect(
    screen.getByText("That file is empty. Choose .css source to import."),
  ).toBeInTheDocument();
  expect(onImport).not.toHaveBeenCalled();
});
