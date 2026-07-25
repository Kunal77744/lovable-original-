import Link from "next/link";
import { SiteFooter, SiteNav } from "./site-chrome";

function ArrowIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      width="20"
      height="20"
      fill="none"
    >
      <path d="M4 10h11M11 6l4 4-4 4" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

export default function NotFound() {
  return (
    <main className="not-found-page">
      <SiteNav />

      <section className="not-found-shell" aria-labelledby="not-found-title">
        <div className="not-found-code" aria-hidden="true">
          <span>4</span>
          <span className="not-found-zero">
            <span>L</span>
          </span>
          <span>4</span>
        </div>

        <div className="not-found-copy">
          <p className="eyebrow">Lovable Original · Page not found</p>
          <h1 id="not-found-title">This page wandered off the learning path.</h1>
          <p className="not-found-lede">
            The page you followed is not here, but the next useful step still is.
          </p>
          <Link className="primary-action" href="/#learning-path">
            Return to the learning path
            <ArrowIcon />
          </Link>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
