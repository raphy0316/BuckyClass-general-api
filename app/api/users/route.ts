import { saveVerifiedUser } from "@/app/services/postgreService";


export async function POST(request : Request){
    try{
        const data = await request.json();

        await saveVerifiedUser(data);

        return Response.json(
            { message: "Verified User saved successfully" },
            { status: 201}
        );
    } catch (error) {
        console.error("Error saving review:", error);
        return Response.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

