import admin from 'firebase-admin';
import { readFile } from 'fs/promises';


const serviceAccount = JSON.parse(
  await readFile(new URL('../../serviceAccountKey.json', import.meta.url), 'utf-8')
);

if(!admin.apps.length){
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log(`Server is running on port ${process.env.PORT || 3000}`);
}

export const auth = admin.auth();
export const storage = admin.storage();
export const messaging = admin.messaging();
export default admin;
