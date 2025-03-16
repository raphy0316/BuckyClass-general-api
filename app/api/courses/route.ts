import { getCourses } from "@/app/services/postgreService";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const subject = searchParams.get("subject") ?? undefined;
        const title = searchParams.get("title") ?? undefined;

        const courses = await getCourses(subject, title);
        return new Response(
            JSON.stringify(courses),
            { status: 200, headers: { "Content-Type": "application/json" } }
        );

    } catch (error) {
        console.error("Failed to fetch courses:", error);
        return new Response(
            JSON.stringify({ error: "Failed to fetch courses" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}
