import { NextResponse } from "next/server";
import { getDatabase } from "@/db";
import { earlyAccessSignup } from "@/db/schema";
import { normalizeEmail, validateEarlyAccessEmail } from "@/lib/early-access-validation";

const FIRST_COURSE_SLUG = "first-course";

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Enter your email address and try again." },
      { status: 400 },
    );
  }

  const email =
    typeof payload === "object" &&
    payload !== null &&
    "email" in payload &&
    typeof payload.email === "string"
      ? normalizeEmail(payload.email)
      : "";
  const validationMessage = validateEarlyAccessEmail(email);

  if (validationMessage) {
    return NextResponse.json(
      { message: validationMessage },
      { status: 400 },
    );
  }

  try {
    const inserted = await getDatabase()
      .insert(earlyAccessSignup)
      .values({
        id: crypto.randomUUID(),
        email,
        courseSlug: FIRST_COURSE_SLUG,
      })
      .onConflictDoNothing()
      .returning({ id: earlyAccessSignup.id });

    if (inserted.length === 0) {
      return NextResponse.json({
        message: "You're already on the early-access list.",
        duplicate: true,
      });
    }

    return NextResponse.json(
      { message: "You're on the list. We'll email you when the first course opens." },
      { status: 201 },
    );
  } catch (error) {
    console.error("Early-access signup failed", error);
    return NextResponse.json(
      {
        message:
          "We couldn't save your place just now. Your email is still here, so please try again.",
      },
      { status: 503 },
    );
  }
}
