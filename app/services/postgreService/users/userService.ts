import { pool } from "@/app/config/db";
import { VerifiedUser, UserProfile } from "@/app/types/types";

export const getUserProfile = async (id: string): Promise<UserProfile | null> => {
    const client = await pool.connect();
    try {
        const result = await client.query(
            `
            SELECT
                u.id,
                u.name,
                u.email,
                u.profile_picture,
                ARRAY_AGG(um.major) AS majors
            FROM users u
            LEFT JOIN "UsersMajors" um
                ON u.id = um.user_id
            WHERE u.id = $1
            GROUP BY u.id;
            `,
            [id]
        );

        if (result.rows.length === 0) {
            return null;
        }

        const user: UserProfile = {
            id: result.rows[0].id,
            name: result.rows[0].name,
            email: result.rows[0].email,
            majors: result.rows[0].majors,
            profile_picture: result.rows[0].profile_picture
        };

        return user;
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
export const deleteUserProfile = async (id: string): Promise<void> => {
    const client = await pool.connect();
    try {
        await client.query(`DELETE FROM users WHERE id = $1`, [id]);
        console.log(`User [${id}] deleted from users table`);
    } finally {
        client.release();
    }
};

export const saveUserProfile = async (profile: UserProfile): Promise<void> => {
    const client = await pool.connect();
    try {
        await client.query(
          `INSERT INTO users (id, name, email, profile_picture) VALUES ($1, $2, $3, $4)`,
          [profile.id, profile.name, profile.email, profile.profile_picture || null]
        );

        for (const major of profile.majors) {
          await client.query(
            `INSERT INTO "UsersMajors" (user_id, major) VALUES ($1, $2)`,
            [profile.id, major]
          );
        }
        console.log(`User profile saved`);
    } finally {
        client.release();
    }
};

export const isNewUser = async (id: string): Promise<boolean | null> => {
    const client = await pool.connect();

    try {
        const result = await client.query(
            `SELECT is_new_user FROM users WHERE id = $1`,
            [id]
        );

        if (result.rowCount === 0) {
            return null;
        }

        return result.rows[0].is_new_user;
    }
    finally {
        client.release();
    }
}

export const updateUserProfile = async (profile: Partial<UserProfile> & { id: string; majors?: string[] }): Promise<void> => {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        await client.query(
            `
            UPDATE users
            SET
                name = COALESCE($2, name),
                profile_picture = COALESCE($3, profile_picture)
            WHERE id = $1;
            `,
            [profile.id, profile.name || null, profile.profile_picture || null]
        );

        if (profile.majors) {
            const { rows: existingRows } = await client.query(
                `
                SELECT major
                FROM "UsersMajors"
                WHERE user_id = $1;
                `,
                [profile.id]
            );

            const existingMajors = existingRows.map(row => row.major);

            const majorsToAdd = profile.majors.filter(m => !existingMajors.includes(m));
            const majorsToRemove = existingMajors.filter(m => !profile.majors!.includes(m));

            for (const major of majorsToAdd) {
                await client.query(
                    `
                    INSERT INTO "UsersMajors" (user_id, major)
                    VALUES ($1, $2);
                    `,
                    [profile.id, major]
                );
            }

            for (const major of majorsToRemove) {
                await client.query(
                    `
                    DELETE FROM "UsersMajors"
                    WHERE user_id = $1 AND major = $2;
                    `,
                    [profile.id, major]
                );
            }
        }

        await client.query("COMMIT");
        console.log(`User profile updated (with majors diff applied)`);
    } catch (error) {
        await client.query("ROLLBACK");
        console.error("Failed to update user profile:", error);
        throw error;
    } finally {
        client.release();
    }
};

export const markUserAsOld = async (id: string): Promise<void> => {
    const client = await pool.connect();
    try {
        await client.query(
            `UPDATE users SET is_new_user = false WHERE id = $1 AND is_new_user = true`, 
            [id]);
    } finally {
      client.release();
    }
};
  