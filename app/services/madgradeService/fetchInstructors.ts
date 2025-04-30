import { ENV } from "@/app/config/env";
import { Instructor } from "@/app/types/types";
import  axiosInstance from "@/app/lib/axiosInstance";
import { delay } from "@/app/utils/delay";

interface MadgradesInstructor {
    id: number;
    name: string;
}

interface MadgradesInstructorResponse {
    results: MadgradesInstructor[];
    nextPageUrl: string | null;
}

export async function fetchInstructors(): Promise<Instructor[]> {
    const instructors: Instructor[] = [];
    let url: string | null = `${ENV.MADGRADES_API_BASE_URL}/instructors`;
    
    while (url) {
        try{
            
            const { data }: { data: MadgradesInstructorResponse } = await axiosInstance.get(url, {
                headers: { Authorization: `Token token=${ENV.API_TOKEN}` }
            });

            const pageInstructors: Instructor[] = data.results.map((instructor) => ({
                id: instructor.id,
                name: instructor.name
            }));

            instructors.push(...pageInstructors);

            url = data.nextPageUrl;
            await delay(150);
        } catch(error){
            console.log(error);
            delay(1000);
        }
        
    }

    return instructors;
        
}
