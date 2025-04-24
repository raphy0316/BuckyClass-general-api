import { getLatestReviewsWithCourse } from "@/app/services/postgreService";

export async function GET() {
    try {
        const reviews = await getLatestReviewsWithCourse();
        return Response.json(reviews, { status: 200 });
    } catch (error) {
        console.error("Error fetching latest reviews:", error);
        return Response.json({ error: "Failed to fetch latest reviews" }, { status: 500 });
    }
    
}

