import React, { useEffect, useState } from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import { useTheme, useMediaQuery } from "@mui/material";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import BASE_URL from "Base/api";

const COLORS = ["#2563EB", "#F59E0B", "#EF4444", "#DC2626"];

const PriorityDistribution = () => {
  const [data, setData] = useState([]);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const fetchPriorityData = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${BASE_URL}/HelpDesk/GetPriorityDistribution`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to fetch");

      const result = await response.json();
      if (result.result) {
        const formattedData = result.result.map((item) => ({
          name: item.priority,
          value: item.count,
        }));
        setData(formattedData);
      }
    } catch (error) {
      console.error("Error fetching priority data:", error);
      setData([
        { name: "Low", value: 0 },
        { name: "Medium", value: 0 },
        { name: "High", value: 0 },
        { name: "Critical", value: 0 },
      ]);
    }
  };

  useEffect(() => {
    fetchPriorityData();
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
          Priority Distribution
        </Typography>
        <Box sx={{ height: 320 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent, value }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                outerRadius={isMobile ? 80 : 110}
                innerRadius={isMobile ? 50 : 70}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
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
                wrapperStyle={{ paddingTop: "24px" }}
                iconType="circle"
                iconSize={10}
                formatter={(value) => <span style={{ color: "#374151", fontSize: "0.875rem" }}>{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  );
};

export default PriorityDistribution;
