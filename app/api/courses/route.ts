import { getCourses } from "@/app/services/postgreService/courses/courseService";
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

        const { searchParams } = new URL(request.url);
        const keyword = searchParams.get("keyword") ?? undefined;

        const courses = await getCourses(keyword);

        return NextResponse.json(
            courses,
            { status: 200 }
        );

    } catch (error) {
        console.error("Failed to fetch courses:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
