/* eslint-disable no-restricted-globals */
/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-unused-vars */

// Import and configure the Firebase SDK
importScripts(
  "https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js"
);

firebase.initializeApp({
  // Your Firebase config
  apiKey: "AIzaSyA2jtz-T1tkG0qdko7iV--iWwaGUx7U02g",
  authDomain: "fitness-11981.firebaseapp.com",
  projectId: "fitness-11981",
  storageBucket: "fitness-11981.appspot.com",
  messagingSenderId: "872841654558",
  appId: "1:872841654558:web:082c2d89425612d936990f",
  measurementId: "G-M7JV2P4VRP",
});

const messaging = firebase.messaging();

// If you need to perform some action on message received:
messaging.onBackgroundMessage((payload) => {
  console.log(
    "[firebase-messaging-sw.js] Received background message ",
    payload
  );
  // Customize notification here
  const notificationTitle = "Background Message Title";
  const notificationOptions = {
    body: "Background Message body.",
    icon: "/firebase-logo.png",
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
