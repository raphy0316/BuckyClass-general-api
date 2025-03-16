import {getReview} from "@/app/services/postgreService";

export async function GET(request: Request, context: { params: { id: string } }) {
    try {
        const params = await context.params;
        const review = await getReview(params.id);

        return Response.json(
            review,
            { status: 200}
        );
    } catch (error) {
        console.error("Failed to update courses and grades:", error);
        return Response.json(
            { error: "Failed to update courses and grades" },
            { status: 500 }
        );
    }
}