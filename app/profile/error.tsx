"use client";

export default function ProfileError({ reset }: { reset: () => void }) {
  return (
    <main className="dashboard-error">
      <div>
        <p className="eyebrow">Profile unavailable</p>
        <h1>We couldn’t load your learning record.</h1>
        <p>Your saved work is safe. Try loading the profile again.</p>
        <button className="account-submit" type="button" onClick={() => reset()}>
          Try again
        </button>
      </div>
    </main>
  );
}
