import { db } from "@/app/lib/firebaseAdmin";
import { insertChatRoom } from "@/app/services/postgreService/chats/chatService";
import { verifyFirebaseAuth } from "@/app/middlewares/firebaseAuth";
import { verifyAdmin } from "@/app/lib/verifyAdmin";
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";


export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { course_id, name, type, created_by } = body;

        if (!name || !type || (type === "private" && !created_by) || (type === "course" && !course_id)) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        const chatId = type === "course" ? course_id : uuidv4();
        let creator = created_by;

        const user = await verifyFirebaseAuth(request);
        if (!user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        if (type === "course") {
            const adminCheck = await verifyAdmin(user.uid);
            if (!adminCheck.ok) {
                return adminCheck.response;
            }
            creator = "Admin";
        }

        const chatRef = db.ref(`chats/${chatId}`);
        const snapshot = await chatRef.get();
        if (snapshot.exists()) {
            return NextResponse.json(
                { error: "Chat room already exists" },
                { status: 409 }
            );
        }

        await chatRef.set({
            name,
            type,
            createdBy: creator,
            createdAt: Date.now(),
            participants: {},
            messages: {}
        });

        await insertChatRoom({
            chat_id: chatId,
            name,
            type,
            created_by: creator
        });

        return NextResponse.json(
            { chatId },
            { status: 201 }
        );

    } catch (error) {
        console.error("Failed to create chatroom:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
