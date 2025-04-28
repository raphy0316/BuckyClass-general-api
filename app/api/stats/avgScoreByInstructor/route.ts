import { getAverageScoreByInstructor } from "@/app/services/postgreService/home/homeService";
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

        const result = await getAverageScoreByInstructor();

        return NextResponse.json(
            result,
            { status: 200 }
        );

    } catch (error) {
        console.error("Failed to fetch average score by instructor:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
