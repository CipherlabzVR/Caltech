import React, { useEffect, useState } from "react";
import { Box, Grid, TextField, Typography } from "@mui/material";
import Card from "@mui/material/Card";
import ReservationSummeryChart from "./ReservationSummeryChart";
import styles from "./Summery.module.css";
import BASE_URL from "Base/api";

const getSLDateString = (date) => {
  const offsetMs = 5.5 * 60 * 60 * 1000;
  const slTime = new Date(date.getTime() + offsetMs);
  return slTime.toISOString().split('T')[0];
};

const Summery = () => {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const [features, setFeatures] = useState();
  const [values, setValues] = useState();
  const [startDate, setStartDate] = useState(getSLDateString(firstDay));
  const [endDate, setEndDate] = useState(getSLDateString(lastDay));
  const [percentages, setPercentages] = useState();

  const fetchDashboard = async (start, end) => {
    try {
      const response = await fetch(
        `${BASE_URL}/Dashboard/ReservationSummaryByDateRange?startDate=${start}&endDate=${end}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch");

      const data = await response.json();
      const rawData = data.result;
      
      const featuresArray = [
        rawData.reservations,
        rawData.pencilNotes,
        rawData.pendingApprovals,
        rawData.otherNotes,
      ];

      const reservationRate = rawData.totalItems
        ? ((rawData.reservations / rawData.totalItems) * 100).toFixed(2)
        : "0.00";
      const pencilNotesRate = rawData.totalItems
        ? ((rawData.pencilNotes / rawData.totalItems) * 100).toFixed(2)
        : "0.00";
      const pendingApprovalsRate = rawData.totalItems
        ? ((rawData.pendingApprovals / rawData.totalItems) * 100).toFixed(2)
        : "0.00";
      const otherNotesRate = rawData.totalItems
        ? ((rawData.otherNotes / rawData.totalItems) * 100).toFixed(2)
        : "0.00";

      const percentagesObject = {
        ReservationPercentage: reservationRate,
        PencilNotesPercentage: pencilNotesRate,
        PendingApprovalsPercentage: pendingApprovalsRate,
        OtherNotesPercentage: otherNotesRate,
      };

      await setFeatures(featuresArray);
      setValues(rawData);
      setPercentages(percentagesObject);

    } catch (error) {
      console.error("Error fetching:", error);
    }
  };

  useEffect(() => {
    fetchDashboard(startDate, endDate);
  }, []);

  const handleUpdate = (start, end) => {
    fetchDashboard(start, end);
  }

  return (
    <>
      <Card
        sx={{
          boxShadow: "none",
          borderRadius: "10px",
          p: "25px",
          mb: "15px",
        }}
      >

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid #EEF0F7",
            paddingBottom: "10px",
            mb: "20px",
          }}
          className="for-dark-bottom-border"
        >
          <Grid container>
            <Grid item lg={6} xs={12}>
              <Typography
                as="h3"
                sx={{
                  fontSize: 18,
                  fontWeight: 500,
                }}
              >
                Summery
              </Typography>

            </Grid>
            <Grid item xs={12} lg={6}>
              <Box display="flex" gap={2}>
                <Box display="flex" alignItems="center" gap={2}>
                  <Typography>Start Date</Typography>
                  <TextField value={startDate} size="small" type="date" onChange={(e) => {
                    setStartDate(e.target.value);
                    handleUpdate(e.target.value, endDate);
                  }} />
                </Box>
                <Box display="flex" alignItems="center" gap={2}>
                  <Typography>End Date</Typography>
                  <TextField value={endDate} size="small" type="date" onChange={(e) => {
                    setEndDate(e.target.value);
                    handleUpdate(startDate, e.target.value);
                  }
                  } />
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Box>
        <Grid container>
          <Grid item lg={6} xs={6}>
            <ReservationSummeryChart features={features} value={values?.totalItems} />
          </Grid>
          <Grid item lg={6} xs={6}>
            <ul className={styles.list}>
              <li>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <img src="/images/dashboard/reservation/1.png" width="22" alt="bitcoin" />
                  <Box sx={{ ml: "10px" }}>
                    <Typography
                      as="h5"
                      sx={{
                        fontSize: 15,
                        fontWeight: 500,
                      }}
                    >
                      Reservations
                    </Typography>

                    <Typography as="span">{percentages?.ReservationPercentage}%</Typography>
                  </Box>
                </Box>

                <Box textAlign="right">
                  <Typography as="p" fontWeight="500">
                    as of today
                  </Typography>
                  <Typography as="p" fontWeight="500" color="#00B69B">
                    {values?.reservations}
                  </Typography>
                </Box>
              </li>

              <li>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <img src="/images/dashboard/reservation/2.png" width="22" alt="ethereum" />
                  <Box sx={{ ml: "10px" }}>
                    <Typography
                      as="h5"
                      sx={{
                        fontSize: 15,
                        fontWeight: 500,
                      }}
                    >
                      Pencil Notes
                    </Typography>

                    <Typography as="span">{percentages?.PencilNotesPercentage}%</Typography>
                  </Box>
                </Box>

                <Box textAlign="right">
                  <Typography as="p" fontWeight="500">
                    as of today
                  </Typography>
                  <Typography as="p" fontWeight="500" color="#00B69B">
                    {values?.pencilNotes}
                  </Typography>
                </Box>
              </li>

              <li>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <img src="/images/dashboard/reservation/3.png" width="22" alt="comp-bidr" />
                  <Box sx={{ ml: "10px" }}>
                    <Typography
                      as="h5"
                      sx={{
                        fontSize: 15,
                        fontWeight: 500,
                      }}
                    >
                      Pending Payment Approval
                    </Typography>

                    <Typography as="span">{percentages?.PendingApprovalsPercentage}%</Typography>
                  </Box>
                </Box>

                <Box textAlign="right">
                  <Typography as="p" fontWeight="500">
                    as of today
                  </Typography>
                  <Typography as="p" fontWeight="500" color="#00B69B">
                    {values?.pendingApprovals}
                  </Typography>
                </Box>
              </li>

              <li>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <img src="/images/dashboard/reservation/4.png" width="22" alt="matic2" />
                  <Box sx={{ ml: "10px" }}>
                    <Typography
                      as="h5"
                      sx={{
                        fontSize: 15,
                        fontWeight: 500,
                      }}
                    >
                      Other Notes
                    </Typography>

                    <Typography as="span">{percentages?.OtherNotesPercentage}%</Typography>
                  </Box>
                </Box>

                <Box textAlign="right">
                  <Typography as="p" fontWeight="500">
                    as of today
                  </Typography>
                  <Typography as="p" fontWeight="500" color="#00B69B">
                    {values?.otherNotes}
                  </Typography>
                </Box>
              </li>
            </ul>
          </Grid>
        </Grid>
      </Card>
    </>
  );
};

export default Summery;
