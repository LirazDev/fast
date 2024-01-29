import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Box,
  Backdrop,
  Button,
} from "@mui/material";
import { CollapsibleText } from "../CollapsibleText";

// Define a type for session data
type Session = {
  id: string;
  endTime: { seconds: number };
  name: string;
  duration: number;
  note: string | null;
};

const DataPage = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const userId = localStorage.getItem("userId");

  useEffect(() => {
    const fetchSessions = async () => {
      setIsLoading(true);
      const sessionsData: Session[] = [];

      // Fetch data based on filter
      if (filter === "all") {
        const usersSnapshot = await getDocs(collection(db, "users"));
        for (const userDoc of usersSnapshot.docs) {
          const userSessionsSnapshot = await getDocs(
            query(
              collection(db, "users", userDoc.id, "sessions"),
              orderBy("endTime", "desc")
            )
          );
          userSessionsSnapshot.forEach((sessionDoc) => {
            const sessionData = sessionDoc.data();
            sessionsData.push({
              id: sessionDoc.id,
              name: userDoc.data().name, // Assuming each user document has a 'name' field
              endTime: sessionData.endTime,
              duration: sessionData.duration,
              note: sessionData.note || null,
            });
          });
        }
      } else {
        const userSessionsSnapshot = await getDocs(
          query(
            collection(db, "users", userId ?? "defaultUserId", "sessions"),
            orderBy("endTime", "desc")
          )
        );
        userSessionsSnapshot.forEach((sessionDoc) => {
          const sessionData = sessionDoc.data();

          sessionsData.push({
            id: sessionDoc.id,
            name: "ME",
            endTime: sessionData.endTime,
            duration: sessionData.duration,
            note: sessionData.note || null,
          });
        });
      }
      setSessions(
        sessionsData.sort((a, b) => b.endTime.seconds - a.endTime.seconds)
      );
      setIsLoading(false);
    };

    fetchSessions();
  }, [filter, userId]);

  const formatDate = (dateString: { seconds: number }) => {
    const date = new Date(dateString.seconds * 1000);
    return format(date, "dd/MM");
  };

  if (isLoading) {
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
    <Box sx={{ padding: "20px" }}>
      <h1>Data Page</h1>
      <Box
        sx={{
          display: "flex",
          gap: 1,
          mb: 2,
          position: "sticky",
          top: "60px",
        }}
      >
        <Button
          onClick={() => setFilter("all")}
          variant="contained"
          sx={{ mt: 2, background: "#eb595a" }}
        >
          All Activities
        </Button>
        <Button
          onClick={() => setFilter("mine")}
          variant="contained"
          sx={{ mt: 2, background: "#eb595a" }}
        >
          My Activities
        </Button>
      </Box>

      <TableContainer component={Paper} sx={{ background: "transparent" }}>
        <Table aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              {filter === "all" && <TableCell align="right">Name</TableCell>}
              <TableCell align="right" sx={{ width: "150px" }}>
                Time
              </TableCell>
              <TableCell align="right" sx={{ width: "200px" }}>
                Note
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {sessions.map((session) => (
              <TableRow
                key={session.id}
                sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
              >
                <TableCell component="th" scope="row">
                  {formatDate(session.endTime)}
                </TableCell>
                {filter === "all" && (
                  <TableCell align="right">{session.name}</TableCell>
                )}
                <TableCell align="right">
                  {new Date(session.duration * 1000)
                    .toISOString()
                    .substr(11, 8)}
                </TableCell>
                <TableCell align="right">
                  <CollapsibleText
                    text={session.note || "No note"}
                    maxLength={50}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default DataPage;
