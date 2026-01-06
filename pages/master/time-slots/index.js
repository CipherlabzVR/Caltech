import React, { useEffect, useState } from "react";
import styles from "@/styles/PageTitle.module.css";
import Link from "next/link";
import Grid from "@mui/material/Grid";
import { ToastContainer } from "react-toastify";
import BASE_URL from "Base/api";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import AddTimeSlot from "./create";
import { Box, Card, Chip, Typography } from "@mui/material";
import EditTimeSlot from "./edit";
import DeleteConfirmationById from "@/components/UIElements/Modal/DeleteConfirmationById";

export default function TimeSlots() {
  const cId = sessionStorage.getItem("category");
  const { navigate, create, update, remove, print } = IsPermissionEnabled(cId);
  const [slots, setSlots] = useState([]);
  const controller = "TimeSlot/DeleteTimeSlot";

  const fetchTimeSlots = async () => {
    try {
      const response = await fetch(`${BASE_URL}/TimeSlot/GetAll`, {
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
    fetchTimeSlots();
  }, []);

  if (!navigate) {
    return <AccessDenied />;
  }

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Time Slots</h1>
        <ul>
          <li>
            <Link href="/master/time-slots/">Time Slots</Link>
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
          justifyContent="end"
        >
          {create ? <AddTimeSlot fetchItems={fetchTimeSlots} /> : ""}
        </Grid>
        <Grid container spacing={2}>
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
                    bgcolor: slot.isActive === false ? "#e5e5e5" : "white",
                  }}
                >
                  <Box display="flex" justifyContent="center" alignItems="center">
                    <Typography variant="h6">
                      {slot.startTime} - {slot.endTime}
                    </Typography>
                  </Box>
                  <Box mt={1} display="flex" justifyContent="space-between" gap={1}>
                    {update ? <EditTimeSlot item={slot} fetchItems={fetchTimeSlots} /> : ""}
                    {remove ? <DeleteConfirmationById id={slot.id} controller={controller} fetchItems={fetchTimeSlots} /> : ""}
                  </Box>
                </Card>
              </Grid>
            )))}
        </Grid>

      </Grid>
    </>
  );
}
