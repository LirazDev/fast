// HomePage.tsx
import { useState, useEffect, useRef } from "react";
import { usePushNotifications } from ".././usePushNotifications"; // adjust the path based on your project structure

import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { useNavigate } from "react-router-dom";
import {
  Typography,
  Box,
  Button,
  CircularProgress,
  Snackbar,
  Backdrop,
} from "@mui/material";
import { db } from "../firebase";
import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  collection,
  setDoc,
  onSnapshot,
  query,
} from "firebase/firestore";
import { usePageVisibility } from "../usePageVisibility";

import Timer from "../Timer";
import UserProgress, { User } from "../UserProgress";
import FeedbackDialog from "../FeedbackDialog";

function calculateEndingTime(
  inputDate: Date | null,
  hoursToAdd: number,
  desiredStartTime: Date | null
): string {
  // Get the current time
  const currentTime = new Date();
  const getNewTime = () => {
    if (desiredStartTime && inputDate) {
      if (desiredStartTime < inputDate) {
        return desiredStartTime.getTime();
      } else {
        return inputDate.getTime();
      }
    } else if (inputDate) {
      return inputDate.getTime();
    }
    return currentTime.getTime();
  };
  // Calculate the new time by adding hours
  const newTime = new Date(getNewTime() + hoursToAdd * 1000);

  // Check if the new time has already passed

  if (newTime < currentTime) {
    return "Feast Ended 🥳";
  }

  // Determine if the new time is today or tomorrow
  let endingStr = "Ending Today";
  if (newTime.getDate() !== currentTime.getDate()) {
    endingStr = "Ending Tomorrow";
  }

  // Format the hours and minutes
  const hours = newTime.getHours().toString().padStart(2, "0");
  const minutes = newTime.getMinutes().toString().padStart(2, "0");

  // Combine the ending string and formatted time
  const result = `${endingStr} at ${hours}:${minutes}`;

  return result;
}

function calculateEndTime(
  inputDate: Date | null,
  hoursToAdd: number,
  desiredStartTime: Date | null
): Date | null {
  // Get the current time

  const getNewTime = () => {
    if (desiredStartTime && inputDate) {
      if (desiredStartTime < inputDate) {
        return desiredStartTime.getTime();
      } else {
        return inputDate.getTime();
      }
    } else if (inputDate) {
      return inputDate.getTime();
    }
    return null;
  };
  // Calculate the new time by adding hours
  const newTime = getNewTime();
  return newTime === null ? null : new Date(newTime + hoursToAdd * 1000);
}
// Define an interface for user objects in otherUsers state
export interface OtherUser {
  id: string;
  name: string;
  timer?: {
    isRunning: boolean;
    startTime: {
      toDate: () => Date;
    };
    elapsedTime: number;
  };
  goal: number;
}

// Define types for states that were previously any
type CurrentSessionIdType = string | null;
type EndTimeType = Date | null;

const HomePage = () => {
  const [timer, setTimer] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [goal, setGoal] = useState(0); // In seconds
  const [progress, setProgress] = useState(0);
  const [userName, setUserName] = useState("");
  const [otherUsers, setOtherUsers] = useState<User[]>([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [userNote, setUserNote] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentSessionId, setCurrentSessionId] =
    useState<CurrentSessionIdType>(null);
  const [buttonLoading, setButtonLoading] = useState(false);
  const [desiredStartTime, setDesiredStartTime] = useState<Date | null>(null);
  const isVisible = usePageVisibility();
  const [endTime, setEndTime] = useState<EndTimeType>(null);
  const userId = localStorage.getItem("userId");
  const navigate = useNavigate();
  usePushNotifications();
  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  const intervalIdRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);

      if (userId) {
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();
          setUserName(userData.name);
          setGoal(userData.goal * 3600); // Convert goal from hours to seconds

          if (userData.timer?.isRunning) {
            setIsRunning(true);
            const startTime = userData.timer.startTime.toDate();
            const currentTime = new Date() as unknown as number;
            const elapsedTime = Math.floor((currentTime - startTime) / 1000);
            setEndTime(startTime); // Make sure you have a state or function for setEndTime
            setTimer(elapsedTime);
            startTimer();
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
    };

    fetchUserData();
  }, [userId, navigate, isVisible]);

  // Update progress when timer changes
  useEffect(() => {
    if (goal > 0) {
      const newProgress = (timer / goal) * 100;
      setProgress(newProgress > 100 ? 100 : newProgress); // Cap the progress at 100%
    }
  }, [timer, goal]);

  useEffect(() => {
    let previousUsers: OtherUser[] = [];

    const fetchOtherUsers = () => {
      const unsubscribe = onSnapshot(
        query(collection(db, "users")),
        (querySnapshot) => {
          const usersData: User[] = [];
          querySnapshot.forEach((doc) => {
            if (doc.id !== userId) {
              const data = doc.data() as User;
              const previousUserData = previousUsers.find(
                (user) => user.id === doc.id
              );

              if (data.timer && data.timer.isRunning) {
                // Timer was started
                if (previousUserData?.timer?.isRunning === false) {
                  setSnackbarMessage(`${data.name} started a timer!`);
                  setSnackbarOpen(true);
                }
                const startTime = data.timer.startTime.toDate();
                const currentTime = new Date();
                const elapsedTime = Math.floor(
                  (currentTime.getTime() - startTime.getTime()) / 1000
                );
                data.timer.elapsedTime = elapsedTime;
              } else if (previousUserData?.timer?.isRunning === true) {
                // Timer was stopped
                setSnackbarMessage(`${data.name} stopped their timer!`);
                setSnackbarOpen(true);
              }

              usersData.push({ ...data, id: doc.id });
            }
          });
          previousUsers = usersData;
          setOtherUsers(usersData);
        }
      );

      return unsubscribe;
    };

    const unsubscribeFromOtherUsers = fetchOtherUsers();

    return () => {
      unsubscribeFromOtherUsers();
    };
  }, [userId, isVisible, navigate]);

  const handleStart = async () => {
    setButtonLoading(true);

    const startTime = serverTimestamp();
    const userRef = doc(db, "users", userId ?? "defaultUserId");
    await updateDoc(userRef, {
      "timer.startTime": startTime,
      "timer.isRunning": true,
    });

    const notificationRef = doc(collection(db, "notifications"));
    await setDoc(notificationRef, {
      userId: userId,
      type: "start",
      timestamp: serverTimestamp(),
    });
    setEndTime(new Date());
    setIsRunning(true);
    startTimer();
    setButtonLoading(false);
  };

  const handleStop = async () => {
    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }

    setButtonLoading(true);

    intervalIdRef.current && clearInterval(intervalIdRef.current);
    intervalIdRef.current = null;
    setIsRunning(false);

    const userRef = doc(db, "users", userId ?? "defaultUserId");
    const sessionsCollectionRef = collection(
      db,
      "users",
      userId ?? "defaultUserId",
      "sessions"
    );
    const newSessionRef = doc(sessionsCollectionRef); // Firestore creates a new document ID

    await setDoc(newSessionRef, {
      startTime: serverTimestamp(),
      endTime: serverTimestamp(),
      duration: timer,
    });

    const notificationRef = doc(collection(db, "notifications"));
    await setDoc(notificationRef, {
      userId: userId,
      type: "stop",
      timestamp: serverTimestamp(),
    });

    // Store the current session ID
    setCurrentSessionId(newSessionRef.id);

    setTimer(0);
    await updateDoc(userRef, {
      "timer.isRunning": false,
    });

    const success = determineSuccess(); // Implement this function based on your criteria
    const feedbackMessage = success
      ? "Great job!"
      : "Next time you will stand it";
    setFeedbackMessage(feedbackMessage);

    // Open the feedback dialog
    setDialogOpen(true);
    setButtonLoading(false);
  };

  const determineSuccess = () => {
    // Implement your logic to determine success
    return true; // or false based on your criteria
  };

  const handleSaveUserNote = async () => {
    console.log(`Saving note for session: ${currentSessionId}`);

    if (currentSessionId) {
      // Ensure we have a session ID
      const sessionRef = doc(
        db,
        "users",
        userId ?? "defaultUserId",
        "sessions",
        currentSessionId
      );
      await updateDoc(sessionRef, { note: userNote });
      setSnackbarMessage("Note saved successfully!");
      setSnackbarOpen(true);
      setDialogOpen(false); // Close the dialog after saving the note
      setUserNote(""); // Clear the note field
    } else {
      setSnackbarMessage("No active session to add a note to.");
      setSnackbarOpen(true);
    }
  };

  const startTimer = () => {
    // Clear any existing interval
    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
    }

    // Set a new interval
    intervalIdRef.current = setInterval(() => {
      setTimer((prevTime) => prevTime + 1);
    }, 1000);
  };

  const handleUpdateTime = async () => {
    if (!isRunning) {
      setSnackbarMessage(
        "Timer is not running. Start the timer to update time."
      );
      setSnackbarOpen(true);
      return;
    }

    setButtonLoading(true); // Show loading indicator
    const userRef = doc(db, "users", userId ?? "defaultUserId");
    await updateDoc(userRef, {
      "timer.startTime": desiredStartTime,
    });

    // Calculate the elapsed time since the desired start time
    const currentTime = new Date();
    const elapsedTime = Math.floor(
      (currentTime.getTime() - (desiredStartTime || new Date()).getTime()) /
        1000
    );
    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
    }

    setTimer(elapsedTime); // Update the timer
    startTimer(); // Restart the timer

    setSnackbarMessage("Start time updated successfully!");
    setSnackbarOpen(true);
    setButtonLoading(false); // Hide loading indicator
  };

  // Loader
  if (loading) {
    return (
      <Backdrop
        sx={{
          background: "#22222255",
          color: "#fff",
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
        open={true}
      >
        <CircularProgress color="inherit" size={60} />
      </Backdrop>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box
        sx={{
          background: "transparent",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100%",
          padding: "20px",
        }}
      >
        <Typography variant="h5">Welcome, {userName}!</Typography>
        <Typography variant="h6">Today's goal is {goal / 3600}hr</Typography>

        {/* Timer Component */}
        <Timer
          timer={timer}
          endTime={calculateEndTime(endTime, goal, desiredStartTime)}
          isRunning={isRunning}
          progress={progress}
          handleStart={handleStart}
          handleStop={handleStop}
          buttonLoading={buttonLoading}
          goal={goal}
        />
        {/* Conditional Rendering */}
        {isRunning && (
          <>
            <Typography sx={{ marginBottom: 2 }}>
              {calculateEndingTime(endTime, goal, desiredStartTime)}
            </Typography>
            <DateTimePicker
              label="Chose Start Time"
              value={desiredStartTime}
              onOpen={() => !desiredStartTime && setDesiredStartTime(endTime)}
              onChange={(newValue) => {
                if (newValue && newValue instanceof Date) {
                  setDesiredStartTime(newValue);
                }
              }}
            />
            <Button
              onClick={handleUpdateTime}
              variant="outlined"
              sx={{ mt: 2, color: "#eb595a", border: "1px solid #eb595a" }}
              disabled={buttonLoading || !isRunning}
            >
              Update Start Time
            </Button>
          </>
        )}

        {/* UserProgress Component */}
        <UserProgress users={otherUsers} />

        {/* FeedbackDialog Component */}
        <FeedbackDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          feedbackMessage={feedbackMessage}
          userNote={userNote}
          setUserNote={setUserNote}
          handleSaveUserNote={handleSaveUserNote}
        />

        {/* Snackbar for Notifications */}
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={3000}
          onClose={handleCloseSnackbar}
          message={snackbarMessage}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        />
      </Box>
    </LocalizationProvider>
  );
};

export default HomePage;
