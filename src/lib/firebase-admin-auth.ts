import { initializeApp, getApps, getApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

// This project deploys to Netlify, not Firebase App Hosting, so there is no
// ambient Google Application Default Credentials for the Admin SDK to use.
// Verifying an ID token doesn't need one, though - it's checked against
// Google's public signing keys over HTTPS using just the project ID, no
// service-account secret required. This helper is intentionally scoped to
// that one operation; it must never be used for privileged Firestore
// writes, since those *do* need real credentials this app doesn't have.
const FIREBASE_PROJECT_ID = 'gymapp-3f326';

function getAdminApp() {
  return getApps().length ? getApp() : initializeApp({ projectId: FIREBASE_PROJECT_ID });
}

export async function verifyIdTokenFromHeader(authorizationHeader: string | null): Promise<string> {
  if (!authorizationHeader?.startsWith('Bearer ')) {
    throw new Error('Missing or malformed Authorization header.');
  }
  const idToken = authorizationHeader.slice('Bearer '.length);
  const decoded = await getAuth(getAdminApp()).verifyIdToken(idToken);
  return decoded.uid;
}
