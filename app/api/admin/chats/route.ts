import { db } from "@/app/lib/firebaseAdmin";
import { insertChatRoom, insertChatRoomUser } from "@/app/services/postgreService/chats/chatService";
import { pool } from "@/app/config/db";
import { verifyAdmin } from "@/app/lib/verifyAdmin";
import { NextRequest, NextResponse } from "next/server";
import { verifyFirebaseAuth } from "@/app/middlewares/firebaseAuth";

/**
 * Creates course chatrooms: 
 * chat_id = course_id (UUID), name = course_code (e.g., "CS 400")
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
        c.id AS course_id,
        cs.subject_abbreviation || ' ' || c.number AS course_code,
        e.user_id
      FROM "EnrolledSections" e
      JOIN sections sec ON e.section_id = sec.id
      JOIN "courseOffering" co ON sec.courseOffering_id = co.id
      JOIN courses c ON co.course_id = c.id
      JOIN "CoursesSubjects" cs ON c.id = cs.course_id
    `;

    const result = await client.query(query);

    // Map<course_id(UUID), { name: "CS 400", users: Set<user_id> }>
    const courseMap = new Map<string, { name: string; users: Set<string> }>();

    for (const row of result.rows) {
      const { course_id, course_code, user_id } = row;
      if (!courseMap.has(course_id)) {
        courseMap.set(course_id, { name: course_code, users: new Set() });
      }
      courseMap.get(course_id)!.users.add(user_id);
    }

    for (const [courseId, { name: courseCode, users: userSet }] of courseMap) {
      const chatRef = db.ref(`chats/${courseCode}`);
      const exists = await chatRef.get();
      if (exists.exists()) continue;

      await chatRef.set({
        name: courseCode,
        type: "course",
        createdBy: "Admin",
        createdAt: Date.now(),
        participants: Object.fromEntries(Array.from(userSet).map((uid) => [uid, true])),
        messages: {},
      });

      await insertChatRoom({
        chat_id: courseId,
        name: courseCode,
        created_by: "Admin",
      });

      for (const uid of userSet) {
        await insertChatRoomUser({
          chat_id: courseId,
          user_id: uid,
        });
      }
    }

    client.release();
    return NextResponse.json({ message: "Course chatrooms created with course_id as chat_id" }, { status: 201 });
  } catch (err) {
    console.error("Failed to batch create chatrooms:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
