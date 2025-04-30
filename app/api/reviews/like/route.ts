import { updateLikeReview } from "@/app/services/postgreService/reviews/reviewService";
import { verifyFirebaseAuth } from "@/app/middlewares/firebaseAuth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
    request: NextRequest
) {
    try {
        const user = await verifyFirebaseAuth(request);
        if (!user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { course_id, user_id } = await request.json();
        const liked_by_user_id = user.id;

        if (!course_id || !user_id) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }
        
        await updateLikeReview(course_id, user_id, liked_by_user_id);

        return NextResponse.json(
            { message: "Like updated successfully" },
            { status: 201 }
        );

    } catch (error) {
        console.error("Error updating like on review:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
