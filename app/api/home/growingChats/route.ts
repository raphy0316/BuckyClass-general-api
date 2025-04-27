import { getTop3Chats } from "@/app/services/postgreService";

export async function GET() {
    try {
        const topCourses = await getTop3Chats();
        return Response.json(topCourses, { status: 200 });
    } catch (error) {
        console.error("Error fetching top 3 courses:", error);
        return Response.json({ error: "Failed to fetch top 3 courses" }, { status: 500 });
    }
}
