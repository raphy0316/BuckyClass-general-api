import { pool } from "@/app/config/db";
import { Review } from "@/app/types/types";

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
