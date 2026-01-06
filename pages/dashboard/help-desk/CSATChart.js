import React, { useEffect, useState } from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import BASE_URL from "Base/api";

const CSATChart = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    // Mock CSAT data - in real app, this would come from customer feedback
    const mockData = [
      { rating: "Positive", count: 85, color: "#10B981" },
      { rating: "Neutral", count: 10, color: "#F59E0B" },
      { rating: "Negative", count: 5, color: "#EF4444" },
    ];
    setData(mockData);
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
          Customer Satisfaction (CSAT)
        </Typography>
        <Box sx={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" horizontal={true} vertical={false} />
              <XAxis type="number" stroke="#6B7280" style={{ fontSize: "0.875rem" }} tickLine={false} axisLine={false} />
              <YAxis
                dataKey="rating"
                type="category"
                stroke="#6B7280"
                width={100}
                style={{ fontSize: "0.875rem", fontWeight: 500 }}
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
                formatter={(value) => [`${value}%`, "Percentage"]}
                cursor={{ fill: "rgba(37, 99, 235, 0.1)" }}
              />
              <Legend wrapperStyle={{ paddingTop: "16px" }} />
              <Bar dataKey="count" radius={[0, 8, 8, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Box>
        <Box sx={{ mt: 3, display: "flex", justifyContent: "center", gap: 3 }}>
          {data.map((item) => (
            <Box key={item.rating} sx={{ textAlign: "center" }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: item.color }}>
                {item.count}%
              </Typography>
              <Typography variant="caption" sx={{ color: "#6B7280", fontSize: "0.75rem" }}>
                {item.rating}
              </Typography>
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
};

export default CSATChart;

