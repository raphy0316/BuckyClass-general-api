import { ENV } from "@/app/config/env";
import { MadgradesGradeResponse } from "@/app/types/madgradesTypes";
import { Course, Grade, SectionGrade } from "@/app/types/types";
import { parseGrades } from "@/app/services/madgradeService/parseGrades";
import { delay } from "@/app/utils/delay";
import axiosInstance from "@/app/lib/axiosInstance";
import { chunk } from "lodash";

export async function fetchGrades(courses: Course[]): Promise<{ grades: Grade[]; sectionGrades: SectionGrade[] }> {
  const grades: Grade[] = [];
  const sectionGrades: SectionGrade[] = [];

  const courseChunks = chunk(courses, 10);

  for (const group of courseChunks) {
    const results = await Promise.all(
      group.map(async (course: Course) => {
        try {
          const url = `${ENV.MADGRADES_API_BASE_URL}/courses/${course.id}/grades`;
          const { data }: { data: MadgradesGradeResponse } = await axiosInstance.get(url, {
            headers: { Authorization: `Token token=${ENV.API_TOKEN}` },
          });

          const { grade, sectionGrades: sections } = parseGrades(data);
          return { grade, sectionGrades: sections };
        } catch (error) {
          console.error(`Error fetching grades for ${course.id}:`, error);
          return null;
        }
      })
    );

    for (const result of results) {
      if (result) {
        grades.push(result.grade);
        sectionGrades.push(...result.sectionGrades);
      }
    }

    await delay(1000);
  }

  return { grades, sectionGrades };
}
