import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/app/lib/verifyAdmin";
import { fetchSubjects } from "@/app/services/madgradeService/fetchSubjects";
import { fetchInstructors } from "@/app/services/madgradeService/fetchInstructors"
import { fetchCourseOfferings } from "@/app/services/madgradeService/fetchCourseOfferings"
import { fetchSections } from "@/app/services/madgradeService/fetchSections"
import { fetchGrades } from "@/app/services/madgradeService/fetchGrades"
import { saveSubjects, saveInstructors, saveCourses, saveGrades, saveSections, clearCourseDataInDB, saveCourseOfferings } from "@/app/services/postgreService/courses/courseService";
import { verifyFirebaseAuth } from "@/app/middlewares/firebaseAuth";
import { fetchCourses } from "@/app/services/madgradeService/fetchCourses";

export async function POST(request: NextRequest) {
    try {
        const user = await verifyFirebaseAuth(request);
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const adminCheck = await verifyAdmin(user.uid);
        if (!adminCheck.ok) {
            return adminCheck.response;
        }

        await clearCourseDataInDB();
        console.log("Starting Madgrades Data Update...");

        const instructors = await fetchInstructors();
        await saveInstructors(instructors);
        console.log("Instructors updated.");
        instructors.length = 0;

        const subjects = await fetchSubjects();
        await saveSubjects(subjects);
        console.log("Subjects updated.");
        subjects.length = 0;

        const { courses, courseSubjects } = await fetchCourses();
        await saveCourses(courses, courseSubjects);
        console.log("Courses updated.");
        courseSubjects.length = 0;
        
        const { courseOfferings } = await fetchCourseOfferings(courses);
        await saveCourseOfferings(courseOfferings);
        console.log("CourseOfferings updated.");

        const { sections, instructorSections } = await fetchSections(courseOfferings);
        await saveSections(sections, instructorSections);
        console.log("Sections updated.");
        courseOfferings.length = 0;
        sections.length = 0;
        instructorSections.length = 0;

        const { grades, sectionGrades } = await fetchGrades(courses);
        await saveGrades(grades, sectionGrades);
        console.log("Grades updated.");
        courses.length = 0;
        sectionGrades.length = 0;
        grades.length = 0;
        

        console.log("Update Complete.");
        return NextResponse.json({ message: "Madgrades data update complete!" }, { status: 200 });

    } catch (error) {
        console.error("Error updating Madgrades data:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

