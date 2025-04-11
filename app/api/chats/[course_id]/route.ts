import { db } from "@/app/lib/firebaseAdmin";
import { saveVerifiedUser } from "@/app/services/postgreService";

export async function DELETE(
    request: Request,
    { params }: { params: { course_id: string } }
) {
    try {
        const { course_id } = params;

        if (!course_id) {
            return new Response(
                JSON.stringify({ error: "Missing id" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        const chatRef = db.ref(`chats/${course_id}`);
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
                course_id,
                user_id: uid,
            }));

            await saveVerifiedUser(verifiedUsers);
        }

        await chatRef.remove();

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
}
