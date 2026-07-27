import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { CodingWorkspace } from "@/components/coding-workspace";
import { getCodingProblemForStudent } from "@/db/coding-practice";
import { auth } from "@/lib/auth";
import {
  CODING_PROBLEMS,
  getCodingProblem,
} from "@/lib/coding-problems";
import { SiteFooter, SiteNav } from "../../site-chrome";

export const dynamic = "force-dynamic";

type ProblemPageProps = {
  params: Promise<{ problemSlug: string }>;
};

export async function generateMetadata({
  params,
}: ProblemPageProps): Promise<Metadata> {
  const { problemSlug } = await params;
  const problem = getCodingProblem(problemSlug);

  if (!problem) {
    return { title: "Problem not found | Lovable Original" };
  }

  return {
    title: `${problem.title} | JavaScript practice`,
    description: problem.statement,
    alternates: {
      canonical: `/practice/${problem.slug}`,
    },
  };
}

export default async function ProblemPage({ params }: ProblemPageProps) {
  const { problemSlug } = await params;
  const problem = getCodingProblem(problemSlug);

  if (!problem) notFound();

  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const studentState = await getCodingProblemForStudent(
    session?.user.id ?? null,
    problemSlug,
  );

  if (!studentState) notFound();

  const previousProblem = CODING_PROBLEMS[problem.number - 2] ?? null;
  const nextProblem = CODING_PROBLEMS[problem.number] ?? null;

  return (
    <main>
      <SiteNav currentPage="practice" studentSession={Boolean(session)} />
      <div
        className="coding-problem-shell"
        id="main-content"
        tabIndex={-1}
      >
        <nav className="problem-breadcrumbs" aria-label="Problem navigation">
          <Link href="/practice">Practice arena</Link>
          <span aria-hidden="true">/</span>
          <span>Problem {String(problem.number).padStart(2, "0")}</span>
        </nav>

        <div className="coding-problem-layout">
          <article className="problem-brief">
            <div className="problem-brief-heading">
              <p className="eyebrow">
                Problem {String(problem.number).padStart(2, "0")} ·{" "}
                {problem.skill}
              </p>
              <h1>{problem.title}</h1>
              <div className="problem-meta">
                <span>{problem.difficulty}</span>
                <span>JavaScript</span>
                <span>1,000 ms</span>
              </div>
            </div>

            <section>
              <h2>Problem</h2>
              <p>{problem.statement}</p>
            </section>
            <section>
              <h2>Input</h2>
              <p>{problem.inputFormat}</p>
            </section>
            <section>
              <h2>Output</h2>
              <p>{problem.outputFormat}</p>
            </section>
            <section>
              <h2>Examples</h2>
              <div className="problem-examples">
                {problem.examples.map((example, index) => (
                  <div className="problem-example" key={`${example.input}-${index}`}>
                    <div>
                      <span>Input</span>
                      <pre>{example.input}</pre>
                    </div>
                    <div>
                      <span>Output</span>
                      <pre>{example.output}</pre>
                    </div>
                    <p>{example.explanation}</p>
                  </div>
                ))}
              </div>
            </section>
          </article>

          <CodingWorkspace
            attempts={studentState.attempts}
            bestVerdict={studentState.bestVerdict}
            initialCode={studentState.code}
            isSignedIn={Boolean(session)}
            problem={{
              slug: problem.slug,
              title: problem.title,
              tests: problem.tests.map((test) => ({ input: test.input })),
              example: {
                input: problem.examples[0].input,
                expectedOutput: problem.examples[0].output,
              },
            }}
          />
        </div>

        <nav className="problem-step-navigation" aria-label="Adjacent problems">
          {previousProblem ? (
            <Link href={`/practice/${previousProblem.slug}`}>
              <span>Previous</span>
              <strong>{previousProblem.title}</strong>
            </Link>
          ) : (
            <span />
          )}
          {nextProblem ? (
            <Link href={`/practice/${nextProblem.slug}`}>
              <span>Next problem</span>
              <strong>{nextProblem.title}</strong>
            </Link>
          ) : (
            <Link href="/practice">
              <span>Set complete</span>
              <strong>Back to the arena</strong>
            </Link>
          )}
        </nav>
      </div>
      <SiteFooter />
    </main>
  );
}
