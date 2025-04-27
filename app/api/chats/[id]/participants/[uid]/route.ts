import { pool } from "@/app/config/db";

export async function DELETE(request: Request, { params }: { params: { id: string; uid: string } }) {
    const client = await pool.connect();
    try {
        const { id: chatId, uid: userId } = params;

        await client.query(
            `DELETE FROM chatroom_participants WHERE chat_id = $1 AND user_id = $2`,
            [chatId, userId]
        );

        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (err) {
        console.error("Error removing participant:", err);
        return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
    } finally {
        client.release();
    }
}
