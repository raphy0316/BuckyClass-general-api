import { pool } from "@/app/config/db";
import {ChatMessageCounts} from "@/app/types/types";

export const insertChatRoom = async (room: {
    chat_id: string;
    name: string;
    type: "course" | "private";
    created_by: string;
}): Promise<void> => {
    const client = await pool.connect();
    try {
        await client.query(
            `
            INSERT INTO "chatRoom" (id, name, type, created_by)
            VALUES ($1, $2, $3, $4);
            `,
            [
                room.chat_id,
                room.name,
                room.type,
                room.created_by,
            ]
        );
        console.log(`Chat room [${room.chat_id}] inserted into chatRoom table`);
    } finally {
        client.release();
    }
};

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
      for (const [chatId, { dailyCounts, createdBy, type }] of Object.entries(chatMessageCounts)) {
        const totalMessageCount = Object.values(dailyCounts).reduce((sum, count) => sum + count, 0);
  
        await client.query(`
            INSERT INTO "chatRoom" (id, message_count, created_by, type)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (id)
            DO UPDATE SET message_count = EXCLUDED.message_count;
        `, [chatId, totalMessageCount, createdBy, type]);

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
