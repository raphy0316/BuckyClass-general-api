import { getAverageScoreByTermForCourse } from "@/app/services/postgreService";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const courseId = (await params).id;
    const result = await getAverageScoreByTermForCourse(courseId);
    return Response.json(result, { status: 200 });
  } catch (error) {
      console.error("Failed to fetch GPA by term for course", error);
      return Response.json({ error: "Failed to fetch GPA by term for course" }, { status: 500 });
  }
}
