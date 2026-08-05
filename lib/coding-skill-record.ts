import { CODING_PROBLEMS } from "@/lib/coding-problems";

export type CodingSkillAttempt = {
  problemSlug: string;
  verdict: string;
  passedTests: number;
  totalTests: number;
  createdAt: string;
};

export type CodingSkillState = "accepted" | "retry" | "not-started";

export type CodingSkillRecordItem = {
  slug: string;
  number: number;
  title: string;
  skill: string;
  state: CodingSkillState;
  resultLabel: string;
  lastAttemptedAt: string | null;
};

export type CodingSkillRecordAction = {
  kicker: string;
  title: string;
  description: string;
  label: string;
  href: string;
};

export type CodingSkillRecord = {
  acceptedCount: number;
  totalCount: number;
  attemptCount: number;
  practiceDays: number;
  lastPracticedAt: string | null;
  skills: CodingSkillRecordItem[];
  nextAction: CodingSkillRecordAction;
};

function compareAttempts(left: CodingSkillAttempt, right: CodingSkillAttempt) {
  return (
    new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
  );
}

export function buildCodingSkillRecord({
  completedSlugs,
  attempts,
}: {
  completedSlugs: string[];
  attempts: CodingSkillAttempt[];
}): CodingSkillRecord {
  const completed = new Set(completedSlugs);
  const relevantAttempts = attempts
    .filter((attempt) =>
      CODING_PROBLEMS.some((problem) => problem.slug === attempt.problemSlug),
    )
    .sort(compareAttempts);
  const attemptsByProblem = new Map<string, CodingSkillAttempt[]>();

  for (const attempt of relevantAttempts) {
    const saved = attemptsByProblem.get(attempt.problemSlug) ?? [];
    saved.push(attempt);
    attemptsByProblem.set(attempt.problemSlug, saved);
  }

  const skills = CODING_PROBLEMS.map((problem): CodingSkillRecordItem => {
    const problemAttempts = attemptsByProblem.get(problem.slug) ?? [];
    const latestAttempt = problemAttempts[0] ?? null;
    const acceptedAttempt = problemAttempts.find(
      (attempt) => attempt.verdict === "Accepted",
    );
    const isAccepted = completed.has(problem.slug);
    const evidenceAttempt = isAccepted
      ? (acceptedAttempt ?? latestAttempt)
      : latestAttempt;
    const state: CodingSkillState = isAccepted
      ? "accepted"
      : latestAttempt
        ? "retry"
        : "not-started";

    return {
      slug: problem.slug,
      number: problem.number,
      title: problem.title,
      skill: problem.skill,
      state,
      resultLabel: evidenceAttempt
        ? `${evidenceAttempt.passedTests}/${evidenceAttempt.totalTests} checks`
        : "No judged attempt",
      lastAttemptedAt: latestAttempt?.createdAt ?? null,
    };
  });

  const retrySkill = skills
    .filter((skill) => skill.state === "retry")
    .sort((left, right) => {
      if (!left.lastAttemptedAt || !right.lastAttemptedAt) return 0;
      return (
        new Date(right.lastAttemptedAt).getTime() -
        new Date(left.lastAttemptedAt).getTime()
      );
    })[0];
  const nextSkill = skills.find((skill) => skill.state === "not-started");
  const practiceDays = new Set(
    relevantAttempts.map((attempt) => attempt.createdAt.slice(0, 10)),
  ).size;

  let nextAction: CodingSkillRecordAction;

  if (retrySkill) {
    nextAction = {
      kicker: "Your next practice",
      title: `Retry ${retrySkill.title}.`,
      description: `${retrySkill.resultLabel} passed on your latest saved attempt. Reopen ${retrySkill.skill.toLowerCase()} while the result is still useful.`,
      label: `Retry problem ${String(retrySkill.number).padStart(2, "0")}`,
      href: `/practice/${retrySkill.slug}`,
    };
  } else if (nextSkill) {
    nextAction = {
      kicker: "Your next practice",
      title: `Start ${nextSkill.title}.`,
      description: `Continue the six-step path with ${nextSkill.skill.toLowerCase()} and save the judged result to this record.`,
      label: `Start problem ${String(nextSkill.number).padStart(2, "0")}`,
      href: `/practice/${nextSkill.slug}`,
    };
  } else {
    nextAction = {
      kicker: "Six skills accepted",
      title: "Keep the fundamentals sharp.",
      description:
        "Every problem has an Accepted result. Reopen the first skill and solve it again without relying on the saved answer.",
      label: "Review problem 01",
      href: `/practice/${CODING_PROBLEMS[0].slug}`,
    };
  }

  return {
    acceptedCount: skills.filter((skill) => skill.state === "accepted").length,
    totalCount: skills.length,
    attemptCount: relevantAttempts.length,
    practiceDays,
    lastPracticedAt: relevantAttempts[0]?.createdAt ?? null,
    skills,
    nextAction,
  };
}
