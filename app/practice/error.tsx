"use client";

import Link from "next/link";

export default function PracticeError({ reset }: { reset: () => void }) {
  return (
    <main className="dashboard-error">
      <div>
        <p className="eyebrow">Practice interrupted</p>
        <h1>We couldn’t load this practice space.</h1>
        <p>
          Your saved work stays with your account. Try loading this page again,
          or return to the practice path.
        </p>
        <div className="practice-error-actions">
          <button
            className="account-submit"
            type="button"
            onClick={() => reset()}
          >
            Try again
          </button>
          <Link className="text-link" href="/practice">
            Return to practice
          </Link>
        </div>
      </div>
    </main>
  );
}
