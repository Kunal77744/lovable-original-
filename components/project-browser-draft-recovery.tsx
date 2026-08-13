type ProjectBrowserDraftRecoveryProps = {
  titleId: string;
  fileLabel: string;
  multiple?: boolean;
  onKeepSaved: () => void;
  onRestore: () => void;
};

export function ProjectBrowserDraftRecovery({
  titleId,
  fileLabel,
  multiple = false,
  onKeepSaved,
  onRestore,
}: ProjectBrowserDraftRecoveryProps) {
  return (
    <aside
      className="browser-draft-recovery project-browser-draft-recovery"
      aria-labelledby={titleId}
    >
      <div>
        <span>Browser recovery</span>
        <strong id={titleId}>Newer {fileLabel} work is available.</strong>
      </div>
      <p>
        Your private saved {multiple ? "files are" : "file is"} still loaded.
        Restore {multiple ? "these browser copies" : "this browser copy"} as
        unsaved work, or keep the account-backed version.
      </p>
      <div className="browser-draft-recovery-actions">
        <button type="button" onClick={onKeepSaved}>
          Keep saved {multiple ? "files" : "file"}
        </button>
        <button type="button" onClick={onRestore}>
          Restore browser {multiple ? "files" : "draft"}
        </button>
      </div>
    </aside>
  );
}
