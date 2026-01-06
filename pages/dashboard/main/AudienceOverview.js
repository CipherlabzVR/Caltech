import React, { useEffect, useState } from "react";
import { Box, Card, Typography, InputLabel, MenuItem, FormControl, Select, TextField } from "@mui/material";
import { Line } from "react-chartjs-2";
import Chart from "chart.js/auto";
import BASE_URL from "Base/api";

const options = {
  plugins: {
    legend: {
      labels: {
        color: "#5B5B98",
      },
    },
  },
};

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

      const sales = result.map((item) => item.sales);
      const cost = result.map((item) => item.cost);
      const profit = result.map((item) => item.profit);

      setChartData({
        labels: labels,
        datasets: [
          {
            label: "Sales",
            backgroundColor: "#6F52ED",
            borderColor: "#6F52ED",
            data: sales,
          },
          {
            label: "Cost",
            backgroundColor: "#2DB6F5",
            borderColor: "#2DB6F5",
            data: cost,
          },
          {
            label: "Profit",
            backgroundColor: "#F765A3",
            borderColor: "#F765A3",
            data: profit,
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
        <Box sx={{ height: 350 }}>
          <Line data={chartData} options={options} />
        </Box>
      )}

    </Card>
  );
};

export default AudienceOverview;
