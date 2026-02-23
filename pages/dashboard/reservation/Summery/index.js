import React, { useEffect, useState } from "react";
import { Box, Grid, Typography } from "@mui/material";
import Card from "@mui/material/Card";
import ReservationSummeryChart from "./ReservationSummeryChart";
import BarChartIcon from "@mui/icons-material/BarChart";
import styles from "./Summery.module.css";
import BASE_URL from "Base/api";

const getSLDateString = (date) => {
  const offsetMs = 5.5 * 60 * 60 * 1000;
  const slTime = new Date(date.getTime() + offsetMs);
  return slTime.toISOString().split('T')[0];
};

const Summery = ({ startDate: propStartDate, endDate: propEndDate }) => {
  const [features, setFeatures] = useState();
  const [values, setValues] = useState();
  const [percentages, setPercentages] = useState();

  const fetchDashboard = async (start, end) => {
    try {
      // Ensure dates are properly formatted (YYYY-MM-DD)
      const startDateFormatted = start ? new Date(start).toISOString().split('T')[0] : start;
      const endDateFormatted = end ? new Date(end).toISOString().split('T')[0] : end;
      
      const response = await fetch(
        `${BASE_URL}/Dashboard/ReservationSummaryByDateRange?startDate=${encodeURIComponent(startDateFormatted)}&endDate=${encodeURIComponent(endDateFormatted)}`,
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
    if (propStartDate && propEndDate) {
      fetchDashboard(propStartDate, propEndDate);
    }
  }, [propStartDate, propEndDate]);

  return (
    <>
      <Card
        sx={{
          background: "#FFFFFF",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
          borderRadius: "8px",
          p: "20px",
          mb: "15px",
          border: "1px solid rgba(0, 0, 0, 0.08)",
        }}
      >

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid rgba(0, 0, 0, 0.1)",
            paddingBottom: "12px",
            mb: "20px",
          }}
          className="for-dark-bottom-border"
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <BarChartIcon sx={{ fontSize: 20, color: "#475569" }} />
            <Typography
              as="h3"
              sx={{
                fontSize: 20,
                fontWeight: 600,
                color: "#1E293B",
              }}
            >
              Summary
            </Typography>
          </Box>
        </Box>
        <Grid container spacing={3}>
          <Grid item lg={6} xs={12}>
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
              <ReservationSummeryChart features={features} value={values?.totalItems} />
            </Box>
          </Grid>
          <Grid item lg={6} xs={12}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} lg={6}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    p: "16px",
                    borderRadius: "16px",
                    background: "linear-gradient(135deg, rgba(32, 191, 107, 0.08) 0%, rgba(1, 163, 164, 0.08) 100%)",
                    transition: "all 0.3s ease",
                    width: "100%",
                    "&:hover": {
                      background: "linear-gradient(135deg, rgba(32, 191, 107, 0.12) 0%, rgba(1, 163, 164, 0.12) 100%)",
                      transform: "translateX(4px)",
                    },
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: "6px",
                        background: "linear-gradient(135deg, #20BF6B 0%, #01A3A4 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "18px",
                        boxShadow: "0 2px 4px rgba(32, 191, 107, 0.3)",
                      }}
                    >
                      📅
                    </Box>
                    <Box>
                      <Typography
                        as="h5"
                        sx={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: "#1E293B",
                          mb: 0.5,
                        }}
                      >
                        Reservations
                      </Typography>
                      <Typography 
                        as="span" 
                        sx={{ 
                          fontSize: 12, 
                          fontWeight: 500,
                          color: "#20BF6B",
                        }}
                      >
                        {percentages?.ReservationPercentage}%
                      </Typography>
                    </Box>
                  </Box>

                  <Box textAlign="right">
                    <Typography 
                      as="p" 
                      sx={{ 
                        fontSize: 11, 
                        fontWeight: 500,
                        color: "#94A3B8",
                        mb: 0.5,
                      }}
                    >
                      as of today
                    </Typography>
                    <Typography 
                      as="p" 
                      sx={{ 
                        fontSize: 20, 
                        fontWeight: 700,
                        background: "linear-gradient(135deg, #20BF6B 0%, #01A3A4 100%)",
                        backgroundClip: "text",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                      }}
                    >
                      {values?.reservations}
                    </Typography>
                  </Box>
                </Box>
              </Grid>

              <Grid item xs={12} sm={6} lg={6}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    p: "20px",
                    borderRadius: "6px",
                    background: "rgba(95, 39, 205, 0.08)",
                    transition: "all 0.2s ease",
                    width: "100%",
                    border: "1px solid rgba(0, 0, 0, 0.08)",
                    "&:hover": {
                      background: "rgba(95, 39, 205, 0.12)",
                    },
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: "6px",
                        background: "linear-gradient(135deg, #5F27CD 0%, #341F97 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "18px",
                        boxShadow: "0 2px 4px rgba(95, 39, 205, 0.3)",
                      }}
                    >
                      ✏️
                    </Box>
                    <Box>
                      <Typography
                        as="h5"
                        sx={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: "#1E293B",
                          mb: 0.5,
                        }}
                      >
                        Pencil Notes
                      </Typography>
                      <Typography 
                        as="span" 
                        sx={{ 
                          fontSize: 13, 
                          fontWeight: 500,
                          color: "#5F27CD",
                        }}
                      >
                        {percentages?.PencilNotesPercentage}%
                      </Typography>
                    </Box>
                  </Box>

                  <Box textAlign="right">
                    <Typography 
                      as="p" 
                      sx={{ 
                        fontSize: 11, 
                        fontWeight: 500,
                        color: "#94A3B8",
                        mb: 0.5,
                      }}
                    >
                      as of today
                    </Typography>
                    <Typography 
                      as="p" 
                      sx={{ 
                        fontSize: 20, 
                        fontWeight: 700,
                        background: "linear-gradient(135deg, #5F27CD 0%, #341F97 100%)",
                        backgroundClip: "text",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                      }}
                    >
                      {values?.pencilNotes}
                    </Typography>
                  </Box>
                </Box>
              </Grid>

              <Grid item xs={12} sm={6} lg={6}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    p: "20px",
                    borderRadius: "6px",
                    background: "rgba(255, 107, 157, 0.08)",
                    transition: "all 0.2s ease",
                    width: "100%",
                    border: "1px solid rgba(0, 0, 0, 0.08)",
                    "&:hover": {
                      background: "rgba(255, 107, 157, 0.12)",
                    },
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: "6px",
                        background: "linear-gradient(135deg, #FF6B9D 0%, #C44569 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "18px",
                        boxShadow: "0 2px 4px rgba(255, 107, 157, 0.3)",
                      }}
                    >
                      ⏳
                    </Box>
                    <Box>
                      <Typography
                        as="h5"
                        sx={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: "#1E293B",
                          mb: 0.5,
                        }}
                      >
                        Pending Payment Approval
                      </Typography>
                      <Typography 
                        as="span" 
                        sx={{ 
                          fontSize: 13, 
                          fontWeight: 500,
                          color: "#FF6B9D",
                        }}
                      >
                        {percentages?.PendingApprovalsPercentage}%
                      </Typography>
                    </Box>
                  </Box>

                  <Box textAlign="right">
                    <Typography 
                      as="p" 
                      sx={{ 
                        fontSize: 11, 
                        fontWeight: 500,
                        color: "#94A3B8",
                        mb: 0.5,
                      }}
                    >
                      as of today
                    </Typography>
                    <Typography 
                      as="p" 
                      sx={{ 
                        fontSize: 20, 
                        fontWeight: 700,
                        background: "linear-gradient(135deg, #FF6B9D 0%, #C44569 100%)",
                        backgroundClip: "text",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                      }}
                    >
                      {values?.pendingApprovals}
                    </Typography>
                  </Box>
                </Box>
              </Grid>

              <Grid item xs={12} sm={6} lg={6}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    p: "20px",
                    borderRadius: "6px",
                    background: "rgba(254, 202, 87, 0.08)",
                    transition: "all 0.2s ease",
                    width: "100%",
                    border: "1px solid rgba(0, 0, 0, 0.08)",
                    "&:hover": {
                      background: "rgba(254, 202, 87, 0.12)",
                    },
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: "6px",
                        background: "linear-gradient(135deg, #FECA57 0%, #FF9FF3 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "18px",
                        boxShadow: "0 2px 4px rgba(254, 202, 87, 0.3)",
                      }}
                    >
                      📋
                    </Box>
                    <Box>
                      <Typography
                        as="h5"
                        sx={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: "#1E293B",
                          mb: 0.5,
                        }}
                      >
                        Other Notes
                      </Typography>
                      <Typography 
                        as="span" 
                        sx={{ 
                          fontSize: 13, 
                          fontWeight: 500,
                          color: "#FECA57",
                        }}
                      >
                        {percentages?.OtherNotesPercentage}%
                      </Typography>
                    </Box>
                  </Box>

                  <Box textAlign="right">
                    <Typography 
                      as="p" 
                      sx={{ 
                        fontSize: 11, 
                        fontWeight: 500,
                        color: "#94A3B8",
                        mb: 0.5,
                      }}
                    >
                      as of today
                    </Typography>
                    <Typography 
                      as="p" 
                      sx={{ 
                        fontSize: 20, 
                        fontWeight: 700,
                        background: "linear-gradient(135deg, #FECA57 0%, #FF9FF3 100%)",
                        backgroundClip: "text",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                      }}
                    >
                      {values?.otherNotes}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
            
            <Grid container spacing={2} sx={{ mt: 2 }}>
              <Grid item xs={12} sm={6} lg={6}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    p: "20px",
                    borderRadius: "6px",
                    background: "rgba(239, 68, 68, 0.08)",
                    transition: "all 0.2s ease",
                    width: "100%",
                    border: "1px solid rgba(0, 0, 0, 0.08)",
                    "&:hover": {
                      background: "rgba(239, 68, 68, 0.12)",
                    },
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: "6px",
                        background: "linear-gradient(135deg, #EF4444 0%, #DC2626 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "18px",
                        boxShadow: "0 2px 4px rgba(239, 68, 68, 0.3)",
                      }}
                    >
                      ❌
                    </Box>
                    <Box>
                      <Typography
                        as="h5"
                        sx={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: "#1E293B",
                          mb: 0.5,
                        }}
                      >
                        Rejected Reservations
                      </Typography>
                      <Typography 
                        as="span" 
                        sx={{ 
                          fontSize: 13, 
                          fontWeight: 500,
                          color: "#EF4444",
                        }}
                      >
                        {values?.rejectedReservations || 0}
                      </Typography>
                    </Box>
                  </Box>

                  <Box textAlign="right">
                    <Typography 
                      as="p" 
                      sx={{ 
                        fontSize: 11, 
                        fontWeight: 500,
                        color: "#94A3B8",
                        mb: 0.5,
                      }}
                    >
                      as of today
                    </Typography>
                    <Typography 
                      as="p" 
                      sx={{ 
                        fontSize: 20, 
                        fontWeight: 700,
                        background: "linear-gradient(135deg, #EF4444 0%, #DC2626 100%)",
                        backgroundClip: "text",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                      }}
                    >
                      {values?.rejectedReservations || 0}
                    </Typography>
                  </Box>
                </Box>
              </Grid>

              <Grid item xs={12} sm={6} lg={6}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    p: "20px",
                    borderRadius: "6px",
                    background: "rgba(251, 146, 60, 0.08)",
                    transition: "all 0.2s ease",
                    width: "100%",
                    border: "1px solid rgba(0, 0, 0, 0.08)",
                    "&:hover": {
                      background: "rgba(251, 146, 60, 0.12)",
                    },
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: "6px",
                        background: "linear-gradient(135deg, #FB923C 0%, #F97316 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "18px",
                        boxShadow: "0 2px 4px rgba(251, 146, 60, 0.3)",
                      }}
                    >
                      ⏸️
                    </Box>
                    <Box>
                      <Typography
                        as="h5"
                        sx={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: "#1E293B",
                          mb: 0.5,
                        }}
                      >
                        Postponed Reservations
                      </Typography>
                      <Typography 
                        as="span" 
                        sx={{ 
                          fontSize: 13, 
                          fontWeight: 500,
                          color: "#FB923C",
                        }}
                      >
                        {values?.postponedReservations || 0}
                      </Typography>
                    </Box>
                  </Box>

                  <Box textAlign="right">
                    <Typography 
                      as="p" 
                      sx={{ 
                        fontSize: 11, 
                        fontWeight: 500,
                        color: "#94A3B8",
                        mb: 0.5,
                      }}
                    >
                      as of today
                    </Typography>
                    <Typography 
                      as="p" 
                      sx={{ 
                        fontSize: 20, 
                        fontWeight: 700,
                        background: "linear-gradient(135deg, #FB923C 0%, #F97316 100%)",
                        backgroundClip: "text",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                      }}
                    >
                      {values?.postponedReservations || 0}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Card>
    </>
  );
};

export default Summery;
