"use client";

import { Button, Typography, Box, Paper } from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { useRouter } from "next/navigation";

export default function AccessDenied() {
  const router = useRouter();

  return (
    <Box
      height="70vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      bgcolor="#f5f5f5"
      px={2}
    >
      <Paper elevation={3} sx={{ p: 4, maxWidth: 400, textAlign: "center" }}>
        <LockOutlinedIcon color="error" sx={{ fontSize: 48, mb: 2 }} />
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          Access Denied
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          You do not have permission to view this page. Please contact your administrator if you think this is a mistake.
        </Typography>
        <Button
          variant="contained"
          color="error"
          onClick={() => router.back()}
          sx={{ mt: 2 }}
        >
          Go Back
        </Button>
      </Paper>
    </Box>
  );
}
