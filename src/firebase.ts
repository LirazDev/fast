//src/firebase.ts
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getMessaging, getToken } from "firebase/messaging";

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
export const messaging = getMessaging(app);

getToken(messaging, {
  vapidKey:
    "BMZ5USWHxZMBlE-xkV2Nd5oTnR_5f4FFc1T4TrYo5AxPRPt2CEb56a0r6fWZ-coPyLdk7h2sS77sj3XR_lvnzm8",
})
  .then((currentToken) => {
    if (currentToken) {
      console.log("Token:", currentToken);
      // Send the token to your server and update the database
    } else {
      console.log(
        "No registration token available. Request permission to generate one."
      );
    }
  })
  .catch((err) => {
    console.log("An error occurred while retrieving token. ", err);
  });

export const db = getFirestore(app);
