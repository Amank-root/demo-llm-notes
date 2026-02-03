import admin, { ServiceAccount } from 'firebase-admin';
// import { readFile } from 'fs/promises';/


// const serviceAccount = JSON.parse(
//   await readFile(new URL('../../serviceAccountKey.json', import.meta.url), 'utf-8')
// );
const serviceAccount = {
  "type": process.env.FIREBASE_ACCOUNT_TYPE,
  "project_id": process.env.FIREBASE_PROJECT_ID,
  "private_key_id": process.env.FIREBASE_PRIVATE_KEY_ID,
  "private_key": process.env.FIREBASE_PRIVATE_KEY,
  "client_email": process.env.FIREBASE_CLIENT_EMAIL,
  "client_id": process.env.FIREBASE_CLIENT_ID,
  "auth_uri": process.env.FIREBASE_AUTH_URI,
  "token_uri": process.env.FIREBASE_TOKEN_URI,
  "auth_provider_x509_cert_url": process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
  "client_x509_cert_url": process.env.FIREBASE_CLIENT_X509_CERT_URL,
  "universe_domain": process.env.FIREBASE_UNIVERSE_DOMAIN
}
// const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT!);

console.log(serviceAccount) 

if(!admin.apps.length){
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as ServiceAccount)
  });
  console.log(`Server is running on port ${process.env.PORT || 3000}`);
}

export const auth = admin.auth();
export const storage = admin.storage();
export const messaging = admin.messaging();
export default admin;
