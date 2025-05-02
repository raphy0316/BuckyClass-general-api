import { pool } from "@/app/config/db";
import { Course, Grade, Instructor, Review, Subject, CourseSubject, Section, SectionGrade, InstructorSection, CourseOffering } from "@/app/types/types";
import { chunk } from "lodash";
//DB Update

export const getSectionsByCourseId = async (courseId: string): Promise<Section[]> => {
    const client = await pool.connect();

    try {
        const currentSemester = "Fall 2024";

        const query = `
            SELECT 
            s.id,
            s.number,
            s.section_type,
            s.courseoffering_id,
            (s.days || ' ' || TO_CHAR(s.start_time, 'HH24:MI') || ' - ' || TO_CHAR(s.end_time, 'HH24:MI')) AS meeting_time
            FROM "sections" s
            JOIN "courseOffering" co ON s.courseOffering_id = co.id
            WHERE co.course_id = $1 AND co.semester = $2

        `;

        const result = await client.query(query, [courseId, currentSemester]);
        return result.rows;
    } finally {
        client.release();
    }
};


export async function getCoursesByMajor(major: string) {
    const client = await pool.connect();
    try {
        const query = `
            SELECT DISTINCT
                c.id,
                c.name,
                cs.subject_abbreviation || ' ' || c.number AS course_code
            FROM "MajorsSubjects" ms
            JOIN "CoursesSubjects" cs ON ms.subject_abbreviation = cs.subject_abbreviation
            JOIN "courses" c ON cs.course_id = c.id
            WHERE ms.major = $1
        `;
        const result = await client.query(query, [major]);
        return result.rows;
    } finally {
        client.release();
    }
}

export async function getCourseCode(course_id: string): Promise<string | null> {
    const client = await pool.connect();
    try {
        const query = `
            SELECT cs.subject_abbreviation || ' ' || c.number AS course_code
            FROM "courses" c
            JOIN "CoursesSubjects" cs ON c.id = cs.course_id
            WHERE c.id = $1
            LIMIT 1
        `;
        const result = await client.query(query, [course_id]);
        return result.rows[0]?.course_code ?? null;
    } finally {
        client.release();
    }
}



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
        await client.query("BEGIN");

        const sectionChunks = chunk(sections, 100);
        for (const group of sectionChunks) {
            const values: (string | number | null)[] = [];
            const placeholders: string[] = [];

            group.forEach((s, index) => {
                const baseIndex = index * 7;
                placeholders.push(
                    `($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${baseIndex + 4}, $${baseIndex + 5}, $${baseIndex + 6}, $${baseIndex + 7})`
                );
                values.push(
                    s.id,
                    s.number,
                    s.sectionType,
                    s.courseOffering_id,
                    s.start_Time || null,
                    s.end_Time || null,
                    s.days || null
                );
            });

            const insertSectionsQuery = `
                INSERT INTO sections (id, number, section_type, courseoffering_id, start_time, end_time, days)
                VALUES ${placeholders.join(",")}
                ON CONFLICT (id) DO NOTHING;
            `;

            await client.query(insertSectionsQuery, values);
        }

        const instructorChunks = chunk(instructorSections, 100);
        for (const group of instructorChunks) {
            const values: (string | number | null)[] = [];
            const placeholders: string[] = [];

            group.forEach((is, index) => {
                const baseIndex = index * 2;
                placeholders.push(`($${baseIndex + 1}, $${baseIndex + 2})`);
                values.push(is.section_id, is.instructor_id);
            });

            const insertInstructorSectionsQuery = `
                INSERT INTO "InstructorsSections" (section_id, instructor_id)
                VALUES ${placeholders.join(",")}
                ON CONFLICT DO NOTHING;
            `;

            await client.query(insertInstructorSectionsQuery, values);
        }

        await client.query("COMMIT");
    } catch (error) {
        await client.query("ROLLBACK");
        console.error("saveSections Error:", error);
        throw error;
    } finally {
        client.release();
    }
}


export async function saveCourseOfferings(courseOfferings: CourseOffering[]): Promise<void> {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const offeringChunks = chunk(courseOfferings, 100);
        for (const group of offeringChunks) {
            const values: (string | number | null)[] = [];
            const placeholders: string[] = [];

            group.forEach((o, index) => {
                const baseIndex = index * 3;
                placeholders.push(`($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3})`);
                values.push(o.id, o.course_id, o.semester);
            });

            const insertQuery = `
                INSERT INTO "courseOffering" (id, course_id, semester)
                VALUES ${placeholders.join(",")}
                ON CONFLICT (id) DO UPDATE
                SET semester = EXCLUDED.semester;
            `;

            await client.query(insertQuery, values);
        }

        await client.query("COMMIT");
    } catch (error) {
        await client.query("ROLLBACK");
        console.error("saveCourseOfferings Error:", error);
        throw error;
    } finally {
        client.release();
    }
}



export async function saveGrades(courseGrades: Grade[]): Promise<void> {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const gradeChunks = chunk(courseGrades, 100);
        for (const group of gradeChunks) {
            const values: (string | number | null)[] = [];
            const placeholders: string[] = [];

            group.forEach((g, index) => {
                const i = index * 10;
                placeholders.push(`($${i + 1}, $${i + 2}, $${i + 3}, $${i + 4}, $${i + 5}, $${i + 6}, $${i + 7}, $${i + 8}, $${i + 9}, $${i + 10})`);
                values.push(
                    g.course_id,
                    g.total,
                    g.a_per,
                    g.ab_per,
                    g.b_per,
                    g.bc_per,
                    g.c_per,
                    g.d_per,
                    g.f_per,
                    g.other_per
                );
            });

            const query = `
                INSERT INTO course_grades (course_id, total, a_per, ab_per, b_per, bc_per, c_per, d_per, f_per, other_per)
                VALUES ${placeholders.join(",")}
                ON CONFLICT (course_id) DO UPDATE SET
                    total = EXCLUDED.total,
                    a_per = EXCLUDED.a_per,
                    ab_per = EXCLUDED.ab_per,
                    b_per = EXCLUDED.b_per,
                    bc_per = EXCLUDED.bc_per,
                    c_per = EXCLUDED.c_per,
                    d_per = EXCLUDED.d_per,
                    f_per = EXCLUDED.f_per,
                    other_per = EXCLUDED.other_per;
            `;

            await client.query(query, values);
        }

        await client.query("COMMIT");
    } catch (error) {
        await client.query("ROLLBACK");
        console.error("saveGrades Error:", error);
        throw error;
    } finally {
        client.release();
    }
}

export async function saveSectionGrades(sectionGrades: SectionGrade[]): Promise<void> {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const gradeChunks = chunk(sectionGrades, 100);
        for (const group of gradeChunks) {
            const values: (string | number | null)[] = [];
            const placeholders: string[] = [];

            group.forEach((g, index) => {
                const i = index * 10;
                placeholders.push(`($${i + 1}, $${i + 2}, $${i + 3}, $${i + 4}, $${i + 5}, $${i + 6}, $${i + 7}, $${i + 8}, $${i + 9}, $${i + 10})`);
                values.push(
                    g.section_id,
                    g.total,
                    g.a_per,
                    g.ab_per,
                    g.b_per,
                    g.bc_per,
                    g.c_per,
                    g.d_per,
                    g.f_per,
                    g.other_per
                );
            });

            const query = `
                INSERT INTO section_grades (section_id, total, a_per, ab_per, b_per, bc_per, c_per, d_per, f_per, other_per)
                VALUES ${placeholders.join(",")}
                ON CONFLICT (section_id) DO UPDATE SET
                    total = EXCLUDED.total,
                    a_per = EXCLUDED.a_per,
                    ab_per = EXCLUDED.ab_per,
                    b_per = EXCLUDED.b_per,
                    bc_per = EXCLUDED.bc_per,
                    c_per = EXCLUDED.c_per,
                    d_per = EXCLUDED.d_per,
                    f_per = EXCLUDED.f_per,
                    other_per = EXCLUDED.other_per;
            `;

            await client.query(query, values);
        }

        await client.query("COMMIT");
    } catch (error) {
        await client.query("ROLLBACK");
        console.error("saveSectionGrades Error:", error);
        throw error;
    } finally {
        client.release();
    }
}


export async function saveSubjects(subjects: Subject[]): Promise<void> {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const subjectChunks = chunk(subjects, 100);
        for (const group of subjectChunks) {
            const values: (string | number | null)[] = [];
            const placeholders: string[] = [];

            group.forEach((s, index) => {
                const baseIndex = index * 3;
                placeholders.push(`($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3})`);
                values.push(s.code, s.name, s.abbreviation);
            });

            const insertQuery = `
                INSERT INTO subjects (code, name, abbreviation)
                VALUES ${placeholders.join(", ")}
                ON CONFLICT (abbreviation) DO UPDATE
                SET name = EXCLUDED.name,
                    abbreviation = EXCLUDED.abbreviation
            `;

            await client.query(insertQuery, values);
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

        const courseChunks = chunk(courses, 100);
        for (const group of courseChunks) {
            const values: (string | number | null)[] = [];
            const placeholders: string[] = [];

            group.forEach((course, index) => {
                const base = index * 3;
                placeholders.push(`($${base + 1}, $${base + 2}, $${base + 3})`);
                values.push(course.id, course.name, course.number);
            });

            const insertCoursesQuery = `
                INSERT INTO courses (id, name, number)
                VALUES ${placeholders.join(", ")}
                ON CONFLICT (id) DO UPDATE
                SET name = EXCLUDED.name,
                    number = EXCLUDED.number;
            `;

            await client.query(insertCoursesQuery, values);
        }

        const courseSubjectChunks = chunk(courseSubjects, 100);
        for (const group of courseSubjectChunks) {
            const values: (string | number | null)[] = [];
            const placeholders: string[] = [];

            group.forEach((cs, index) => {
                const base = index * 2;
                placeholders.push(`($${base + 1}, $${base + 2})`);
                values.push(cs.course_id, cs.subject_abbreviation);
            });

            const insertCourseSubjectsQuery = `
                INSERT INTO "CoursesSubjects" (course_id, subject_abbreviation)
                VALUES ${placeholders.join(", ")}
                ON CONFLICT DO NOTHING;
            `;

            await client.query(insertCourseSubjectsQuery, values);
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

        const instructorChunks = chunk(instructors, 100);
        for (const group of instructorChunks) {
            const values: (string | number | null)[] = [];
            const placeholders: string[] = [];

            group.forEach((instructor, index) => {
                const base = index * 2;
                placeholders.push(`($${base + 1}, $${base + 2})`);
                values.push(instructor.id, instructor.name);
            });

            const insertQuery = `
                INSERT INTO instructors (id, name)
                VALUES ${placeholders.join(", ")}
                ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;
            `;

            await client.query(insertQuery, values);
        }

        await client.query("COMMIT");
    } catch (error) {
        await client.query("ROLLBACK");
        console.error("Failed to insert instructors:", error);
        throw error;
    } finally {
        client.release();
    }
}


export const getCourses = async (
    keyword?: string
  ): Promise<Course[]> => {
    const client = await pool.connect();
  
    try {
      let query = `
        SELECT 
          c.*,
          cs.subject_abbreviation
        FROM "courses" c
        LEFT JOIN "CoursesSubjects" cs ON c.id = cs.course_id
        WHERE 1=1
      `;
  
      const queryParams: string[] = [];
  
      if (keyword) {
        query += ` AND (
          (cs.subject_abbreviation || ' ' || c.number) ILIKE '%' || $1 || '%' OR
          c.name ILIKE '%' || $1 || '%'
        )`;
        queryParams.push(keyword);
      }
  
      const result = await client.query(query, queryParams);
      return result.rows;
    } catch (err) {
      console.error("Error in getCourses:", err);
      return [];
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
        FROM "instructors" i
        JOIN "InstructorsSections" ins ON i.id = ins.instructor_id
        JOIN "sections" s ON ins.section_id = s.id
        JOIN "courseOffering" co ON s.courseOffering_id = co.id
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
