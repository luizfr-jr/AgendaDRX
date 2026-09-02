import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDEDdz8EmNJ9n59S0OPzu_KrqAd4IIOLdo",
  authDomain: "agendadrx-b24d5.firebaseapp.com",
  projectId: "agendadrx-b24d5",
  storageBucket: "agendadrx-b24d5.firebasestorage.app",
  messagingSenderId: "667281967481",
  appId: "1:667281967481:web:0366f8f2d1be85c06087a8",
  measurementId: "G-019S89V9ST"
};

// Inicializa o Firebase garantindo que não seja recriado no Next.js (SSR / Hot Reload)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);
