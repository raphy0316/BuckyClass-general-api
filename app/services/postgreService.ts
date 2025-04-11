import { pool } from "../config/db";
import {Course, Grade, Review, VerifiedUser, UserProfile} from "../types/types";


export const saveCourses = async (courses: Course[]): Promise<void> => {
    const client = await pool.connect();

    try {
        const query = `
            INSERT INTO courses (id, name)
            VALUES ($1, $2)
            ON CONFLICT (id) 
            DO UPDATE SET name = EXCLUDED.name;
        `;

        for (const course of courses) {
            await client.query(query, [
                course.id,
                course.name
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
                DO UPDATE SET rating = EXCLUDED.rating, comment = EXCLUDED.comment, edited = true;
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

export const saveVerifiedUser = async (verifiedUser: VerifiedUser[]): Promise<void> => {
    const client = await pool.connect();
    try {

        const valuesStr = verifiedUser.map((_, i) => `($${i * 2 + 1}, $${i * 2 + 2})`).join(", ");
        const params = verifiedUser.flatMap(v => [v.course_id, v.user_id]);

        const query = `
            INSERT INTO verified_users (course_id, user_id)
            VALUES ${valuesStr}
            ON CONFLICT DO NOTHING;
        `;

        await client.query(query,params);

        console.log(`Verified User saved`);
    } finally {
        client.release();
    }
};

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

export const saveUserProfile = async (profile: UserProfile): Promise<void> => {
    const client = await pool.connect();
    try {
        await client.query(
            `
      INSERT INTO users (firebase_uid, name, email, profile_picture)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (firebase_uid) DO NOTHING;
    `,
            [profile.firebase_uid, profile.name, profile.email, profile.profile_picture || null]
        );
        console.log(`User profile saved`);
    } finally {
        client.release();
    }
};

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


