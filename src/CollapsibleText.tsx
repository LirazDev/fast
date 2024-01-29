import { useState } from "react";
import { Box, Typography } from "@mui/material";

interface CollapsibleTextProps {
  text: string;
  maxLength?: number;
}

export const CollapsibleText: React.FC<CollapsibleTextProps> = ({
  text,
  maxLength = 50,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(true);

  const toggleIsCollapsed = () => {
    setIsCollapsed(!isCollapsed);
  };

  const textStyle = {
    direction: "rtl",
    maxWidth: "100px", // Adjust the width as needed
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: isCollapsed ? "nowrap" : "normal",
    cursor: "pointer",
  };

  if (text.length <= maxLength) {
    return (
      <Typography sx={textStyle} onClick={toggleIsCollapsed}>
        {text}
      </Typography>
    );
  }

  return (
    <Box onClick={toggleIsCollapsed}>
      <Typography sx={textStyle}>
        {isCollapsed ? `${text.substring(0, maxLength)}...` : text}
      </Typography>
    </Box>
  );
};
