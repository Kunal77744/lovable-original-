import { and, eq } from "drizzle-orm";
import { getDatabase } from "./index";
import { course, courseAssignment } from "./schema";

const FIRST_COURSE = {
  id: "first-course",
  slug: "first-course",
  title: "Your first course",
  description:
    "One focused course will connect short explanations, active recall, and a real project.",
  status: "topic-selection",
} as const;

export async function getOrCreateFirstCourseAssignment(userId: string) {
  const database = getDatabase();

  await database
    .insert(course)
    .values(FIRST_COURSE)
    .onConflictDoUpdate({
      target: course.id,
      set: {
        title: FIRST_COURSE.title,
        description: FIRST_COURSE.description,
        status: FIRST_COURSE.status,
        updatedAt: new Date(),
      },
    });

  await database
    .insert(courseAssignment)
    .values({
      id: crypto.randomUUID(),
      userId,
      courseId: FIRST_COURSE.id,
    })
    .onConflictDoNothing();

  const [assignment] = await database
    .select({
      slug: course.slug,
      title: course.title,
      description: course.description,
      status: course.status,
    })
    .from(courseAssignment)
    .innerJoin(course, eq(courseAssignment.courseId, course.id))
    .where(
      and(
        eq(courseAssignment.userId, userId),
        eq(courseAssignment.courseId, FIRST_COURSE.id),
      ),
    )
    .limit(1);

  if (!assignment) {
    throw new Error("The first course could not be assigned.");
  }

  return assignment;
}
