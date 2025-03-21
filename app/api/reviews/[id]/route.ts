import {getReview} from "@/app/services/postgreService";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const id = (await params).id
        const review = await getReview(id);

        return Response.json(
            review,
            { status: 200 }
        );
    } catch (error) {
        console.error("Failed to update courses and grades:", error);
        return Response.json(
            { error: "Failed to update courses and grades" },
            { status: 500 }
        );
    }
}