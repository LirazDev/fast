// Timer.tsx
import React, { useState } from "react";
import { CircularProgress, Typography, Box, Button } from "@mui/material";

type TimerProps = {
  timer: number;
  goal: number;
  endTime: Date | null;
  isRunning: boolean;
  progress: number;
  handleStart: () => void;
  handleStop: () => void;
  buttonLoading: boolean;
};

function secondsToTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  seconds %= 3600;
  const minutes = Math.floor(seconds / 60);
  seconds %= 60;
  const formattedTime = `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  return formattedTime;
}

const userChoice = localStorage.getItem("timeToShown");
const Timer: React.FC<TimerProps> = ({
  timer,
  endTime,
  isRunning,
  progress,
  handleStart,
  handleStop,
  buttonLoading,
  goal,
}) => {
  const [isDisplayTimeElapsed, setIsDisplayTimeElapsed] = useState(
    userChoice ? userChoice === "true" : true
  );

  const remainingTime =
    endTime && new Date(endTime).getTime() - new Date().getTime();
  const handelTimeClick = () => {
    setIsDisplayTimeElapsed((prev) => {
      localStorage.setItem("timeToShown", !prev + "");
      return !prev;
    });
  };
  return (
    <Box
      sx={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "200px",
        marginBlock: "5vh",
      }}
    >
      <CircularProgress
        variant="determinate"
        value={100}
        size={200}
        thickness={4}
        sx={{ color: "#f0f0f0" }}
      />
      <CircularProgress
        variant="determinate"
        value={progress}
        size={200}
        thickness={4}
        sx={{
          color: progress !== 100 ? "#ffd238" : "#34ff88",
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
        <div dir="rtl">{isDisplayTimeElapsed ? "עברו:" : "נותרו:"}</div>
        <div onClick={handelTimeClick}>
          <Typography variant="h4">
            {isDisplayTimeElapsed
              ? new Date(timer * 1000).toISOString().substr(11, 8)
              : isRunning
              ? remainingTime && remainingTime > 0
                ? new Date(remainingTime).toISOString().substr(11, 8)
                : `Done!`
              : secondsToTime(goal)}
          </Typography>
        </div>

        <Button
          onClick={isRunning ? handleStop : handleStart}
          variant="contained"
          sx={{ mt: 2, background: "#eb595a" }}
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
  );
};

export default Timer;
