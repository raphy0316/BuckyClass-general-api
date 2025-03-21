import { updateLikeReview } from "@/app/services/postgreService";

export async function POST(request : Request){
    try{
        const { course_id, user_id, cancel } = await request.json();


        await updateLikeReview(course_id, user_id, cancel);

        return Response.json(
            { message: "Like updated successfully" },
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

