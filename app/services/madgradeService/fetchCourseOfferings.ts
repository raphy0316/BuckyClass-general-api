import { ENV } from "@/app/config/env";
import { Course, CourseOffering } from "@/app/types/types";
import { convertTermCode } from "./convertTermCode";
import axiosInstance from "@/app/lib/axiosInstance";
import { delay } from "@/app/utils/delay";
import { chunk } from "lodash";

interface MadgradesCourseDetailResponse {
    uuid: string;
    number: number;
    courseOfferings: {
        uuid: string;
        courseUuid: string;
        termCode: number;
    }[];
}

export async function fetchCourseOfferings(courses: Course[]): Promise<{ courseOfferings: CourseOffering[] }> {
    const courseOfferings: CourseOffering[] = [];

    const courseChunks = chunk(courses, 10);

    for (const group of courseChunks) {
        const results = await Promise.all(
            group.map(async (course: Course) => {
                try {
                    const url = `${ENV.MADGRADES_API_BASE_URL}/courses/${course.id}`;
                    const { data }: { data: MadgradesCourseDetailResponse } = await axiosInstance.get(url, {
                        headers: { Authorization: `Token token=${ENV.API_TOKEN}` },
                    });

                    const offerings: CourseOffering[] = data.courseOfferings.map((offering) => ({
                        id: offering.uuid,
                        course_id: offering.courseUuid,
                        semester: convertTermCode(offering.termCode),
                    }));

                    return offerings;
                } catch (error) {
                    console.error(`Error fetching course ${course.id}:`, error);
                    return null;
                }
            })
        );

        for (const offeringList of results) {
            if (offeringList) {
                courseOfferings.push(...offeringList);
            }
        }

        await delay(1000);
    }

    return { courseOfferings };
}
