import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// TODO: Replace this block with your actual config from Firebase!
const firebaseConfig = {
  apiKey: "AIzaSyDTw2bi4k-ymxas5FlHBT9BINFbDglIsrs",
  authDomain: "financial-dashboard-b4499.firebaseapp.com",
  projectId: "financial-dashboard-b4499",
  storageBucket: "financial-dashboard-b4499.firebasestorage.app",
  messagingSenderId: "562677693708",
  appId: "1:562677693708:web:3037cc54cd520ef1489d29",
  measurementId: "G-D0L509V3K2"
};


// Initialize Firebase services
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();