import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyB1YQLpkBljnkH0GIJGua9ZHiS8T35MtG4",
    authDomain: "expenses-9d8a6.firebaseapp.com",
    projectId: "expenses-9d8a6",
    storageBucket: "expenses-9d8a6.firebasestorage.app",
    messagingSenderId: "478089430013",
    appId: "1:478089430013:web:4166c8f251ed76eae10f94",
    measurementId: "G-56YVT7LDKS"
  };
// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app; 