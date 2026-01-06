import React, { useEffect, useState } from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import BASE_URL from "Base/api";

const ResponseTimeMetrics = () => {
  const [data, setData] = useState([]);

  const fetchResponseTimeData = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${BASE_URL}/HelpDesk/GetResponseTimeMetrics`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to fetch");

      const result = await response.json();
      if (result.result) {
        setData(result.result);
      }
    } catch (error) {
      console.error("Error fetching response time data:", error);
      const defaultData = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        defaultData.push({
          date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          responseTime: 0,
          resolutionTime: 0,
        });
      }
      setData(defaultData);
    }
  };

  useEffect(() => {
    fetchResponseTimeData();
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
          Response & Resolution Time
        </Typography>
        <Typography
          variant="body2"
          sx={{
            mb: 3,
            color: "#6B7280",
            fontSize: "0.875rem",
          }}
        >
          Last 7 Days
        </Typography>
        <Box sx={{ height: { xs: 280, sm: 320 } }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
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
                iconType="line"
                formatter={(value) => <span style={{ color: "#374151", fontSize: "0.875rem" }}>{value}</span>}
              />
              <Line
                type="monotone"
                dataKey="responseTime"
                stroke="#2563EB"
                strokeWidth={2.5}
                name="Response Time (h)"
                dot={{ fill: "#2563EB", r: 4, strokeWidth: 2, stroke: "#fff" }}
                activeDot={{ r: 6, strokeWidth: 2, stroke: "#fff" }}
              />
              <Line
                type="monotone"
                dataKey="resolutionTime"
                stroke="#10B981"
                strokeWidth={2.5}
                name="Resolution Time (h)"
                dot={{ fill: "#10B981", r: 4, strokeWidth: 2, stroke: "#fff" }}
                activeDot={{ r: 6, strokeWidth: 2, stroke: "#fff" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ResponseTimeMetrics;
