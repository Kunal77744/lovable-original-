"use client";

export default function DashboardError({
  reset,
}: {
  reset: () => void;
}) {
  return (
    <main className="dashboard-error">
      <div>
        <p className="eyebrow">Dashboard unavailable</p>
        <h1>We couldn’t load your learning space.</h1>
        <p>Your account is safe. Try loading the dashboard again.</p>
        <button className="account-submit" type="button" onClick={() => reset()}>
          Try again
        </button>
      </div>
    </main>
  );
}
