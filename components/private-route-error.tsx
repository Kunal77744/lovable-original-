"use client";

import Link from "next/link";
import styles from "./private-route-error.module.css";

type PrivateRouteErrorProps = {
  eyebrow: string;
  title: string;
  description: string;
  returnHref: string;
  returnLabel: string;
  reset: () => void;
};

export function PrivateRouteError({
  eyebrow,
  title,
  description,
  returnHref,
  returnLabel,
  reset,
}: PrivateRouteErrorProps) {
  return (
    <main className="dashboard-error">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p>{description}</p>
        <div className={styles.actions}>
          <button className="account-submit" type="button" onClick={reset}>
            Try again
          </button>
          <Link className="text-link" href={returnHref}>
            {returnLabel}
          </Link>
        </div>
      </div>
    </main>
  );
}
