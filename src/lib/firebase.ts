import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Allowed admin emails
export const ADMIN_EMAILS = ['fahadafrn07@gmail.com', 'fsrahat33@gmail.com'];

export const isUserAdmin = (user: User | null) => {
  if (!user || !user.email) return false;
  const userEmail = user.email.toLowerCase();
  return ADMIN_EMAILS.some(email => email.toLowerCase() === userEmail);
};

export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errorMsg = error instanceof Error ? error.message : String(error);
  const userId = auth.currentUser?.uid || 'no-user';
  const email = auth.currentUser?.email || 'no-email';
  
  console.error(`Firestore Error [${operationType}] at [${path || 'unknown'}]:`, errorMsg, `(User: ${email} / ${userId})`);
  
  throw new Error(`Firestore Error [${operationType}] at [${path || 'unknown'}]: ${errorMsg}`);
}

// testConnection();
