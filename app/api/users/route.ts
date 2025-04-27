import { saveUserProfile, updateUserProfile } from "@/app/services/postgreService";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { firebase_uid, name, email, profile_picture } = body;

        if (!firebase_uid || !name || !email) {
            return new Response(JSON.stringify({ error: "Missing required fields" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        await saveUserProfile({
            firebase_uid,
            name,
            email,
            profile_picture,
        });

        return new Response(JSON.stringify({ success: true }), {
            status: 201,
            headers: { "Content-Type": "application/json" },
        });
    } catch (err) {
        console.error("Error saving user profile:", err);
        return new Response(JSON.stringify({ error: "Internal server error" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}

export async function PATCH(request: Request) {
    try {
        const body = await request.json();
        const { firebase_uid, name, profile_picture } = body;

        if (!firebase_uid) {
            return new Response(JSON.stringify({ error: "Missing firebase_uid" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        await updateUserProfile({
            firebase_uid,
            name,
            profile_picture,
        });

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (err) {
        console.error("Error updating user profile:", err);
        return new Response(JSON.stringify({ error: "Internal server error" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}


