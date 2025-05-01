import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/app/lib/verifyAdmin";
//import { fetchSubjects } from "@/app/services/madgradeService/fetchSubjects";
//import { fetchInstructors } from "@/app/services/madgradeService/fetchInstructors"
//import { fetchCourseOfferings } from "@/app/services/madgradeService/fetchCourseOfferings"
import { fetchSections } from "@/app/services/madgradeService/fetchSections"
import { fetchGrades } from "@/app/services/madgradeService/fetchGrades"
import { /*saveSubjects, saveInstructors, saveCourses,*/ saveGrades, saveSections, /*clearCourseDataInDB, saveCourseOfferings, saveSectionGrades */ } from "@/app/services/postgreService/courses/courseService";
import { verifyFirebaseAuth } from "@/app/middlewares/firebaseAuth";
//import { fetchCourses } from "@/app/services/madgradeService/fetchCourses";

import { CourseOffering, Course } from "@/app/types/types";
import { pool } from "@/app/config/db";
async function getRecentCourseOfferings(): Promise<CourseOffering[]> {
    const client = await pool.connect();
    try {
        const query = `
            SELECT id, course_id, semester
            FROM "courseOffering"
            WHERE CAST(SUBSTRING(semester FROM '\\d{4}') AS INTEGER) >= EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER - 5
        `;
        const result = await client.query(query);
        return result.rows;
    } finally {
        client.release();
    }
}
async function getAllCourses(): Promise<Course[]> {
    const client = await pool.connect();
    try {
        const query = `
            SELECT id, name, number
            FROM courses
        `;
        const result = await client.query(query);
        return result.rows;
    } finally {
        client.release();
    }
}


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

        //await clearCourseDataInDB();
        //console.log("Starting Madgrades Data Update...");
        /*
        {
            const instructors = await fetchInstructors();
            console.log("Instructors fetched.");
            await saveInstructors(instructors);
            console.log("Instructors updated.");
        }
        
        {
            const subjects = await fetchSubjects();
            console.log("Subjects updated.");
            await saveSubjects(subjects);
            console.log("Subjects updated.");
        }
        */
        {
            //const { courses, courseSubjects } = await fetchCourses();
            //console.log("Courses fetched.");
            //await saveCourses(courses, courseSubjects);
            //console.log("Courses updated.");
            
            {
                //const { courseOfferings } = await fetchCourseOfferings(courses);
                const courseOfferings = await getRecentCourseOfferings();
                console.log("CourseOfferings fetched.");
                //await saveCourseOfferings(courseOfferings);
                console.log("CourseOfferings updated.");

                const { sections, instructorSections } = await fetchSections(courseOfferings);
                console.log("Sections fetched.");
                await saveSections(sections, instructorSections);
                console.log("Sections updated.");
            }
            
            const courses  = await getAllCourses();
            const { grades/*, sectionGrades*/ } = await fetchGrades(courses);
            console.log("Grades fetched.");
            await saveGrades(grades);
            console.log("Grades Updated.");
            // await saveSectionGrades(sectionGrades);
            // console.log("Grades updated.");
        }
        
        console.log("Update Complete.");
        return NextResponse.json({ message: "Madgrades data update complete!" }, { status: 200 });

    } catch (error) {
        console.error("Error updating Madgrades data:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

