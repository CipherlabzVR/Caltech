import React, { useEffect, useState } from "react";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Typography from "@mui/material/Typography";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import PeopleIcon from "@mui/icons-material/People";
import CancelIcon from "@mui/icons-material/Cancel";
import EditNoteIcon from "@mui/icons-material/EditNote";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import BASE_URL from "Base/api";
import { formatCurrency } from "@/components/utils/formatHelper";

const Features = () => {
  const [features, setFeatures] = useState();
  const fetchDashboard = async () => {
    try {
      const response = await fetch(
        `${BASE_URL}/Dashboard/ReservationDashboard`,
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
      setFeatures(data.result);
    } catch (error) {
      console.error("Error fetching:", error);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const FeaturesData = [
    {
      id: "1",
      amount: `Rs. ${formatCurrency(features?.totalIncome || 0)}`,
      title: "Total Income",
      image: "/images/icon5.png",
      icon: <TrendingUpIcon />,
      growth: "+1.3%",
      growthText: "Current month",
      color: "successColor",
    },
    {
      id: "2",
      amount: features?.totalCustomers || 0,
      title: "No of Reservations",
      image: "/images/icon6.png",
      icon: <TrendingDownIcon />,
      growth: "-2.5%",
      growthText: "Current month",
      color: "dangerColor",
    },
    {
      id: "3",
      amount: features?.totalRejectedReservations || 0,
      title: "Rejected Reservations",
      image: "/images/icon7.png",
      icon: <TrendingUpIcon />,
      growth: "+0.4%",
      growthText: "Current month",
      color: "successColor",
    },
    {
      id: "4",
      amount: features?.totalPostponed || 0,
      title: "Total Postponed",
      image: "/images/icon7.png",
      icon: <TrendingUpIcon />,
      growth: "+0.4%",
      growthText: "Current month",
      color: "warningColor",
    },
  ];

  const cardGradients = [
    "linear-gradient(135deg, #20BF6B 0%, #01A3A4 100%)", // Green/teal for Total Income
    "linear-gradient(135deg, #5F27CD 0%, #341F97 100%)", // Blue/purple for No of Reservations
    "linear-gradient(135deg, #FF6B9D 0%, #C44569 100%)", // Pink for Rejected Reservations
    "linear-gradient(135deg, #FECA57 0%, #FF9FF3 100%)", // Yellow/orange for Total Postponed
  ];

  const cardBackgrounds = [
    "linear-gradient(135deg, #E8F8F5 0%, #D5F4E6 100%)", // Light green/teal
    "linear-gradient(135deg, #E8E3F3 0%, #DDD6F7 100%)", // Light blue/purple
    "linear-gradient(135deg, #FFE5EC 0%, #FFD6E0 100%)", // Light pink
    "linear-gradient(135deg, #FFF5E6 0%, #FFE8CC 100%)", // Light yellow/orange
  ];

  const cardIcons = [
    <AttachMoneyIcon sx={{ fontSize: 24, color: "#FFFFFF" }} />,
    <PeopleIcon sx={{ fontSize: 24, color: "#FFFFFF" }} />,
    <CancelIcon sx={{ fontSize: 24, color: "#FFFFFF" }} />,
    <EditNoteIcon sx={{ fontSize: 24, color: "#FFFFFF" }} />,
  ];

  return (
    <>
      <Grid
        container
        justifyContent="center"
        rowSpacing={2}
        columnSpacing={{ xs: 2, sm: 2, md: 3 }}
      >
        {FeaturesData.map((feature, index) => (
          <Grid item xs={12} sm={6} md={6} lg={3} key={feature.id}>
            <Card
              sx={{
                background: cardBackgrounds[index],
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                borderRadius: "8px",
                p: "16px",
                mb: "15px",
                border: "1px solid rgba(0, 0, 0, 0.08)",
                transition: "all 0.2s ease",
                position: "relative",
                overflow: "hidden",
                height: "100%",
                "&:hover": {
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                },
                "&::before": {
                  content: '""',
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: "3px",
                  background: cardGradients[index],
                  borderRadius: "8px 8px 0 0",
                },
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  mb: "12px",
                }}
              >
                <Box sx={{ flex: 1 }}>
                  <Typography
                    variant="h4"
                    sx={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#64748B",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    {feature.title}
                  </Typography>
                </Box>

                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: "6px",
                    background: cardGradients[index],
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: `0 2px 4px ${cardGradients[index]}40`,
                  }}
                >
                  {cardIcons[index]}
                </Box>
              </Box>

              <Typography
                variant="h1"
                sx={{
                  fontSize: 28,
                  fontWeight: 700,
                  mb: "12px",
                  background: cardGradients[index],
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  textAlign: "left",
                  lineHeight: 1.2,
                }}
              >
                {feature.amount}
              </Typography>

              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  pt: "8px",
                  borderTop: "1px solid rgba(0, 0, 0, 0.08)",
                }}
              >
                <CalendarMonthIcon sx={{ fontSize: 14, color: "#94A3B8" }} />
                <Typography
                  sx={{
                    fontSize: "12px",
                    fontWeight: 500,
                    color: "#64748B",
                  }}
                >
                  {feature.growthText}
                </Typography>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>
    </>
  );
};

export default Features;
