import React, { useEffect, useState } from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import BASE_URL from "Base/api";

const DailyTicketFlow = () => {
  const [data, setData] = useState([]);
  const [period, setPeriod] = useState("14");

  const fetchDailyData = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${BASE_URL}/HelpDesk/GetAllTickets?SkipCount=0&MaxResultCount=10000&Search=null`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to fetch");

      const result = await response.json();
      if (result.result?.items) {
        const tickets = result.result.items;
        const days = parseInt(period);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const dailyData = [];
        for (let i = days - 1; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split("T")[0];

          const dayTickets = tickets.filter((t) => {
            const createdDate = new Date(t.createdOn);
            createdDate.setHours(0, 0, 0, 0);
            return createdDate.toISOString().split("T")[0] === dateStr;
          });

          const closedTickets = tickets.filter((t) => {
            if (!t.updatedOn) return false;
            const updatedDate = new Date(t.updatedOn);
            updatedDate.setHours(0, 0, 0, 0);
            return (
              updatedDate.toISOString().split("T")[0] === dateStr &&
              (t.status === 3 || t.status === 4)
            );
          });

          const pendingTickets = tickets.filter((t) => {
            const createdDate = new Date(t.createdOn);
            createdDate.setHours(0, 0, 0, 0);
            return (
              createdDate.toISOString().split("T")[0] <= dateStr &&
              t.status !== 3 &&
              t.status !== 4
            );
          });

          dailyData.push({
            date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            newTickets: dayTickets.length,
            closedTickets: closedTickets.length,
            pendingTickets: pendingTickets.length,
          });
        }

        setData(dailyData);
      }
    } catch (error) {
      console.error("Error fetching daily data:", error);
    }
  };

  useEffect(() => {
    fetchDailyData();
  }, [period]);

  const handlePeriodChange = (event, newPeriod) => {
    if (newPeriod !== null) {
      setPeriod(newPeriod);
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
            Daily Ticket Trends
          </Typography>
        }
        action={
          <ToggleButtonGroup
            value={period}
            exclusive
            onChange={handlePeriodChange}
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
            <ToggleButton value="7">7 Days</ToggleButton>
            <ToggleButton value="14">14 Days</ToggleButton>
            <ToggleButton value="30">30 Days</ToggleButton>
          </ToggleButtonGroup>
        }
        sx={{ pb: 2, px: 3, pt: 3 }}
      />
      <CardContent sx={{ pt: 0, px: 3, pb: 3 }}>
        <Box sx={{ height: 350 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
              <defs>
                <linearGradient id="colorNew" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorClosed" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
              <XAxis
                dataKey="date"
                stroke="#6B7280"
                style={{ fontSize: "0.875rem", fontWeight: 500 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#6B7280"
                style={{ fontSize: "0.875rem" }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #E5E7EB",
                  borderRadius: 8,
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                  padding: "12px",
                }}
                itemStyle={{ color: "#111827", fontSize: "0.875rem" }}
                labelStyle={{ color: "#6B7280", fontWeight: 600, marginBottom: "4px" }}
              />
              <Legend
                wrapperStyle={{ paddingTop: "16px" }}
                iconType="circle"
                formatter={(value) => <span style={{ color: "#374151", fontSize: "0.875rem" }}>{value}</span>}
              />
              <Area
                type="monotone"
                dataKey="newTickets"
                stroke="#2563EB"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorNew)"
                name="New Tickets"
              />
              <Area
                type="monotone"
                dataKey="closedTickets"
                stroke="#10B981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorClosed)"
                name="Closed Tickets"
              />
              <Line
                type="monotone"
                dataKey="pendingTickets"
                stroke="#F59E0B"
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Pending Tickets"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  );
};

export default DailyTicketFlow;

