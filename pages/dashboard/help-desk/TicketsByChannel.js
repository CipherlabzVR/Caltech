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

const TicketsByChannel = () => {
  const [data, setData] = useState([]);

  const fetchChannelData = async () => {
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
        
        // Mock channel distribution - in real app, this would come from ticket data
        // For now, we'll simulate based on ticket creation patterns
        const channels = [
          { channel: "Email", count: Math.floor(tickets.length * 0.35) },
          { channel: "Live Chat", count: Math.floor(tickets.length * 0.25) },
          { channel: "Phone", count: Math.floor(tickets.length * 0.20) },
          { channel: "Web Form", count: Math.floor(tickets.length * 0.15) },
          { channel: "Social Media", count: Math.floor(tickets.length * 0.05) },
        ];

        setData(channels);
      }
    } catch (error) {
      console.error("Error fetching channel data:", error);
      setData([
        { channel: "Email", count: 0 },
        { channel: "Live Chat", count: 0 },
        { channel: "Phone", count: 0 },
        { channel: "Web Form", count: 0 },
        { channel: "Social Media", count: 0 },
      ]);
    }
  };

  useEffect(() => {
    fetchChannelData();
  }, []);

  const getBarColor = (channel) => {
    const colors = {
      Email: "#2563EB",
      "Live Chat": "#10B981",
      Phone: "#F59E0B",
      "Web Form": "#8B5CF6",
      "Social Media": "#EC4899",
    };
    return colors[channel] || "#6B7280";
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
          Tickets by Channel
        </Typography>
        <Box sx={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
              <XAxis
                dataKey="channel"
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
                cursor={{ fill: "rgba(37, 99, 235, 0.1)" }}
              />
              <Legend wrapperStyle={{ paddingTop: "16px" }} />
              <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(entry.channel)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  );
};

export default TicketsByChannel;

