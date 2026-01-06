import React, { useEffect, useState } from "react";
import useApi from "@/components/utils/useApi";
import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material";

const StockTable = () => {
  const [stock, setStock] = useState([]);

  const {
    data: stockList,
    loading: Loading,
    error: Error,
  } = useApi("/StockBalance/GetAllItemsStockBalance?warehouseId=1");

  useEffect(() => {
    if (stockList) {
      setStock(stockList);
    }
  }, [stockList]);

  return (
    <>
      <TableContainer
        component={Paper}
        sx={{
          boxShadow: "none",
          maxHeight: "50vh",
          overflowY: "auto",
        }}
      >
        <Table
          aria-label="custom pagination table"
          className="dark-table"
        >
          <TableHead sx={{ background: "#F7FAFF" }}>
            <TableRow>
              <TableCell sx={{ borderBottom: "1px solid #F7FAFF", fontSize: "13.5px", padding: "15px 10px" }}>
                Item Name
              </TableCell>
              <TableCell sx={{ borderBottom: "1px solid #F7FAFF", fontSize: "13.5px", padding: "15px 10px" }}>
                Stock&nbsp;Balance
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {stock.map((row,i) => (
              <TableRow key={i}>
                <TableCell sx={{ fontWeight: "500", fontSize: "13px", borderBottom: "1px solid #F7FAFF", color: "#260944", padding: "9px 10px" }}>
                  {row.productName}
                </TableCell>
                <TableCell align="right" sx={{ borderBottom: "1px solid #F7FAFF", padding: "9px 10px", fontSize: "13px" }}>
                  {row.bookBalanceQuantity}
                </TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell colSpan={2} sx={{ fontWeight: 600, padding: "10px" }}>
                {stock.length} Item(s)
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
};

export default StockTable;
