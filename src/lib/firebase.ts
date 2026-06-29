import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { initializeFirestore, doc, getDocFromServer } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBGEDfUcw7GgIhR_nvBk_iRU6GQaWHGeaw",
  authDomain: "hazel-shift-7qmt3.firebaseapp.com",
  projectId: "hazel-shift-7qmt3",
  storageBucket: "hazel-shift-7qmt3.firebasestorage.app",
  messagingSenderId: "624282907093",
  appId: "1:624282907093:web:d494268454c8ee4c098d5c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Use custom firestore database ID with experimentalForceLongPolling to bypass iframe/proxy stream limitations
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true
}, "ai-studio-6c3ac8cf-a3bb-457a-ab4f-43935c359c15");

const googleProvider = new GoogleAuthProvider();

// Validate Connection
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firebase Firestore connected successfully.");
  } catch (error) {
    if (error instanceof Error && error.message.includes('offline')) {
      console.error("Please check your Firebase configuration or network status.");
    } else {
      console.log("Firebase connected. Verification complete:", error);
    }
  }
}
testConnection();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export { app, auth, db, googleProvider };
