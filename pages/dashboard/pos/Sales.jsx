import React, { useState, useEffect } from "react";
import { Box, Typography, Paper, Grid, useTheme, FormControl, InputLabel, Select, MenuItem, TextField, Stack } from "@mui/material";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { ComposedChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Line } from "recharts";
import { formatDate } from "@/components/utils/formatHelper";
import BASE_URL from "Base/api";
import StockValueCard from "./StockValueCard";
import TotalPurchaseCard from "./TotalPurchaseCard";


const generateDailyData = (start, end) => {
  const data = [];
  let current = new Date(start);

  while (current <= end) {
    const sales = 15000 + Math.random() * 20000;
    const profit = sales * (0.3 + Math.random() * 0.1);
    const margin = (profit / sales) * 100;
    data.push({
      name: current.toLocaleDateString("en-US", { month: 'short', day: 'numeric' }),
      sales: Math.round(sales),
      profit: Math.round(profit),
      margin: parseFloat(margin.toFixed(1)),
    });
    current.setDate(current.getDate() + 1);
  }
  return data;
};

const generateMonthlyData = (month, years) => {
  const data = [];
  const currentYear = new Date().getFullYear();
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  for (let i = 0; i < years; i++) {
    const year = currentYear - i;
    const sales = 80000 + Math.random() * 100000;
    const profit = sales * (0.3 + Math.random() * 0.1);
    const margin = (profit / sales) * 100;

    data.push({
      name: `${monthNames[month]} '${year.toString().slice(-2)}`,
      sales: Math.round(sales),
      profit: Math.round(profit),
      margin: parseFloat(margin.toFixed(1)),
    });
  }
  return data.reverse();
};

const generateYearlyData = () => {
  const data = [];
  const endYear = new Date().getFullYear();
  const startYear = endYear - 9;

  for (let currentYear = startYear; currentYear <= endYear; currentYear++) {
    const sales = 1000000 + Math.random() * 1000000;
    const profit = sales * (0.3 + Math.random() * 0.1);
    const margin = (profit / sales) * 100;
    data.push({
      name: currentYear.toString(),
      sales: Math.round(sales),
      profit: Math.round(profit),
      margin: parseFloat(margin.toFixed(1)),
    });
  }
  return data;
};


const Sales = ({totalStock,totalPurchase}) => {
  const theme = useTheme();
  const [timeFrame, setTimeFrame] = useState("monthly");
  const [chartData, setChartData] = useState([]);

  // --- State for Daily view ---
  const initialStartDate = new Date();
  initialStartDate.setDate(initialStartDate.getDate() - 6);
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(new Date());

  // --- State for Monthly view ---
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [yearCount, setYearCount] = useState(2);

  const [list, setList] = useState([]);

  const handleGetData = (value) => {
    if (value === 1) {
      var fromDate = formatDate(startDate);
      var toDate = formatDate(endDate);
      fetchSalesAndProfit(`GetPOSSalesAndProfitDailySummaryAsync?startDate=${fromDate}&endDate=${toDate}`);

    } else if (value === 2) {
      var month = selectedMonth + 1;
      fetchSalesAndProfit(`GetPOSSalesAndProfitMonthlySummaryAsync?month=${month}&yearRange=${yearCount}`);
    }
    else {
      fetchSalesAndProfit(`GetPOSSalesAndProfitYearlySummaryAsync`);
    }
  };


  const fetchSalesAndProfit = async (URL) => {
    try {
      const response = await fetch(
        `${BASE_URL}/Dashboard/${URL}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch");
      }

      const data = await response.json();
      setList(data.result);

    } catch (error) {
      console.error("Error fetching:", error);
    }
  };
  useEffect(() => {
    switch (timeFrame) {
      case "daily":
        handleGetData(1);
        if (!startDate || !endDate || startDate > endDate) return;
        setChartData(generateDailyData(startDate, endDate));
        break;
      case "monthly":
        handleGetData(2);
        setChartData(generateMonthlyData(selectedMonth, yearCount));
        break;
      case "yearly":
        handleGetData(3);
        setChartData(generateYearlyData());
        break;
      default:
        setChartData(generateMonthlyData(selectedMonth, yearCount));
    }
  }, [timeFrame, startDate, endDate, selectedMonth, yearCount]);

  // --- Dynamic chart title based on selected filters ---
  const getChartTitle = () => {
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    switch (timeFrame) {
      case 'daily':
        if (!startDate || !endDate) return "Sales & Profit";
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        const startStr = startDate.toLocaleDateString('en-US', options);
        const endStr = endDate.toLocaleDateString('en-US', options);
        return `Daily: ${startStr} - ${endStr}`;
      case 'monthly':
        const monthName = monthNames[selectedMonth];
        const plural = yearCount > 1 ? 's' : '';
        return `Sales for ${monthName} Over the Last ${yearCount} Year${plural}`;
      case 'yearly':
        return "Yearly Sales & Profit Comparison";
      default:
        return "Sales & Profit";
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ pt: 0 }}>
        <Grid container spacing={3}>
          <Grid item lg={6} md={6} xs={12} sm={12}>
            <StockValueCard stock={totalStock} />
          </Grid>
          <Grid item lg={6} md={6} xs={12} sm={12}>
             <TotalPurchaseCard purchase={totalPurchase} />
          </Grid>
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 2,
                  mb: 2,
                }}
              >
                <Typography variant="h6" gutterBottom sx={{ mb: 0, my: 2 }}>
                  {getChartTitle()}
                </Typography>

                <Stack direction="row" spacing={2} sx={{ flexWrap: "wrap", gap: 1 }}>
                  <FormControl sx={{ minWidth: 120 }} size="small">
                    <InputLabel>View</InputLabel>
                    <Select
                      value={timeFrame}
                      label="View"
                      onChange={(e) => setTimeFrame(e.target.value)}
                    >
                      <MenuItem value="daily">Daily</MenuItem>
                      <MenuItem value="monthly">Monthly</MenuItem>
                      <MenuItem value="yearly">Yearly</MenuItem>
                    </Select>
                  </FormControl>

                  {/* --- Daily View Controls --- */}
                  {timeFrame === 'daily' && (
                    <>
                      <DatePicker
                        label="From Date"
                        value={startDate}
                        onChange={(newValue) => setStartDate(newValue)}
                        maxDate={endDate}
                        renderInput={(params) => <TextField {...params} size="small" />}
                      />
                      <DatePicker
                        label="To Date"
                        value={endDate}
                        onChange={(newValue) => setEndDate(newValue)}
                        minDate={startDate}
                        renderInput={(params) => <TextField {...params} size="small" />}
                      />
                    </>
                  )}

                  {/* --- Monthly View Controls --- */}
                  {timeFrame === 'monthly' && (
                    <>
                      <FormControl sx={{ minWidth: 120 }} size="small">
                        <InputLabel>Month</InputLabel>
                        <Select
                          value={selectedMonth}
                          label="Month"
                          onChange={(e) => setSelectedMonth(e.target.value)}
                        >
                          {Array.from({ length: 12 }, (_, i) => (
                            <MenuItem key={i} value={i}>
                              {new Date(0, i).toLocaleString('en-US', { month: 'long' })}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <FormControl sx={{ minWidth: 120 }} size="small">
                        <InputLabel>Years</InputLabel>
                        <Select
                          value={yearCount}
                          label="Years"
                          onChange={(e) => setYearCount(e.target.value)}
                        >
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(year => (
                            <MenuItem key={year} value={year}>{year}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </>
                  )}
                </Stack>
              </Box>

              <Box sx={{ height: 400 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={list}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis
                      yAxisId="left"
                      orientation="left"
                      stroke={theme.palette.primary.main}
                      tickFormatter={(value) => `Rs.${value.toLocaleString()}`}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      stroke={theme.palette.secondary.main}
                      domain={[0, 50]}
                      tickFormatter={(value) => `${value}%`}
                    />
                    <Tooltip
                      formatter={(value, name) => {
                        if (name === "Profit Margin (%)")
                          return [`${value}%`, name];
                        return [`Rs.${value.toLocaleString()}`, name];
                      }}
                    />
                    <Legend />
                    <Bar
                      yAxisId="left"
                      dataKey="sales"
                      name="Total Sales"
                      fill={theme.palette.primary.main}
                    />
                    <Bar
                      yAxisId="left"
                      dataKey="profit"
                      name="Profit"
                      fill={theme.palette.success.main}
                    />
                    <Line
                      yAxisId="right"
                      dataKey="profitMargin"
                      name="Profit Margin (%)"
                      stroke={theme.palette.secondary.main}
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </LocalizationProvider>
  );
};

export default Sales;