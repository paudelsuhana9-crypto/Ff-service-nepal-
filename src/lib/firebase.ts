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

export { app, auth, db, googleProvider };
