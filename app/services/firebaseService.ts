import axios from "axios";

export const fetchRecentChatMessageCounts = async (): Promise<Record<string, { messageCount: number, createdBy: string, type: string }>> => {
  const response = await axios.get("https://grow-madison-default-rtdb.firebaseio.com/chats.json");
  const chats = response.data;

  const nowMs = Date.now();
  const tenDaysAgoMs = nowMs - 10 * 24 * 60 * 60 * 1000;

  const chatMessageCounts: Record<string, { messageCount: number, createdBy: string, type: string }> = {};

  for (const chatId in chats) {
    const chatInfo = chats[chatId];
    if (chatInfo.type !== "course") continue;

    const messages = chatInfo.messages || {};
    let count = 0;

    for (const messageId in messages) {
      const message = messages[messageId];
      if (message.timestamp && message.timestamp >= tenDaysAgoMs) {
        count++;
      }
    }

    // Fetch createdBy and course from chatInfo
    const createdBy = chatInfo.createdBy || "Unknown";  // 기본값 설정
    const type = chatInfo.type || "Unknown";  // 기본값 설정

    chatMessageCounts[chatId] = {
        messageCount: count,
        createdBy,
        type
      };
  }

  return chatMessageCounts;
};
