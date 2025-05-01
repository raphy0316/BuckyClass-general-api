import { pool } from "@/app/config/db";
import { TopAGradeCourse, ReviewWithCourse, TopViewedCourse, AverageRatingResult } from "@/app/types/types";

export const getTopAGradeCourses = async (): Promise<TopAGradeCourse[]> => {
  const client = await pool.connect();

  try {
    const result = await client.query(`
      SELECT
        g.course_id,
        c.name AS course_name,
        g.a_per
      FROM course_grades g
      JOIN courses c ON g.course_id = c.id
      ORDER BY g.a_per DESC
      LIMIT 1;
    `);
    return result.rows;
  } catch (error) {
    console.error("getTopAGradeCourses failed:", error);
    throw error;
  } finally {
    client.release();
  }
};

export const getLatestReviewsWithCourse = async (): Promise<ReviewWithCourse[]> => {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT
        r.user_id,
        cs.subject_abbreviation || ' ' || c.number AS course_name,
        c.name,
        r.rating,
        r.comment
      FROM reviews r
      JOIN "CoursesSubjects" cs ON r.course_id = cs.course_id
      JOIN "courses" c ON r.course_id = c.id
      ORDER BY r.created_at DESC
      LIMIT 10
    `);
    return result.rows;
  } catch (error) {
    console.error("getLatestReviewsWithCourse failed:", error);
    throw error;
  }
};

export const getTopViewedCourses = async (): Promise<TopViewedCourse[]> => {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT
        id,
        cs.subject_abbreviation || ' ' || number AS display_name,
        name,
        views
      FROM courses c
      JOIN "CoursesSubjects" cs ON c.id = cs.course_id
      ORDER BY views DESC
      LIMIT 10
    `);
    return result.rows;
  } catch (error) {
    console.error("Failed to fetch top viewed courses:", error);
    throw error;
  } finally {
    client.release();
  }
};

export const getAverageRatingByCourse = async (courseId: string): Promise<AverageRatingResult[]> => {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `
      SELECT AVG(rating) AS average_rating
      FROM reviews
      WHERE course_id = $1
      `,
      [courseId]
    );
    return result.rows;
  } finally {
    client.release();
  }
};

export const getAverageScoreByTermForCourse = async (
  courseId: string
): Promise<{ course_id: string; term: string; avg_gpa: number }[]> => {
  const client = await pool.connect();
  try {
    const query = `
      SELECT
        co.course_id,
        co.semester AS term,
        ROUND(AVG(
          sg.a_per * 4 +
          sg.ab_per * 3.5 +
          sg.b_per * 3 +
          sg.bc_per * 2.5 +
          sg.c_per * 2 +
          sg.d_per * 1
        ) / 100, 2) AS avg_gpa
      FROM "section_grades" sg
      JOIN "sections" s ON sg.section_id = s.id
      JOIN "CourseOfferingSections" cos ON s.id = cos.section_id
      JOIN "courseOffering" co ON cos.offering_id = co.id
      WHERE co.course_id = $1
      GROUP BY co.course_id, co.semester
      ORDER BY co.semester;
    `;
    const result = await client.query(query, [courseId]);
    return result.rows;
  } finally {
    client.release();
  }
};

export const getAverageScoreByInstructor = async (): Promise<
  { instructor_id: number; average_gpa: number }[]
> => {
  const client = await pool.connect();
  try {
    const query = `
      SELECT
        ico.instructor_id,
        ROUND(AVG(
          (sg.a_per * 4.0 + sg.ab_per * 3.5 + sg.b_per * 3.0 +
          sg.bc_per * 2.5 + sg.c_per * 2.0 + sg.d_per * 1.0 + sg.f_per * 0.0) / 100
        ), 2) AS average_gpa
      FROM section_grades sg
      JOIN sections s ON sg.section_id = s.id
      JOIN "CourseOfferingSections" cos ON s.id = cos.section_id
      JOIN "InstructorCourseOffering" ico ON cos.offering_id = ico.offering_id
      GROUP BY ico.instructor_id
      ORDER BY average_gpa DESC;
    `;
    const res = await client.query(query);
    return res.rows;
  } catch (error) {
    throw error;
  } finally {
    client.release();
  }
};

export const getARatioByInstructor = async (): Promise<
  { instructor_id: number; a_ratio: number }[]
> => {
  const client = await pool.connect();
  try {
    const query = `
      SELECT
        ico.instructor_id,
        ROUND(AVG(sg.a_per), 2) AS a_ratio
      FROM section_grades sg
      JOIN "CourseOfferingSections" cos ON sg.section_id = cos.section_id
      JOIN "InstructorCourseOffering" ico ON cos.offering_id = ico.offering_id
      WHERE sg.a_per IS NOT NULL
      GROUP BY ico.instructor_id
      ORDER BY a_ratio DESC;
    `;
    const res = await client.query(query);
    return res.rows;
  } finally {
    client.release();
  }
};

export const getTop3Chats = async (): Promise<{ name: string; message_count: number; date: string; count: number }[]> => {
  const client = await pool.connect();
  try {
    const query = `
      WITH top_chats AS (
        SELECT
          cr.chat_id,
          cs.subject_abbreviation || ' ' || c.number AS display_name,
          cr.message_count
        FROM "chatRoom" cr
        JOIN "courses" c ON cr.chat_id = c.id::text
        JOIN "CoursesSubjects" cs ON cr.chat_id = cs.course_id::text
       	ORDER BY cr.message_count DESC
        LIMIT 3
      )
      SELECT
        tc.display_name AS name,
        tc.message_count,
        mc.date,
        mc.message_count AS count
      FROM top_chats tc
      LEFT JOIN "chatRoomDailyMessageCount" mc ON tc.chat_id = mc.chat_id
      ORDER BY tc.message_count DESC, mc.date ASC
    `;
    const result = await client.query(query);
    return result.rows;
  } finally {
    client.release();
  }
};

