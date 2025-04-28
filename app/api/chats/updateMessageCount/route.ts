import { fetchRecentChatMessageCounts } from "@/app/services/firebaseService/firebaseService";
import { saveChatRoomMessageCounts } from "@/app/services/postgreService/chats/chatService";
import { verifyFirebaseAuth } from "@/app/middlewares/firebaseAuth";
import { NextRequest, NextResponse } from "next/server";

export async function POST( request: NextRequest ) {
    try {
        const user = await verifyFirebaseAuth(request);
        if (!user) {
            return NextResponse.json(
                 { error: "Unauthorized" },
                 { status: 401 }
            );
        }
        const chatMessageCounts = await fetchRecentChatMessageCounts();

        if (!chatMessageCounts || Object.keys(chatMessageCounts).length === 0) {
            return Response.json(
                { error: "No chat message counts found" },
                { status: 404 }
            );
        }

        await saveChatRoomMessageCounts(chatMessageCounts);

        console.log("Chat room message counts updated successfully");
        return Response.json(
            { message: "Chat room message counts updated successfully" },
            { status: 200 }
        );
    } catch (error) {
        console.error("Failed to update chat room message counts:", error);
        return Response.json(
            { error: "Failed to update chat room message counts" },
            { status: 500 }
        );
    }
}
