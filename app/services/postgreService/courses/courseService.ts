import { pool } from "@/app/config/db";
import { Course, Grade, Instructor, Review, Subject, CourseSubject, Section, SectionGrade, InstructorSection, CourseOffering } from "@/app/types/types";

//DB Update

export async function clearCourseDataInDB(): Promise<void> {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        console.log("Deleting existing Madgrades data...");

        await client.query(`DELETE FROM "CoursesSubjects";`);
        await client.query(`DELETE FROM instructors;`);
        await client.query(`DELETE FROM subjects;`);
        await client.query(`DELETE FROM courses;`);

        await client.query('COMMIT');

        console.log("Madgrades data cleared successfully.");
    } catch (error) {
        console.error("Error clearing Madgrades data:", error);
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}


export async function saveSections(sections: Section[], instructorSections: InstructorSection[]): Promise<void> {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // sections INSERT
        const sectionValues = sections.map((s) =>
            `('${s.id}', ${s.number}, '${s.sectionType}', '${s.courseOffering_id}', ${s.start_Time ? `'${s.start_Time}'` : 'NULL'}, ${s.end_Time ? `'${s.end_Time}'` : 'NULL'}, ${s.days ? `'${s.days}'` : 'NULL'})`
        ).join(",");

        const insertSectionsQuery = `
            INSERT INTO sections (id, number, section_type, course_offering_id, start_time, end_time, days)
            VALUES ${sectionValues}
            ON CONFLICT (id) DO NOTHING;
        `;

        await client.query(insertSectionsQuery);

        if (instructorSections.length > 0) {
            const instructorValues = instructorSections.map((is) =>
                `('${is.section_id}', '${is.instructor_id}')`
            ).join(",");

            const insertInstructorSectionsQuery = `
                INSERT INTO "InstructorsSections" (section_id, instructor_id)
                VALUES ${instructorValues}
                ON CONFLICT DO NOTHING;
            `;

            await client.query(insertInstructorSectionsQuery);
        }

        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error("saveSections Error:", error);
        throw error;
    } finally {
        client.release();
    }
}


export async function saveCourseOfferings(courseOfferings: CourseOffering[]): Promise<void> {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const values = courseOfferings.map((o) => 
            `('${o.id}', '${o.course_id}', '${o.semester}')`
        ).join(",");

        const query = `
            INSERT INTO "courseOffering" (id, course_id, semester)
            VALUES ${values}
            ON CONFLICT (id) DO NOTHING;
        `;

        await client.query(query);
        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error("saveCourseOfferings Error:", error);
        throw error;
    } finally {
        client.release();
    }
}


export async function saveGrades(courseGrades: Grade[], sectionGrades: SectionGrade[] ): Promise<void> {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const courseGradeValues = courseGrades.map((g) => `('${g.course_id}', ${g.total}, ${g.a_per}, ${g.ab_per}, ${g.b_per}, ${g.bc_per}, ${g.c_per}, ${g.d_per}, ${g.f_per}, ${g.other_per})`).join(",");
        const courseGradeQuery = `
            INSERT INTO course_grades (course_id, total, a_per, ab_per, b_per, bc_per, c_per, d_per, f_per, other_per)
            VALUES ${courseGradeValues}
            ON CONFLICT (course_id) DO UPDATE
            SET total = EXCLUDED.total,
                a_per = EXCLUDED.a_per,
                ab_per = EXCLUDED.ab_per,
                b_per = EXCLUDED.b_per,
                bc_per = EXCLUDED.bc_per,
                c_per = EXCLUDED.c_per,
                d_per = EXCLUDED.d_per,
                f_per = EXCLUDED.f_per,
                other_per = EXCLUDED.other_per;
        `;

        const sectionGradeValues = sectionGrades.map((g) => `('${g.section_id}', ${g.total}, ${g.a_per}, ${g.ab_per}, ${g.b_per}, ${g.bc_per}, ${g.c_per}, ${g.d_per}, ${g.f_per}, ${g.other_per})`).join(",");
        const sectionGradeQuery = `
            INSERT INTO section_grades (section_id, total, a_per, ab_per, b_per, bc_per, c_per, d_per, f_per, other_per)
            VALUES ${sectionGradeValues}
            ON CONFLICT (section_id) DO UPDATE
            SET total = EXCLUDED.total,
                a_per = EXCLUDED.a_per,
                ab_per = EXCLUDED.ab_per,
                b_per = EXCLUDED.b_per,
                bc_per = EXCLUDED.bc_per,
                c_per = EXCLUDED.c_per,
                d_per = EXCLUDED.d_per,
                f_per = EXCLUDED.f_per,
                other_per = EXCLUDED.other_per;
        `;

        await client.query(courseGradeQuery);
        await client.query(sectionGradeQuery);

        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error("saveGrades Error:", error);
        throw error;
    } finally {
        client.release();
    }
}

export async function saveSubjects(subjects: Subject[]): Promise<void> {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const insertQuery = `
            INSERT INTO subjects (code, name, abbreviation)
            VALUES ($1, $2, $3)
            ON CONFLICT (abbreviation) DO UPDATE
            SET name = EXCLUDED.name,
                abbreviation = EXCLUDED.abbreviation
        `;

        for (const subject of subjects) {
            await client.query(insertQuery, [subject.code, subject.name, subject.abbreviation]);
        }

        await client.query("COMMIT");
    } catch (error) {
        await client.query("ROLLBACK");
        console.error("Error inserting subjects:", error);
        throw error;
    } finally {
        client.release();
    }
}

export async function saveCourses(courses: Course[], courseSubjects: CourseSubject[]): Promise<void> {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const insertCourseQuery = `
            INSERT INTO courses (id, name, number)
            VALUES ($1, $2, $3)
            ON CONFLICT (id) DO UPDATE
            SET name = EXCLUDED.name,
                number = EXCLUDED.number
        `;

        const insertCourseSubjectQuery = `
            INSERT INTO "CoursesSubjects" (course_id, subject_abbreviation)
            VALUES ($1, $2)
            ON CONFLICT DO NOTHING
        `;

        for (const course of courses) {
            await client.query(insertCourseQuery, [course.id, course.name, course.number]);
        }

        for (const cs of courseSubjects) {
            await client.query(insertCourseSubjectQuery, [cs.course_id, cs.subject_abbreviation]);
        }

        await client.query("COMMIT");
    } catch (error) {
        await client.query("ROLLBACK");
        console.error("Error inserting courses:", error);
        throw error;
    } finally {
        client.release();
    }
}

export async function saveInstructors(instructors: Instructor[]): Promise<void> {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const insertPromises = instructors.map((instructor) => {
            return client.query(
                `INSERT INTO instructors (id, name)
                 VALUES ($1, $2)
                 ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name`,
                [instructor.id, instructor.name]
            );
        });

        await Promise.all(insertPromises);

        await client.query("COMMIT");
    } catch (error) {
        await client.query("ROLLBACK");
        console.error("Failed to insert instructors:", error);
        throw error;
    } finally {
        client.release();
    }
}


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
