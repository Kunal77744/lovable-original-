"use client";

import Link from "next/link";
import { useState } from "react";
import {
  buildPortableProjectEvidence,
  type ProjectPortfolioViewModel,
} from "@/lib/project-portfolio";

export function ProjectPortfolio({
  portfolio,
}: {
  portfolio: ProjectPortfolioViewModel;
}) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">(
    "idle",
  );
  const portableEvidence = buildPortableProjectEvidence(portfolio);

  async function copyProjectEvidence() {
    if (!portableEvidence) return;

    try {
      await navigator.clipboard.writeText(portableEvidence);
      setCopyState("copied");
    } catch {
      setCopyState("error");
    }
  }

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
          <p>Three bounded builds, each reviewed against six outcomes.</p>
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

      {portableEvidence ? (
        <section
          className="project-portfolio-export"
          aria-labelledby="project-portfolio-export-title"
        >
          <div>
            <p className="eyebrow">Portable evidence</p>
            <h2 id="project-portfolio-export-title">
              Take completed work into your README.
            </h2>
            <p>
              Copy a clean Markdown summary of completed projects and saved
              review totals. Private code, feedback, and identity stay out.
            </p>
          </div>
          <div className="project-portfolio-export-action">
            <button type="button" onClick={copyProjectEvidence}>
              {copyState === "copied"
                ? "Project summary copied"
                : "Copy completed-project summary"}
            </button>
            <p aria-live="polite">
              {copyState === "copied"
                ? `${portfolio.completedCount} completed ${portfolio.completedCount === 1 ? "project is" : "projects are"} ready to paste.`
                : copyState === "error"
                  ? "The summary could not be copied. Try again."
                  : "Copies Markdown to this browser's clipboard."}
            </p>
          </div>
        </section>
      ) : null}

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
