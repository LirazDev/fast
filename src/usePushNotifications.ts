// usePushNotifications.ts
import { useEffect } from "react";
import { getToken, onMessage } from "firebase/messaging";
import { messaging } from "./firebase"; // adjust the path based on your project structure

export const usePushNotifications = () => {
  useEffect(() => {
    const requestPermissionAndGetToken = async () => {
      try {
        const currentToken = await getToken(messaging, {
          vapidKey:
            "BMZ5USWHxZMBlE-xkV2Nd5oTnR_5f4FFc1T4TrYo5AxPRPt2CEb56a0r6fWZ-coPyLdk7h2sS77sj3XR_lvnzm8",
        });
        if (currentToken) {
          console.log("FCM Token:", currentToken);
          // Optionally send the token to your backend if needed
        } else {
          console.log(
            "No registration token available. Request permission to generate one."
          );
        }
      } catch (error) {
        console.error("An error occurred while retrieving token. ", error);
      }
    };

    requestPermissionAndGetToken();

    const unsubscribeOnMessage = onMessage(messaging, (payload) => {
      console.log("Message received. ", payload);
      // Handle foreground message
    });

    return () => {
      unsubscribeOnMessage();
    };
  }, []);
};
