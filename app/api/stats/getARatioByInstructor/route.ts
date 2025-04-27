import { getARatioByInstructor } from "@/app/services/postgreService";

export async function GET() {
  try {
    const result = await getARatioByInstructor();
    return Response.json(result, { status: 200 });
  } catch (error) {
      console.error("Failed to fetch A ratio by instructor", error);
      return Response.json({ error: "Failed to fetch A ratio by instructor" }, { status: 500 });
  }
}
