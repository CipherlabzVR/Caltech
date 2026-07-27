import React, { useEffect, useMemo, useState } from "react";
import { Box, Card, Typography, InputLabel, MenuItem, FormControl, Select, TextField } from "@mui/material";
import { Line } from "react-chartjs-2";
import Chart from "chart.js/auto";
import BASE_URL from "Base/api";
import { formatCurrency } from "@/components/utils/formatHelper";

const getPeriodCount = (fromDate, toDate, dateRange) => {
  const start = new Date(fromDate);
  const end = new Date(toDate);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  if (dateRange === 6) {
    return Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
  }
  if (dateRange === 7) {
    return (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1;
  }
  if (dateRange === 8) {
    return end.getFullYear() - start.getFullYear() + 1;
  }
  return 1;
};

const getAvgLabel = (dateRange) => {
  if (dateRange === 6) return "Avg per day";
  if (dateRange === 7) return "Avg per month";
  if (dateRange === 8) return "Avg per year";
  return "Average";
};

const buildChartOptions = () => ({
  plugins: {
    legend: {
      labels: {
        color: "#5B5B98",
        filter: (item) => !item.text.includes("Avg"),
      },
    },
    tooltip: {
      callbacks: {
        label: (context) => {
          const label = context.dataset.label || "";
          const value = context.parsed.y;
          return `${label}: ${formatCurrency(value)}`;
        },
      },
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        callback: (value) => formatCurrency(value),
      },
    },
  },
});

const getFirstDayOfMonth = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  return new Date(year, month, 1);
};

const getLastDayOfMonth = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  return new Date(year, month + 1, 0);
};

const formatDateForAPI = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatDateForInput = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const AudienceOverview = () => {
  const [fromDate, setFromDate] = useState(formatDateForInput(getFirstDayOfMonth()));
  const [toDate, setToDate] = useState(formatDateForInput(getLastDayOfMonth()));
  const [dateRange, setDateRange] = useState(6);
  const [chartData, setChartData] = useState(null);
  const [averages, setAverages] = useState({ sales: 0, cost: 0, profit: 0 });

  const chartOptions = useMemo(() => buildChartOptions(), []);
  const avgLabel = getAvgLabel(dateRange);

  const handleDateRangeChange = (event) => {
    setDateRange(event.target.value);
  };

  const handleFromDateChange = (event) => {
    setFromDate(event.target.value);
  };

  const handleToDateChange = (event) => {
    setToDate(event.target.value);
  };

  const fetchSalesSummary = async () => {
    try {
      const token = localStorage.getItem("token");
      const fromDateFormatted = formatDateForAPI(new Date(fromDate));
      const toDateFormatted = formatDateForAPI(new Date(toDate));
      const query = `${BASE_URL}/Dashboard/GetSalesSummary?fromDate=${fromDateFormatted}&toDate=${toDateFormatted}&dateRange=${dateRange}`;

      const response = await fetch(query, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to fetch items");

      const res = await response.json();
      const result = res.result;

      const labels = result.map((item) => item.name || new Date(item.date).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
      }));

      const sales = result.map((item) => item.sales ?? 0);
      const cost = result.map((item) => item.cost ?? 0);
      const profit = result.map((item) => item.profit ?? 0);

      const periodCount = getPeriodCount(fromDate, toDate, dateRange);
      const totalSales = sales.reduce((sum, value) => sum + value, 0);
      const totalCost = cost.reduce((sum, value) => sum + value, 0);
      const totalProfit = profit.reduce((sum, value) => sum + value, 0);

      const avgSales = periodCount > 0 ? totalSales / periodCount : 0;
      const avgCost = periodCount > 0 ? totalCost / periodCount : 0;
      const avgProfit = periodCount > 0 ? totalProfit / periodCount : 0;

      setAverages({ sales: avgSales, cost: avgCost, profit: avgProfit });

      setChartData({
        labels: labels,
        datasets: [
          {
            label: "Sales",
            backgroundColor: "#6F52ED",
            borderColor: "#6F52ED",
            data: sales,
            tension: 0.3,
          },
          {
            label: "Cost",
            backgroundColor: "#2DB6F5",
            borderColor: "#2DB6F5",
            data: cost,
            tension: 0.3,
          },
          {
            label: "Profit",
            backgroundColor: "#F765A3",
            borderColor: "#F765A3",
            data: profit,
            tension: 0.3,
          },
          {
            label: "Sales Avg",
            borderColor: "#6F52ED",
            backgroundColor: "transparent",
            data: labels.map(() => avgSales),
            borderDash: [6, 4],
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 0,
            fill: false,
          },
          {
            label: "Cost Avg",
            borderColor: "#2DB6F5",
            backgroundColor: "transparent",
            data: labels.map(() => avgCost),
            borderDash: [6, 4],
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 0,
            fill: false,
          },
          {
            label: "Profit Avg",
            borderColor: "#F765A3",
            backgroundColor: "transparent",
            data: labels.map(() => avgProfit),
            borderDash: [6, 4],
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 0,
            fill: false,
          },
        ],
      });
    } catch (error) {
      console.error("Error:", error);
    }
  };

  useEffect(() => {
    fetchSalesSummary();
  }, [fromDate, toDate, dateRange]);

  return (
    <Card
      sx={{
        boxShadow: "none",
        borderRadius: "10px",
        p: "25px",
        mb: "15px",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid #EEF0F7",
          paddingBottom: "10px",
          marginBottom: "15px",
        }}
        className="for-dark-bottom-border"
      >
        <Typography
          as="h3"
          sx={{
            fontSize: 18,
            fontWeight: 500,
          }}
        >
          Sales Summary
        </Typography>
      </Box>
      <Box
        sx={{
          display: "flex",
          gap: 2,
          mb: 2,
          justifyContent: 'space-between'
        }}
      >
        <Box display="flex" gap={2}>
          <TextField
            label="From Date"
            type="date"
            size="small"
            value={fromDate}
            onChange={handleFromDateChange}
            InputLabelProps={{
              shrink: true,
            }}
            sx={{ minWidth: 150 }}
          />
          <TextField
            label="To Date"
            type="date"
            size="small"
            value={toDate}
            onChange={handleToDateChange}
            InputLabelProps={{
              shrink: true,
            }}
            sx={{ minWidth: 150 }}
          />

        </Box>
        <FormControl sx={{ minWidth: 120 }} size="small">
          <InputLabel id="date-range-select" sx={{ fontSize: "14px" }}>
            Type
          </InputLabel>
          <Select
            labelId="date-range-select"
            id="date-range-select"
            value={dateRange}
            label="Type"
            onChange={handleDateRangeChange}
            sx={{ fontSize: "14px" }}
          >
            <MenuItem value={6} sx={{ fontSize: "14px" }}>
              Daily
            </MenuItem>
            <MenuItem value={7} sx={{ fontSize: "14px" }}>
              Monthly
            </MenuItem>
            <MenuItem value={8} sx={{ fontSize: "14px" }}>
              Yearly
            </MenuItem>
          </Select>
        </FormControl>
      </Box>
      {chartData && (
        <>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
              gap: 2,
              mb: 2,
            }}
          >
            <Box
              sx={{
                p: 1.5,
                borderRadius: "8px",
                bgcolor: "rgba(111, 82, 237, 0.08)",
                border: "1px solid rgba(111, 82, 237, 0.15)",
              }}
            >
              <Typography variant="caption" color="text.secondary" display="block">
                Sales {avgLabel.toLowerCase()}
              </Typography>
              <Typography variant="subtitle1" fontWeight={600} color="#6F52ED">
                {formatCurrency(averages.sales)}
              </Typography>
            </Box>
            <Box
              sx={{
                p: 1.5,
                borderRadius: "8px",
                bgcolor: "rgba(45, 182, 245, 0.08)",
                border: "1px solid rgba(45, 182, 245, 0.15)",
              }}
            >
              <Typography variant="caption" color="text.secondary" display="block">
                Cost {avgLabel.toLowerCase()}
              </Typography>
              <Typography variant="subtitle1" fontWeight={600} color="#2DB6F5">
                {formatCurrency(averages.cost)}
              </Typography>
            </Box>
            <Box
              sx={{
                p: 1.5,
                borderRadius: "8px",
                bgcolor: "rgba(247, 101, 163, 0.08)",
                border: "1px solid rgba(247, 101, 163, 0.15)",
              }}
            >
              <Typography variant="caption" color="text.secondary" display="block">
                Profit {avgLabel.toLowerCase()}
              </Typography>
              <Typography variant="subtitle1" fontWeight={600} color="#F765A3">
                {formatCurrency(averages.profit)}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ height: 350 }}>
            <Line data={chartData} options={chartOptions} />
          </Box>
        </>
      )}

    </Card>
  );
};

export default AudienceOverview;
