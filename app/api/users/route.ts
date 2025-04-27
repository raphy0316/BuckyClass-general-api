import { saveUserProfile, updateUserProfile } from "@/app/services/postgreService";
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

        const { firebase_uid, name, email, profile_picture } = await request.json();

        if (!firebase_uid || !name || !email) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        await saveUserProfile({
            firebase_uid,
            name,
            email,
            profile_picture
        });

        return NextResponse.json(
            { success: true },
            { status: 201 }
        );

    } catch (error) {
        console.error("Error saving user profile:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

export async function PATCH(
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

        const { firebase_uid, name, profile_picture } = await request.json();

        if (!firebase_uid) {
            return NextResponse.json(
                { error: "Missing firebase_uid" },
                { status: 400 }
            );
        }

        await updateUserProfile({
            firebase_uid,
            name,
            profile_picture
        });

        return NextResponse.json(
            { success: true },
            { status: 200 }
        );

    } catch (error) {
        console.error("Error updating user profile:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
