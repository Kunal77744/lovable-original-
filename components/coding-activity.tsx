import Link from "next/link";
import type { CodingActivity as CodingActivityViewModel } from "@/lib/coding-activity";

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00.000Z`));
}

function getDayLabel(day: CodingActivityViewModel["days"][number]) {
  const resultLabel = `${day.acceptedCount} Accepted`;
  const attemptLabel = `${day.attemptCount} ${
    day.attemptCount === 1 ? "attempt" : "attempts"
  }`;

  return `${formatDate(day.date)}: ${attemptLabel}, ${resultLabel}`;
}

export function CodingActivity({
  activity,
}: {
  activity: CodingActivityViewModel;
}) {
  return (
    <div className="coding-activity-layout">
      <header className="coding-activity-hero">
        <div className="coding-activity-heading">
          <p className="eyebrow">Private coding activity</p>
          <h1 id="coding-activity-title">See when you actually practiced.</h1>
          <p>
            This 28-day view counts only your saved judged attempts. It creates
            no new progress, score, or public record.
          </p>
          <Link
            className="coding-activity-primary-action"
            href={activity.nextAction.href}
          >
            {activity.nextAction.label} <span aria-hidden="true">→</span>
          </Link>
        </div>

        <aside className="coding-activity-summary" aria-label="Activity summary">
          <p>Last {activity.windowDays} days</p>
          <strong>{activity.activeDays}</strong>
          <span>{activity.activeDays === 1 ? "active day" : "active days"}</span>
          <dl>
            <div>
              <dt>Judged attempts</dt>
              <dd>{activity.attemptCount}</dd>
            </div>
            <div>
              <dt>Accepted results</dt>
              <dd>{activity.acceptedCount}</dd>
            </div>
          </dl>
        </aside>
      </header>

      <section
        className="coding-activity-calendar"
        aria-labelledby="coding-activity-calendar-title"
      >
        <div className="coding-activity-calendar-heading">
          <div>
            <p className="eyebrow">Saved attempt calendar</p>
            <h2 id="coding-activity-calendar-title">Four weeks at a glance</h2>
          </div>
          <p>
            Darker cells mean more judged attempts. Dates use UTC so the saved
            record stays consistent across sessions.
          </p>
        </div>

        <div
          className="coding-activity-grid"
          role="list"
          aria-label="28-day coding activity"
        >
          {activity.days.map((day) => (
            <div
              className={`coding-activity-day intensity-${day.intensity}${
                day.isToday ? " is-today" : ""
              }`}
              key={day.date}
              role="listitem"
              aria-label={getDayLabel(day)}
              title={getDayLabel(day)}
            >
              <span>{new Date(`${day.date}T00:00:00.000Z`).getUTCDate()}</span>
            </div>
          ))}
        </div>
        <div className="coding-activity-range" aria-hidden="true">
          <span>{formatDate(activity.days[0].date)}</span>
          <span>Today</span>
        </div>
      </section>

      <section
        className="coding-activity-detail"
        aria-label="Saved activity detail"
      >
        <dl>
          <div>
            <dt>Consecutive active days</dt>
            <dd>{activity.consecutiveDays}</dd>
            <p>Counts through today or yesterday. A gap resets this number.</p>
          </div>
          <div>
            <dt>Longest saved run</dt>
            <dd>{activity.longestRun}</dd>
            <p>Calculated from every day with a saved judged attempt.</p>
          </div>
          <div>
            <dt>Last saved activity</dt>
            <dd>
              {activity.lastActiveDate
                ? formatDate(activity.lastActiveDate)
                : "No activity yet"}
            </dd>
            <p>Local runs are intentionally excluded from this private record.</p>
          </div>
        </dl>
      </section>

      <section
        className="coding-activity-next"
        aria-labelledby="coding-activity-next-title"
      >
        <div>
          <p className="eyebrow">Exact next step</p>
          <h2 id="coding-activity-next-title">{activity.nextAction.title}</h2>
          <p>{activity.nextAction.description}</p>
        </div>
        <Link href={activity.nextAction.href}>
          {activity.nextAction.label} <span aria-hidden="true">→</span>
        </Link>
      </section>
    </div>
  );
}
