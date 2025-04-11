import { getTopAGradeCourses } from "@/app/services/postgreService";

export async function GET() {
    try {
        const topCourses = await getTopAGradeCourses();
        return Response.json(topCourses, { status: 200 });
    } catch (error) {
        return Response.json({ error: "Failed to fetch top A-grade courses" }, { status: 500 });
    }
}
