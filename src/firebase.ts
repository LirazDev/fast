import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA2jtz-T1tkG0qdko7iV--iWwaGUx7U02g",
  authDomain: "fitness-11981.firebaseapp.com",
  projectId: "fitness-11981",
  storageBucket: "fitness-11981.appspot.com",
  messagingSenderId: "872841654558",
  appId: "1:872841654558:web:082c2d89425612d936990f",
  measurementId: "G-M7JV2P4VRP",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
