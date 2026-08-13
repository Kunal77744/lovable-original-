"use client";

import { useLayoutEffect, useRef, type KeyboardEvent } from "react";
import { toggleEditorLineComments } from "@/lib/code-editor-comments";
import { applyEditorIndentation } from "@/lib/code-editor-indentation";
import { applyEditorSmartEditing } from "@/lib/code-editor-smart-editing";

type PendingSelection = { start: number; end: number };

export function GuidedJavaScriptCodeEditor({
  id,
  label,
  value,
  onChange,
  maxLength,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  maxLength: number;
}) {
  const editor = useRef<HTMLTextAreaElement | null>(null);
  const pendingSelection = useRef<PendingSelection | null>(null);
  const allowNextTabToExit = useRef(false);
  const keyboardHintId = `${id}-keyboard-hint`;

  useLayoutEffect(() => {
    const selection = pendingSelection.current;
    if (!selection || !editor.current) return;

    pendingSelection.current = null;
    editor.current.focus();
    editor.current.setSelectionRange(selection.start, selection.end);
  }, [value]);

  function applyEdit(result: {
    value: string;
    selectionStart: number;
    selectionEnd: number;
  }) {
    if (result.value === value) {
      editor.current?.setSelectionRange(
        result.selectionStart,
        result.selectionEnd,
      );
      return;
    }

    pendingSelection.current = {
      start: result.selectionStart,
      end: result.selectionEnd,
    };
    onChange(result.value);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (
      event.key === "/" &&
      (event.ctrlKey || event.metaKey) &&
      !event.altKey &&
      !event.shiftKey &&
      !event.repeat &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault();
      applyEdit(
        toggleEditorLineComments(
          value,
          event.currentTarget.selectionStart,
          event.currentTarget.selectionEnd,
        ),
      );
      return;
    }

    if (event.key === "Escape") {
      allowNextTabToExit.current = true;
      return;
    }

    if (event.key === "Tab") {
      if (allowNextTabToExit.current) {
        allowNextTabToExit.current = false;
        return;
      }

      if (
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.nativeEvent.isComposing
      ) {
        return;
      }

      event.preventDefault();
      applyEdit(
        applyEditorIndentation(
          value,
          event.currentTarget.selectionStart,
          event.currentTarget.selectionEnd,
          event.shiftKey,
        ),
      );
      return;
    }

    allowNextTabToExit.current = false;
    if (
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.repeat ||
      event.nativeEvent.isComposing
    ) {
      return;
    }

    const result = applyEditorSmartEditing(
      value,
      event.currentTarget.selectionStart,
      event.currentTarget.selectionEnd,
      event.key,
    );
    if (!result) return;

    event.preventDefault();
    applyEdit(result);
  }

  return (
    <>
      <label htmlFor={id}>{label}</label>
      <textarea
        ref={editor}
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        aria-describedby={keyboardHintId}
        maxLength={maxLength}
        spellCheck={false}
      />
      <p className="guided-code-editor-shortcuts" id={keyboardHintId}>
        Tab/Shift+Tab indent · Ctrl/⌘ / comments · Smart pairs · Esc then Tab
        exits
      </p>
    </>
  );
}
