import React, { useEffect, useState } from "react";
import Grid from "@mui/material/Grid";
import Link from "next/link";
import { Button, Box } from "@mui/material";
import styles from "@/styles/PageTitle.module.css";
import Features from "@/components/Dashboard/ProjectManagement/Features";
import BASE_URL from "Base/api";
import TotalItems from "@/components/Dashboard/ProjectManagement/TotalItems";
import SalesAnalytics from "./SalesAnalytics";
import AudienceOverview from "./AudienceOverview";
import OutstandingCustomers from "./OutstandingCustomers";
import ShippingTargetData from "./ShippingTargetData";
import { formatCurrency, formatDateWithTime } from "@/components/utils/formatHelper";

export default function Dashboard() {
  const [features, setFeatures] = useState({});
  const [outstandingCustomers, setOutstandingCustomers] = useState([]);
  const [activeShifts, setActiveShifts] = useState([]);

  const fetchIncomeDetails = async () => {
    try {
      const response = await fetch(
        `${BASE_URL}/Receipt/GetPaymentTypeWiseTotal`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch");
      }

      const data = await response.json();
      setFeatures(data.result);
    } catch (error) {
      console.error("Error fetching:", error);
    }
  };

  const fetchOutstandingCustomers = async () => {
    try {
      const response = await fetch(
        `${BASE_URL}/Outstanding/GetAllOutstandingsGroupedByCustomer`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch");
      }

      const data = await response.json();
      setOutstandingCustomers(data.result);
    } catch (error) {
      console.error("Error fetching:", error);
    }
  };

  const fetchActiveShifts = async () => {
    try {
      const response = await fetch(
        `${BASE_URL}/Shift/GetAllActiveShifts`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch");
      }

      const data = await response.json();
      setActiveShifts(data.result || []);
    } catch (error) {
      console.error("Error fetching active shifts:", error);
      setActiveShifts([]);
    }
  };

  useEffect(() => {
    fetchIncomeDetails();
    fetchOutstandingCustomers();
    fetchActiveShifts();
  }, []);

  return (
    <>
      <div className={styles.pageTitle}>
        <h1>Dashboard</h1>
        <ul>
          <li>
            <Link href="/dashboard/main">Dashboard</Link>
          </li>
        </ul>
      </div>

      <Features features={features} />

      <Grid
        container
        rowSpacing={1}
        columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}
      >
        <Grid item xs={12} md={12} lg={6} xl={6}>

          <AudienceOverview />
          {/* <TotalItems /> */}
          <ShippingTargetData />
        </Grid>
        <Grid item xs={12} md={12} lg={6} xl={6}>
          {activeShifts.length > 0 && (
            <Grid container>
              <Grid item xs={12} mb={2}>
                <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                  {activeShifts.map((shift, index) => (
                    <Button
                      key={index}
                      variant="contained"
                      disabled
                      sx={{
                        backgroundColor: "#4caf50",
                        color: "#fff",
                        textTransform: "none",
                        borderRadius: "8px",
                        px: 2,
                        py: 1,
                        fontSize: "12px",
                        fontWeight: 500,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-start",
                        minWidth: "auto",
                        "&:disabled": {
                          backgroundColor: "#81c784",
                          color: "#fff",
                        },
                      }}
                    >
                      <Box sx={{ fontWeight: 600, fontSize: "12px" }}>
                        {shift.createdByUser}
                      </Box>
                      <Box sx={{ fontSize: "18px", fontWeight: 600 }}>
                        Rs. {formatCurrency(shift.totalAmount)}
                      </Box>
                      <Box sx={{ fontSize: "11px", opacity: 0.9 }}>
                        {formatDateWithTime(shift.startTime)}
                      </Box>
                    </Button>
                  ))}
                </Box>
              </Grid>
            </Grid>
          )}
          <OutstandingCustomers outstandingCustomers={outstandingCustomers} />
          <SalesAnalytics />

        </Grid>
      </Grid>
    </>
  );
}
