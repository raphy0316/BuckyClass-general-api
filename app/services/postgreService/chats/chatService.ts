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
        await client.query(`DELETE FROM "chatRoom" WHERE chat_id = $1`, [chat_id]);
        console.log(`Chat room [${chat_id}] deleted from PostgreSQL`);
    } finally {
        client.release();
    }
};

export const saveChatRoomMessageCounts = async (chatMessageCounts: ChatMessageCounts): Promise<void> => {
    const client = await pool.connect();
  
    try {
      for (const [chatId, { dailyCounts}] of Object.entries(chatMessageCounts)) {
        const totalMessageCount = Object.values(dailyCounts).reduce((sum, count) => sum + count, 0);
  
        await client.query(`
            UPDATE "chatRoom"
            SET message_count = $1
            WHERE chat_id = $2;
          `, [totalMessageCount, chatId]);          

        for (const [date, count] of Object.entries(dailyCounts)) {
          await client.query(`
            INSERT INTO "chatRoomDailyMessageCount" (chat_id, date, message_count)
            VALUES ($1, $2, $3)
            ON CONFLICT (chat_id, date)
            DO UPDATE SET message_count = EXCLUDED.message_count;
          `, [chatId, date, count]);
        }
      }
  
    } finally {
      client.release();
    }
};
