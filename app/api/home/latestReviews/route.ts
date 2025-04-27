import { getLatestReviewsWithCourse } from "@/app/services/postgreService";
import { verifyFirebaseAuth } from "@/app/middlewares/firebaseAuth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
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

        const reviews = await getLatestReviewsWithCourse();

        return NextResponse.json(
            reviews,
            { status: 200 }
        );

    } catch (error) {
        console.error("Error fetching latest reviews:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
