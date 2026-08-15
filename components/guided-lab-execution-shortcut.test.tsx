import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ComponentType } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  GUIDED_LAB_EXECUTION_HINT_ID,
  GuidedLabExecutionHint,
  useGuidedLabExecutionShortcut,
} from "./guided-lab-execution-shortcut";
import { JavaScriptAlgorithmPatternsLab } from "./javascript-algorithm-patterns-lab";
import { JavaScriptDataStructuresLab } from "./javascript-data-structures-lab";
import { JavaScriptDomLab } from "./javascript-dom-lab";
import { JavaScriptFunctionsScopeLab } from "./javascript-functions-scope-lab";
import { JavaScriptLinkedListLab } from "./javascript-linked-list-lab";
import { JavaScriptRecursionLab } from "./javascript-recursion-lab";
import { JavaScriptSearchSortLab } from "./javascript-search-sort-lab";
import { JavaScriptStacksQueuesLab } from "./javascript-stacks-queues-lab";
import { JavaScriptTreesGraphsLab } from "./javascript-trees-graphs-lab";

const runCodingSolution = vi.fn();
const runDomLabCode = vi.fn();

vi.mock("@/lib/coding-runner", () => ({
  runCodingSolution: (...args: unknown[]) => runCodingSolution(...args),
}));

vi.mock("@/lib/dom-lab-runner", () => ({
  runDomLabCode: (...args: unknown[]) => runDomLabCode(...args),
}));

type LabComponent = ComponentType<{ completedExerciseIds?: string[] }>;

const guidedCodeLabs: Array<{
  name: string;
  Component: LabComponent;
  editorName: string;
  runner: "coding" | "dom";
}> = [
  {
    name: "algorithm patterns",
    Component: JavaScriptAlgorithmPatternsLab,
    editorName: "JavaScript algorithm pattern code",
    runner: "coding",
  },
  {
    name: "data structures",
    Component: JavaScriptDataStructuresLab,
    editorName: "JavaScript data-structure code",
    runner: "coding",
  },
  {
    name: "DOM fundamentals",
    Component: JavaScriptDomLab,
    editorName: "JavaScript DOM code",
    runner: "dom",
  },
  {
    name: "functions and scope",
    Component: JavaScriptFunctionsScopeLab,
    editorName: "JavaScript functions and scope code",
    runner: "coding",
  },
  {
    name: "linked lists",
    Component: JavaScriptLinkedListLab,
    editorName: "JavaScript linked-list code",
    runner: "coding",
  },
  {
    name: "recursion",
    Component: JavaScriptRecursionLab,
    editorName: "JavaScript recursion code",
    runner: "coding",
  },
  {
    name: "searching and sorting",
    Component: JavaScriptSearchSortLab,
    editorName: "JavaScript searching and sorting code",
    runner: "coding",
  },
  {
    name: "stacks and queues",
    Component: JavaScriptStacksQueuesLab,
    editorName: "JavaScript stacks and queues code",
    runner: "coding",
  },
  {
    name: "trees and graphs",
    Component: JavaScriptTreesGraphsLab,
    editorName: "JavaScript trees and graphs code",
    runner: "coding",
  },
];

function ShortcutHarness({
  disabled = false,
  onRun,
}: {
  disabled?: boolean;
  onRun: () => Promise<void> | void;
}) {
  const handleKeyDown = useGuidedLabExecutionShortcut({ disabled, onRun });

  return (
    <>
      <label htmlFor="shortcut-harness">Code</label>
      <textarea
        id="shortcut-harness"
        aria-describedby={GUIDED_LAB_EXECUTION_HINT_ID}
        onKeyDown={handleKeyDown}
      />
      <GuidedLabExecutionHint />
    </>
  );
}

describe("guided lab execution shortcut", () => {
  beforeEach(() => {
    runCodingSolution.mockReset();
    runDomLabCode.mockReset();
  });

  afterEach(cleanup);

  it("runs once while a shortcut-triggered check is unresolved, then unlocks", async () => {
    let finishRun: (() => void) | undefined;
    const onRun = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finishRun = resolve;
        }),
    );
    render(<ShortcutHarness onRun={onRun} />);

    const editor = screen.getByRole("textbox", { name: "Code" });
    fireEvent.keyDown(editor, { key: "Enter", ctrlKey: true });
    fireEvent.keyDown(editor, { key: "Enter", metaKey: true });

    expect(onRun).toHaveBeenCalledTimes(1);

    await act(async () => finishRun?.());
    fireEvent.keyDown(editor, { key: "Enter", metaKey: true });

    expect(onRun).toHaveBeenCalledTimes(2);
  });

  it("keeps ordinary editing, alternate modifiers, repeats, and composition untouched", () => {
    const onRun = vi.fn();
    render(<ShortcutHarness onRun={onRun} />);

    const editor = screen.getByRole("textbox", { name: "Code" });
    fireEvent.keyDown(editor, { key: "Enter" });
    fireEvent.keyDown(editor, { key: "Enter", ctrlKey: true, shiftKey: true });
    fireEvent.keyDown(editor, { key: "Enter", metaKey: true, altKey: true });
    fireEvent.keyDown(editor, { key: "Enter", ctrlKey: true, repeat: true });
    fireEvent.keyDown(editor, {
      key: "Enter",
      ctrlKey: true,
      isComposing: true,
    });

    expect(onRun).not.toHaveBeenCalled();
  });

  it("keeps a recognized shortcut inert when checks are unavailable", () => {
    const onRun = vi.fn();
    render(<ShortcutHarness disabled onRun={onRun} />);

    const editor = screen.getByRole("textbox", { name: "Code" });
    expect(
      fireEvent.keyDown(editor, { key: "Enter", ctrlKey: true }),
    ).toBe(false);
    expect(onRun).not.toHaveBeenCalled();
  });

  it.each(guidedCodeLabs)(
    "connects the visible shortcut to the $name editor",
    ({ Component, editorName, runner }) => {
      const neverFinishes = new Promise(() => undefined);
      runCodingSolution.mockReturnValue(neverFinishes);
      runDomLabCode.mockReturnValue(neverFinishes);
      render(<Component />);

      const editor = screen.getByRole("textbox", { name: editorName });
      expect(editor).toHaveAccessibleDescription(
        "Keyboard Ctrl/⌘ + Enter to run checks",
      );

      fireEvent.keyDown(editor, { key: "Enter", ctrlKey: true });
      fireEvent.keyDown(editor, { key: "Enter", ctrlKey: true });
      fireEvent.keyDown(editor, {
        key: "Enter",
        ctrlKey: true,
        repeat: true,
      });

      const selectedRunner = runner === "dom" ? runDomLabCode : runCodingSolution;
      expect(selectedRunner).toHaveBeenCalledTimes(1);
    },
  );
});
