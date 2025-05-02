import { auth, db } from "@/app/lib/firebaseAdmin"
import { DailyMessageCounts, ChatMessageCounts} from "../../types/types";

export const fetchRecentChatMessageCounts = async (): Promise<ChatMessageCounts> => {
  const chatsRef = db.ref("chats");
  const snapshot = await chatsRef.once("value");
  const chats = snapshot.val();

  const now = new Date();
  const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);
  
  const dateKeys: string[] = [];
  for (let i = 9; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateString = date.toISOString().split("T")[0];
    dateKeys.push(dateString);
  }
  
  const chatMessageCounts: ChatMessageCounts = {};
  
  for (const chatId in chats) {
    const chatInfo = chats[chatId];
    if (chatInfo.type !== "course") continue;
  
    const messages = chatInfo.messages || {};
    const dailyCounts: DailyMessageCounts = {};
  
    for (const date of dateKeys) {
      dailyCounts[date] = 0;
    }
  
    for (const messageId in messages) {
      const message = messages[messageId];
      if (!message.timestamp) continue;
  
      const messageDate = new Date(message.timestamp);
      if (messageDate >= tenDaysAgo && messageDate <= now) {
        const dateString = messageDate.toISOString().split("T")[0];
        dailyCounts[dateString] += 1;
      }
    }
  
    chatMessageCounts[chatId] = {
      dailyCounts,
      createdBy: chatInfo.createdBy || "Unknown",
      type: chatInfo.type || "Unknown"
    };
  }
  
  return chatMessageCounts;
};

export async function updateUserDisplayName(id: string, newDisplayName: string) {
    await auth.updateUser(id, {
        displayName: newDisplayName,
    });
}

