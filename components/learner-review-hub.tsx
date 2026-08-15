import Link from "next/link";
import type { LearnerReviewHubViewModel } from "@/lib/learner-review-hub";

export function LearnerReviewHub({
  review,
}: {
  review: LearnerReviewHubViewModel;
}) {
  const firstReview = review.ready[0] ?? null;
  const queuedReviews = review.ready.slice(1);

  return (
    <div className="learner-review-layout">
      <nav className="learner-review-breadcrumbs" aria-label="Review navigation">
        <Link href="/profile">Private profile</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">Review</span>
      </nav>

      <header className="learner-review-heading">
        <div>
          <p className="eyebrow">Private review</p>
          <h1 id="review-title">
            {firstReview
              ? "Your next review is already chosen."
              : "Nothing needs review right now."}
          </h1>
          <p>
            {firstReview
              ? "Due recall and unresolved saved work come first. This page changes only when your private results change."
              : "Keep moving through your exact unfinished activity. Saved recall will return here when it is due."}
          </p>
        </div>
        <aside aria-label={`${review.ready.length} reviews ready now`}>
          <strong>{review.ready.length}</strong>
          <span>{review.ready.length === 1 ? "review ready" : "reviews ready"}</span>
          <small>From saved results only</small>
        </aside>
      </header>

      {firstReview ? (
        <>
          <section
            className="learner-review-priority"
            aria-labelledby="priority-review-title"
          >
            <div className="learner-review-priority-index" aria-hidden="true">
              01
            </div>
            <div className="learner-review-priority-copy">
              <p>{firstReview.eyebrow}</p>
              <h2 id="priority-review-title">{firstReview.title}</h2>
              <p>{firstReview.description}</p>
              <small>{firstReview.detail}</small>
            </div>
            <Link
              className="learner-review-primary-action"
              href={firstReview.href}
            >
              {firstReview.label}
              <span aria-hidden="true">→</span>
            </Link>
          </section>

          {queuedReviews.length > 0 ? (
            <section
              className="learner-review-queue"
              aria-labelledby="review-queue-title"
            >
              <div className="learner-review-section-heading">
                <div>
                  <p className="eyebrow">Ready after that</p>
                  <h2 id="review-queue-title">Keep the next passes short.</h2>
                </div>
                <p>Each destination keeps its own saved result authoritative.</p>
              </div>
              <ol>
                {queuedReviews.map((item, index) => (
                  <li key={item.id}>
                    <span className="learner-review-queue-index">
                      {String(index + 2).padStart(2, "0")}
                    </span>
                    <div>
                      <p>{item.eyebrow}</p>
                      <h3>{item.title}</h3>
                      <span>{item.detail}</span>
                    </div>
                    <Link href={item.href}>
                      {item.label} <span aria-hidden="true">→</span>
                    </Link>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}

          <aside className="learner-review-continuation is-secondary">
            <div>
              <p>{review.continuation.kicker}</p>
              <h2>{review.continuation.title}</h2>
              <span>Your forward learning path stays ready after review.</span>
            </div>
            <Link href={review.continuation.href}>
              {review.continuation.label} <span aria-hidden="true">→</span>
            </Link>
          </aside>
        </>
      ) : (
        <section
          className="learner-review-continuation"
          aria-labelledby="review-continuation-title"
        >
          <div>
            <p>{review.continuation.kicker}</p>
            <h2 id="review-continuation-title">{review.continuation.title}</h2>
            <span>{review.continuation.description}</span>
          </div>
          <Link
            className="learner-review-primary-action"
            href={review.continuation.href}
          >
            {review.continuation.label}
            <span aria-hidden="true">→</span>
          </Link>
        </section>
      )}

      {review.scheduled.length > 0 ? (
        <section
          className="learner-review-scheduled"
          aria-labelledby="scheduled-review-title"
        >
          <div>
            <p className="eyebrow">Scheduled later</p>
            <h2 id="scheduled-review-title">Recall with a reason to return.</h2>
          </div>
          <ul>
            {review.scheduled.map((item) => (
              <li key={item.id}>
                <div>
                  <strong>{item.title}</strong>
                  <span>{item.detail}</span>
                </div>
                <Link href={item.href} aria-label={`Open ${item.title}`}>
                  View <span aria-hidden="true">→</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
