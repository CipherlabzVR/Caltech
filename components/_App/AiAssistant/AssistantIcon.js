import React from "react";
import { Box } from "@mui/material";

const AssistantIcon = ({ size = 24, sx = {} }) => (
  <Box
    component="img"
    src="/chatbot.png"
    alt="ApexFlow Assistant"
    sx={{ width: size, height: size, objectFit: "contain", display: "block", ...sx }}
  />
);

export default AssistantIcon;
