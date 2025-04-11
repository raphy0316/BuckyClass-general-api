import admin from "firebase-admin";
import { ENV } from "../config/env";

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: ENV.FIREBASE_PROJECT_ID,
            clientEmail: ENV.FIREBASE_CLIENT_EMAIL,
            privateKey: ENV.FIREBASE_PRIVATE_KEY,
        }),
        databaseURL: ENV.FIREBASE_DATABASE_URL,
    });
}

const db = admin.database();

export { admin, db };