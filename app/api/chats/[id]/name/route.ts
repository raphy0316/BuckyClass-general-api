import { pool } from "@/app/config/db";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
    const client = await pool.connect();
    try {
        const { id: chatId } = params;
        const { name } = await request.json();

        if (!name) {
            return new Response(JSON.stringify({ error: "Missing name" }), { status: 400 });
        }

        await client.query(
            `UPDATE "chatRoom" SET name = $1 WHERE id = $2`,
            [name, chatId]
        );

        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (err) {
        console.error("Error updating chat name:", err);
        return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
    } finally {
        client.release();
    }
}
