import { getAverageRatingByCourse } from "@/app/services/postgreService";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const courseId = (await params).id;
    const result = await getAverageRatingByCourse(courseId);
    return Response.json(result, { status: 200 });
  } catch (error) {
      console.error("Failed to  average rating", error);
      return Response.json({ error: "Failed to fetch average rating" }, { status: 500 });
  }
}