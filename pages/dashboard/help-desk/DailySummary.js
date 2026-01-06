import React, { useEffect, useState } from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Divider from "@mui/material/Divider";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PersonIcon from "@mui/icons-material/Person";
import BASE_URL from "Base/api";

const DailySummary = () => {
  const [summary, setSummary] = useState({
    newTicketsToday: 0,
    closedTicketsToday: 0,
    slaMet: 0,
    avgResponseTime: 0,
    topAgent: null,
    mostCommonIssue: null,
  });

  const fetchDailySummary = async () => {
    try {
      const token = localStorage.getItem("token");
      const [statsResponse, ticketsResponse, teamResponse] = await Promise.all([
        fetch(`${BASE_URL}/HelpDesk/GetDashboardStats`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${BASE_URL}/HelpDesk/GetAllTickets?SkipCount=0&MaxResultCount=10000&Search=null`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${BASE_URL}/HelpDesk/GetTeamPerformance`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (statsResponse.ok && ticketsResponse.ok && teamResponse.ok) {
        const stats = await statsResponse.json();
        const tickets = await ticketsResponse.json();
        const team = await teamResponse.json();

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todayTickets = tickets.result?.items?.filter((t) => {
          const created = new Date(t.createdOn);
          created.setHours(0, 0, 0, 0);
          return created.getTime() === today.getTime();
        }) || [];

        const closedToday = tickets.result?.items?.filter((t) => {
          if (!t.updatedOn) return false;
          const updated = new Date(t.updatedOn);
          updated.setHours(0, 0, 0, 0);
          return updated.getTime() === today.getTime() && (t.status === 3 || t.status === 4);
        }) || [];

        const topAgent = team.result?.[0] || null;
        const categories = {};
        tickets.result?.items?.forEach((t) => {
          if (t.category?.name) {
            categories[t.category.name] = (categories[t.category.name] || 0) + 1;
          }
        });
        const mostCommonIssue = Object.entries(categories).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

        setSummary({
          newTicketsToday: todayTickets.length,
          closedTicketsToday: closedToday.length,
          slaMet: stats.result ? Math.round((closedToday.length / Math.max(todayTickets.length, 1)) * 100) : 0,
          avgResponseTime: stats.result?.averageResponseTime || 0,
          topAgent: topAgent
            ? `${topAgent.firstName || ""} ${topAgent.lastName || ""}`.trim() || topAgent.userName
            : "N/A",
          mostCommonIssue,
        });
      }
    } catch (error) {
      console.error("Error fetching daily summary:", error);
    }
  };

  useEffect(() => {
    fetchDailySummary();
  }, []);

  const summaryItems = [
    {
      label: "New Tickets Today",
      value: summary.newTicketsToday,
      icon: <CheckCircleIcon sx={{ color: "#2563EB" }} />,
    },
    {
      label: "Closed Today",
      value: summary.closedTicketsToday,
      icon: <CheckCircleIcon sx={{ color: "#10B981" }} />,
    },
    {
      label: "SLA Met",
      value: `${summary.slaMet}%`,
      icon: <CheckCircleIcon sx={{ color: summary.slaMet >= 80 ? "#10B981" : "#F59E0B" }} />,
    },
    {
      label: "Avg Response Time",
      value: `${summary.avgResponseTime}h`,
      icon: <CheckCircleIcon sx={{ color: "#8B5CF6" }} />,
    },
    {
      label: "Top Agent",
      value: summary.topAgent,
      icon: <PersonIcon sx={{ color: "#EC4899" }} />,
    },
    {
      label: "Most Common Issue",
      value: summary.mostCommonIssue,
      icon: <CheckCircleIcon sx={{ color: "#6366F1" }} />,
    },
  ];

  return (
    <Card
      sx={{
        bgcolor: "white",
        border: "1px solid #E5E7EB",
        borderRadius: 2,
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Typography
          variant="h6"
          sx={{
            mb: 3,
            fontWeight: 600,
            color: "#111827",
            fontSize: "1.125rem",
            letterSpacing: "-0.01em",
          }}
        >
          Daily Performance Summary
        </Typography>
        <Grid container spacing={2}>
          {summaryItems.map((item, index) => (
            <React.Fragment key={index}>
              <Grid item xs={6} sm={4}>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    textAlign: "center",
                    p: 2,
                    borderRadius: 2,
                    bgcolor: "#F9FAFB",
                    transition: "all 0.2s ease",
                    "&:hover": {
                      bgcolor: "#F3F4F6",
                    },
                  }}
                >
                  <Box sx={{ mb: 1 }}>{item.icon}</Box>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 700,
                      color: "#111827",
                      fontSize: "1.25rem",
                      mb: 0.5,
                    }}
                  >
                    {item.value}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: "#6B7280",
                      fontSize: "0.75rem",
                      fontWeight: 500,
                    }}
                  >
                    {item.label}
                  </Typography>
                </Box>
              </Grid>
              {index < summaryItems.length - 1 && (index + 1) % 3 === 0 && (
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                </Grid>
              )}
            </React.Fragment>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
};

export default DailySummary;

