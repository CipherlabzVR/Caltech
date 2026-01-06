import React from "react";
import Grid from "@mui/material/Grid";
import Link from "next/link";
import { useRouter } from "next/router";
import { Button, Card, CardContent, Typography, Box } from "@mui/material";
import styles from "@/styles/PageTitle.module.css";
import Features from "@/components/Dashboard/HelpDesk/Features";
import TicketsStatus from "@/components/Dashboard/HelpDesk/TicketsStatus";
import CustomerSatisfaction from "@/components/Dashboard/HelpDesk/CustomerSatisfaction";
import SupportStatus from "@/components/Dashboard/HelpDesk/SupportStatus";
import AverageSpeedOfAnswer from "@/components/Dashboard/HelpDesk/AverageSpeedOfAnswer";
import AgentPerformance from "@/components/Dashboard/HelpDesk/AgentPerformance";
import TimeToResolveComplaint from "@/components/Dashboard/HelpDesk/TimeToResolveComplaint";
import Activity from "@/components/Dashboard/HelpDesk/Activity";
import AssignmentIcon from "@mui/icons-material/Assignment";
import CategoryIcon from "@mui/icons-material/Category";

export default function HelpDesk() {
  const router = useRouter();

  return (
    <>
      {/* Page title */}
      <div className={styles.pageTitle}>
        <h1>Help/Support Desk</h1>
        <ul>
          <li>
            <Link href="/">Dashboard</Link>
          </li>
          <li>Help or Support Desk</li>
        </ul>
      </div>

      {/* Quick Actions */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <AssignmentIcon sx={{ fontSize: 40, mr: 2, color: "primary.main" }} />
                <Box>
                  <Typography variant="h6">Ticket Management</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Create, view, and manage support tickets
                  </Typography>
                </Box>
              </Box>
              <Button
                variant="contained"
                fullWidth
                onClick={() => router.push("/help-desk/tickets")}
              >
                Manage Tickets
              </Button>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <CategoryIcon sx={{ fontSize: 40, mr: 2, color: "primary.main" }} />
                <Box>
                  <Typography variant="h6">Categories</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Manage ticket categories
                  </Typography>
                </Box>
              </Box>
              <Button
                variant="contained"
                fullWidth
                onClick={() => router.push("/help-desk/categories")}
              >
                Manage Categories
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Features */}
      <Features />

      <Grid container rowSpacing={1} columnSpacing={{ xs: 1, sm: 2, md: 2 }}>
        <Grid item xs={12} md={12} lg={12} xl={8}>
          {/* TicketsStatus */}
          <TicketsStatus />
        </Grid>

        <Grid item xs={12} md={12} lg={12} xl={4}>
          {/* CustomerSatisfaction */}
          <CustomerSatisfaction />
        </Grid>
      </Grid>
 
      <Grid container rowSpacing={1} columnSpacing={{ xs: 1, sm: 2, md: 2 }}>
        <Grid item xs={12} md={12} lg={12} xl={8}>
          <Grid
            container
            columnSpacing={{ xs: 1, sm: 2, md: 2 }}
          >
            <Grid item xs={12} md={6} lg={6}>
              {/* AverageSpeedOfAnswer */}
              <AverageSpeedOfAnswer />

              {/* TimeToResolveComplaint */}
              <TimeToResolveComplaint />
            </Grid>

            <Grid item xs={12} md={6} lg={6}>
              {/* SupportStatus */}
              <SupportStatus />
            </Grid>
          </Grid>
        </Grid>

        <Grid item xs={12} md={12} lg={12} xl={4}>
          {/* Activity */}
          <Activity />
        </Grid>
      </Grid>

      {/* AgentPerformance */}
      <AgentPerformance />
    </>
  );
}
