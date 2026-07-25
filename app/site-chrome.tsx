import Link from "next/link";

type SiteNavProps = {
  currentPage?: "home" | "about";
};

export function SkipLink() {
  return (
    <a className="skip-link" href="#main-content">
      Skip to main content
    </a>
  );
}

export function SiteNav({ currentPage = "home" }: SiteNavProps) {
  return (
    <nav className="site-nav" aria-label="Main navigation">
      <Link className="brand" href="/" aria-label="Lovable Original home">
        <span className="brand-mark" aria-hidden="true">
          L
        </span>
        <span>Lovable Original</span>
      </Link>
      <Link
        className="nav-link"
        href="/about"
        aria-current={currentPage === "about" ? "page" : undefined}
      >
        About
      </Link>
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
