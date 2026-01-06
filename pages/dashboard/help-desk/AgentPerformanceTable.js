import React, { useEffect, useState } from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Avatar from "@mui/material/Avatar";
import Rating from "@mui/material/Rating";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import BASE_URL from "Base/api";

const AgentPerformanceTable = () => {
  const [agentData, setAgentData] = useState([]);
  const [filter, setFilter] = useState("week");

  const fetchAgentPerformance = async () => {
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
        // Calculate additional metrics
        const enhancedData = result.result.map((agent) => {
          const avgResponseTime = Math.floor(Math.random() * 30) + 5; // Mock data - replace with actual calculation
          const rating = 3.5 + Math.random() * 1.5; // Mock rating - replace with actual CSAT data
          return {
            ...agent,
            avgResponseTime,
            rating: parseFloat(rating.toFixed(1)),
          };
        });
        setAgentData(enhancedData);
      }
    } catch (error) {
      console.error("Error fetching agent performance:", error);
      setAgentData([]);
    }
  };

  useEffect(() => {
    fetchAgentPerformance();
  }, [filter]);

  const handleFilterChange = (event, newFilter) => {
    if (newFilter !== null) {
      setFilter(newFilter);
    }
  };

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
            Agent Performance
          </Typography>
        }
        action={
          <ToggleButtonGroup
            value={filter}
            exclusive
            onChange={handleFilterChange}
            size="small"
            sx={{
              "& .MuiToggleButton-root": {
                px: 1.5,
                py: 0.5,
                fontSize: "0.75rem",
                borderColor: "#E5E7EB",
                color: "#6B7280",
                "&.Mui-selected": {
                  bgcolor: "#2563EB",
                  color: "white",
                  "&:hover": {
                    bgcolor: "#1D4ED8",
                  },
                },
              },
            }}
          >
            <ToggleButton value="today">Today</ToggleButton>
            <ToggleButton value="week">This Week</ToggleButton>
            <ToggleButton value="month">This Month</ToggleButton>
          </ToggleButtonGroup>
        }
        sx={{ pb: 2, px: 3, pt: 3 }}
      />
      <CardContent sx={{ pt: 0, px: 3, pb: 3 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: "#F9FAFB" }}>
                <TableCell
                  sx={{
                    fontWeight: 600,
                    fontSize: "0.75rem",
                    color: "#374151",
                    borderBottom: "1px solid #E5E7EB",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    py: 1.5,
                  }}
                >
                  Agent
                </TableCell>
                <TableCell
                  align="center"
                  sx={{
                    fontWeight: 600,
                    fontSize: "0.75rem",
                    color: "#374151",
                    borderBottom: "1px solid #E5E7EB",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    py: 1.5,
                  }}
                >
                  Assigned
                </TableCell>
                <TableCell
                  align="center"
                  sx={{
                    fontWeight: 600,
                    fontSize: "0.75rem",
                    color: "#374151",
                    borderBottom: "1px solid #E5E7EB",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    py: 1.5,
                  }}
                >
                  Resolved
                </TableCell>
                <TableCell
                  align="center"
                  sx={{
                    fontWeight: 600,
                    fontSize: "0.75rem",
                    color: "#374151",
                    borderBottom: "1px solid #E5E7EB",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    py: 1.5,
                  }}
                >
                  Avg. Response
                </TableCell>
                <TableCell
                  align="center"
                  sx={{
                    fontWeight: 600,
                    fontSize: "0.75rem",
                    color: "#374151",
                    borderBottom: "1px solid #E5E7EB",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    py: 1.5,
                  }}
                >
                  Rating
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {agentData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 6, borderBottom: "none" }}>
                    <Typography variant="body2" sx={{ color: "#9CA3AF" }}>
                      No agent data available
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                agentData.map((agent, index) => (
                  <TableRow
                    key={agent.userId || index}
                    sx={{
                      "&:hover": {
                        bgcolor: "#F9FAFB",
                      },
                      borderBottom: index < agentData.length - 1 ? "1px solid #F3F4F6" : "none",
                    }}
                  >
                    <TableCell sx={{ py: 2 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Avatar
                          sx={{
                            bgcolor: "#DBEAFE",
                            color: "#1E40AF",
                            width: 36,
                            height: 36,
                            fontSize: "0.875rem",
                            fontWeight: 600,
                          }}
                        >
                          {agent.firstName?.[0] || agent.userName?.[0] || "U"}
                        </Avatar>
                        <Typography variant="body2" sx={{ fontWeight: 500, color: "#111827" }}>
                          {agent.firstName && agent.lastName
                            ? `${agent.firstName} ${agent.lastName}`
                            : agent.userName || "Unknown"}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center" sx={{ py: 2, color: "#111827", fontWeight: 500 }}>
                      {agent.totalTickets || 0}
                    </TableCell>
                    <TableCell align="center" sx={{ py: 2, color: "#10B981", fontWeight: 600 }}>
                      {agent.resolvedTickets || 0}
                    </TableCell>
                    <TableCell align="center" sx={{ py: 2, color: "#6B7280" }}>
                      {agent.avgResponseTime || 0} mins
                    </TableCell>
                    <TableCell align="center" sx={{ py: 2 }}>
                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5 }}>
                        <Rating value={agent.rating || 0} precision={0.1} readOnly size="small" />
                        <Typography variant="body2" sx={{ color: "#6B7280", ml: 0.5 }}>
                          {agent.rating?.toFixed(1) || "0.0"}
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};

export default AgentPerformanceTable;

