import { delay } from "@/app/utils/delay";
import { ENV } from "@/app/config/env";
import { Course, CourseSubject } from "@/app/types/types";
import axiosInstance from "@/app/lib/axiosInstance";

interface MadgradesCourseResponse {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    nextPageUrl: string | null;
    results: {
        uuid: string;
        number: number;
        name: string;
        subjects: {
            abbreviation : string;
        }[];
    }[];
}

export async function fetchCourses(): Promise<{ courses: Course[]; courseSubjects: CourseSubject[] }> {
    const courses: Course[] = [];
    const courseSubjects: CourseSubject[] = [];

    let url: string | null = `${ENV.MADGRADES_API_BASE_URL}/courses`;

    while (url) {
        try{
            await delay(300);
            const { data }: { data: MadgradesCourseResponse } = await axiosInstance.get(url, {
                headers: { Authorization: `Token token=${ENV.API_TOKEN}` }
            });

            for (const course of data.results) {
                courses.push({
                    id: course.uuid,
                    name: course.name,
                    number: course.number
                });

                for (const subject of course.subjects) {
                    courseSubjects.push({
                        course_id: course.uuid,
                        subject_abbreviation: subject.abbreviation
                    });
                }
            }

            url = data.nextPageUrl;
        } catch( error ){
            console.log("Errror: ", error);
            continue;
        }
        
    }

    return { courses, courseSubjects };
}
