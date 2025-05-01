import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/app/config/db";
import { verifyFirebaseAuth } from "@/app/middlewares/firebaseAuth";

export async function POST(req: NextRequest) {
    const client = await pool.connect();

    try {
        const user = await verifyFirebaseAuth(req);
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { section_id } = await req.json();
        if (!section_id) {
            return NextResponse.json({ error: "Missing section_id" }, { status: 400 });
        }

        await client.query(
            `INSERT INTO "EnrolledSections" (user_id, section_id)
             VALUES ($1, $2)
             ON CONFLICT DO NOTHING`,
            [user.uid, section_id]
        );

        return NextResponse.json({ success: true }, { status: 200 });

    } catch (err) {
        console.error("Enrollment failed:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    } finally {
        client.release();
    }
}

export async function GET(request: NextRequest) {
    const client = await pool.connect();
  
    try {
      const user = await verifyFirebaseAuth(request);
      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
  
      const query = `
        SELECT 
            s.id AS section_id,
            s.number AS section_number,
            s.roomCode AS location_code,
            (s.days || ' ' || TO_CHAR(s.start_time, 'HH12:MIAM') || ' - ' || TO_CHAR(s.end_time, 'HH12:MIAM')) AS meeting_time,
            co.semester,
            c.name AS course_name,
            c.number AS course_number,
            cs.subject_abbreviation,
            (cs.subject_abbreviation || ' ' || c.number) AS course_code,
            i.name AS instructor_name
        FROM "EnrolledSections" e
        JOIN "sections" s ON e.section_id = s.id
        JOIN "courseOfferings" co ON s.courseOffering_id = co.id
        JOIN "courses" c ON co.course_id = c.id
        JOIN "CoursesSubjects" cs ON c.id = cs.course_id
        LEFT JOIN "InstructorsSections" isec ON s.id = isec.section_id
        LEFT JOIN "instructors" i ON isec.instructor_id = i.id
        WHERE e.user_id = $1
      `;
  
      const result = await client.query(query, [user.uid]);
  
      return NextResponse.json(result.rows, { status: 200 });
    } catch (err) {
      console.error("Failed to fetch enrolled sections:", err);
      return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    } finally {
      client.release();
    }
  }