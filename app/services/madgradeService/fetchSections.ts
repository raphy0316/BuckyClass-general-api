import { delay } from "@/app/utils/delay";
import { ENV } from "@/app/config/env";
import { Section, CourseOffering, InstructorSection } from "@/app/types/types";
import axiosInstance from "@/app/lib/axiosInstance";

interface MadgradesSectionResponse {
    uuid: string;
    courseOfferingUuid: string;
    sectionType: string;
    number: number;
    schedule: {
        startTime: string | null;
        endTime: string | null;
        days: string | null;
    };
    room: {
        facilityCode: string | null;
        roomCode: string | null;
    };
    instructors: {
        id: number;
    }[];
}

export interface MadgradesCourseOfferingDetailResponse {
    sections: {
        uuid: string;
    }[];
}

export async function fetchSections(
    courseOfferings: CourseOffering[]
): Promise<{ sections: Section[]; instructorSections: InstructorSection[] }> {
    const sections: Section[] = [];
    const instructorSections: InstructorSection[] = [];

    const currentYear = new Date().getFullYear();

    for (const courseOffering of courseOfferings) {
        const match = courseOffering.semester.match(/\b(\d{4})\b/);
        const semesterYear = match ? parseInt(match[1]) : null;
        if (!semesterYear || semesterYear < currentYear - 4) continue;

        try {
            await delay(250);
            const url = `${ENV.MADGRADES_API_BASE_URL}/course_offerings/${courseOffering.id}`;
            const { data }: { data: MadgradesCourseOfferingDetailResponse } = await axiosInstance.get(url, {
                headers: { Authorization: `Token token=${ENV.API_TOKEN}` },
            });

            for (const section of data.sections) {
                try {
                    await delay(250);
                    const sectionUrl = `${ENV.MADGRADES_API_BASE_URL}/sections/${section.uuid}`;
                    const { data }: { data: MadgradesSectionResponse } = await axiosInstance.get(sectionUrl, {
                        headers: { Authorization: `Token token=${ENV.API_TOKEN}` },
                    });

                    sections.push({
                        id: data.uuid,
                        number: data.number,
                        sectionType: data.sectionType,
                        courseOffering_id: data.courseOfferingUuid,
                        start_Time: data.schedule.startTime,
                        end_Time: data.schedule.endTime,
                        days: data.schedule.days,
                    });

                    for (const instructor of data.instructors) {
                        instructorSections.push({
                            section_id: data.uuid,
                            instructor_id: instructor.id,
                        });
                    }
                } catch (error) {
                    console.log("Error fetching section:", error);
                }
            }
        } catch (error) {
            console.log("Error fetching course offering:", error);
        }
    }

    return { sections, instructorSections };
}
