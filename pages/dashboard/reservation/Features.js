import React, { useEffect, useState } from "react";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Typography from "@mui/material/Typography";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
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
      title: "Total Customers",
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
      amount: features?.totalPencilNotes || 0,
      title: "Total Pencil Notes",
      image: "/images/icon7.png",
      icon: <TrendingUpIcon />,
      growth: "+0.4%",
      growthText: "Current month",
      color: "warningColor",
    },
  ];

  return (
    <>
      <Grid
        container
        justifyContent="center"
        rowSpacing={1}
        columnSpacing={{ xs: 1, sm: 2, md: 2 }}
      >
        {FeaturesData.map((feature) => (
          <Grid item xs={12} sm={6} md={3} lg={3} key={feature.id}>
            <Card
              sx={{
                boxShadow: "none",
                borderRadius: "10px",
                p: "25px 20px",
                mb: "15px",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  mb: "15px",
                }}
              >
                <Box>
                  <Typography variant="h4" fontSize={16} fontWeight="500">
                    {feature.title}
                  </Typography>
                </Box>

                <Box>
                  {/* <img src={feature.image} alt="Graph" /> */}
                </Box>
              </Box>

              <Typography
                variant="h1"
                color="primary"
                sx={{
                  fontSize: 28,
                  fontWeight: 700,
                  mb: "20px",
                  textAlign: "center",
                }}
              >
                {feature.amount}
              </Typography>

              <Box>
                <Typography
                  sx={{
                    fontSize: "13px",
                    fontWeight: "500",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span>{feature.growthText}</span>
                  <span
                    style={{ display: "flex", alignItems: "center" }}
                    className={feature.color}
                  >
                    {/* {feature.icon}{" "} */}
                    {/* <span style={{ marginLeft: "5px" }}>{feature.growth}</span> */}
                  </span>
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
