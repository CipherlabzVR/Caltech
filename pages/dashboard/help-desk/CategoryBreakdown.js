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
} from "recharts";
import BASE_URL from "Base/api";

const CategoryBreakdown = () => {
  const [data, setData] = useState([]);

  const fetchCategoryData = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${BASE_URL}/HelpDesk/GetCategoryBreakdown`, {
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
      console.error("Error fetching category data:", error);
      setData([]);
    }
  };

  useEffect(() => {
    fetchCategoryData();
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
          Category Breakdown
        </Typography>
        <Box sx={{ height: { xs: 280, sm: 320 } }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" horizontal={true} vertical={false} />
              <XAxis type="number" stroke="#6B7280" style={{ fontSize: "0.875rem" }} tickLine={false} axisLine={false} />
              <YAxis
                dataKey="categoryName"
                type="category"
                stroke="#6B7280"
                width={120}
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
                cursor={{ fill: "rgba(37, 99, 235, 0.1)" }}
              />
              <Legend wrapperStyle={{ paddingTop: "16px" }} />
              <Bar dataKey="count" fill="#2563EB" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  );
};

export default CategoryBreakdown;
