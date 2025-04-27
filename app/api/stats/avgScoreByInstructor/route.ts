import { getAverageScoreByInstructor } from "@/app/services/postgreService";

export async function GET() {
    try {
        const result = await getAverageScoreByInstructor();
        return Response.json(result, { status: 200 });
    } catch (error) {
        console.error("Failed to average score by instructor", error);
        return Response.json({ error: "Failed to fetch average score by instructor" }, { status: 500 });
    }
}