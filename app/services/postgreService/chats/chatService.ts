import { pool } from "@/app/config/db";
import {ChatMessageCounts} from "@/app/types/types";

export const insertChatRoom = async (room: {
    chat_id: string;
    name: string;
    created_by: string;
}): Promise<void> => {
    const client = await pool.connect();
    try {
        await client.query(
            `
            INSERT INTO "chatRoom" (chat_id, name)
            VALUES ($1, $2);
            `,
            [
                room.chat_id,
                room.name,
            ]
        );
        console.log(`Chat room [${room.chat_id}] inserted into chatRoom table`);
    } finally {
        client.release();
    }
};
interface ChatRoomUserInput {
    chat_id: string;
    user_id: string;
}
  

export async function insertChatRoomUser({ chat_id, user_id }: ChatRoomUserInput): Promise<void> {
const client = await pool.connect();
try {
    await client.query(
    `
    INSERT INTO "ChatRoomUsers" (chat_id, user_id, joined_at)
    VALUES ($1, $2, NOW())
    ON CONFLICT (chat_id, user_id) DO NOTHING
    `,
    [chat_id, user_id]
    );
} catch (error) {
    console.error("Failed to insert ChatRoomUser:", error);
    throw error;
} finally {
    client.release();
}
}

export const deleteChatRoomById = async (chat_id: string): Promise<void> => {
    const client = await pool.connect();
    try {
        await client.query(`DELETE FROM "chatRoom" WHERE id = $1`, [chat_id]);
        console.log(`Chat room [${chat_id}] deleted from PostgreSQL`);
    } finally {
        client.release();
    }
};

export const saveChatRoomMessageCounts = async (chatMessageCounts: ChatMessageCounts): Promise<void> => {
    const client = await pool.connect();

    try {
        const query = `
            INSERT INTO "chatRoom" (id, message_count, created_by, type)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (id)
            DO UPDATE SET message_count = EXCLUDED.message_count;
        `;

        for (const [chatId, { messageCount, createdBy, type }] of Object.entries(chatMessageCounts)) {
            const createdByString = (typeof createdBy === "string")
            ? new Date(parseInt(createdBy)).toLocaleString()
            : createdBy;
            await client.query(query, [
                chatId, messageCount, createdByString, type
            ]);
        }

    } finally {
        client.release();
    }
};