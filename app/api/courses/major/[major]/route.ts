import { getCoursesByMajor } from "@/app/services/postgreService/courses/courseService";
import { verifyFirebaseAuth } from "@/app/middlewares/firebaseAuth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ major: string }> }
) {
    try {
        
        const user = await verifyFirebaseAuth(request);
        if (!user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { major } = await params;
        const decodedMajor = decodeURIComponent(major);

        console.log("Decoded major:", decodedMajor);
        if (!major) {
            return NextResponse.json(
                { error: "Missing major" },
                { status: 400 }
            );
        }

        const courses = await getCoursesByMajor(decodedMajor);

        return NextResponse.json(courses, { status: 200 });
    } catch (error) {
        console.error("Failed to fetch courses by major:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
