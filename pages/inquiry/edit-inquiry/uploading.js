import React from "react";
import { Box, LinearProgress, Typography } from "@mui/material";

export default function UploadingScreen() {
  return (
    <Box
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        bgcolor: "rgba(255, 255, 255, 0.5)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1300,
      }}
    >
      <Typography sx={{ mb: 2, fontSize: 18, fontWeight: 500 }}>
        Uploading...
      </Typography>
      <Box sx={{ width: "60%", maxWidth: 400 }}>
        <LinearProgress />
      </Box>
    </Box>
  );
}
