import { pool } from "@/app/config/db";
import { verifyFirebaseAuth } from "@/app/middlewares/firebaseAuth";
import { verifyAdmin } from "@/app/lib/verifyAdmin"
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {

    const user = await verifyFirebaseAuth(request);

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await pool.connect();
    try {
        const { id: chatId } = await params;
        const { name } = await request.json();

        if (!name) {
            return NextResponse.json({ error: "Missing name"}, { status: 404 });
        }

        const adminCheck = await verifyAdmin(user.uid);
        if (!adminCheck.ok) {
            return adminCheck.response;
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
