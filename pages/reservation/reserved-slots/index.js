import React, { useState } from "react";
import styles from "@/styles/PageTitle.module.css";
import Link from "next/link";
import Grid from "@mui/material/Grid";
import { ToastContainer } from "react-toastify";
import BASE_URL from "Base/api";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import { Box, Card, TextField, Typography } from "@mui/material";
import { formatDate } from "@/components/utils/formatHelper";
import { useEffect } from "react";

export default function ReservedSlots() {
  const cId = sessionStorage.getItem("category");
  const { navigate, create, update, remove, print } = IsPermissionEnabled(cId);
  var today = new Date();
  const [selectedDate, setSelectedDate] = useState(formatDate(today));
  const [slots, setSlots] = useState([]);

  const handleChangeDate = (value) => {
    var formattedDate = formatDate(value);
    setSelectedDate(formattedDate);
    fetchTimeSlots(formattedDate);
  }

  const fetchTimeSlots = async (date) => {
    try {
      const response = await fetch(`${BASE_URL}/Booking/GetAvailableSlotByDate?date=${date}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch");
      }

      const data = await response.json();
      setSlots(data.result);
    } catch (error) {
      console.error("Error fetching:", error);
    }
  };

  useEffect(() => {
    fetchTimeSlots(selectedDate);
  }, []);

  if (!navigate) {
    return <AccessDenied />;
  }

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Reserved Slots</h1>
        <ul>
          <li>
            <Link href="/reservation/reserved-slots/">Reserved Slots</Link>
          </li>
        </ul>
      </div>
      <Grid
        container
        rowSpacing={1}
        columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}
      >
        <Grid
          item
          xs={12}
          mb={1}
          display="flex"
          gap={2}
        >
          <Box>
            <Typography>Select Date</Typography>
            <TextField type="date" value={selectedDate} onChange={(e) => handleChangeDate(e.target.value)} />
          </Box>
        </Grid>
        <Grid container spacing={1}>
          {slots.length === 0 ?
            <Grid item xs={12} p={1}>
              <Typography color="error">No Time Slots Available</Typography>
            </Grid>
            : (slots.map((slot, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Card
                  variant="outlined"
                  sx={{
                    position: "relative",
                    p: 2,
                    borderRadius: '10px',
                    bgcolor: slot.isAvailable === false ? "#e5e5e5" : "white",
                  }}
                >
                  <Box display="flex" justifyContent="center" alignItems="center">
                    <Typography variant="h6">
                      {slot.startTime} - {slot.endTime}
                    </Typography>
                  </Box>
                  <Box mt={1} display="flex" justifyContent="space-between" gap={1}>

                  </Box>
                </Card>
              </Grid>
            )))}
        </Grid>

      </Grid>
    </>
  );
}
