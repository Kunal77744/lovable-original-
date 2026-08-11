import Link from "next/link";
import type { PracticeJournalIndex as PracticeJournalIndexViewModel } from "@/lib/practice-journal-index";

function formatSavedDate(updatedAt: string) {
  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(updatedAt));
}

function JournalField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className={value ? undefined : "is-empty"}>
      <dt>{label}</dt>
      <dd>{value || "Not saved yet"}</dd>
    </div>
  );
}

export function PracticeJournalIndex({
  journal,
}: {
  journal: PracticeJournalIndexViewModel;
}) {
  return (
    <div className="practice-journal-layout">
      <header className="practice-journal-hero">
        <div className="practice-journal-intro">
          <p className="eyebrow">Private JavaScript notebook</p>
          <h1 id="practice-journal-title">
            Keep the reasoning behind every result.
          </h1>
          <p>
            Review your saved plans and reflections across all 12 judged
            problems, then return to the exact journal that needs your next
            thought.
          </p>
        </div>

        <aside className="practice-journal-next" aria-label="Journal next step">
          <div className="practice-journal-counts">
            <div>
              <strong>{journal.journalCount}</strong>
              <span>journals started</span>
            </div>
            <div>
              <strong>{journal.plannedCount}</strong>
              <span>plans ready</span>
            </div>
            <div>
              <strong>{journal.reflectedCount}</strong>
              <span>reflections</span>
            </div>
          </div>
          <div>
            <p>{journal.primaryAction.kicker}</p>
            <h2>{journal.primaryAction.title}</h2>
            <p>{journal.primaryAction.description}</p>
            <Link
              className="practice-journal-primary-action"
              href={journal.primaryAction.href}
            >
              {journal.primaryAction.label} <span aria-hidden="true">→</span>
            </Link>
          </div>
        </aside>
      </header>

      <section
        className="practice-journal-ledger"
        aria-labelledby="practice-journal-ledger-title"
      >
        <div className="practice-journal-ledger-heading">
          <div>
            <p className="eyebrow">Saved reasoning</p>
            <h2 id="practice-journal-ledger-title">
              Your problem journals
            </h2>
          </div>
          <p>
            Only your account can read this notebook. Opening it creates no
            attempt, progress, mastery, or analytics record.
          </p>
        </div>

        {journal.items.length === 0 ? (
          <div className="practice-journal-empty">
            <span aria-hidden="true">01</span>
            <div>
              <h3>Your first plan starts beside the editor.</h3>
              <p>
                Open problem 01 and save the input shape, one edge case, and
                your ordered approach. It will return here privately.
              </p>
            </div>
          </div>
        ) : (
          <ol className="practice-journal-list">
            {journal.items.map((item) => (
              <li key={item.slug}>
                <div className="practice-journal-item-heading">
                  <span className="practice-journal-number">
                    {String(item.number).padStart(2, "0")}
                  </span>
                  <div>
                    <p>{item.skill}</p>
                    <h3>{item.title}</h3>
                  </div>
                  <div className="practice-journal-state">
                    <strong>{item.statusLabel}</strong>
                    <span>Saved {formatSavedDate(item.updatedAt)} UTC</span>
                  </div>
                </div>

                <dl className="practice-journal-fields">
                  <JournalField label="Input shape" value={item.inputShape} />
                  <JournalField label="One edge case" value={item.edgeCase} />
                  <JournalField label="Ordered approach" value={item.steps} />
                  <JournalField
                    label="After Accepted"
                    value={item.reflection}
                  />
                </dl>

                <Link
                  className="practice-journal-item-action"
                  href={`/practice/${item.slug}`}
                  aria-label={`${item.actionLabel} for ${item.title}`}
                >
                  {item.actionLabel} <span aria-hidden="true">→</span>
                </Link>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
