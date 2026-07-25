import { and, eq } from "drizzle-orm";
import {
  FIRST_COURSE,
  FIRST_LESSON,
} from "@/lib/first-course-content";
import { getDatabase } from "./index";
import {
  course,
  courseAssignment,
  lesson,
  lessonProgress,
} from "./schema";

async function ensureFirstCourse() {
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
    .insert(lesson)
    .values({
      ...FIRST_LESSON,
      courseId: FIRST_COURSE.id,
    })
    .onConflictDoUpdate({
      target: lesson.id,
      set: {
        title: FIRST_LESSON.title,
        description: FIRST_LESSON.description,
        moduleTitle: FIRST_LESSON.moduleTitle,
        position: FIRST_LESSON.position,
        estimatedMinutes: FIRST_LESSON.estimatedMinutes,
        updatedAt: new Date(),
      },
    });
}

async function ensureFirstCourseAssignment(userId: string) {
  const database = getDatabase();
  await ensureFirstCourse();

  await database
    .insert(courseAssignment)
    .values({
      id: crypto.randomUUID(),
      userId,
      courseId: FIRST_COURSE.id,
    })
    .onConflictDoNothing();
}

export async function getOrCreateFirstCourseAssignment(userId: string) {
  const database = getDatabase();
  await ensureFirstCourseAssignment(userId);

  const [assignment] = await database
    .select({
      slug: course.slug,
      title: course.title,
      description: course.description,
      status: course.status,
      lessonSlug: lesson.slug,
      lessonTitle: lesson.title,
      lessonDescription: lesson.description,
      lessonModuleTitle: lesson.moduleTitle,
      estimatedMinutes: lesson.estimatedMinutes,
      progressStatus: lessonProgress.status,
      quizScore: lessonProgress.quizScore,
    })
    .from(courseAssignment)
    .innerJoin(course, eq(courseAssignment.courseId, course.id))
    .innerJoin(lesson, eq(lesson.courseId, course.id))
    .leftJoin(
      lessonProgress,
      and(
        eq(lessonProgress.lessonId, lesson.id),
        eq(lessonProgress.userId, userId),
      ),
    )
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

  const completed = assignment.progressStatus === "completed";

  return {
    slug: assignment.slug,
    title: assignment.title,
    description: assignment.description,
    status: assignment.status,
    progressPercent: completed ? 100 : 0,
    completedLessons: completed ? 1 : 0,
    totalLessons: 1,
    lesson: {
      slug: assignment.lessonSlug,
      title: assignment.lessonTitle,
      description: assignment.lessonDescription,
      moduleTitle: assignment.lessonModuleTitle,
      estimatedMinutes: assignment.estimatedMinutes,
      completed,
      quizScore: assignment.quizScore ?? null,
    },
  };
}

export async function getFirstCourseLessonForStudent(
  userId: string,
  courseSlug: string,
  lessonSlug: string,
) {
  const database = getDatabase();
  await ensureFirstCourseAssignment(userId);

  const [studentLesson] = await database
    .select({
      courseSlug: course.slug,
      courseTitle: course.title,
      lessonId: lesson.id,
      lessonSlug: lesson.slug,
      lessonTitle: lesson.title,
      lessonDescription: lesson.description,
      moduleTitle: lesson.moduleTitle,
      position: lesson.position,
      estimatedMinutes: lesson.estimatedMinutes,
      progressStatus: lessonProgress.status,
      quizScore: lessonProgress.quizScore,
    })
    .from(courseAssignment)
    .innerJoin(course, eq(courseAssignment.courseId, course.id))
    .innerJoin(lesson, eq(lesson.courseId, course.id))
    .leftJoin(
      lessonProgress,
      and(
        eq(lessonProgress.lessonId, lesson.id),
        eq(lessonProgress.userId, userId),
      ),
    )
    .where(
      and(
        eq(courseAssignment.userId, userId),
        eq(course.slug, courseSlug),
        eq(lesson.slug, lessonSlug),
      ),
    )
    .limit(1);

  if (!studentLesson) {
    return null;
  }

  return {
    ...studentLesson,
    completed: studentLesson.progressStatus === "completed",
    quizScore: studentLesson.quizScore ?? null,
  };
}

export async function saveFirstLessonQuizResult(
  userId: string,
  lessonSlug: string,
  score: number,
  passed: boolean,
) {
  const database = getDatabase();
  await ensureFirstCourseAssignment(userId);

  const [assignedLesson] = await database
    .select({ id: lesson.id })
    .from(courseAssignment)
    .innerJoin(course, eq(courseAssignment.courseId, course.id))
    .innerJoin(lesson, eq(lesson.courseId, course.id))
    .where(
      and(
        eq(courseAssignment.userId, userId),
        eq(course.id, FIRST_COURSE.id),
        eq(lesson.slug, lessonSlug),
      ),
    )
    .limit(1);

  if (!assignedLesson) {
    return null;
  }

  const now = new Date();
  const [existingProgress] = await database
    .select({
      quizScore: lessonProgress.quizScore,
      completedAt: lessonProgress.completedAt,
      status: lessonProgress.status,
    })
    .from(lessonProgress)
    .where(
      and(
        eq(lessonProgress.userId, userId),
        eq(lessonProgress.lessonId, assignedLesson.id),
      ),
    )
    .limit(1);

  const bestScore = Math.max(existingProgress?.quizScore ?? 0, score);
  const completed = existingProgress?.status === "completed" || passed;

  await database
    .insert(lessonProgress)
    .values({
      id: crypto.randomUUID(),
      userId,
      lessonId: assignedLesson.id,
      status: completed ? "completed" : "in-progress",
      quizScore: bestScore,
      startedAt: now,
      completedAt: completed ? (existingProgress?.completedAt ?? now) : null,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [lessonProgress.userId, lessonProgress.lessonId],
      set: {
        status: completed ? "completed" : "in-progress",
        quizScore: bestScore,
        completedAt: completed ? (existingProgress?.completedAt ?? now) : null,
        updatedAt: now,
      },
    });

  return {
    completed,
    quizScore: bestScore,
  };
}
