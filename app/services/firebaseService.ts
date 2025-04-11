// import { get, ref } from "firebase/database";
// import { db } from "../config/firebase";

// export const getTopChatRoomsToday = async (): Promise<{ roomId: string; count: number }[]> => {
//     const today = new Date().toISOString().split("T")[0];
//     const snapshot = await get(ref(db, `events/${today}`));
    
//     const roomCounts: Record<string, number> = {};
    
//     if (snapshot.exists()) {
//       snapshot.forEach((child: { val: () => { (): any; new(): any; chatroomId: any; }; }) => {
//         const roomId = child.val().chatroomId;
//         if (roomId) {
//           roomCounts[roomId] = (roomCounts[roomId] || 0) + 1;
//         }
//       });
//     }
    
//     const sorted = Object.entries(roomCounts)
//       .sort((a, b) => b[1] - a[1])
//       .map(([roomId, count]) => ({ roomId, count }));
    
//     return sorted;
    
// };
