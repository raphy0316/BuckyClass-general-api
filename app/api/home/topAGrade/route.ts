import { getTopAGradeCourses } from "@/app/services/postgreService/home/homeService";
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

        console.log("[GET] /api/home/top-a-grade called by user:", user.uid);

        const topCourses = await getTopAGradeCourses();

        return NextResponse.json(
            topCourses,
            { status: 200 }
        );

    } catch (error) {
        console.error("Failed to fetch top A-grade courses:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
