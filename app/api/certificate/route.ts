import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { getFirstCourseCertificateForStudent } from "@/db/course";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json(
      { error: "Sign in to view your certificate." },
      { status: 401 },
    );
  }

  const certificateState = await getFirstCourseCertificateForStudent(
    session.user.id,
    session.user.name,
  );

  return NextResponse.json(certificateState);
}
