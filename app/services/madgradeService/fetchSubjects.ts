import { delay } from "@/app/utils/delay";
import { ENV } from "@/app/config/env";
import { Subject } from "@/app/types/types";
import axiosInstance from "@/app/lib/axiosInstance";

interface MadgradesSubjectResponse {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    nextPageUrl?: string;
    results: {
        code: string;
        name: string;
        abbreviation: string;
        coursesUrl: string;
    }[];
}

export async function fetchSubjects(): Promise<Subject[]> {
    const subjects: Subject[] = [];
    let url: string | null = `${ENV.MADGRADES_API_BASE_URL}/subjects`;

    while (url) {
        try{
            
            const { data }: { data: MadgradesSubjectResponse } = await axiosInstance.get(url, {
                headers: { Authorization: `Token token=${ENV.API_TOKEN}` }
            });

            const pageSubjects: Subject[] = data.results.map((subject) => ({
                code: subject.code,
                name: subject.name,
                abbreviation: subject.abbreviation
            }));

            subjects.push(...pageSubjects);

            url = data.nextPageUrl ?? null;
            await delay(150);
        } catch(error){
            console.log("Error: ", error)
            await delay(1000);
        }
    }

    return subjects;
}
