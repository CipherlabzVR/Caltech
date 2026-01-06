import React, { useState } from "react";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Typography from "@mui/material/Typography";
import Outlet from "./Outlet";
import Sales from "./Sales";
import OutstandingCustomers from "./OutstandingCustomers";
import OutstandingSuppliers from "./OutstandingSuppliers";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { TextField } from "@mui/material";
import BASE_URL from "Base/api";
import { useEffect } from "react";
import { formatCurrency, formatDate } from "@/components/utils/formatHelper";


const Index = () => {
  const today = new Date();
const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

const [features, setFeatures] = useState({});
const [fromDate, setFromDate] = useState(firstDayOfMonth.toISOString().split('T')[0]);
const [toDate, setToDate] = useState(lastDayOfMonth.toISOString().split('T')[0]);

  const [warehouse, setWarehouse] = useState(0);

  const fetchFeatures = async (startDate, endDate, warehouseId) => {
    try {
      const response = await fetch(
        `${BASE_URL}/Dashboard/POSDashboardCardSummaryByDateRange?startDate=${startDate}&endDate=${endDate}&warehouseId=${warehouseId}`,
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
      setFeatures(data.result);
    } catch (error) {
      console.error("Error fetching:", error);
    }
  };

  useEffect(() => {
    fetchFeatures(fromDate, toDate, warehouse);
  }, []);


  const handleStartDateChange = (newValue) => {
    const formattedDate = formatDate(newValue);
    setFromDate(formattedDate);
    fetchFeatures(formattedDate, toDate, warehouse);
  };

  const handleEndDateChange = (newValue) => {
    const formattedDate = formatDate(newValue);
    setToDate(formattedDate);
    fetchFeatures(fromDate, formattedDate, warehouse);
  };


  const posData = [
    {
      id: "1",
      subTitle: "Cash Payments",
      title: formatCurrency(features.cashAmount),
      iconName: "ri-wallet-line",
    },
    {
      id: "2",
      subTitle: "Card Payments",
      title: formatCurrency(features.cardAmount),
      iconName: "ri-bank-card-line",
    },
    {
      id: "3",
      subTitle: "Bank Transfers",
      title: formatCurrency(features.bankAmount),
      iconName: "ri-bank-line",
    },
    {
      id: "4",
      subTitle: "Cheque",
      title: formatCurrency(features.chequeAmount),
      iconName: "ri-file-paper-line",
    },
  ];

  const handleSetValue = (value) => {
    setWarehouse(value);
    fetchFeatures(fromDate, toDate, value);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Outlet onChangeWarehouse={handleSetValue} />
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            flexWrap: "wrap",
          }}
        >
          <DatePicker
            label="From Date"
            value={fromDate}
            onChange={handleStartDateChange}
            renderInput={(params) => (
              <TextField {...params} size="small" sx={{ width: "160px" }} />
            )}
          />
          <DatePicker
            label="To Date"
            value={toDate}
            onChange={handleEndDateChange}
            renderInput={(params) => (
              <TextField {...params} size="small" sx={{ width: "160px" }} />
            )}
          />
        </Box>
      </Box>

      <Grid
        container
        justifyContent="center"
        rowSpacing={1}
        columnSpacing={{ xs: 1, sm: 2, md: 2 }}
      >
        {/* Payment Cards */}
        {posData.map((feature) => (
          <Grid item xs={12} sm={6} md={6} lg={6} xl={3} key={feature.id}>
            <Card
              sx={{
                boxShadow: "none",
                borderRadius: "10px",
                p: "20px 15px",
                mb: "15px",
                background: "#fff",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <Box
                    sx={{
                      width: "58px",
                      height: "58px",
                      lineHeight: "58px",
                      background: "#757FEF",
                      color: "#fff",
                      fontSize: "30px",
                      borderRadius: "8px",
                      textAlign: "center",
                    }}
                    className="mr-10px"
                  >
                    <i className={feature.iconName}></i>
                  </Box>

                  <Box>
                    <Typography sx={{ fontSize: "13px" }}>
                      {feature.subTitle}
                    </Typography>
                    <Typography
                      variant="h1"
                      sx={{ fontSize: 25, fontWeight: 700, marginTop: "4px" }}
                    >
                      {feature.title}
                    </Typography>
                  </Box>
                </Box>
              </Box>
              <Box mt={1}>
                <Typography sx={{color: '#00c851'}}>Date filter applicable</Typography>
              </Box>
            </Card>
          </Grid>
        ))}

        {/* Sales Section */}
        <Grid item xs={12} sm={12} md={6} lg={6} xl={6}>
          <Sales totalStock={features.stock} totalPurchase={features.totalPurchase}/>          
        </Grid>

        <Grid item xs={12} sm={12} md={6} lg={6} xl={6}>
          <OutstandingCustomers totalProfit={features.profit} totalProfitMargin={features.profitMargin} totalSales={features.totalSales} totalCustomers={features.customers}/>
          <OutstandingSuppliers />
        </Grid>
      </Grid>
    </LocalizationProvider>
  );
};

export default Index;
