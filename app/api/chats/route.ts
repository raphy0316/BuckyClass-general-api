import { db } from "@/app/lib/firebaseAdmin";
import { insertChatRoom } from "@/app/services/postgreService";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { course_id, name, type, created_by } = body;
        const creator = type === "course" ? "mVS5fpVMrUfQJwhDox0dgYEqAX83" : created_by;

        if (!name || !type || (type === "private" && !created_by) || (type === "course" && !course_id)) {
            return new Response(
                JSON.stringify({ error: "Missing required fields" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        const chatId = type === "course" ? course_id : uuidv4();

        if (type === "course") {
            const existingRef = db.ref(`chats/${chatId}`);
            const snapshot = await existingRef.get();
            if (snapshot.exists()) {
                return new Response(
                    JSON.stringify({ error: "Chat room already exists" }),
                    { status: 409, headers: { "Content-Type": "application/json" } }
                );
            }
        }

        const chatRef = db.ref(`chats/${chatId}`);
        await chatRef.set({
            name,
            type,
            createdBy : creator,
            createdAt: Date.now(),
            participants: {
            },
            messages: {},
        });

        await insertChatRoom({
            chat_id: chatId,
            name,
            type,
            created_by: creator,
        });

        return new Response(
            JSON.stringify({ chatId }),
            { status: 201, headers: { "Content-Type": "application/json" } }
        );
    } catch (err) {
        console.error("Failed to create chatroom:", err);
        return new Response(
            JSON.stringify({ error: "Internal Server Error" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}
