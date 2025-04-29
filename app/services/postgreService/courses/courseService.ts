import { pool } from "@/app/config/db";
import {Course, Grade, Instructor, Review } from "@/app/types/types";

export const saveCourses = async (courses: Course[]): Promise<void> => {
    const client = await pool.connect();

    try {
        const query = `
            INSERT INTO courses (id, name, subject_abbreviation, number)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (id)
            DO UPDATE SET
                name = EXCLUDED.name,
                subject_abbreviation = EXCLUDED.subject_abbreviation,
                number = EXCLUDED.number;
        `;

        for (const course of courses) {
            await client.query(query, [
                course.id,
                course.name,
                course.subject_abbreviation,
                course.number
            ]);
        }

        console.log(`${courses.length} courses saved/updated in PostgreSQL`);
    } finally {
        client.release();
    }
};


export const saveGrades = async (grades: Grade): Promise<void> => {
    const client = await pool.connect();

    try {
        const query = `
            INSERT INTO course_grades (course_id, total, a_per, ab_per, b_per, bc_per, c_per, d_per, f_per, other_per)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            ON CONFLICT (course_id)
            DO UPDATE SET total = EXCLUDED.total, a_per = EXCLUDED.a_per, ab_per = EXCLUDED.ab_per,
            b_per = EXCLUDED.b_per, bc_per = EXCLUDED.bc_per, c_per = EXCLUDED.c_per,
            d_per = EXCLUDED.d_per, f_per = EXCLUDED.f_per, other_per = EXCLUDED.other_per;
        `;

        await client.query(query, [
            grades.course_id,
            grades.total,
            grades.a_per,
            grades.ab_per,
            grades.b_per,
            grades.bc_per,
            grades.c_per,
            grades.d_per,
            grades.f_per,
            grades.other_per
        ]);

        console.log(`Grades saved for course ${grades.course_id}`);
    } finally {
        client.release();
    }
};

export const getCourses = async (subject?: string, title?: string): Promise<Course[]> => {
    const client = await pool.connect();

    try {
        let query = `
            SELECT c.*
            FROM "courses" c
            LEFT JOIN "CoursesSubjects" cs ON c.id = cs.course_id
            LEFT JOIN "subjects" s ON cs.subject_id = s.id
            WHERE 1=1
        `;

        const queryParams: (string)[] = [];

        if (subject) {
            query += ` AND s.name ILIKE '%' || $${queryParams.length + 1} || '%'`;
            queryParams.push(subject);
        }

        if (title) {
            query += ` AND c.name ILIKE '%' || $${queryParams.length + 1} || '%'`;
            queryParams.push(title);
        }

        const result = await client.query(query, queryParams);
        return result.rows;
    } finally {
        client.release();
    }
};

export const saveInstructors = async (instructors: Instructor[]): Promise<void> => {
    const client = await pool.connect();

    try {
        if (!instructors || instructors.length === 0) {
            console.log("No instructors to save.");
            return;
        }

        const instructorQuery = `
            INSERT INTO instructors (id, name)
            VALUES ($1, $2)
            ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;
        `;

        const instructorCourseQuery = `
            INSERT INTO "InstructorCourseOffering" (instructor_id, offering_id)
            VALUES ($1, $2)
            ON CONFLICT (instructor_id, offering_id) DO NOTHING;
        `;

        for (const instructor of instructors) {
            await client.query(instructorQuery, [
                instructor.id,
                instructor.name
            ]);

            if (instructor.courseOfferings) {
                for (const offering of instructor.courseOfferings) {
                    await client.query(instructorCourseQuery, [
                        instructor.id,
                        offering.id
                    ]);
                }
            }
        }
        console.log(`${instructors.length} instructors saved/updated in PostgreSQL`);
    } catch (error) {
        console.error("Failed to save instructors:", error);
    }
}

export const getCourseById = async (id: string): Promise<{ course: Course, grade?: Grade, reviews?: Review[] } | null> => {
    const client = await pool.connect();

    try {
        const courseQuery = `SELECT * FROM courses WHERE id = $1`;
        const courseResult = await client.query(courseQuery, [id]);

        if (courseResult.rows.length === 0) return null;

        const course: Course = courseResult.rows[0];

        const gradeQuery = `SELECT * FROM course_grades WHERE course_id = $1`;
        const gradeResult = await client.query(gradeQuery, [id]);
        const grade: Grade | undefined = gradeResult.rows.length > 0 ? gradeResult.rows[0] : undefined;

        const reviewQuery = `SELECT * FROM reviews WHERE course_id = $1`;
        const reviewResult = await client.query(reviewQuery, [id]);
        const reviews: Review[] = reviewResult.rows;

        return { course, grade, reviews };
    } finally {
        client.release();
    }
};

export const incrementCourseViews = async (courseId: string): Promise<void> => {
    const client = await pool.connect();

    try {
        await client.query(
            `UPDATE courses SET views = views + 1 WHERE id = $1`,
            [courseId]
        );
        console.log(` view increment sucecess: ${courseId}`);
    } catch (error) {
        console.error("view increment failed:", error);
        throw error;
    }
}

export const getCourseInfoById = async (id: string): Promise<{
  course: Course;
  grade?: Grade;
  averageGpa: number | null;
  instructors: string[];
} | null> => {
  const client = await pool.connect();

  try {
    const courseQuery = `SELECT * FROM courses WHERE id = $1`;
    const courseResult = await client.query(courseQuery, [id]);
    if (courseResult.rows.length === 0) return null;
    const course: Course = courseResult.rows[0];

    const gradeQuery = `SELECT * FROM course_grades WHERE course_id = $1`;
    const gradeResult = await client.query(gradeQuery, [id]);
    const grade: Grade | undefined = gradeResult.rows[0];

    const avgGpaQuery = `
      SELECT ROUND(
        (a_per * 4 + ab_per * 3.5 + b_per * 3 + bc_per * 2.5 + c_per * 2 + d_per * 1 + f_per * 0) / 100, 2
      ) AS average_gpa
      FROM course_grades
      WHERE course_id = $1
    `;
    const avgGpaResult = await client.query(avgGpaQuery, [id]);
    const averageGpa: number | null = avgGpaResult.rows[0]?.average_gpa ?? null;

    const instructorQuery = `
      SELECT i.name
      FROM instructors i
      JOIN "InstructorCourseOffering" ico ON i.id = ico.instructor_id
      JOIN "courseOffering" co ON ico.offering_id = co.id
      WHERE co.course_id = $1
      LIMIT 1
    `;
    const instructorResult = await client.query(instructorQuery, [id]);
    const instructors: string[] = instructorResult.rows.map(r => r.name);

    return { course, grade, averageGpa, instructors };
  } finally {
    client.release();
  }
};
