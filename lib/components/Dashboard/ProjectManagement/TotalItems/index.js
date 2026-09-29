import React, { useEffect, useState } from "react";
import { Box, Grid, Typography } from "@mui/material";
import Card from "@mui/material/Card";
import TotalItemsChart from "./TotalItemsChart";
import useApi from "@/components/utils/useApi";
import StockTable from "./stock-table";

const TotalItems = () => {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [stock, setStock] = useState([]);
  const [products, setProducts] = useState([]);

  const {
    data: stockList,
    loading: Loading,
    error: Error,
  } = useApi("/StockBalance/GetAllItemsStockBalance?warehouseId=1");

  useEffect(() => {
    if (stockList) {
      const stockbalance = stockList.map(item => item.bookBalanceQuantity).slice(0, 15); 
      const productNames = stockList.map(item => item.productName).slice(0, 15); 
      setStock(stockbalance);
      setProducts(productNames);
    }
  }, [stockList]);

  return (
    <>
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
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid #EEF0F7",
            paddingBottom: "10px",
            mb: "20px",
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
            Available Stock
          </Typography>
        </Box>
        
        <Grid container>
          <Grid item xs={12} lg={6}>
            <TotalItemsChart stock={stock} productNames={products}/>
          </Grid>
          <Grid item xs={12} lg={6}>
            <StockTable/>
          </Grid>
        </Grid>
      </Card>
    </>
  );
};

export default TotalItems;
