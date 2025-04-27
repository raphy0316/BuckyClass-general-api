import { pool } from "../config/db";
import {Course, Grade, Review, VerifiedUser, UserProfile,
     Instructor, TopAGradeCourse, ReviewWithCourse, TopViewedCourse, AverageRatingResult, ChatMessageCounts} from "../types/types";


export const saveCourses = async (courses: Course[]): Promise<void> => {
    const client = await pool.connect();

    try {
        const query = `
            INSERT INTO courses (id, name, display_name)
            VALUES ($1, $2, $3)
            ON CONFLICT (id) 
            DO UPDATE SET 
                name = EXCLUDED.name,
                display_name = EXCLUDED.display_name;
        `;

        for (const course of courses) {
            await client.query(query, [
                course.id,
                course.name,
                course.displayName
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


export const saveReview = async (review: Review): Promise<void> => {
    const client = await pool.connect();
    try {
        const query = `
                INSERT INTO reviews ( course_id, user_id, rating, comment)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (course_id,user_id) 
                DO UPDATE SET rating = EXCLUDED.rating, comment = EXCLUDED.comment;
            `;

        await client.query(query, [
            review.course_id,
            review.user_id,
            review.rating,
            review.comment
        ]);

        console.log(`Review saved`);
    } finally {
        client.release();
    }
};

export const deleteReview = async (course_id: string, user_id: string): Promise<void> => {
    const client = await pool.connect();
    try {
        const query = `
            DELETE FROM reviews
            WHERE course_id = $1 AND user_id = $2;
        `;
        await client.query(query, [course_id, user_id]);
        console.log('Review deleted');
    } finally {
        client.release();
    }
};



export const getReview = async (id : string): Promise<Review[] | null> => {
    const client = await pool.connect();
    try {
        const query = "SELECT * FROM reviews WHERE course_id = $1";
        const result = await client.query(query, [id]);
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
        
export const saveVerifiedUser = async (verifiedUser: VerifiedUser[]): Promise<void> => {
    const client = await pool.connect();
    try {

        const valuesStr = verifiedUser.map((_, i) => `($${i * 2 + 1}, $${i * 2 + 2})`).join(", ");
        const params = verifiedUser.flatMap(v => [v.course_id, v.user_id]);

        const query = `
            INSERT INTO "VerifiedUser" (course_id, user_id)
            VALUES ${valuesStr}
            ON CONFLICT DO NOTHING;
        `;

        await client.query(query,params);

        console.log(`Verified User saved`);
    } finally {
        client.release();
    }
};
export const deleteUserProfile = async (firebase_uid: string): Promise<void> => {
    const client = await pool.connect();
    try {
        await client.query(`DELETE FROM users WHERE id = $1`, [firebase_uid]);
        console.log(`User [${firebase_uid}] deleted from users table`);
    } finally {
        client.release();
    }
};

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
                c."display_name" AS course_name,
                c.name,
                r.rating,
                r.comment
            FROM reviews r
            JOIN courses c ON r.course_id = c.id
            ORDER BY r.created_at DESC
            LIMIT 10
        `);
        return result.rows;
    } catch (error) {
        console.error("getLatestReviewsWithCourse failed:", error);
        throw error;
    }
}

export const updateLikeReview = async (course_id: string, user_id : string, cancel: boolean): Promise<void> => {
    const client = await pool.connect();
    try {
        const query = `
                UPDATE reviews
                SET like_count = like_count + $1
                WHERE course_id = $2 AND user_id = $3;
            `;
        const incrementValue = cancel ? -1 : 1;

        await client.query(query, [
            incrementValue,
            course_id,
            user_id
        ]);

        console.log(`Like increased`);
    } finally {
        client.release();
    }
};

export const getTopViewedCourses = async (): Promise<TopViewedCourse[]> => {
    const client = await pool.connect();
    try {
        const result = await client.query(`
            SELECT id, "display_name" AS display_name, name, views
            FROM courses
            ORDER BY views DESC
            LIMIT 10;
        `);
        return result.rows;
    } catch (error) {
        console.error("Failed to fetch top viewed courses:", error);
        throw error;
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

export const saveUserProfile = async (profile: UserProfile): Promise<void> => {
    const client = await pool.connect();
    try {
        await client.query(
            `
      INSERT INTO users (id, name, email, profile_picture)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (id) DO NOTHING;
    `,
            [profile.firebase_uid, profile.name, profile.email, profile.profile_picture || null]
        );
        console.log(`User profile saved`);
    } finally {
        client.release();
    }
};

export const getAverageRatingByCourse = async (courseId: string): Promise<AverageRatingResult[]> => {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT AVG(rating) AS average_rating FROM reviews WHERE course_id = $1`,
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
  { instructor_id: number; average_gpa: number }[]> => {
  const client = await pool.connect();
  try {
    const query = `
    SELECT ico.instructor_id, 
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
  { instructor_id: number; a_ratio: number }[]> => {
  const client = await pool.connect();
  try {
    const query = `
    SELECT ico.instructor_id, 
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

export const isNewUser = async (firebase_uid: string): Promise<boolean | null> => {
    const client = await pool.connect();

    try {
        const result = await client.query(
            `SELECT is_new_user FROM users WHERE firebase_uid = $1`,
            [firebase_uid]
        );

        if (result.rowCount === 0) {
            return null; // 유저 없음
        }

        return result.rows[0].is_new_user;
    }
    finally {
        client.release();
    }
}

export const updateUserProfile = async (profile: Partial<UserProfile> & { firebase_uid: string }): Promise<void> => {
    const client = await pool.connect();
    try {
        await client.query(
            `
      UPDATE users
      SET name = COALESCE($2, name),
          profile_picture = COALESCE($3, profile_picture)
      WHERE firebase_uid = $1;
    `,
            [profile.firebase_uid, profile.name || null, profile.profile_picture || null]
        );
        console.log(`User profile updated`);
    } finally {
        client.release();
    }
};

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

export const saveChatRoomMessageCounts = async (chatMessageCounts: ChatMessageCounts): Promise<void> => {
    const client = await pool.connect();

    try {
        const query = `
            INSERT INTO "chatRoom" (id, message_count, created_by, type)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (id)
            DO UPDATE SET message_count = EXCLUDED.message_count;
        `;

        for (const [chatId, { messageCount, createdBy, type }] of Object.entries(chatMessageCounts)) {
            const createdByString = (typeof createdBy === "string")
            ? new Date(parseInt(createdBy)).toLocaleString()  
            : createdBy;
            await client.query(query, [
                chatId, messageCount, createdByString, type
            ]);
        }
        
    } finally {
        client.release();
    }
};

export const getTop3Chats = async (): Promise<{ id: string; name: string; message_count: number }[]> => {
    const client = await pool.connect();

    try {
        const query = `
            SELECT c.id, c.display_name, cr.message_count
            FROM "chatRoom" cr
            JOIN "courses" c ON cr.id = c.id
            WHERE cr.type = 'course'
            ORDER BY cr.message_count DESC
            LIMIT 3;
        `;

        const result = await client.query(query);
        return result.rows;
    } finally {
        client.release();
    }
};

export const insertChatRoom = async (room: {
    chat_id: string;
    name: string;
    type: "course" | "private";
    created_by: string;
}): Promise<void> => {
    const client = await pool.connect();
    try {
        await client.query(
            `
            INSERT INTO "chatRoom" (id, name, type, created_by)
            VALUES ($1, $2, $3, $4);
            `,
            [
                room.chat_id,
                room.name,
                room.type,
                room.created_by,
            ]
        );
        console.log(`Chat room [${room.chat_id}] inserted into chatRoom table`);
    } finally {
        client.release();
    }
};

export const deleteChatRoomById = async (chat_id: string): Promise<void> => {
    const client = await pool.connect();
    try {
        await client.query(`DELETE FROM "chatRoom" WHERE id = $1`, [chat_id]);
        console.log(`Chat room [${chat_id}] deleted from PostgreSQL`);
    } finally {
        client.release();
    }
};