import dotenv from "dotenv";

dotenv.config();

export const ENV = {
    PORT: process.env.PORT || 3000,
    MADGRADES_API_BASE_URL: process.env.MADGRADES_API_BASE_URL || "",
    API_TOKEN: process.env.MADGRADES_API_TOKEN || "",
    DATABASE_URL : process.env.DATABASE_URL
};
