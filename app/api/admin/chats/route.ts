import { db } from "@/app/lib/firebaseAdmin";
import { insertChatRoom, insertChatRoomUser } from "@/app/services/postgreService/chats/chatService";
import { pool } from "@/app/config/db";
import { verifyAdmin } from "@/app/lib/verifyAdmin";
import { NextRequest, NextResponse } from "next/server";
import { verifyFirebaseAuth } from "@/app/middlewares/firebaseAuth";
/**
 * Creates course chatrooms grouped by subject + course number (e.g., CS 400).
 * The course_code (e.g., "CS 400") is used as the Firebase chat ID and chat_id in the DB.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await verifyFirebaseAuth(request);
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminCheck = await verifyAdmin(user.uid);
    if (!adminCheck.ok) {
        return adminCheck.response;
    }

    const client = await pool.connect();

    const query = `
      SELECT
        cs.subject_abbreviation || ' ' || c.number AS course_code,
        e.user_id
      FROM "EnrolledSections" e
      JOIN sections sec ON e.section_id = sec.id
      JOIN "courseOffering" co ON sec.courseOffering_id = co.id
      JOIN courses c ON co.course_id = c.id
      JOIN "CoursesSubjects" cs ON c.id = cs.course_id
    `;

    const result = await client.query(query);
    const courseMap = new Map<string, Set<string>>();

    for (const row of result.rows) {
      const { course_code, user_id } = row;
      if (!courseMap.has(course_code)) {
        courseMap.set(course_code, new Set());
      }
      courseMap.get(course_code)!.add(user_id);
    }

    for (const [courseCode, userSet] of courseMap) {
      const chatRef = db.ref(`chats/${courseCode}`);
      const exists = await chatRef.get();
      if (exists.exists()) continue;

      await chatRef.set({
        name: courseCode,
        type: "course",
        createdBy: "Admin",
        createdAt: Date.now(),
        participants: Object.fromEntries(
          Array.from(userSet).map((uid) => [uid, true])
        ),
        messages: {},
      });

      await insertChatRoom({
        chat_id: courseCode,
        name: courseCode,
        created_by: "Admin",
      });

      for (const uid of userSet) {
        await insertChatRoomUser({
          chat_id: courseCode,
          user_id: uid,
        });
      }
    }

    client.release();
    return NextResponse.json({ message: "Course chatrooms created by subject+number" }, { status: 201 });
  } catch (err) {
    console.error("Failed to batch create subject-number chatrooms:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
