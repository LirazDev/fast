/* eslint-disable max-len */
/* eslint-disable indent */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-restricted-globals */
/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-unused-vars */

const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

exports.sendTimerNotification = functions.firestore
  .document("users/{userId}/timers/{timerId}")
  .onWrite(async (change, context) => {
    // Mark the function as async
    // Get the user who initiated the change
    const userId = context.params.userId;
    const timer = change.after.data();

    // Notification content
    const payload = {
      notification: {
        title: "Timer Update",
        body: `${userId} has ${
          timer.isActive ? "started" : "stopped"
        } the timer.`,
        // You can add more payload options like icon, click_action etc.
      },
    };

    try {
      // Get the list of device tokens.
      // You need to have a way to store and retrieve these tokens in your database
      const deviceTokens = await getDeviceTokens(); // Assuming getDeviceTokens is an async function

      if (deviceTokens.length > 0) {
        const response = await admin
          .messaging()
          .sendToDevice(deviceTokens, payload);
        console.log("Successfully sent message:", response);
      } else {
        console.log("No device tokens available.");
      }
    } catch (error) {
      console.log("Error sending message:", error);
    }
  });
