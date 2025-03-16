import {getReview, saveReview} from "@/app/services/postgreService";
import { Review } from "@/app/types/types";

export async function POST(request : Request){
    try{
        const { course_id, user_id, rating, comment } = await request.json();

        const review: Review = {
            course_id: course_id,
            user_id: user_id,
            rating: rating,
            comment: comment
        }

        await saveReview(review);

        return Response.json(
            { message: "Review saved successfully", review },
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

