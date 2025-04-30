import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/app/config/db";
import { verifyFirebaseAuth } from "@/app/middlewares/firebaseAuth";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ section_id: string }> }
) {
  const client = await pool.connect();

  try {
    const user = await verifyFirebaseAuth(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { section_id } = await params;
    if (!section_id) {
      return NextResponse.json({ error: "Missing section_id" }, { status: 400 });
    }

    await client.query(
      `DELETE FROM "EnrolledSections" WHERE user_id = $1 AND section_id = $2`,
      [user.uid, section_id]
    );

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("Unenrollment failed:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  } finally {
    client.release();
  }
}
