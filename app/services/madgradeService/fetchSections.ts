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

    for (const courseOffering of courseOfferings) {
        const match = courseOffering.semester.match(/\b(\d{4})\b/);
        const semesterYear = match ? parseInt(match[1]) : null;
        if (!semesterYear || semesterYear < currentYear - 2) continue;

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
            const results = await Promise.all(
                group.map(async (section): Promise<{ section: Section; instructors: InstructorSection[] } | null> => {
                    try {
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
                    } catch (error: unknown) {
                        if (axios.isAxiosError(error) && error.response?.status === 403) {
                            console.warn(`403 Forbidden - skipping section: ${section.uuid}`);
                            skippedSectionUuids.push(section.uuid);
                        } else {
                            console.warn(`Error fetching section ${section.uuid}:`, error);
                        }
                        return null;
                    }
                    
                })
            );

            for (const result of results) {
                if (result) {
                    sections.push(result.section);
                    instructorSections.push(...result.instructors);
                }
            }

            await delay(1500);
        }
    }

    console.log("=== Skipped courseOffering IDs due to 403 ===", skippedCourseOfferingIds);
    console.log("=== Skipped section UUIDs due to 403 ===", skippedSectionUuids);

    return { sections, instructorSections };
}

