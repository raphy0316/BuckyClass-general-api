import { db } from "@/app/lib/firebaseAdmin";
import { saveVerifiedUser } from "@/app/services/postgreService/users/userService";
import { deleteChatRoomById } from "@/app/services/postgreService/chats/chatService";
import { verifyFirebaseAuth } from "@/app/middlewares/firebaseAuth";
import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/app/lib/verifyAdmin"

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: chatId } = await params;

        if (!chatId) {
            return NextResponse.json(
                { error: "Missing id" },
                { status: 400 }
            );
        }

        const user = await verifyFirebaseAuth(request);
        if (!user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const chatRef = db.ref(`chats/${chatId}`);
        const snapshot = await chatRef.get();

        if (!snapshot.exists()) {
            return NextResponse.json(
                { error: "Chat room not found" },
                { status: 404 }
            );
        }

        const chatData = snapshot.val();

        if(chatData.type === "course"){
            const adminCheck = await verifyAdmin(user.uid);
            if (!adminCheck.ok) {
                return adminCheck.response;
            }
        }

        if (chatData.type === "course" && chatData.participants) {
            const verifiedUsers = Object.keys(chatData.participants).map((uid) => ({
                course_id: chatId,
                user_id: uid,
            }));

            await saveVerifiedUser(verifiedUsers);
        }

        await chatRef.remove();
        await deleteChatRoomById(chatId);

        return NextResponse.json(
            { success: true, message: "Chat room deleted" },
            { status: 200 }
        );

    } catch (error) {
        console.error("Failed to delete chat room:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
