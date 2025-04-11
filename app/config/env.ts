import dotenv from "dotenv";

dotenv.config();

export const ENV = {
    PORT: process.env.PORT || 3000,
    MADGRADES_API_BASE_URL: process.env.MADGRADES_API_BASE_URL || "",
    API_TOKEN: process.env.MADGRADES_API_TOKEN || "",
    DATABASE_URL: process.env.POSTGRES_URL,

    // 🔥 Firebase Admin용 환경변수
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
    FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
    FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    FIREBASE_DATABASE_URL: process.env.FIREBASE_DATABASE_URL,
};
