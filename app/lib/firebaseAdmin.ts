import admin from "firebase-admin";
import serviceAccount from "../../serviceAccountKey.json";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    databaseURL: "https://grow-madison-default-rtdb.firebaseio.com/",
  });
}

export const db = admin.database();
export { admin };