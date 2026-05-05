import React, { useState } from "react";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Link from "next/link";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import styles from "@/styles/PageTitle.module.css";
import Features from "./Features";
import Summery from "./Summery";
import ReservationChart from "./ReservationChart";
import UpcomingReservations from "./UpcomingReservations";

const getSLDateString = (date) => {
  const offsetMs = 5.5 * 60 * 60 * 1000;
  const slTime = new Date(date.getTime() + offsetMs);
  return slTime.toISOString().split('T')[0];
};

export default function Reservation() {
  // Shared date range state - default to current month (same as Summary)
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const [startDate, setStartDate] = useState(getSLDateString(firstDay));
  const [endDate, setEndDate] = useState(getSLDateString(lastDay));
  const [localStartDate, setLocalStartDate] = useState(getSLDateString(firstDay));
  const [localEndDate, setLocalEndDate] = useState(getSLDateString(lastDay));

  const handleApply = () => {
    if (localStartDate && localEndDate && localStartDate <= localEndDate) {
      setStartDate(localStartDate);
      setEndDate(localEndDate);
    }
  };

  const isApplyDisabled = !localStartDate || !localEndDate || new Date(localStartDate) > new Date(localEndDate);

  return (
    <Box
      sx={{
        background: "linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)",
        minHeight: "100vh",
        p: { xs: 2, sm: 3, md: 4, lg: 5 },
      }}
    >
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="h4"
          sx={{
            fontSize: 24,
            fontWeight: 600,
            color: "#1E293B",
            mb: 0.5,
          }}
        >
          Reservation Dashboard
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Link href="/" style={{ textDecoration: "none", color: "#64748B", fontSize: 14 }}>
            Dashboard
          </Link>
          <Typography sx={{ color: "#CBD5E1", fontSize: 14 }}>/</Typography>
          <Typography sx={{ color: "#1E293B", fontSize: 14, fontWeight: 500 }}>
            Reservation
          </Typography>
        </Box>
      </Box>

      <Grid container rowSpacing={3} columnSpacing={{ xs: 2, sm: 3, md: 3 }}>
        <Grid item xs={12} md={12} lg={12}>
          <Features />
        </Grid>

        <Grid item xs={12} md={12} lg={12}>
          <Card
            sx={{
              background: "#FFFFFF",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
              borderRadius: "8px",
              p: 2.5,
              border: "1px solid rgba(0, 0, 0, 0.08)",
            }}
          >
            <Box
              sx={{
                display: "flex",
                gap: 2,
                alignItems: "center",
                flexWrap: { xs: "wrap", md: "nowrap" },
                justifyContent: { xs: "flex-start", md: "flex-end" },
              }}
            >
              <Box
                display="flex"
                alignItems="center"
                gap={1}
                sx={{
                  background: "#F8F9FA",
                  p: "6px 10px",
                  borderRadius: "6px",
                  border: "1px solid rgba(0, 0, 0, 0.1)",
                }}
              >
                <CalendarTodayIcon sx={{ fontSize: 16, color: "#64748B" }} />
                <Typography sx={{ fontSize: 12, fontWeight: 500, color: "#475569", minWidth: "70px" }}>
                  Start Date
                </Typography>
                <TextField
                  value={localStartDate}
                  size="small"
                  type="date"
                  onChange={(e) => setLocalStartDate(e.target.value)}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "6px",
                      background: "#FFFFFF",
                      fontSize: "12px",
                      "& fieldset": {
                        borderColor: "rgba(0, 0, 0, 0.15)",
                      },
                      "&:hover fieldset": {
                        borderColor: "rgba(0, 0, 0, 0.25)",
                      },
                    },
                  }}
                />
              </Box>
              <Box
                display="flex"
                alignItems="center"
                gap={1}
                sx={{
                  background: "#F8F9FA",
                  p: "6px 10px",
                  borderRadius: "6px",
                  border: "1px solid rgba(0, 0, 0, 0.1)",
                }}
              >
                <CalendarTodayIcon sx={{ fontSize: 16, color: "#64748B" }} />
                <Typography sx={{ fontSize: 12, fontWeight: 500, color: "#475569", minWidth: "70px" }}>
                  End Date
                </Typography>
                <TextField
                  value={localEndDate}
                  size="small"
                  type="date"
                  onChange={(e) => setLocalEndDate(e.target.value)}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "6px",
                      background: "#FFFFFF",
                      fontSize: "12px",
                      "& fieldset": {
                        borderColor: "rgba(0, 0, 0, 0.15)",
                      },
                      "&:hover fieldset": {
                        borderColor: "rgba(0, 0, 0, 0.25)",
                      },
                    },
                  }}
                />
              </Box>
              <Button
                variant="contained"
                size="small"
                onClick={handleApply}
                disabled={isApplyDisabled}
                sx={{
                  textTransform: "none",
                  px: 2,
                  height: "36px",
                  background: "linear-gradient(135deg, #2563EB 0%, #1E40AF 100%)",
                  "&:hover": {
                    background: "linear-gradient(135deg, #1E40AF 0%, #1E3A8A 100%)",
                  },
                }}
              >
                Apply
              </Button>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} md={8} lg={8}>
          <ReservationChart 
            startDate={startDate}
            endDate={endDate}
          />
        </Grid>

        <Grid item xs={12} md={4} lg={4}>
          <UpcomingReservations 
            startDate={startDate}
            endDate={endDate}
          />
        </Grid>

        <Grid item xs={12} md={12} lg={12}>
          <Summery 
            startDate={startDate}
            endDate={endDate}
          />
        </Grid>
      </Grid>
    </Box>
  );
}
