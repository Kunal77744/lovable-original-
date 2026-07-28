export default function ProfileLoading() {
  return (
    <main className="dashboard-loading" aria-busy="true" aria-live="polite">
      <div className="dashboard-loading-inner">
        <span className="loading-line loading-line-short" />
        <span className="loading-line loading-line-title" />
        <span className="loading-course" />
        <span className="sr-only">Loading your private learner profile…</span>
      </div>
    </main>
  );
}
