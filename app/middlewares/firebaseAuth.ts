import { auth } from "@/lib/firebase-admin";
import { NextRequest, NextResponse } from "next/server";

export async function verifyFirebaseAuth(request: NextRequest) {
    const token = request.headers.get("authorization")?.split("Bearer ")[1];
    if (!token) return null;
    try {
        const decoded = await auth.verifyIdToken(token);
        return decoded;
    } catch (err) {
        return null;
    }
}
