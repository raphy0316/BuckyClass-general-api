import { getTopViewedCourses } from "@/app/services/postgreService/home/homeService";
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

        console.log("[GET] /api/home/popular called by user:", user.uid);

        const topViewedCourses = await getTopViewedCourses();

        return NextResponse.json(
            topViewedCourses,
            { status: 200 }
        );

    } catch (error) {
        console.error("Failed to fetch popular courses:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
