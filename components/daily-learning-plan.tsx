import Link from "next/link";
import type { DailyLearningPlan as DailyLearningPlanModel } from "@/lib/daily-learning-plan";

export function DailyLearningPlan({
  plan,
}: {
  plan: DailyLearningPlanModel;
}) {
  return (
    <section
      className="dashboard-daily-plan"
      aria-labelledby="dashboard-daily-plan-title"
    >
      <div className="dashboard-daily-plan-focus">
        <p className="course-kicker">Today’s private plan · {plan.dateLabel}</p>
        <h2 id="dashboard-daily-plan-title">{plan.continuation.title}</h2>
        <p>{plan.continuation.description}</p>
        <span>{plan.continuation.kicker}</span>
        <Link
          className="dashboard-daily-plan-action"
          href={plan.continuation.href}
          aria-label={`Today's plan: ${plan.continuation.label}`}
        >
          {plan.continuation.label} <span aria-hidden="true">→</span>
        </Link>
      </div>

      <div className="dashboard-daily-plan-support">
        <div>
          <p className="course-kicker">Due and scheduled</p>
          <h3>{plan.items.length > 0 ? "Know what can wait." : "Keep one step in focus."}</h3>
        </div>
        {plan.items.length > 0 ? (
          <ul>
            {plan.items.map((item) => (
              <li key={item.id} className={`is-${item.state}`}>
                <div>
                  <span>{item.label}</span>
                  <strong>{item.title}</strong>
                  <p>{item.detail}</p>
                </div>
                <Link href={item.href} aria-label={`Open ${item.title}`}>
                  <span aria-hidden="true">↗</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="dashboard-daily-plan-empty">
            Reviews and daily practice will appear here when they become part of
            your saved path.
          </p>
        )}
      </div>
    </section>
  );
}
