import Link from "next/link";

type SiteNavProps = {
  currentPage?:
    | "home"
    | "course"
    | "about"
    | "account"
    | "dashboard"
    | "profile"
    | "lesson"
    | "practice"
    | "settings"
    | "certificate";
  studentSession?: boolean;
};

export function SkipLink() {
  return (
    <a className="skip-link" href="#main-content">
      Skip to main content
    </a>
  );
}

export function SiteNav({
  currentPage = "home",
  studentSession = false,
}: SiteNavProps) {
  const inStudentSpace =
    currentPage === "dashboard" ||
    currentPage === "profile" ||
    currentPage === "lesson" ||
    currentPage === "settings" ||
    currentPage === "certificate" ||
    studentSession;

  return (
    <nav className="site-nav" aria-label="Main navigation">
      <Link className="brand" href="/" aria-label="Lovable Original home">
        <span className="brand-mark" aria-hidden="true">
          L
        </span>
        <span>Lovable Original</span>
      </Link>
      <div className="nav-actions">
        <Link
          className="nav-link"
          href="/practice"
          aria-current={currentPage === "practice" ? "page" : undefined}
        >
          Practice
        </Link>
        <Link
          className="nav-link"
          href="/courses/web-development-foundations"
          aria-current={currentPage === "course" ? "page" : undefined}
        >
          Course
        </Link>
        <Link
          className="nav-link"
          href="/about"
          aria-current={currentPage === "about" ? "page" : undefined}
        >
          About
        </Link>
        {inStudentSpace ? (
          <Link
            className="nav-link"
            href="/profile"
            aria-current={currentPage === "profile" ? "page" : undefined}
          >
            Profile
          </Link>
        ) : null}
        <Link
          className="nav-account-link"
          href={inStudentSpace ? "/dashboard" : "/account"}
          aria-current={
            currentPage === "account" || currentPage === "dashboard"
              ? "page"
              : undefined
          }
        >
          {inStudentSpace ? "Dashboard" : "Student sign in"}
        </Link>
      </div>
    </nav>
  );
}

export function SiteFooter() {
  return (
    <footer>
      <span>© 2026 Lovable Original</span>
      <span className="footer-divider" aria-hidden="true">
        ·
      </span>
      <a className="tin-credit" href="https://tin.computer">
        <span className="tin-mark" aria-hidden="true" />
        Growth by Tin
      </a>
    </footer>
  );
}
