import { db } from "@/app/lib/firebaseAdmin";
import { saveVerifiedUser, deleteChatRoomById, deleteUserProfile } from "@/app/services/postgreService";

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const chat_id = (await params).id

        if (!chat_id) {
            return new Response(
                JSON.stringify({ error: "Missing id" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        const chatRef = db.ref(`chats/${chat_id}`);
        const snapshot = await chatRef.get();

        if (!snapshot.exists()) {
            return new Response(
                JSON.stringify({ error: "Chat room not found" }),
                { status: 404, headers: { "Content-Type": "application/json" } }
            );
        }

        const chatData = snapshot.val();

        if (chatData.type === "course" && chatData.participants) {
            const verifiedUsers = Object.keys(chatData.participants).map((uid) => ({
                course_id: chat_id,
                user_id: uid,
            }));

            await saveVerifiedUser(verifiedUsers);
        }

        await chatRef.remove();

        await deleteChatRoomById(chat_id);

        return new Response(
            JSON.stringify({ success: true, message: "Chat room deleted" }),
            { status: 200, headers: { "Content-Type": "application/json" } }
        );
    } catch (err) {
        console.error("Failed to delete chat room:", err);
        return new Response(
            JSON.stringify({ error: "Internal server error" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }

    export async function DELETE(request: Request) {
        try {
            const body = await request.json();
            const { firebase_uid } = body;

            if (!firebase_uid) {
                return new Response(JSON.stringify({ error: "Missing firebase_uid" }), {
                    status: 400,
                    headers: { "Content-Type": "application/json" },
                });
            }

            await deleteUserProfile(firebase_uid);

            return new Response(JSON.stringify({ success: true }), {
                status: 200,
                headers: { "Content-Type": "application/json" },
            });
        } catch (err) {
            console.error("Error deleting user profile:", err);
            return new Response(JSON.stringify({ error: "Internal server error" }), {
                status: 500,
                headers: { "Content-Type": "application/json" },
            });
        }
    }
}

