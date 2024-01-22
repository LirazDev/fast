/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  useState,
  useEffect,
  JSXElementConstructor,
  Key,
  ReactElement,
  ReactNode,
  ReactPortal,
} from "react";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { useNavigate } from "react-router-dom";
import {
  Typography,
  Box,
  Button,
  CircularProgress,
  LinearProgress,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
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

const HomePage = () => {
  const [timer, setTimer] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [intervalId, setIntervalId] = useState<any>(null);
  const [goal, setGoal] = useState(0); // In seconds
  const [progress, setProgress] = useState(0);
  const [userName, setUserName] = useState("");
  const [otherUsers, setOtherUsers] = useState<any>([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [userNote, setUserNote] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentSessionId, setCurrentSessionId] = useState<any>(null);
  const [buttonLoading, setButtonLoading] = useState(false);
  const [desiredStartTime, setDesiredStartTime] = useState<any>(new Date());

  const userId = localStorage.getItem("userId");
  const navigate = useNavigate();

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  // Fetch user's data
  useEffect(() => {
    const fetchUserData = async () => {
      if (userId) {
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();
          setUserName(userData.name);
          setGoal(userData.goal * 3600); // Convert goal from hours to seconds
          setLoading(false);
        } else {
          navigate("/login");
        }
      }
    };

    fetchUserData();
  }, [userId, navigate]);

  // Update progress when timer changes
  useEffect(() => {
    if (goal > 0) {
      const newProgress = (timer / goal) * 100;
      setProgress(newProgress > 100 ? 100 : newProgress); // Cap the progress at 100%
    }
  }, [timer, goal]);

  // Fetch other users' data and listen for changes
  useEffect(() => {
    let previousUsers: any[] = [];

    const fetchOtherUsers = () => {
      const unsubscribe = onSnapshot(
        query(collection(db, "users")),
        (querySnapshot) => {
          const usersData: any[] | ((prevState: never[]) => never[]) = [];
          querySnapshot.forEach((doc) => {
            if (doc.id !== userId) {
              // Exclude the current user
              const data = doc.data();
              // Find the same user in previousUsers to compare
              const previousUserData = previousUsers.find(
                (user) => user.id === doc.id
              );
              if (data.timer && data.timer.isRunning) {
                if (previousUserData && !previousUserData.timer.isRunning) {
                  // Timer was started
                  setSnackbarMessage(`${data.name} started a timer!`);
                  setSnackbarOpen(true);
                }
                const startTime = data.timer.startTime.toDate();
                const currentTime = new Date() as any;
                const elapsedTime = Math.floor(
                  (currentTime - startTime) / 1000
                );
                data.timer.elapsedTime = elapsedTime;
              } else if (previousUserData && previousUserData.timer.isRunning) {
                // Timer was stopped
                setSnackbarMessage(`${data.name} stopped their timer!`);
                setSnackbarOpen(true);
              }
              usersData.push({ id: doc.id, ...data });
            }
          });
          previousUsers = usersData; // Update previousUsers for the next snapshot
          setOtherUsers(usersData);
        }
      );

      return unsubscribe;
    };

    const unsubscribeFromOtherUsers = fetchOtherUsers();

    return () => {
      unsubscribeFromOtherUsers(); // Clean up the subscription
    };
  }, [userId]);

  // Update other users' elapsed time every second
  useEffect(() => {
    const intervalId = setInterval(() => {
      setOtherUsers((currentUsers: any[]) =>
        currentUsers.map(
          (user: {
            timer: { isRunning: any; startTime: { toDate: () => any } };
          }) => {
            if (user.timer && user.timer.isRunning) {
              const startTime = user.timer.startTime.toDate();
              const currentTime = new Date() as unknown as number;
              const elapsedTime = Math.floor((currentTime - startTime) / 1000);
              return { ...user, timer: { ...user.timer, elapsedTime } };
            }
            return user;
          }
        )
      );
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  const handleStart = async () => {
    setButtonLoading(true);

    const startTime = serverTimestamp();
    const userRef = doc(db, "users", userId ?? "defaultUserId");
    await updateDoc(userRef, {
      "timer.startTime": startTime,
      "timer.isRunning": true,
    });
    setIsRunning(true);
    startTimer();
    setButtonLoading(false);
  };

  const handleStop = async () => {
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }

    setButtonLoading(true);

    intervalId && clearInterval(intervalId);
    setIntervalId(null);
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
    if (intervalId) {
      clearInterval(intervalId);
    }

    const id = setInterval(() => {
      setTimer((prevTime) => prevTime + 1);
    }, 1000);
    setIntervalId(id);
  };

  useEffect(() => {
    const fetchUserData = async () => {
      if (userId) {
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();
          if (userData.timer && userData.timer.isRunning) {
            setIsRunning(true);
            const startTime = userData.timer.startTime.toDate();
            const currentTime = new Date() as unknown as number;
            const elapsedTime = Math.floor((currentTime - startTime) / 1000);
            setTimer(elapsedTime);
            startTimer();
          }
        } else {
          localStorage.removeItem("userId");
          navigate("/login");
        }
      } else {
        navigate("/login");
      }
    };

    fetchUserData();
  }, [userId, navigate]);

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
    const currentTime = new Date() as unknown as number;
    const elapsedTime = Math.floor((currentTime - desiredStartTime) / 1000);
    if (intervalId) {
      clearInterval(intervalId);
    }

    setTimer(elapsedTime); // Update the timer
    startTimer(); // Restart the timer

    setSnackbarMessage("Start time updated successfully!");
    setSnackbarOpen(true);
    setButtonLoading(false); // Hide loading indicator
  };

  const feedbackDialog = (
    <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
      <DialogTitle>Session Feedback</DialogTitle>
      <DialogContent>
        <Typography>{feedbackMessage}</Typography>
        <TextField
          dir="rtl"
          autoFocus
          margin="dense"
          id="note"
          label="Note for Self"
          multiline
          rows={4}
          value={userNote}
          onChange={(e) => setUserNote(e.target.value)}
          fullWidth
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setDialogOpen(false)} color="primary">
          Close
        </Button>
        <Button onClick={handleSaveUserNote} color="primary">
          Save Note
        </Button>
      </DialogActions>
    </Dialog>
  );

  // Loader
  if (loading) {
    return <CircularProgress />;
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "80vh",
          padding: "20px",
        }}
      >
        <Typography variant="h5">Welcome, {userName}!</Typography>
        <Typography variant="h6">Today's goal is {goal / 3600}hr</Typography>

        <Box
          sx={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "50vh",
          }}
        >
          {/* Background Progress Bar (Light Gray Full Circle) */}
          <CircularProgress
            variant="determinate"
            value={100}
            size={200}
            thickness={4}
            sx={{ color: "lightgray", position: "absolute" }}
          />

          {/* Foreground Progress Bar (Dynamic Green Progress) */}
          <CircularProgress
            variant="determinate"
            value={progress}
            size={200}
            thickness={4}
            sx={{
              color: progress >= 100 ? "green" : "green",
              position: "absolute",
            }}
          />

          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <Typography variant="h4">
              {new Date(timer * 1000).toISOString().substr(11, 8)}
            </Typography>
            <Button
              onClick={isRunning ? handleStop : handleStart}
              variant="contained"
              color="primary"
              sx={{ mt: 2 }}
              disabled={buttonLoading}
              startIcon={
                buttonLoading && (
                  <CircularProgress
                    size={24}
                    sx={{
                      color: "white",
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      marginTop: "-12px",
                      marginLeft: "-12px",
                    }}
                  />
                )
              }
            >
              {isRunning ? "Stop" : "Start"}
            </Button>
          </Box>
        </Box>

        {isRunning && (
          <>
            <DateTimePicker
              label="Desired Start Time"
              value={desiredStartTime}
              onChange={(newValue) => {
                if (newValue && newValue instanceof Date) {
                  setDesiredStartTime(newValue);
                }
              }}
            />
            <Button
              onClick={handleUpdateTime}
              variant="outlined"
              color="secondary"
              sx={{ mt: 2 }}
              disabled={buttonLoading || !isRunning}
            >
              Update Start Time
            </Button>
          </>
        )}

        {otherUsers.map(
          (user: {
            id: Key | null | undefined;
            name:
              | string
              | number
              | boolean
              | ReactElement<any, string | JSXElementConstructor<any>>
              | Iterable<ReactNode>
              | ReactPortal
              | null
              | undefined;
            timer: { elapsedTime: number };
            goal: number;
          }) => (
            <Box key={user.id} sx={{ width: "100%", mt: 2 }}>
              <Typography variant="subtitle1">
                {user.name}'s Progress
              </Typography>
              <LinearProgress
                variant="determinate"
                value={
                  user.timer
                    ? (user.timer.elapsedTime / (user.goal * 3600)) * 100
                    : 0
                }
              />
              <Typography variant="caption">
                {user.timer && !isNaN(user.timer.elapsedTime)
                  ? new Date(user.timer.elapsedTime * 1000)
                      .toISOString()
                      .substr(11, 8)
                  : "Not started"}
              </Typography>
            </Box>
          )
        )}

        {/* Dialog for feedback and note */}
        {feedbackDialog}

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
