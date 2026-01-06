import React, { useEffect, useState } from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Avatar from "@mui/material/Avatar";
import LinearProgress from "@mui/material/LinearProgress";
import BASE_URL from "Base/api";

const TeamPerformance = () => {
  const [teamData, setTeamData] = useState([]);

  const fetchTeamPerformance = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${BASE_URL}/HelpDesk/GetTeamPerformance`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to fetch");

      const result = await response.json();
      if (result.result) {
        setTeamData(result.result);
      }
    } catch (error) {
      console.error("Error fetching team performance:", error);
      setTeamData([]);
    }
  };

  useEffect(() => {
    fetchTeamPerformance();
  }, []);

  return (
    <Card
      sx={{
        height: "100%",
        bgcolor: "white",
        border: "1px solid #E5E7EB",
        borderRadius: 2,
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
        transition: "all 0.2s ease",
        "&:hover": {
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
        },
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
            Team Performance
          </Typography>
        }
        sx={{ pb: 2, px: 3, pt: 3 }}
      />
      <CardContent sx={{ pt: 0, px: 3, pb: 3 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {teamData.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 4 }}>
              <Typography variant="body2" sx={{ color: "#9CA3AF" }}>
                No team data available
              </Typography>
            </Box>
          ) : (
            teamData.map((member, index) => (
              <Box key={index}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    mb: 1.5,
                  }}
                >
                  <Avatar
                    sx={{
                      bgcolor: "#DBEAFE",
                      color: "#1E40AF",
                      fontWeight: 600,
                      width: 44,
                      height: 44,
                      fontSize: "0.875rem",
                    }}
                  >
                    {member.userName?.[0] || member.firstName?.[0] || "U"}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 600,
                        color: "#111827",
                        fontSize: "0.875rem",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        mb: 0.25,
                      }}
                    >
                      {member.firstName && member.lastName
                        ? `${member.firstName} ${member.lastName}`
                        : member.userName || "Unknown"}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ color: "#6B7280", fontSize: "0.75rem" }}
                    >
                      {member.resolvedTickets || 0} resolved of {member.totalTickets || 0} total
                    </Typography>
                  </Box>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 700,
                      color: "#111827",
                      fontSize: "1.125rem",
                    }}
                  >
                    {member.performancePercentage || 0}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={member.performancePercentage || 0}
                  sx={{
                    height: 10,
                    borderRadius: 5,
                    bgcolor: "#F3F4F6",
                    "& .MuiLinearProgress-bar": {
                      bgcolor: "#2563EB",
                      borderRadius: 5,
                    },
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

export default TeamPerformance;
