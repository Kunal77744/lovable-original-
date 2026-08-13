import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { ProjectLocalFileImport } from "./project-local-file-import";

function createLocalFile(name: string, source: string) {
  const file = new File([source], name, { type: "text/plain" });
  Object.defineProperty(file, "text", {
    configurable: true,
    value: vi.fn().mockResolvedValue(source),
  });
  return file;
}

afterEach(cleanup);

it("confirms before replacing a project editor", async () => {
  const onImport = vi.fn();
  render(
    <ProjectLocalFileImport
      accept=".html,text/html"
      extension=".html"
      fileLabel="HTML"
      maxLength={100}
      onImport={onImport}
      titleId="import-title"
    />,
  );

  fireEvent.change(screen.getByLabelText("Choose HTML file to import"), {
    target: { files: [createLocalFile("page.html", "<main>Page</main>")] },
  });
  await act(async () => Promise.resolve());

  expect(screen.getByText("Import page.html?")).toBeInTheDocument();
  expect(onImport).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Import file" }));
  expect(onImport).toHaveBeenCalledWith("<main>Page</main>");
  expect(
    screen.getByText(
      "page.html imported locally. Normal project saving now applies.",
    ),
  ).toBeInTheDocument();
});

it("keeps the editor unchanged when an import is cancelled", async () => {
  const onImport = vi.fn();
  render(
    <ProjectLocalFileImport
      accept=".css,text/css"
      extension=".css"
      fileLabel="CSS"
      maxLength={100}
      onImport={onImport}
      titleId="import-title"
    />,
  );

  fireEvent.change(screen.getByLabelText("Choose CSS file to import"), {
    target: { files: [createLocalFile("styles.css", "main { color: red; }")] },
  });
  await act(async () => Promise.resolve());
  fireEvent.click(screen.getByRole("button", { name: "Keep editor" }));

  expect(onImport).not.toHaveBeenCalled();
  expect(
    screen.getByText("Import cancelled. Your project file was not changed."),
  ).toBeInTheDocument();
});

it("rejects the wrong extension, oversized files, and empty source", async () => {
  const onImport = vi.fn();
  render(
    <ProjectLocalFileImport
      accept=".js,text/javascript"
      extension=".js"
      fileLabel="JavaScript"
      maxLength={12}
      onImport={onImport}
      titleId="import-title"
    />,
  );
  const input = screen.getByLabelText("Choose JavaScript file to import");

  fireEvent.change(input, {
    target: { files: [createLocalFile("notes.txt", "hello")] },
  });
  expect(screen.getByText("Choose a file ending in .js.")).toBeInTheDocument();

  fireEvent.change(input, {
    target: { files: [createLocalFile("large.js", "x".repeat(13))] },
  });
  expect(
    screen.getByText("Keep imported JavaScript to 12 bytes or fewer."),
  ).toBeInTheDocument();

  fireEvent.change(input, {
    target: { files: [createLocalFile("empty.js", "")] },
  });
  await act(async () => Promise.resolve());
  expect(
    screen.getByText("That file is empty. Choose .js source to import."),
  ).toBeInTheDocument();
  expect(onImport).not.toHaveBeenCalled();
});
