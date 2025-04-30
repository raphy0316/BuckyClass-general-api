import { pool } from "@/app/config/db";
import { verifyFirebaseAuth } from "@/app/middlewares/firebaseAuth";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/firebaseAdmin"; 

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; uid: string }> }
) {
    const client = await pool.connect();

    try {
        const user = await verifyFirebaseAuth(request);
        if (!user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { id: chatId, uid: userId } = await params;

        await client.query(
            `DELETE FROM "ChatroomUsers" WHERE chat_id = $1 AND user_id = $2`,
            [chatId, userId]
        );

        return NextResponse.json(
            { success: true },
            { status: 200 }
        );

    } catch (error) {
        console.error("Error removing participant:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    } finally {
        client.release();
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; uid: string }> }
) {
    const client = await pool.connect();

    try {
        const user = await verifyFirebaseAuth(request);
        if (!user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { id: chatId, uid: userId } = await params;

        if (!userId) {
            return NextResponse.json(
                { error: "Missing userId" },
                { status: 400 }
            );
        }

        await client.query(
            `INSERT INTO "ChatroomUsers" (chat_id, user_id)
             VALUES ($1, $2)
             ON CONFLICT DO NOTHING`,
            [chatId, userId]
        );

        const participantRef = db.ref(`chats/${chatId}/participants/${userId}`);
        await participantRef.set(true);

        return NextResponse.json(
            { success: true },
            { status: 200 }
        );

    } catch (error) {
        console.error("Error adding participant:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    } finally {
        client.release();
    }
}

