import { getCourseInfoById, incrementCourseViews} from "@/app/services/postgreService";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const id = (await params).id
        await incrementCourseViews(id);
        const courseData = await getCourseInfoById(id);

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
