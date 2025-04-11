import { getTopViewedCourses } from "@/app/services/postgreService";

export async function GET(request: Request) {
    try {
        const topViewedCourses = await getTopViewedCourses();
        return Response.json(topViewedCourses, { status: 200 });
    } catch (error) {
        console.error("Failed to fetch popular courses:", error);
        return Response.json({ error: "Failed to fetch popular courses" }, { status: 500 });
    }
}
