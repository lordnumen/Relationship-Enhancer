// Firebase config for Firestore real-time sync
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDYyGpuLq1MiEar7ck5EebnCozHWlmmBM0",
  authDomain: "loveenhancer-sujaswi.firebaseapp.com",
  projectId: "loveenhancer-sujaswi",
  storageBucket: "loveenhancer-sujaswi.firebasestorage.app",
  messagingSenderId: "459865243321",
  appId: "1:459865243321:web:58273d05c4ed960c5c2568",
  measurementId: "G-2XH7X7S7D4"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app); 