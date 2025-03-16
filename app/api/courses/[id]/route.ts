import { getCourseById } from "@/app/services/postgreService";

export async function GET(request: Request, context: { params: { id: string } }) {
    try {
        const params = await context.params;
        const courseData = await getCourseById(params.id);

        if (!courseData) {
            return new Response(
                JSON.stringify({ error: "Course not found" }),
                { status: 404, headers: { "Content-Type": "application/json" } }
            );
        }

        return new Response(
            JSON.stringify(courseData),
            { status: 200, headers: { "Content-Type": "application/json" } }
        );

    } catch (error) {
        console.error("Failed to fetch course by ID:", error);
        return new Response(
            JSON.stringify({ error: "Failed to fetch course" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}
