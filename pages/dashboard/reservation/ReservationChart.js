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

const ReservationChart = ({ startDate, endDate }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchChartDataWithDates = async (start, end) => {
    if (!start || !end) {
      console.warn("ReservationChart: Missing startDate or endDate");
      return;
    }

    setLoading(true);
    try {
      // Dates should already be in YYYY-MM-DD format from the parent
      // Just validate and use them directly, or format if needed
      let startDateFormatted = start;
      let endDateFormatted = end;
      
      // If date is not in YYYY-MM-DD format, convert it
      if (typeof start === 'string' && start.includes('T')) {
        startDateFormatted = new Date(start).toISOString().split('T')[0];
      } else if (start && !start.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // If it's a date object or other format, convert it
        startDateFormatted = new Date(start).toISOString().split('T')[0];
      }
      
      if (typeof end === 'string' && end.includes('T')) {
        endDateFormatted = new Date(end).toISOString().split('T')[0];
      } else if (end && !end.match(/^\d{4}-\d{2}-\d{2}$/)) {
        endDateFormatted = new Date(end).toISOString().split('T')[0];
      }
      
      console.log("ReservationChart: Fetching data for", startDateFormatted, "to", endDateFormatted);
      
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const url = `${BASE_URL}/Dashboard/GetReservationChartDataByDateRange?startDate=${encodeURIComponent(startDateFormatted)}&endDate=${encodeURIComponent(endDateFormatted)}`;
      console.log("ReservationChart: API URL", url);

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("ReservationChart: API error", response.status, errorText);
        throw new Error(`Failed to fetch: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      console.log("ReservationChart: API response", result);
      
      if (result.result) {
        console.log("ReservationChart: Setting data", result.result.length, "items");
        setData(result.result);
      } else {
        console.warn("ReservationChart: No result in response", result);
        setData([]);
      }
    } catch (error) {
      console.error("Error fetching reservation chart data:", error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when date range changes or on initial mount
  useEffect(() => {
    if (startDate && endDate) {
      fetchChartDataWithDates(startDate, endDate);
    } else {
      console.warn("ReservationChart: startDate or endDate is missing", { startDate, endDate });
    }
  }, [startDate, endDate]);

  return (
    <Card
      sx={{
        height: "100%",
        bgcolor: "white",
        border: "1px solid #E5E7EB",
        borderRadius: 2,
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
        transition: "all 0.2s ease",
        display: "flex",
        flexDirection: "column",
        "&:hover": {
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
        },
      }}
    >
      <CardContent sx={{ p: 3, display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
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
          Reservation Trends
        </Typography>

        {loading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              flex: 1,
            }}
          >
            <Typography color="text.secondary">Loading...</Typography>
          </Box>
        ) : data.length === 0 ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              flex: 1,
            }}
          >
            <Typography color="text.secondary">No data available</Typography>
          </Box>
        ) : (
          <Box sx={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data}
                margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#E5E7EB"
                  vertical={false}
                />
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
                  itemStyle={{
                    color: "#111827",
                    fontSize: "0.875rem",
                  }}
                  labelStyle={{
                    color: "#6B7280",
                    fontWeight: 600,
                    marginBottom: "4px",
                  }}
                />
                <Legend
                  wrapperStyle={{ paddingTop: "16px" }}
                  iconType="line"
                  formatter={(value) => (
                    <span style={{ color: "#374151", fontSize: "0.875rem" }}>
                      {value}
                    </span>
                  )}
                />
                <Line
                  type="monotone"
                  dataKey="reservations"
                  stroke="#2563EB"
                  strokeWidth={2.5}
                  name="Reservations"
                  dot={{ fill: "#2563EB", r: 4, strokeWidth: 2, stroke: "#fff" }}
                  activeDot={{ r: 6, strokeWidth: 2, stroke: "#fff" }}
                />
                <Line
                  type="monotone"
                  dataKey="pencilNotes"
                  stroke="#10B981"
                  strokeWidth={2.5}
                  name="Pencil Notes"
                  dot={{ fill: "#10B981", r: 4, strokeWidth: 2, stroke: "#fff" }}
                  activeDot={{ r: 6, strokeWidth: 2, stroke: "#fff" }}
                />
                <Line
                  type="monotone"
                  dataKey="pendingApprovals"
                  stroke="#F59E0B"
                  strokeWidth={2.5}
                  name="Pending Approvals"
                  dot={{ fill: "#F59E0B", r: 4, strokeWidth: 2, stroke: "#fff" }}
                  activeDot={{ r: 6, strokeWidth: 2, stroke: "#fff" }}
                />
                <Line
                  type="monotone"
                  dataKey="otherNotes"
                  stroke="#EF4444"
                  strokeWidth={2.5}
                  name="Other Notes"
                  dot={{ fill: "#EF4444", r: 4, strokeWidth: 2, stroke: "#fff" }}
                  activeDot={{ r: 6, strokeWidth: 2, stroke: "#fff" }}
                />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#8B5CF6"
                  strokeWidth={2.5}
                  name="Total"
                  dot={{ fill: "#8B5CF6", r: 4, strokeWidth: 2, stroke: "#fff" }}
                  activeDot={{ r: 6, strokeWidth: 2, stroke: "#fff" }}
                  strokeDasharray="5 5"
                />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default ReservationChart;

