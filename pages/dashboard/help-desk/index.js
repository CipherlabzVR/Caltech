import React, { useEffect } from "react";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import styles from "@/styles/PageTitle.module.css";
import StatCards from "./StatCards";
import DailySummary from "./DailySummary";
import DailyTicketFlow from "./DailyTicketFlow";
import TicketStatusChart from "./TicketStatusChart";
import PriorityDistribution from "./PriorityDistribution";
import TicketsByChannel from "./TicketsByChannel";
import CategoryBreakdown from "./CategoryBreakdown";
import ResponseTimeMetrics from "./ResponseTimeMetrics";
import CSATChart from "./CSATChart";
import RecentTickets from "./RecentTickets";
import AgentPerformanceTable from "./AgentPerformanceTable";
import TeamPerformance from "./TeamPerformance";
import DailyAgentActivity from "./DailyAgentActivity";
import SLAViolations from "./SLAViolations";
import SystemNotifications from "./SystemNotifications";

export default function HelpDeskDashboard() {
  useEffect(() => {
    sessionStorage.setItem("category", "108"); // Help Desk Dashboard
  }, []);

  return (
    <Box sx={{ bgcolor: "#F9FAFB", minHeight: "100vh", pb: 4 }}>
      <div className={styles.pageTitle}>
        <h1>Help Desk Dashboard</h1>
        <ul>
          <li>
            <Link href="/">Dashboard</Link>
          </li>
          <li>Help Desk Dashboard</li>
        </ul>
      </div>

      <Box sx={{ px: { xs: 2, sm: 3, md: 4 }, pt: 3 }}>
        {/* KPI Summary Cards */}
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 600,
              color: "#111827",
              mb: 3,
              fontSize: { xs: "1.25rem", md: "1.5rem" },
            }}
          >
            Key Performance Indicators
          </Typography>
          <StatCards />
        </Box>

        {/* Daily Summary */}
        <Box sx={{ mb: 4 }}>
          <DailySummary />
        </Box>

        {/* Daily Ticket Flow */}
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 600,
              color: "#111827",
              mb: 3,
              fontSize: { xs: "1.25rem", md: "1.5rem" },
            }}
          >
            Daily Ticket Trends
          </Typography>
          <DailyTicketFlow />
        </Box>

        {/* Analytics Section */}
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 600,
              color: "#111827",
              mb: 3,
              fontSize: { xs: "1.25rem", md: "1.5rem" },
            }}
          >
            Analytics & Insights
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} lg={6}>
              <TicketStatusChart />
            </Grid>
            <Grid item xs={12} lg={6}>
              <PriorityDistribution />
            </Grid>
            <Grid item xs={12} lg={6}>
              <TicketsByChannel />
            </Grid>
            <Grid item xs={12} lg={6}>
              <CategoryBreakdown />
            </Grid>
            <Grid item xs={12} lg={6}>
              <ResponseTimeMetrics />
            </Grid>
            <Grid item xs={12} lg={6}>
              <CSATChart />
            </Grid>
          </Grid>
        </Box>

        {/* Agent Performance & Activity */}
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 600,
              color: "#111827",
              mb: 3,
              fontSize: { xs: "1.25rem", md: "1.5rem" },
            }}
          >
            Team Performance
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} lg={8}>
              <AgentPerformanceTable />
            </Grid>
            <Grid item xs={12} lg={4}>
              <DailyAgentActivity />
            </Grid>
          </Grid>
        </Box>

        {/* Recent Activity & Alerts */}
        <Box>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 600,
              color: "#111827",
              mb: 3,
              fontSize: { xs: "1.25rem", md: "1.5rem" },
            }}
          >
            Recent Activity & Alerts
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} lg={8}>
              <RecentTickets />
            </Grid>
            <Grid item xs={12} lg={4}>
              <Grid container spacing={3} direction="column">
                <Grid item>
                  <SLAViolations />
                </Grid>
                <Grid item>
                  <SystemNotifications />
                </Grid>
                <Grid item>
                  <TeamPerformance />
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </Box>
  );
}
