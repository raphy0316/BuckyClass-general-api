import { isNewUser } from "@/app/services/postgreService";

export async function POST(req: Request) {
  const { firebase_uid } = await req.json();

  if (!firebase_uid) {
    return Response.json({ error: "Missing firebase_uid" }, { status: 400 });
  }

  const is_new = await isNewUser(firebase_uid);

  if (is_new === null) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  return Response.json({
    is_new_user: is_new,
  }, { status: 200 });
}
