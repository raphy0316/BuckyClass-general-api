import { ENV } from "@/app/config/env";
import { Course, CourseOffering } from "@/app/types/types";
import { convertTermCode } from "./convertTermCode";
import axiosInstance from "@/app/lib/axiosInstance";
import { delay } from "@/app/utils/delay";

interface MadgradesCourseDetailResponse {
    uuid: string;
    number: number;
    courseOfferings: {
        uuid: string;
        courseUuid: string;
        termCode: number;
    }[];
}


export async function fetchCourseOfferings(courses : Course[]): Promise<{ courseOfferings: CourseOffering[] }> {
    let url: string | null;
    const courseOfferings: CourseOffering[] = [];
    for (const course of courses) {
        try{
            await delay(300);
            url = `${ENV.MADGRADES_API_BASE_URL}/courses/${course.id}`;

            const { data }: { data: MadgradesCourseDetailResponse } = await axiosInstance.get(url, {
                headers: { Authorization: `Token token=${ENV.API_TOKEN}` }
            });
            for (const courseOffering of data.courseOfferings) {
                courseOfferings.push({
                    id: courseOffering.uuid,
                    course_id: courseOffering.courseUuid,
                    semester: convertTermCode(courseOffering.termCode)
                });
            }   
        } catch( error ){
            console.log("Errror: ", error);
            continue;
        }
                             
    }


    return { courseOfferings };
}
