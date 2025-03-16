import {fetchCourses, fetchGrade} from "@/app/services/madgradesService";
import {saveCourses, saveGrades} from "@/app/services/postgreService";

export async function POST(request : Request){
    try {
        const courses = await fetchCourses();

        if (!courses || courses.length === 0) {
            return Response.json(
                { error: "No courses found from MadGrades API" },
                { status: 404}
            );
        }

        await saveCourses(courses);

        const gradePromises = courses.map(async (course) => {
            try {
                const gradeData = await fetchGrade(course.id);
                if (gradeData) {
                    await saveGrades(gradeData);
                }
            } catch (error) {
                console.error(`Failed to fetch/save grades for course ${course.id}:`, error);
            }
        });

        await Promise.all(gradePromises);
        console.log("Grades updated successfully");
        return Response.json(
            { message: "Courses and grades updated successfully" },
            { status: 200}
        );
    } catch (error) {
        console.error("Failed to update courses and grades:", error);
        return Response.json(
            { error: "Failed to update courses and grades" },
            { status: 500 }
        );
    }
}