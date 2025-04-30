import { getSectionsByCourseId } from "@/app/services/postgreService/courses/courseService";
import { verifyFirebaseAuth } from "@/app/middlewares/firebaseAuth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyFirebaseAuth(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: courseId } = await params;
    if (!courseId) {
      return NextResponse.json({ error: "Missing courseId" }, { status: 400 });
    }

    const sections = await getSectionsByCourseId(courseId);
    return NextResponse.json(sections, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch sections by courseId:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
