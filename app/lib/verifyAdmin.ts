import { pool } from "@/app/config/db";
import { NextResponse } from "next/server";

export async function verifyAdmin(
    uid: string
): Promise<
    | { ok: true }
    | { ok: false, response: ReturnType<typeof NextResponse.json> }
> {
    const client = await pool.connect();

    try {
        const { rows } = await client.query(
            `SELECT is_admin FROM users WHERE id = $1`,
            [uid]
        );

        if (rows.length === 0) {
            return {
                ok: false,
                response: NextResponse.json(
                    { error: "User not found" },
                    { status: 404 }
                )
            };
        }

        const { is_admin } = rows[0];

        if (!is_admin) {
            return {
                ok: false,
                response: NextResponse.json(
                    { error: "Forbidden: You are not admin" },
                    { status: 403 }
                )
            };
        }

        return { ok: true };

    } finally {
        client.release();
    }
}
