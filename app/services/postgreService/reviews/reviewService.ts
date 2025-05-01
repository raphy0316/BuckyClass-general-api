import { pool } from "@/app/config/db";
import { Review } from "@/app/types/types";

export async function updateLikeReview(course_id: string, review_user_id: string, liked_by_user_id: string) {
    const client = await pool.connect();
    try {
        const existing = await client.query(
        `SELECT 1 FROM review_likes WHERE course_id = $1 AND review_user_id = $2 AND liked_by_user_id = $3`,
        [course_id, review_user_id, liked_by_user_id]);
        
        if ((existing.rowCount ?? 0) > 0) {
        await client.query(`
            DELETE FROM review_likes
            WHERE course_id = $1 AND review_user_id = $2 AND liked_by_user_id = $3`, 
            [course_id, review_user_id, liked_by_user_id]);
  
        await client.query(`
            UPDATE reviews
            SET like_count = like_count - 1
            WHERE course_id = $1 AND user_id = $2`, [course_id, review_user_id]);
  
        return "unliked";
    } else {
        await client.query(`
            INSERT INTO review_likes (course_id, review_user_id, liked_by_user_id)
            VALUES ($1, $2, $3) `, [course_id, review_user_id, liked_by_user_id]);
  
        await client.query(`
            UPDATE reviews
            SET like_count = like_count + 1
            WHERE course_id = $1 AND user_id = $2`, [course_id, review_user_id]);
  
        return "liked";
    }
    } finally {
      client.release();
    }
  }
  

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
