import React, { useEffect, useState } from "react";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import styles from "@/styles/PageTitle.module.css";
import { SESSION_CATEGORY_ID, SECTION_TITLE_SX } from "@/components/Dashboard/ServiceManagement/constants";
import { ServiceDashboardProvider } from "@/components/Dashboard/ServiceManagement/ServiceDashboardProvider";
import DateRangeFilter, { DashboardHeaderSection } from "@/components/Dashboard/ServiceManagement/DateRangeFilter";
import StatCards from "@/components/Dashboard/ServiceManagement/StatCards";
import {
  JobStatusChart,
  JobPipelineBoard,
  RecentServiceRequests,
} from "@/components/Dashboard/ServiceManagement/jobs/JobSection";
import {
  StockSummaryCards,
  StockMovementChart,
  LowStockAlerts,
  RecentlyAddedItems,
} from "@/components/Dashboard/ServiceManagement/stock/StockSection";
import {
  FinanceSummaryCards,
  DailyMonthlyIncomeChart,
  ProfitSummaryCard,
} from "@/components/Dashboard/ServiceManagement/finance/FinanceSection";
import {
  TechnicianSummaryCards,
  TechnicianWorkloadChart,
  TechnicianAvailability,
} from "@/components/Dashboard/ServiceManagement/technicians/TechnicianSection";
import { CustomerSummaryCards } from "@/components/Dashboard/ServiceManagement/customers/CustomerSection";
import FreeServiceSection from "@/components/Dashboard/ServiceManagement/free-services/FreeServiceSection";

function getDefaultDateRange() {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const fmt = (d) => d.toISOString().split("T")[0];
  return { start: fmt(firstDay), end: fmt(lastDay) };
}

function Section({ title, children }) {
  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h5" sx={SECTION_TITLE_SX}>
        {title}
      </Typography>
      {children}
    </Box>
  );
}

function DashboardContent() {
  return (
    <>
      <Section title="Overview">
        <StatCards />
      </Section>

      <Section title="Service Jobs">
        <Grid container spacing={3}>
          <Grid item xs={12} lg={5}>
            <JobStatusChart />
          </Grid>
          <Grid item xs={12} lg={7}>
            <JobPipelineBoard />
          </Grid>
        </Grid>
        <RecentServiceRequests />
      </Section>

      <Section title="Free Service Entitlements">
        <FreeServiceSection />
      </Section>

      <Section title="Stock & Finance">
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: "#374151" }}>
            Stock Management
          </Typography>
          <StockSummaryCards />
        </Box>
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: "#374151" }}>
            Income & Expenses
          </Typography>
          <FinanceSummaryCards />
        </Box>
        <Grid container spacing={3}>
          <Grid item xs={12} lg={6}>
            <StockMovementChart />
          </Grid>
          <Grid item xs={12} lg={6}>
            <DailyMonthlyIncomeChart />
          </Grid>
          <Grid item xs={12} lg={4}>
            <LowStockAlerts />
          </Grid>
          <Grid item xs={12} lg={4}>
            <RecentlyAddedItems />
          </Grid>
          <Grid item xs={12} lg={4}>
            <ProfitSummaryCard />
          </Grid>
        </Grid>
      </Section>

      <Section title="Technicians & Customers">
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} lg={6}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: "#374151" }}>
              Technician Management
            </Typography>
            <TechnicianSummaryCards />
          </Grid>
          <Grid item xs={12} lg={6}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: "#374151" }}>
              Customer Management
            </Typography>
            <CustomerSummaryCards />
          </Grid>
        </Grid>
        <Grid container spacing={3}>
          <Grid item xs={12} lg={8}>
            <TechnicianWorkloadChart />
          </Grid>
          <Grid item xs={12} lg={4}>
            <TechnicianAvailability />
          </Grid>
        </Grid>
      </Section>
    </>
  );
}

export default function ServiceManagementDashboard() {
  const defaults = getDefaultDateRange();
  const [startDate, setStartDate] = useState(defaults.start);
  const [endDate, setEndDate] = useState(defaults.end);
  const [warehouseId, setWarehouseId] = useState(0);

  useEffect(() => {
    sessionStorage.setItem("category", String(SESSION_CATEGORY_ID));
  }, []);

  const reportStartDate = startDate;
  const reportEndDate = endDate;

  const titleRow = (
    <div className={styles.pageTitle} style={{ marginBottom: 0 }}>
      <h1>Service Management Dashboard</h1>
      <ul>
        <li>
          <Link href="/">Dashboard</Link>
        </li>
        <li>Service Management Dashboard</li>
      </ul>
    </div>
  );

  return (
    <Box sx={{ bgcolor: "#F9FAFB", minHeight: "100vh", pb: 4 }}>
      <Box sx={{ px: { xs: 2, sm: 3, md: 4 }, pt: 3 }}>
        <DashboardHeaderSection titleRow={titleRow}>
          <DateRangeFilter
            startDate={startDate}
            endDate={endDate}
            onStartChange={setStartDate}
            onEndChange={setEndDate}
            onWarehouseChange={setWarehouseId}
          />
        </DashboardHeaderSection>

        <ServiceDashboardProvider
          startDate={reportStartDate}
          endDate={reportEndDate}
          warehouseId={warehouseId}
        >
          <DashboardContent />
        </ServiceDashboardProvider>
      </Box>
    </Box>
  );
}
