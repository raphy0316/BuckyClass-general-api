import { pool } from "@/app/config/db";

export async function POST(request: Request, { params }: { params: { id: string } }) {
    const client = await pool.connect();
    try {
        const { id: chatId } = params;
        const { user_id } = await request.json();

        if (!user_id) {
            return new Response(JSON.stringify({ error: "Missing user_id" }), { status: 400 });
        }

        await client.query(
            `INSERT INTO chatroom_participants (chat_id, user_id)
             VALUES ($1, $2)
             ON CONFLICT DO NOTHING`,
            [chatId, user_id]
        );

        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (err) {
        console.error("Error adding participant:", err);
        return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
    } finally {
        client.release();
    }
}
