import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { LearnerProfile } from "@/components/learner-profile";
import {
  getCodingCatalogProgress,
  getRecentCodingAttempts,
} from "@/db/coding-practice";
import { getOrCreateFirstCourseAssignment } from "@/db/course";
import { auth } from "@/lib/auth";
import { buildLearnerProfile } from "@/lib/learner-profile";
import { SiteFooter, SiteNav } from "../site-chrome";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Private learner profile | Lovable Original",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function ProfilePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/account?mode=signin");
  }

  const [course, practice, attempts] = await Promise.all([
    getOrCreateFirstCourseAssignment(session.user.id),
    getCodingCatalogProgress(session.user.id),
    getRecentCodingAttempts(session.user.id),
  ]);
  const profile = buildLearnerProfile({ course, practice, attempts });

  return (
    <main>
      <SiteNav currentPage="profile" studentSession />
      <section
        className="profile-shell"
        id="main-content"
        tabIndex={-1}
        aria-labelledby="profile-title"
      >
        <LearnerProfile profile={profile} />
      </section>
      <SiteFooter />
    </main>
  );
}
