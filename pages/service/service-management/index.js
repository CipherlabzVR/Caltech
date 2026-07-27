import React from "react";
import { useRouter } from "next/router";
import { Box, CircularProgress, Typography } from "@mui/material";

export default function ServiceManagementHome() {
  const router = useRouter();

  React.useEffect(() => {
    router.replace("/dashboard/service-management");
  }, [router]);

  return (
    <Box sx={{ p: 4, display: "flex", alignItems: "center", gap: 2 }}>
      <CircularProgress size={24} />
      <Typography>Opening Service Management Dashboard…</Typography>
    </Box>
  );
}
