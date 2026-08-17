"use client";

import {
  useRef,
  type ComponentPropsWithoutRef,
  type UIEvent,
} from "react";

type GuidedCodeEditorProps = Omit<
  ComponentPropsWithoutRef<"textarea">,
  "value"
> & {
  value: string;
};

export function getGuidedLineNumberTransform(scrollTop: number) {
  return `translateY(-${scrollTop}px)`;
}

export function GuidedCodeEditor({
  value,
  onScroll,
  ...textareaProps
}: GuidedCodeEditorProps) {
  const lineNumberGutterRef = useRef<HTMLDivElement>(null);
  const lineCount = Math.max(1, value.split("\n").length);

  function syncLineNumbers(event: UIEvent<HTMLTextAreaElement>) {
    if (lineNumberGutterRef.current) {
      lineNumberGutterRef.current.style.transform =
        getGuidedLineNumberTransform(event.currentTarget.scrollTop);
    }

    onScroll?.(event);
  }

  return (
    <div className="guided-code-editor">
      <div
        aria-hidden="true"
        className="guided-code-editor-line-numbers"
        ref={lineNumberGutterRef}
      >
        {Array.from({ length: lineCount }, (_, index) => (
          <span key={index}>{index + 1}</span>
        ))}
      </div>
      <textarea
        {...textareaProps}
        onScroll={syncLineNumbers}
        value={value}
        wrap="off"
      />
    </div>
  );
}
