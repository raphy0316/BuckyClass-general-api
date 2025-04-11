import { db } from "@/app/lib/firebaseAdmin";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { course_id, name, type, createdBy } = body;

        if (!course_id || !name || type != "course" || !createdBy) {
            return new Response(
                JSON.stringify({ error: "Missing required fields" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        const chatRef = db.ref(`chats/${course_id}`);
        const existingChat = await chatRef.get();

        if (existingChat.exists()) {
            return new Response(
                JSON.stringify({ error: "Chat room already exists for this course" }),
                { status: 409, headers: { "Content-Type": "application/json" } }
            );
        }

        await chatRef.set({
            name,
            type,
            createdBy,
            createdAt: Date.now(),
            participants: {
                [createdBy]: {
                    joinedAt: Date.now()
                }
            },
            messages: {}
        });

        return new Response(
            JSON.stringify({ chatId: course_id }),
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
