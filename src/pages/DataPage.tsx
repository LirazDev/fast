/* eslint-disable @typescript-eslint/no-explicit-any */
// DataPage.tsx
import {
  useState,
  useEffect,
  JSXElementConstructor,
  Key,
  ReactElement,
  ReactNode,
  ReactPortal,
} from "react";
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
} from "@mui/material";
import { CollapsibleText } from "../CollapsibleText";

const DataPage = () => {
  const [sessions, setSessions] = useState<any>([]);
  const [isLoading, setIsLoading] = useState(true); // State for loading indicator
  const [filter, setFilter] = useState("all");
  const userId = localStorage.getItem("userId");

  useEffect(() => {
    const fetchSessions = async () => {
      setIsLoading(true); // Start loading
      const sessionsData:
        | ((prevState: never[]) => never[])
        | { id: string; name: any }[] = [];

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
            sessionsData.push({
              id: sessionDoc.id,
              name: userDoc.data().name, // Assuming each user document has a 'name' field
              ...sessionDoc.data(),
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
        userSessionsSnapshot.forEach((doc) => {
          sessionsData.push({ id: doc.id, name: "Me", ...doc.data() });
        });
      }

      setSessions(sessionsData);
      setIsLoading(false); // End loading
    };

    fetchSessions();
  }, [filter, userId]);

  const formatDate = (dateString: { seconds: number }) => {
    const date = new Date(dateString.seconds * 1000);
    return format(date, "dd/MM"); // Format the date as "day/month"
  };

  if (isLoading) {
    return <CircularProgress />;
  }

  return (
    <Box sx={{ padding: "20px" }}>
      <h1>Data Page</h1>
      <button onClick={() => setFilter("all")}>All Activities</button>
      <button onClick={() => setFilter("mine")}>My Activities</button>
      <TableContainer component={Paper}>
        <Table aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              {filter === "all" && (
                <TableCell align="right">Name</TableCell>
              )}{" "}
              {/* Conditionally render the Name column header */}
              <TableCell align="right" sx={{ width: "150px" }}>
                Fasting Time
              </TableCell>
              <TableCell align="right" sx={{ width: "200px" }}>
                Note
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sessions.map(
              (session: {
                id: Key | null | undefined;
                endTime: any;
                name:
                  | string
                  | number
                  | boolean
                  | ReactElement<any, string | JSXElementConstructor<any>>
                  | Iterable<ReactNode>
                  | ReactPortal
                  | null
                  | undefined;
                duration: number;
                note: any;
              }) => (
                <TableRow
                  key={session.id}
                  sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                >
                  <TableCell component="th" scope="row">
                    {formatDate(session.endTime)}
                  </TableCell>
                  {filter === "all" && (
                    <TableCell align="right">{session.name}</TableCell>
                  )}{" "}
                  {/* Conditionally render the Name cell */}
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
              )
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default DataPage;
