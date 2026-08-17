import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  GuidedJavaScriptFileImport,
  MAX_GUIDED_JAVASCRIPT_IMPORT_BYTES,
  MAX_GUIDED_JAVASCRIPT_IMPORT_CHARACTERS,
} from "./guided-javascript-file-import";

function javaScriptFile(
  name: string,
  source: string,
  text: () => Promise<string> = async () => source,
) {
  const file = new File([source], name, { type: "text/javascript" });
  Object.defineProperty(file, "text", { configurable: true, value: text });
  return file;
}

function chooseFile(input: HTMLInputElement, file: File) {
  fireEvent.change(input, { target: { files: [file] } });
}

describe("GuidedJavaScriptFileImport", () => {
  afterEach(cleanup);

  it("requires confirmation before replacing the editor", async () => {
    const onImport = vi.fn();
    render(
      <GuidedJavaScriptFileImport
        destinationName="array-filter.js"
        onImport={onImport}
      />,
    );
    const input = screen.getByLabelText<HTMLInputElement>(
      "Choose JavaScript file to import into array-filter.js",
    );
    const file = javaScriptFile(
      "local-solution.js",
      "function solve(input) { return input.trim(); }",
    );

    chooseFile(input, file);

    expect(
      await screen.findByText(
        "Import local-solution.js into array-filter.js?",
      ),
    ).toBeInTheDocument();
    expect(onImport).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Import file" }));

    expect(onImport).toHaveBeenCalledWith(
      "function solve(input) { return input.trim(); }",
      "local-solution.js",
    );
    expect(
      screen.getByText(
        "local-solution.js is now unsaved work in array-filter.js. Run the checks when ready.",
      ),
    ).toBeInTheDocument();
  });

  it("keeps the editor unchanged when confirmation is cancelled", async () => {
    const onImport = vi.fn();
    render(
      <GuidedJavaScriptFileImport
        destinationName="foundations.js"
        onImport={onImport}
      />,
    );

    chooseFile(
      screen.getByLabelText<HTMLInputElement>(
        "Choose JavaScript file to import into foundations.js",
      ),
      javaScriptFile("draft.js", "const answer = 42;"),
    );
    await screen.findByText("Import draft.js into foundations.js?");
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onImport).not.toHaveBeenCalled();
    expect(
      screen.getByText("Import cancelled. Your editor was not changed."),
    ).toBeInTheDocument();
  });

  it.each([
    ["wrong type", javaScriptFile("notes.txt", "const answer = 42;"), "Choose a .js file."],
    ["empty", javaScriptFile("empty.js", "   "), "That file is empty. Choose a .js file with code in it."],
    [
      "too many characters",
      javaScriptFile(
        "long.js",
        "x".repeat(MAX_GUIDED_JAVASCRIPT_IMPORT_CHARACTERS + 1),
      ),
      "That source is too long. Keep it under 12,000 characters.",
    ],
    [
      "too many bytes",
      javaScriptFile(
        "large.js",
        "x".repeat(MAX_GUIDED_JAVASCRIPT_IMPORT_BYTES + 1),
      ),
      "That file is too large. Choose a .js file under 24 KB.",
    ],
  ])("rejects a %s file without changing the editor", async (_name, file, message) => {
    const onImport = vi.fn();
    render(
      <GuidedJavaScriptFileImport
        destinationName="exercise.js"
        onImport={onImport}
      />,
    );

    chooseFile(
      screen.getByLabelText<HTMLInputElement>(
        "Choose JavaScript file to import into exercise.js",
      ),
      file,
    );

    expect(await screen.findByText(message)).toBeInTheDocument();
    expect(onImport).not.toHaveBeenCalled();
  });

  it("keeps the editor unchanged when the browser cannot read the file", async () => {
    const onImport = vi.fn();
    render(
      <GuidedJavaScriptFileImport
        destinationName="exercise.js"
        onImport={onImport}
      />,
    );
    const file = javaScriptFile("unreadable.js", "const value = 1;", async () => {
      throw new Error("read failed");
    });

    chooseFile(
      screen.getByLabelText<HTMLInputElement>(
        "Choose JavaScript file to import into exercise.js",
      ),
      file,
    );

    await waitFor(() =>
      expect(
        screen.getByText(
          "That file could not be read. Your editor was not changed.",
        ),
      ).toBeInTheDocument(),
    );
    expect(onImport).not.toHaveBeenCalled();
  });
});
