import { ENV } from "@/app/config/env";
import { MadgradesGradeResponse } from "@/app/types/madgradesTypes";
import { Course, Grade, SectionGrade } from "@/app/types/types";
import { parseGrades } from "@/app/services/madgradeService/parseGrades";
import { delay } from "@/app/utils/delay";
import axiosInstance from "@/app/lib/axiosInstance";

export async function fetchGrades(courses: Course[]): Promise<{ grades: Grade[]; sectionGrades: SectionGrade[] }> {
    const grades: Grade[] = [];
    const sectionGrades: SectionGrade[] = [];

    for (const course of courses) {
        try{
            await delay(300);
            const url = `${ENV.MADGRADES_API_BASE_URL}/courses/${course.id}/grades`;

            const { data }: { data: MadgradesGradeResponse } = await axiosInstance.get(url, {
                headers: { Authorization: `Token token=${ENV.API_TOKEN}` }
            });

            const { grade, sectionGrades: sections } = parseGrades(data);

            grades.push(grade);
            sectionGrades.push(...sections);
        } catch(error){
            console.log("Error:", error)
        }
        
    }

    return { grades, sectionGrades };
}

