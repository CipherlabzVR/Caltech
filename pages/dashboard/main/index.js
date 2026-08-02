import React, { useEffect, useState } from "react";
import Grid from "@mui/material/Grid";
import Link from "next/link";
import { Button, Box } from "@mui/material";
import styles from "@/styles/PageTitle.module.css";
import Features from "@/components/Dashboard/ProjectManagement/Features";
import BASE_URL from "Base/api";
import SalesAnalytics from "./SalesAnalytics";
import AudienceOverview from "./AudienceOverview";
import OutstandingCustomers from "./OutstandingCustomers";
import VirtualBankAccounts from "./VirtualBankAccounts";
import ShippingTargetData from "./ShippingTargetData";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import IsAppSettingEnabled from "@/components/utils/IsAppSettingEnabled";
import useDashboardWidgetPermissions from "@/components/utils/useDashboardWidgetPermissions";
import { formatCurrency, formatDateWithTime } from "@/components/utils/formatHelper";

const MAIN_DASHBOARD_CATEGORY_ID = 39;

export default function Dashboard() {
  const [features, setFeatures] = useState({});
  const [outstandingCustomers, setOutstandingCustomers] = useState([]);
  const [activeShifts, setActiveShifts] = useState([]);
  const [virtualBankBalances, setVirtualBankBalances] = useState([]);
  const { approve1: hasApprovalLevel1 } = IsPermissionEnabled(MAIN_DASHBOARD_CATEGORY_ID);
  const { data: isSafeAccountEnable } = IsAppSettingEnabled("isSafeaccountenable");
  const widgets = useDashboardWidgetPermissions();

  const authHeaders = {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
    "Content-Type": "application/json",
  };

  const fetchIncomeDetails = async () => {
    try {
      const response = await fetch(`${BASE_URL}/Receipt/GetPaymentTypeWiseTotal`, {
        method: "GET",
        headers: authHeaders,
      });

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
          headers: authHeaders,
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch");
      }

      const data = await response.json();
      const items = data.result ?? [];
      setOutstandingCustomers(
        items.map((item) => ({
          customerId: item.customerId,
          customerName: item.customerName,
          companyName: item.companyName ?? item.CompanyName ?? "",
          totalOutstanding: item.totalOutstanding,
          outstandingAmount: item.totalOutstanding,
        }))
      );
    } catch (error) {
      console.error("Error fetching:", error);
      setOutstandingCustomers([]);
    }
  };

  const fetchActiveShifts = async () => {
    try {
      const response = await fetch(`${BASE_URL}/Shift/GetAllActiveShifts`, {
        method: "GET",
        headers: authHeaders,
      });

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

  const fetchVirtualBankBalances = async () => {
    try {
      const response = await fetch(`${BASE_URL}/Bank/GetVirtualBankBalances`, {
        method: "GET",
        headers: authHeaders,
      });

      if (!response.ok) {
        throw new Error("Failed to fetch");
      }

      const data = await response.json();
      setVirtualBankBalances(data.result || []);
    } catch (error) {
      console.error("Error fetching virtual bank balances:", error);
      setVirtualBankBalances([]);
    }
  };

  useEffect(() => {
    fetchIncomeDetails();
  }, []);

  useEffect(() => {
    fetchActiveShifts();
  }, []);

  useEffect(() => {
    fetchOutstandingCustomers();
  }, []);

  useEffect(() => {
    if (isSafeAccountEnable) {
      fetchVirtualBankBalances();
    }
  }, [isSafeAccountEnable]);

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

      {widgets.paymentSummary && (
        <Features features={features} periodLabel="Payments this month" />
      )}

      <Grid
        container
        rowSpacing={1}
        columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}
      >
        <Grid item xs={12} md={12} lg={6} xl={6}>
          {widgets.salesSummary && hasApprovalLevel1 && <AudienceOverview />}
          {widgets.shippingTarget && <ShippingTargetData />}
        </Grid>
        <Grid item xs={12} md={12} lg={6} xl={6}>
          {widgets.activeShifts && activeShifts.length > 0 && (
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
          {widgets.outstandingCustomers && (
            <OutstandingCustomers outstandingCustomers={outstandingCustomers} />
          )}
          {widgets.stockBalance && <SalesAnalytics />}
        </Grid>
      </Grid>

      {isSafeAccountEnable && virtualBankBalances.length > 0 && (
        <VirtualBankAccounts virtualBanks={virtualBankBalances} />
      )}
    </>
  );
}
