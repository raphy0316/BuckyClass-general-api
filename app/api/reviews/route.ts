import { deleteReview, saveReview } from "@/app/services/postgreService/reviews/reviewService";
import { Review } from "@/app/types/types";
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

        const { course_id, user_id, rating, comment } = await request.json();

        if (!course_id || !user_id || rating === undefined || !comment) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        const review: Review = {
            course_id,
            user_id,
            rating,
            comment
        };

        await saveReview(review);

        return NextResponse.json(
            { message: "Review saved successfully", review },
            { status: 201 }
        );

    } catch (error) {
        console.error("Error saving review:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

export async function DELETE(
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

        if (!course_id || !user_id) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        await deleteReview(course_id, user_id);

        return NextResponse.json(
            { message: "Review deleted successfully" },
            { status: 200 }
        );

    } catch (error) {
        console.error("Error deleting review:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
