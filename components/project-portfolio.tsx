import Link from "next/link";
import type { ProjectPortfolioViewModel } from "@/lib/project-portfolio";

export function ProjectPortfolio({
  portfolio,
}: {
  portfolio: ProjectPortfolioViewModel;
}) {
  return (
    <section
      className="project-portfolio-shell"
      id="main-content"
      tabIndex={-1}
      aria-labelledby="project-portfolio-title"
    >
      <header className="project-portfolio-hero">
        <div className="project-portfolio-intro">
          <p className="eyebrow">Private project portfolio</p>
          <h1 id="project-portfolio-title">
            Three projects. One record of what you can build.
          </h1>
          <p>
            Resume the exact project that needs you, or reopen finished work
            without exposing your code, feedback, or identity.
          </p>
        </div>

        <aside
          className="project-portfolio-next"
          aria-labelledby="project-portfolio-next-title"
        >
          <div className="project-portfolio-count">
            <span>{portfolio.completedCount}</span>
            <p>
              of {portfolio.totalCount}
              <br /> projects complete
            </p>
          </div>
          <div>
            <p>{portfolio.primaryAction.kicker}</p>
            <h2 id="project-portfolio-next-title">
              {portfolio.primaryAction.title}
            </h2>
            <p>{portfolio.primaryAction.description}</p>
            <Link
              className="project-portfolio-primary-action"
              href={portfolio.primaryAction.href}
            >
              {portfolio.primaryAction.label}
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </aside>
      </header>

      <section
        className="project-portfolio-ledger"
        aria-labelledby="project-portfolio-ledger-title"
      >
        <div className="project-portfolio-ledger-heading">
          <div>
            <p className="eyebrow">Saved project record</p>
            <h2 id="project-portfolio-ledger-title">Work across the stack</h2>
          </div>
          <div className="project-portfolio-ledger-note">
            <p>Three bounded builds, each reviewed against six outcomes.</p>
            <Link href="/projects/history">Review saved attempts</Link>
          </div>
        </div>

        <ol>
          {portfolio.projects.map((project) => (
            <li
              className={`project-portfolio-row is-${project.state}`}
              key={project.number}
            >
              <div className="project-portfolio-row-number" aria-hidden="true">
                {project.number}
              </div>
              <div className="project-portfolio-row-copy">
                <p>{project.stack}</p>
                <h3>{project.title}</h3>
                <p>{project.description}</p>
                <div className="project-portfolio-artifact" aria-hidden="true">
                  <span />
                  {project.artifact}
                </div>
              </div>
              <div className="project-portfolio-row-status">
                <span>{project.statusLabel}</span>
                <strong>{project.progressLabel}</strong>
                {project.lockedReason ? <p>{project.lockedReason}</p> : null}
                <div className="project-portfolio-row-links">
                  {project.href && project.actionLabel ? (
                    <Link href={project.href}>
                      {project.actionLabel}
                      <span aria-hidden="true">↗</span>
                    </Link>
                  ) : null}
                  {project.debriefHref ? (
                    <Link href={project.debriefHref}>Open private debrief</Link>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <aside className="project-portfolio-privacy">
        <span aria-hidden="true">●</span>
        <p>
          <strong>Only project status and review totals appear here.</strong>
          Your code, HTML, CSS, and feedback stay inside each private project.
        </p>
      </aside>
    </section>
  );
}
