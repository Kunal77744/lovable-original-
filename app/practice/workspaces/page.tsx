import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { CodingWorkspaceLibrary } from "@/components/coding-workspace-library";
import { getCodingWorkspacesForStudent } from "@/db/coding-workspace-library";
import { getSignInHref } from "@/lib/account-destination";
import { auth } from "@/lib/auth";
import { buildCodingWorkspaceLibrary } from "@/lib/coding-workspace-library";
import { SiteFooter, SiteNav, SkipLink } from "../../site-chrome";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your private JavaScript workspaces | Lovable Original",
  description:
    "Resume the exact saved source in your private JavaScript problem workspaces.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function CodingWorkspacesPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect(getSignInHref("/practice/workspaces"));
  }

  const workspaces = await getCodingWorkspacesForStudent(session.user.id);
  const library = buildCodingWorkspaceLibrary(workspaces);

  return (
    <main>
      <SkipLink />
      <SiteNav currentPage="practice" studentSession />
      <section id="main-content" tabIndex={-1} aria-labelledby="workspace-library-title">
        <CodingWorkspaceLibrary library={library} />
      </section>
      <SiteFooter />
    </main>
  );
}
