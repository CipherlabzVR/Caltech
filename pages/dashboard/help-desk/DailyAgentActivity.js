import React, { useEffect, useState } from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Avatar from "@mui/material/Avatar";
import Chip from "@mui/material/Chip";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import BASE_URL from "Base/api";
import { formatDate } from "@/components/utils/formatHelper";

const DailyAgentActivity = () => {
  const [activities, setActivities] = useState([]);

  const fetchAgentActivity = async () => {
    try {
      const token = localStorage.getItem("token");
      const [teamResponse, ticketsResponse] = await Promise.all([
        fetch(`${BASE_URL}/HelpDesk/GetTeamPerformance`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${BASE_URL}/HelpDesk/GetAllTickets?SkipCount=0&MaxResultCount=10000&Search=null`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (teamResponse.ok && ticketsResponse.ok) {
        const team = await teamResponse.json();
        const tickets = await ticketsResponse.json();

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const activityList = team.result?.map((agent) => {
          const agentTickets = tickets.result?.items?.filter(
            (t) => t.assignedToUserId === agent.userId
          ) || [];

          const updatedToday = agentTickets.filter((t) => {
            if (!t.updatedOn) return false;
            const updated = new Date(t.updatedOn);
            updated.setHours(0, 0, 0, 0);
            return updated.getTime() === today.getTime();
          });

          const lastActivity = agentTickets
            .filter((t) => t.updatedOn)
            .sort((a, b) => new Date(b.updatedOn) - new Date(a.updatedOn))[0];

          return {
            agent,
            ticketsUpdated: updatedToday.length,
            lastActivity: lastActivity?.updatedOn || null,
            status: updatedToday.length > 0 ? "active" : "idle",
          };
        }) || [];

        setActivities(activityList.sort((a, b) => b.ticketsUpdated - a.ticketsUpdated));
      }
    } catch (error) {
      console.error("Error fetching agent activity:", error);
    }
  };

  useEffect(() => {
    fetchAgentActivity();
    const interval = setInterval(fetchAgentActivity, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  return (
    <Card
      sx={{
        bgcolor: "white",
        border: "1px solid #E5E7EB",
        borderRadius: 2,
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
      }}
    >
      <CardHeader
        title={
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              color: "#111827",
              fontSize: "1.125rem",
              letterSpacing: "-0.01em",
            }}
          >
            Today's Agent Activity
          </Typography>
        }
        sx={{ pb: 2, px: 3, pt: 3 }}
      />
      <CardContent sx={{ pt: 0, px: 3, pb: 3 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {activities.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 4 }}>
              <Typography variant="body2" sx={{ color: "#9CA3AF" }}>
                No activity data available
              </Typography>
            </Box>
          ) : (
            activities.map((activity, index) => (
              <Box
                key={activity.agent.userId || index}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  p: 2,
                  borderRadius: 2,
                  bgcolor: activity.status === "active" ? "#ECFDF5" : "#F9FAFB",
                  border: `1px solid ${activity.status === "active" ? "#D1FAE5" : "#E5E7EB"}`,
                }}
              >
                <Avatar
                  sx={{
                    bgcolor: activity.status === "active" ? "#10B981" : "#9CA3AF",
                    width: 40,
                    height: 40,
                    fontSize: "0.875rem",
                    fontWeight: 600,
                  }}
                >
                  {activity.agent.firstName?.[0] || activity.agent.userName?.[0] || "U"}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: "#111827", mb: 0.25 }}>
                    {activity.agent.firstName && activity.agent.lastName
                      ? `${activity.agent.firstName} ${activity.agent.lastName}`
                      : activity.agent.userName || "Unknown"}
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
                    <CheckCircleIcon sx={{ fontSize: 14, color: "#10B981" }} />
                    <Typography variant="caption" sx={{ color: "#6B7280", fontSize: "0.75rem" }}>
                      {activity.ticketsUpdated} tickets updated today
                    </Typography>
                  </Box>
                  {activity.lastActivity && (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.5 }}>
                      <AccessTimeIcon sx={{ fontSize: 12, color: "#9CA3AF" }} />
                      <Typography variant="caption" sx={{ color: "#9CA3AF", fontSize: "0.6875rem" }}>
                        Last activity: {formatDate(activity.lastActivity)}
                      </Typography>
                    </Box>
                  )}
                </Box>
                <Chip
                  label={activity.status === "active" ? "Active" : "Idle"}
                  size="small"
                  sx={{
                    bgcolor: activity.status === "active" ? "#D1FAE5" : "#F3F4F6",
                    color: activity.status === "active" ? "#065F46" : "#6B7280",
                    fontWeight: 500,
                    fontSize: "0.75rem",
                  }}
                />
              </Box>
            ))
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default DailyAgentActivity;

