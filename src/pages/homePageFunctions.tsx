//homePageFunctions.tsx

import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  Firestore,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { collection, onSnapshot, query } from "firebase/firestore";

type User = {
  id: string;
  name: string;
  timer: {
    isRunning: boolean;
    startTime: { toDate: () => Date };
    elapsedTime: number;
  };
  goal: number;
};

/**
 * Fetch user data from the database and update the state accordingly.
 */
export async function fetchUserData(
  userId: string | null,
  db: Firestore, // Define a proper type for your Firebase db instance
  setUserName: (name: string) => void,
  setGoal: (goal: number) => void,
  setIsRunning: (isRunning: boolean) => void,
  setTimer: (timer: number) => void,
  setEndTime: (endTime: Date | null) => void,
  setLoading: (loading: boolean) => void,
  navigate: (path: string) => void
) {
  setLoading(true);

  if (userId) {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const userData = userSnap.data() as User;
      setUserName(userData.name);
      setGoal(userData.goal * 3600); // Convert goal from hours to seconds

      if (userData.timer && userData.timer.isRunning) {
        setIsRunning(true);
        const startTime = userData.timer.startTime.toDate();
        const currentTime = new Date();
        const elapsedTime = Math.floor(
          (currentTime.getTime() - startTime.getTime()) / 1000
        );
        setEndTime(startTime);
        setTimer(elapsedTime);
      } else {
        setIsRunning(false);
        setTimer(0);
      }
      setLoading(false);
    } else {
      localStorage.removeItem("userId");
      navigate("/login");
    }
  } else {
    navigate("/login");
  }
}

/**
 * Start the timer and return the interval ID.
 */
export function startTimer(
  isRunning: boolean,
  setTimer: React.Dispatch<React.SetStateAction<number>>
): NodeJS.Timeout | null {
  if (!isRunning) {
    return null;
  }

  const id = setInterval(() => {
    setTimer((prevTime) => prevTime + 1);
  }, 1000);
  return id;
}

/**
 * Handle updating the timer based on the desired start time.
 */
export async function handleUpdateTime(
  userId: string | null,
  db: Firestore, // Define a proper type for your Firebase db instance
  desiredStartTime: Date,
  isRunning: boolean,
  intervalId: NodeJS.Timeout | null,
  setTimer: (timer: number) => void,
  setSnackbarMessage: (message: string) => void,
  setSnackbarOpen: (open: boolean) => void,
  setButtonLoading: (loading: boolean) => void,
  startTimer: () => void
) {
  if (!isRunning) {
    setSnackbarMessage("Timer is not running. Start the timer to update time.");
    setSnackbarOpen(true);
    return;
  }

  setButtonLoading(true);
  const userRef = doc(db, "users", userId ?? "defaultUserId");
  await updateDoc(userRef, {
    "timer.startTime": serverTimestamp(),
  });

  // Calculate the elapsed time since the desired start time
  const currentTime = new Date();
  const elapsedTime = Math.floor(
    (currentTime.getTime() - desiredStartTime.getTime()) / 1000
  );
  if (intervalId) {
    clearInterval(intervalId);
  }

  setTimer(elapsedTime); // Update the timer
  startTimer(); // Restart the timer

  setSnackbarMessage("Start time updated successfully!");
  setSnackbarOpen(true);
  setButtonLoading(false);
}

/**
 * Calculate the ending time of the timer session.
 */
export function calculateEndingTime(
  inputDate: Date,
  hoursToAdd: number,
  desiredStartTime?: Date
): string {
  const currentTime = new Date();
  const baseTime =
    desiredStartTime && inputDate && desiredStartTime < inputDate
      ? desiredStartTime
      : inputDate || currentTime;
  const newTime = new Date(baseTime.getTime() + hoursToAdd * 3600 * 1000);

  if (newTime < currentTime) {
    return "Session Ended 🥳";
  }

  const endingStr =
    newTime.getDate() === currentTime.getDate()
      ? "Ending Today"
      : "Ending Tomorrow";
  const hours = newTime.getHours().toString().padStart(2, "0");
  const minutes = newTime.getMinutes().toString().padStart(2, "0");

  return `${endingStr} at ${hours}:${minutes}`;
}

export function useFetchOtherUsers(userId: string | null, db: Firestore) {
  const [otherUsers, setOtherUsers] = useState<User[]>([]);

  useEffect(() => {
    if (!userId) return;

    let previousUsers: User[] = [];

    const unsubscribe = onSnapshot(
      query(collection(db, "users")),
      (querySnapshot) => {
        const usersData: User[] = [];
        querySnapshot.forEach((docSnapshot) => {
          const data = docSnapshot.data() as Omit<User, "id">;
          const docId = docSnapshot.id;

          if (docId !== userId) {
            // Exclude the current user
            const previousUserData = previousUsers.find(
              (user) => user.id === docId
            );
            if (data.timer && data.timer.isRunning) {
              if (previousUserData && !previousUserData.timer.isRunning) {
                // Timer was started
                console.log(`${data.name} started a timer!`);
              }
              const startTime = data.timer.startTime.toDate();
              const currentTime = new Date();
              const elapsedTime = Math.floor(
                (currentTime.getTime() - startTime.getTime()) / 1000
              );
              data.timer.elapsedTime = elapsedTime;
            } else if (previousUserData && previousUserData.timer.isRunning) {
              // Timer was stopped
              console.log(`${data.name} stopped their timer!`);
            }
            usersData.push({ id: docId, ...data });
          }
        });
        previousUsers = usersData;
        setOtherUsers(usersData);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [userId, db]);

  return otherUsers;
}
