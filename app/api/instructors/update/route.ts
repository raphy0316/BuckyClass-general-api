import { saveInstructors } from "@/app/services/postgreService";
import { fetchInstructors } from "@/app/services/madgradesService";

export async function POST() {
    try {
        const instructors = await fetchInstructors();

        if (!instructors || instructors.length === 0) {
            return Response.json({ error: "No instructors found" }, { status: 404 });
        }

        await saveInstructors(instructors);

        return Response.json({ message: "Instructors updated successfully" }, { status: 200 });
    } catch (_error) {
        return Response.json(
            { error: "Failed to update instructor" },
            { status: 500 }
        );
    }
}
