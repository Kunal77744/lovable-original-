"use client";

import {
  type KeyboardEvent,
  useLayoutEffect,
  useRef,
} from "react";
import {
  toggleEditorBlockComments,
  toggleEditorLineComments,
} from "@/lib/code-editor-comments";
import { applyEditorIndentation } from "@/lib/code-editor-indentation";
import { applyEditorSmartEditing } from "@/lib/code-editor-smart-editing";

type CommentSyntax = "javascript" | "html" | "css";

type EditorResult = {
  value: string;
  selectionStart: number;
  selectionEnd: number;
};

export function useCodeEditorKeyboard({
  value,
  onChange,
  commentSyntax,
}: {
  value: string;
  onChange: (value: string) => void;
  commentSyntax: CommentSyntax;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pendingSelection = useRef<{ start: number; end: number } | null>(null);
  const allowNextTabToExit = useRef(false);

  useLayoutEffect(() => {
    const selection = pendingSelection.current;
    if (!selection || !textareaRef.current) return;

    textareaRef.current.setSelectionRange(selection.start, selection.end);
    pendingSelection.current = null;
  }, [value]);

  function applyResult(result: EditorResult) {
    if (result.value === value) {
      textareaRef.current?.setSelectionRange(
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
      const result =
        commentSyntax === "javascript"
          ? toggleEditorLineComments(
              value,
              event.currentTarget.selectionStart,
              event.currentTarget.selectionEnd,
            )
          : toggleEditorBlockComments(
              value,
              event.currentTarget.selectionStart,
              event.currentTarget.selectionEnd,
              commentSyntax === "html"
                ? { open: "<!--", close: "-->" }
                : { open: "/*", close: "*/" },
            );

      applyResult(result);
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
      applyResult(
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
      !event.altKey &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.repeat &&
      !event.nativeEvent.isComposing
    ) {
      const result = applyEditorSmartEditing(
        value,
        event.currentTarget.selectionStart,
        event.currentTarget.selectionEnd,
        event.key,
      );

      if (result) {
        event.preventDefault();
        applyResult(result);
      }
    }
  }

  return { textareaRef, handleKeyDown };
}
