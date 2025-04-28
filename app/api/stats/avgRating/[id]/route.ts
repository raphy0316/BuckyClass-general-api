import { getAverageRatingByCourse } from "@/app/services/postgreService/home/homeService";
import { verifyFirebaseAuth } from "@/app/middlewares/firebaseAuth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await verifyFirebaseAuth(request);
        if (!user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { id: courseId } = await params;

        if (!courseId) {
            return NextResponse.json(
                { error: "Missing course ID" },
                { status: 400 }
            );
        }

        const result = await getAverageRatingByCourse(courseId);

        return NextResponse.json(
            result,
            { status: 200 }
        );

    } catch (error) {
        console.error("Failed to fetch average rating:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
