import Link from "next/link";
import type { CodingWorkspaceLibrary as CodingWorkspaceLibraryViewModel } from "@/lib/coding-workspace-library";
import styles from "./coding-workspace-library.module.css";

function formatSavedTime(updatedAt: string) {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  }).format(new Date(updatedAt));
}

export function CodingWorkspaceLibrary({
  library,
}: {
  library: CodingWorkspaceLibraryViewModel;
}) {
  return (
    <div className={styles.layout}>
      <header className={styles.hero}>
        <div className={styles.copy}>
          <p className="eyebrow">Private JavaScript workspaces</p>
          <h1 id="workspace-library-title">Return to the code you last touched.</h1>
          <p className={styles.intro}>
            Every account-backed judged workspace in one place. Reopen your
            exact source without changing saves, verdicts, progress, or attempts.
          </p>
        </div>
        <aside className={styles.summary} aria-label="Workspace summary">
          <span>Saved privately</span>
          <strong>{library.totalCount}</strong>
          <p>
            {library.totalCount === 1 ? "workspace" : "workspaces"} across 12
            judged problems. {library.acceptedCount} with an Accepted best result,
            {" "}{library.inProgressCount} still in progress.
          </p>
        </aside>
      </header>

      <section className={styles.next} aria-labelledby="workspace-next-title">
        <div>
          <p className={styles.nextEyebrow}>{library.nextAction.eyebrow}</p>
          <h2 id="workspace-next-title">{library.nextAction.title}</h2>
          <p>{library.nextAction.description}</p>
        </div>
        <Link className={styles.primaryAction} href={library.nextAction.href}>
          {library.nextAction.label} <span aria-hidden="true">→</span>
        </Link>
      </section>

      <section className={styles.collection} aria-labelledby="workspace-list-title">
        <div className={styles.collectionHeading}>
          <h2 id="workspace-list-title">Most recent first</h2>
          <p>
            The verdict is your saved best result, not a fresh review of this
            source. Your code stays inside its private editor.
          </p>
        </div>

        {library.items.length > 0 ? (
          <ol className={styles.list}>
            {library.items.map((item) => (
              <li className={styles.item} key={item.slug}>
                <span className={styles.number} aria-hidden="true">
                  {String(item.number).padStart(2, "0")}
                </span>
                <div className={styles.itemCopy}>
                  <h3>{item.title}</h3>
                  <p className={styles.meta}>
                    <span>{item.skill}</span>
                    <span className={styles.status}>Best result: {item.status}</span>
                    <span>
                      {item.lineCount} {item.lineCount === 1 ? "line" : "lines"} saved
                    </span>
                    <span>Saved {formatSavedTime(item.updatedAt)}</span>
                  </p>
                </div>
                <Link className={styles.itemLink} href={item.href}>
                  Open workspace <span aria-hidden="true">→</span>
                </Link>
              </li>
            ))}
          </ol>
        ) : (
          <div className={styles.empty}>
            <h3>Your first saved workspace starts here.</h3>
            <p>
              Open problem 01 and start editing. Signed-in source appears in this
              private collection after the workspace saves.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
