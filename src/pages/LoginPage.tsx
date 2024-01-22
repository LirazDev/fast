import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { TextField, Button, Typography, Box } from "@mui/material";
import { db } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

const LoginPage = () => {
  const [userId, setUserId] = useState("");
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [isNewUser, setIsNewUser] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      localStorage.setItem("userId", userId);
      navigate("/");
    } else {
      setIsNewUser(true);
    }
  };

  const handleNewUserSubmit = async () => {
    const userRef = doc(db, "users", userId);
    await setDoc(userRef, { name, goal });

    localStorage.setItem("userId", userId);
    navigate("/");
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        padding: "20px",
      }}
    >
      {!isNewUser ? (
        <>
          <Typography variant="h5" sx={{ marginBottom: "20px" }}>
            Login
          </Typography>
          <TextField
            label="User ID"
            variant="outlined"
            fullWidth
            margin="normal"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
          />
          <Button variant="contained" color="primary" onClick={handleLogin}>
            Login
          </Button>
        </>
      ) : (
        <>
          <Typography variant="h5" sx={{ marginBottom: "20px" }}>
            Welcome New User
          </Typography>
          <TextField
            label="Name"
            variant="outlined"
            fullWidth
            margin="normal"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <TextField
            label="Goal (in hours)"
            variant="outlined"
            fullWidth
            margin="normal"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={handleNewUserSubmit}
          >
            Submit
          </Button>
        </>
      )}
    </Box>
  );
};

export default LoginPage;
