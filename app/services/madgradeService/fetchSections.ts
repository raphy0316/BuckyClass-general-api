import { delay } from "@/app/utils/delay";
import { ENV } from "@/app/config/env";
import { Section, CourseOffering, InstructorSection } from "@/app/types/types";
import axiosInstance from "@/app/lib/axiosInstance";
import { chunk } from "lodash";
import axios from "axios";

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
    const skippedCourseOfferingIds: string[] = [];
    const skippedSectionUuids: string[] = [];

    const currentYear = new Date().getFullYear();
    let processedCount = 0;

    for (const courseOffering of courseOfferings) {
        //const match = courseOffering.semester.match(/\b(\d{4})\b/);
        //const semesterYear = match ? parseInt(match[1]) : null;
        //if (!semesterYear || semesterYear < currentYear - 1) continue;
        if (
            !["Spring 2025", "Fall 2024"].includes(courseOffering.semester)
        ) continue;

        let offeringDetail: MadgradesCourseOfferingDetailResponse | null = null;

        try {
            const url = `${ENV.MADGRADES_API_BASE_URL}/course_offerings/${courseOffering.id}`;
            const { data }: { data: MadgradesCourseOfferingDetailResponse } = await axiosInstance.get(url, {
                headers: { Authorization: `Token token=${ENV.API_TOKEN}` },
            });
            offeringDetail = data;
        } catch (error: unknown) {
            if (axios.isAxiosError(error) && error.response?.status === 403) {
                console.warn(`403 Forbidden - skipping courseOffering: ${courseOffering.id} (${courseOffering.semester})`);
                skippedCourseOfferingIds.push(courseOffering.id);
                continue;
            }
            console.warn(`Error fetching courseOffering ${courseOffering.id}:`, error);
            continue;
        }

        const sectionChunks = chunk(offeringDetail.sections, 5);
        for (const group of sectionChunks) {
            const results = await Promise.allSettled(
                group.map(async (section): Promise<{ section: Section; instructors: InstructorSection[] }> => {
                    const sectionUrl = `${ENV.MADGRADES_API_BASE_URL}/sections/${section.uuid}`;
                    const { data }: { data: MadgradesSectionResponse } = await axiosInstance.get(sectionUrl, {
                        headers: { Authorization: `Token token=${ENV.API_TOKEN}` },
                    });

                    const parsedSection: Section = {
                        id: data.uuid,
                        number: data.number,
                        sectionType: data.sectionType,
                        courseOffering_id: data.courseOfferingUuid,
                        start_Time: data.schedule.startTime,
                        end_Time: data.schedule.endTime,
                        days: data.schedule.days,
                    };

                    const parsedInstructors: InstructorSection[] = data.instructors.map((inst) => ({
                        section_id: data.uuid,
                        instructor_id: inst.id,
                    }));

                    return { section: parsedSection, instructors: parsedInstructors };
                })
            );

            for (const result of results) {
                if (result.status === "fulfilled") {
                    sections.push(result.value.section);
                    instructorSections.push(...result.value.instructors);
                } else {
                    const reason = result.reason;
                    if (axios.isAxiosError(reason)) {
                        if (reason.code === "ECONNABORTED") {
                            console.warn("Timeout fetching section");
                        } else if (reason.response?.status === 403) {
                            const match = reason.config?.url?.match(/\/sections\/(.+)$/);
                            const uuid = match?.[1] ?? "unknown";
                            console.warn(`403 Forbidden - skipping section: ${uuid}`);
                            skippedSectionUuids.push(uuid);
                        } else {
                            console.warn("Axios error fetching section:", reason.message);
                        }
                    } else {
                        console.warn("Unknown error fetching section:", reason);
                    }
                }
            }

            let lastLogged = 0;

            processedCount += group.length;
            if (processedCount - lastLogged >= 100) {
                console.log(`[${new Date().toISOString()}] Processed ${processedCount}`);
                lastLogged = processedCount;
            }

            await delay(1000); // 조절 가능
        }
    }

    console.log("=== Skipped courseOffering IDs due to 403 ===", skippedCourseOfferingIds);
    console.log("=== Skipped section UUIDs due to 403 ===", skippedSectionUuids);

    return { sections, instructorSections };
}
