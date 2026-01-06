import React, { useEffect, useState } from "react";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import {
  Assignment,
  CheckCircle,
  Pending,
  Warning,
  TrendingUp,
  TrendingDown,
  AccessTime,
  DoneAll,
  HourglassEmpty,
  Person,
} from "@mui/icons-material";
import BASE_URL from "Base/api";
import TicketListModal from "./TicketListModal";

const StatCards = () => {
  const [stats, setStats] = useState({
    totalTickets: 0,
    openTickets: 0,
    inProgressTickets: 0,
    resolvedTickets: 0,
    closedTickets: 0,
    onHoldTickets: 0,
    averageResponseTime: 0,
    averageResolutionTime: 0,
  });

  const [todayStats, setTodayStats] = useState({
    openToday: 0,
    pendingToday: 0,
    overdueToday: 0,
    resolvedToday: 0,
    activeAgents: 0,
  });

  const [previousDayStats, setPreviousDayStats] = useState({
    openToday: 0,
    resolvedToday: 0,
  });

  const [allTickets, setAllTickets] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [filteredTickets, setFilteredTickets] = useState([]);

  const fetchStats = async () => {
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

      if (statsResponse.ok) {
        const data = await statsResponse.json();
        if (data.result) {
          setStats(data.result);
        }
      }

      if (ticketsResponse.ok && teamResponse.ok) {
        const tickets = await ticketsResponse.json();
        const team = await teamResponse.json();

        const ticketsList = tickets.result?.items || [];
        setAllTickets(ticketsList);

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const todayTickets = ticketsList.filter((t) => {
          const created = new Date(t.createdOn);
          created.setHours(0, 0, 0, 0);
          return created.getTime() === today.getTime();
        });

        const yesterdayTickets = ticketsList.filter((t) => {
          const created = new Date(t.createdOn);
          created.setHours(0, 0, 0, 0);
          return created.getTime() === yesterday.getTime();
        });

        const resolvedToday = ticketsList.filter((t) => {
          if (!t.updatedOn) return false;
          const updated = new Date(t.updatedOn);
          updated.setHours(0, 0, 0, 0);
          return updated.getTime() === today.getTime() && (t.status === 3 || t.status === 4);
        });

        const resolvedYesterday = ticketsList.filter((t) => {
          if (!t.updatedOn) return false;
          const updated = new Date(t.updatedOn);
          updated.setHours(0, 0, 0, 0);
          return updated.getTime() === yesterday.getTime() && (t.status === 3 || t.status === 4);
        });

        const pendingToday = ticketsList.filter((t) => {
          return t.status === 2 && new Date(t.createdOn).setHours(0, 0, 0, 0) <= today.getTime();
        });

        const overdueToday = ticketsList.filter((t) => {
          if (!t.dueDate) return false;
          const dueDate = new Date(t.dueDate);
          return dueDate < today && (t.status === 1 || t.status === 2);
        });

        setTodayStats({
          openToday: todayTickets.length,
          pendingToday: pendingToday.length,
          overdueToday: overdueToday.length,
          resolvedToday: resolvedToday.length,
          activeAgents: team.result?.length || 0,
        });

        setPreviousDayStats({
          openToday: yesterdayTickets.length,
          resolvedToday: resolvedYesterday.length,
        });
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const calculatePercentageChange = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  const handleCardClick = (cardType) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let filtered = [];

    switch (cardType) {
      case "open":
        // Show all open tickets (status = 1)
        filtered = allTickets.filter((t) => t.status === 1);
        setModalTitle("Open Tickets");
        break;
      case "pending":
        // Show all pending/in-progress tickets (status = 2)
        filtered = allTickets.filter((t) => t.status === 2);
        setModalTitle("Pending Tickets");
        break;
      case "overdue":
        // Show all overdue tickets
        filtered = allTickets.filter((t) => {
          if (!t.dueDate) return false;
          const dueDate = new Date(t.dueDate);
          return dueDate < today && (t.status === 1 || t.status === 2);
        });
        setModalTitle("Overdue Tickets");
        break;
      case "resolved":
        // Show tickets resolved today
        filtered = allTickets.filter((t) => {
          if (!t.updatedOn) return false;
          const updated = new Date(t.updatedOn);
          updated.setHours(0, 0, 0, 0);
          return updated.getTime() === today.getTime() && (t.status === 3 || t.status === 4);
        });
        setModalTitle("Resolved Today");
        break;
      case "avgResolution":
        // For average resolution time, show all resolved/closed tickets
        filtered = allTickets.filter((t) => t.status === 3 || t.status === 4);
        setModalTitle("Resolved Tickets (All Time)");
        break;
      case "activeAgents":
        // For active agents, don't show tickets
        return;
      default:
        return;
    }

    setFilteredTickets(filtered);
    setModalOpen(true);
  };

  // Calculate total counts for each category
  // Use calculated values from allTickets if available, otherwise fall back to API stats
  const totalOpenTickets = allTickets.length > 0 
    ? allTickets.filter((t) => t.status === 1).length 
    : stats.openTickets;
  const totalPendingTickets = allTickets.length > 0
    ? allTickets.filter((t) => t.status === 2).length
    : stats.inProgressTickets;
  const totalOverdueTickets = allTickets.length > 0
    ? allTickets.filter((t) => {
        if (!t.dueDate) return false;
        const dueDate = new Date(t.dueDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return dueDate < today && (t.status === 1 || t.status === 2);
      }).length
    : todayStats.overdueToday;
  const totalResolvedTickets = allTickets.filter((t) => t.status === 3 || t.status === 4).length;

  const statCards = [
    {
      title: "Open Tickets",
      value: totalOpenTickets,
      todayValue: todayStats.openToday,
      change: calculatePercentageChange(todayStats.openToday, previousDayStats.openToday),
      icon: <Pending />,
      color: "#3B82F6",
      bgColor: "#EFF6FF",
      iconBg: "#DBEAFE",
      cardType: "open",
      clickable: true,
    },
    {
      title: "Pending Tickets",
      value: totalPendingTickets,
      todayValue: todayStats.pendingToday,
      change: 0,
      icon: <AccessTime />,
      color: "#F59E0B",
      bgColor: "#FFFBEB",
      iconBg: "#FEF3C7",
      cardType: "pending",
      clickable: true,
    },
    {
      title: "Overdue Tickets",
      value: totalOverdueTickets,
      todayValue: todayStats.overdueToday,
      change: 0,
      icon: <Warning />,
      color: "#EF4444",
      bgColor: "#FEF2F2",
      iconBg: "#FEE2E2",
      cardType: "overdue",
      clickable: true,
    },
    {
      title: "Resolved Today",
      value: stats.resolvedTickets,
      todayValue: todayStats.resolvedToday,
      change: calculatePercentageChange(todayStats.resolvedToday, previousDayStats.resolvedToday),
      icon: <CheckCircle />,
      color: "#10B981",
      bgColor: "#ECFDF5",
      iconBg: "#D1FAE5",
      cardType: "resolved",
      clickable: true,
    },
    {
      title: "Avg Resolution Time",
      value: `${stats.averageResolutionTime}h`,
      todayValue: `${stats.averageResolutionTime}h`,
      change: -5,
      icon: <TrendingUp />,
      color: "#8B5CF6",
      bgColor: "#F5F3FF",
      iconBg: "#EDE9FE",
      cardType: "avgResolution",
      clickable: true,
    },
    {
      title: "Active Agents",
      value: todayStats.activeAgents,
      todayValue: todayStats.activeAgents,
      change: 0,
      icon: <Person />,
      color: "#6366F1",
      bgColor: "#EEF2FF",
      iconBg: "#E0E7FF",
      cardType: "activeAgents",
      clickable: false,
    },
  ];

  return (
    <Grid container spacing={3}>
      {statCards.map((card, index) => (
        <Grid item xs={12} sm={6} md={4} lg={4} xl={2} key={index}>
          <Card
            onClick={() => card.clickable && handleCardClick(card.cardType)}
            sx={{
              height: "100%",
              bgcolor: "white",
              border: "1px solid #E5E7EB",
              borderRadius: 2,
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
              transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
              position: "relative",
              overflow: "hidden",
              cursor: card.clickable ? "pointer" : "default",
              "&:hover": {
                boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
                transform: card.clickable ? "translateY(-4px)" : "none",
                borderColor: card.color,
              },
              "&::before": {
                content: '""',
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "3px",
                bgcolor: card.color,
                opacity: 0,
                transition: "opacity 0.2s ease",
              },
              "&:hover::before": {
                opacity: card.clickable ? 1 : 0,
              },
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  mb: 2.5,
                }}
              >
                <Box
                  sx={{
                    bgcolor: card.iconBg,
                    borderRadius: 2,
                    p: 1.5,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: card.color,
                    width: 56,
                    height: 56,
                  }}
                >
                  {React.cloneElement(card.icon, { sx: { fontSize: 28 } })}
                </Box>
                {card.change !== 0 && (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                      bgcolor: card.change > 0 ? (card.title.includes("Overdue") || card.title.includes("Pending") ? "#FEE2E2" : "#D1FAE5") : "#FEE2E2",
                      px: 1,
                      py: 0.5,
                      borderRadius: 1,
                    }}
                  >
                    {card.change > 0 ? (
                      card.title.includes("Overdue") || card.title.includes("Pending") ? (
                        <TrendingUp sx={{ fontSize: 14, color: "#DC2626" }} />
                      ) : (
                        <TrendingUp sx={{ fontSize: 14, color: "#059669" }} />
                      )
                    ) : (
                      <TrendingDown sx={{ fontSize: 14, color: "#DC2626" }} />
                    )}
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 600,
                        fontSize: "0.75rem",
                        color: card.change > 0 ? (card.title.includes("Overdue") || card.title.includes("Pending") ? "#DC2626" : "#059669") : "#DC2626",
                      }}
                    >
                      {Math.abs(card.change)}%
                    </Typography>
                  </Box>
                )}
              </Box>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  mb: 0.5,
                  fontSize: { xs: "1.75rem", md: "2.125rem" },
                  color: "#111827",
                  lineHeight: 1.2,
                }}
              >
                {card.value}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: "#6B7280",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  letterSpacing: "0.01em",
                  mb: 0.5,
                }}
              >
                {card.title}
              </Typography>
              {card.todayValue !== undefined && card.todayValue !== card.value && (
                <Typography
                  variant="caption"
                  sx={{
                    color: "#9CA3AF",
                    fontSize: "0.75rem",
                  }}
                >
                  Today: {card.todayValue}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      ))}
      <TicketListModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalTitle}
        tickets={filteredTickets}
      />
    </Grid>
  );
};

export default StatCards;
