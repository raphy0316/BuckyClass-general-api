import axios, { AxiosResponse } from "axios";
import { Subject, MadgradesSubjectResponse } from "@/app/types/types"


export async function fetchSubjects(): Promise<Subject[]> {
    let subjects: Subject[] = [];
    let url: string | null = "https://api.madgrades.com/v1/subjects?page=1";

    while (url) {
        const response: AxiosResponse<MadgradesSubjectResponse> = await axios.get(url);
        const data = response.data;

        const pageSubjects: Subject[] = data.results.map((subject) => ({
            code: subject.code,
            name: subject.name,
            abbreviation: subject.abbreviation
        }));

        subjects = subjects.concat(pageSubjects);

        url = data.nextPageUrl ?? null;
    }

    return subjects;
}
