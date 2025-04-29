import { auth, db } from "@/app/lib/firebaseAdmin"
import { DailyMessageCounts, ChatMessageCounts} from "../../types/types";

export const fetchRecentChatMessageCounts = async (): Promise<ChatMessageCounts> => {
  const chatsRef = db.ref("chats");
  const snapshot = await chatsRef.once("value");
  const chats = snapshot.val();

  const now = new Date();
  const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);

  const chatMessageCounts: ChatMessageCounts = {};

  for (const chatId in chats) {
    const chatInfo = chats[chatId];
    if (chatInfo.type !== "course") continue;

    const messages = chatInfo.messages || {};
    const dailyCounts: DailyMessageCounts = {};

    for (const messageId in messages) {
      const message = messages[messageId];
      if (!message.timestamp) continue;

      const messageDate = new Date(message.timestamp);
      if (messageDate >= tenDaysAgo && messageDate <= now) {
        const dateString = messageDate.toISOString().split("T")[0]; 
        dailyCounts[dateString] = (dailyCounts[dateString] || 0) + 1;
      }
    }

    const createdBy = chatInfo.createdBy || "Unknown";
    const type = chatInfo.type || "Unknown";

    chatMessageCounts[chatId] = {
      dailyCounts,
      createdBy,
      type
    };
  }

  return chatMessageCounts;
};

export async function updateUserDisplayName(id: string, newDisplayName: string) {
    await auth.updateUser(id, {
        displayName: newDisplayName,
    });
}

