import { isNewUser } from "@/app/services/postgreService";
import { NextRequest, NextResponse } from "next/server";
import { verifyFirebaseAuth } from "@/app/middlewares/firebaseAuth";

export async function POST(
    request: NextRequest
) {
    try {
        const { firebase_uid } = await request.json();

        if (!firebase_uid) {
            return NextResponse.json(
                { error: "Missing firebase_uid" },
                { status: 400 }
            );
        }

        const user = await verifyFirebaseAuth(request);
        if (!user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const is_new = await isNewUser(firebase_uid);

        if (is_new === null) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { is_new_user: is_new },
            { status: 200 }
        );

    } catch (error) {
        console.error("Error checking new user status:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
