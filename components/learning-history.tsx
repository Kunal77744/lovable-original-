import Link from "next/link";
import type { LearningHistoryItem } from "@/lib/learning-history";

function formatDay(occurredAt: string) {
  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(occurredAt));
}

function formatTime(occurredAt: string) {
  return new Intl.DateTimeFormat("en", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  }).format(new Date(occurredAt));
}

function groupByDay(items: LearningHistoryItem[]) {
  const groups = new Map<string, LearningHistoryItem[]>();

  for (const item of items) {
    const day = formatDay(item.occurredAt);
    groups.set(day, [...(groups.get(day) ?? []), item]);
  }

  return [...groups.entries()];
}

export function LearningHistory({ items }: { items: LearningHistoryItem[] }) {
  const newest = items[0] ?? null;
  const representedKinds = new Set(items.map((item) => item.kind));
  const groups = groupByDay(items);

  return (
    <div className="learning-history-layout">
      <header className="learning-history-hero">
        <div className="learning-history-intro">
          <p className="eyebrow">Private learning history</p>
          <h1 id="learning-history-title">Every saved result, in order.</h1>
          <p>
            Return to completed lessons, practice attempts, guided JavaScript,
            project reviews, and revision work from one account-only timeline.
          </p>
        </div>

        <aside className="learning-history-summary" aria-label="History summary">
          <span className="learning-history-private-mark" aria-hidden="true">
            ●
          </span>
          <p className="learning-history-summary-label">Private by default</p>
          <strong>{items.length} recent results</strong>
          <p>
            {representedKinds.size} learning areas are represented. Source code,
            answers, notes, feedback, and identity stay out of this view.
          </p>
          {newest ? (
            <Link className="learning-history-primary-action" href={newest.href}>
              Continue from the newest result
              <span aria-hidden="true">→</span>
            </Link>
          ) : (
            <Link className="learning-history-primary-action" href="/dashboard">
              Start your learning path
              <span aria-hidden="true">→</span>
            </Link>
          )}
        </aside>
      </header>

      {items.length === 0 ? (
        <section className="learning-history-empty" aria-labelledby="empty-title">
          <span aria-hidden="true">01</span>
          <div>
            <p className="course-kicker">Nothing saved yet</p>
            <h2 id="empty-title">Your first result will appear here.</h2>
            <p>
              Complete a lesson, save a practice result, or finish a guided
              exercise. This timeline will update without creating a separate
              activity record.
            </p>
          </div>
        </section>
      ) : (
        <section className="learning-history-timeline" aria-label="Saved results">
          {groups.map(([day, dayItems]) => (
            <div className="learning-history-day" key={day}>
              <div className="learning-history-day-label">
                <time dateTime={dayItems[0]?.occurredAt}>{day}</time>
                <span>{dayItems.length} saved</span>
              </div>
              <ol>
                {dayItems.map((item) => (
                  <li key={item.id}>
                    <span className="learning-history-node" aria-hidden="true" />
                    <article>
                      <div className="learning-history-item-heading">
                        <div>
                          <p>{item.category}</p>
                          <h2>{item.title}</h2>
                        </div>
                        <time dateTime={item.occurredAt}>
                          {formatTime(item.occurredAt)}
                        </time>
                      </div>
                      <div className="learning-history-item-result">
                        <strong>{item.result}</strong>
                        <Link href={item.href}>
                          {item.actionLabel}
                          <span aria-hidden="true">→</span>
                        </Link>
                      </div>
                    </article>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </section>
      )}

      <footer className="learning-history-footer">
        <p>
          This page reads the results already saved to your account. Opening it
          creates no learning or analytics record.
        </p>
      </footer>
    </div>
  );
}
