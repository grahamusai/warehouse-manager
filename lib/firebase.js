// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: "warehouse-75d3e.appspot.com",
  messagingSenderId: "176917274539",
  appId: "1:176917274539:web:b0fcf8ed5d52b685f6fcee",
  measurementId: "G-GN5W6ZR0FT"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics only in browser environment
let analytics;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

// Initialize Auth and Firestore (these work in both environments)
const auth = getAuth(app);
const db = getFirestore(app);

export { app, analytics, auth, db };
export default app;