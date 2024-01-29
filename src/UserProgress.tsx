// UserProgress.tsx
import React, { useEffect, useState } from "react";
import { Typography, Box, LinearProgress } from "@mui/material";
import { linearProgressClasses } from "@mui/material/LinearProgress";

export type User = {
  id: string;
  name: string;
  timer: {
    isRunning: boolean;
    startTime: {
      toDate: () => Date;
    };
    elapsedTime: number;
  };
  goal: number;
};

type UserProgressProps = {
  users: User[];
};

const UserProgress: React.FC<UserProgressProps> = ({ users }) => {
  const [localUsers, setLocalUsers] = useState(users);

  // Update localUsers whenever the users prop changes
  useEffect(() => {
    setLocalUsers(users);
  }, [users]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setLocalUsers((currentUsers) =>
        currentUsers.map((user) => {
          if (user.timer && user.timer.isRunning) {
            const currentTime = new Date();
            const elapsedTime = Math.floor(
              (currentTime.getTime() -
                user.timer.startTime.toDate().getTime()) /
                1000
            );
            return { ...user, timer: { ...user.timer, elapsedTime } };
          }
          return user;
        })
      );
    }, 1000);

    return () => clearInterval(intervalId);
  }, [users]); // Depend on the users prop

  return (
    <>
      {localUsers.map((user) => (
        <Box key={user.id} sx={{ width: "100%", mt: 2 }}>
          <Typography variant="subtitle1">{user.name}'s Progress</Typography>
          <LinearProgress
            variant="determinate"
            sx={{
              borderRadius: 5,
              [`&.${linearProgressClasses.colorPrimary}`]: {
                backgroundColor: "#CCC",
              },
              [`& .${linearProgressClasses.bar}`]: {
                borderRadius: 5,
                backgroundColor: "#eb595a",
              },
            }}
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
      ))}
    </>
  );
};

export default UserProgress;
