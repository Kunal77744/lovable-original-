import { headers } from "next/headers";
import { getLearningDataExportForStudent } from "@/db/learning-data-export";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const exportedAt = new Date().toISOString();
  const learningData = await getLearningDataExportForStudent(session.user.id);
  const filenameDate = exportedAt.slice(0, 10);

  return new Response(
    JSON.stringify({
      ...learningData,
      exportedAt,
    }),
    {
      headers: {
        "cache-control": "private, no-store",
        "content-disposition": `attachment; filename="lovable-original-learning-data-${filenameDate}.json"`,
        "content-type": "application/json; charset=utf-8",
        "x-content-type-options": "nosniff",
      },
    },
  );
}
