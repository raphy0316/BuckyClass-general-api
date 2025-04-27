import { saveUserProfile, updateUserProfile } from "@/app/services/postgreService";
import { verifyFirebaseAuth } from "@/app/middlewares/firebaseAuth";
import { NextRequest, NextResponse } from "next/server";
import { PostgresError } from "@/app/types/types";
import { updateUserDisplayName } from "@/app/services/firebaseService"

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

        const { id, name, email, majors, profile_picture } = await request.json();

        if (!id || !name || !email) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        await saveUserProfile({
            id,
            name,
            email,
            majors,
            profile_picture
        });

        await updateUserDisplayName(id, name);

        return NextResponse.json(
            { success: true },
            { status: 201 }
        );

    } catch (error) {
        const dbError = error as PostgresError;
        if (dbError.code === '23505') {
            return NextResponse.json(
                { error: "Duplicate ID: User already exists" },
                { status: 409 }
            );
        }

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

        const { id, name, majors, profile_picture } = await request.json();

        if (!id) {
            return NextResponse.json(
                { error: "Missing id" },
                { status: 400 }
            );
        }

        await updateUserProfile({
            id,
            name,
            majors,
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
