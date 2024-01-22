// NavBar.tsx
import { AppBar, Toolbar, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";

const NavBar = () => {
  const navigate = useNavigate();

  return (
    <AppBar position="static">
      <Toolbar>
        <Button color="inherit" onClick={() => navigate("/")}>
          Home
        </Button>
        <Button color="inherit" onClick={() => navigate("/data")}>
          Data
        </Button>
      </Toolbar>
    </AppBar>
  );
};

export default NavBar;
