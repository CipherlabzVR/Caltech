import React, { useState, useEffect } from "react";
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";

export default function SummaryTable() {
  const [items, setItems] = useState([
    { description: "Wetlook", unitCost: 10, qty: 30 },
    { description: "Coller Cuff", unitCost: 10, qty: 30 },
    { description: "Trims", unitCost: 10, qty: 30 },
    { description: "Embroider", unitCost: 10, qty: 30 },
    { description: "Screen Print", unitCost: 10, qty: 30 },
    { description: "Sublimation", unitCost: 10, qty: 30 },
    { description: "DTF", unitCost: 10, qty: 30 },
    { description: "Sewing", unitCost: 10, qty: 30 },
    { description: "Other", unitCost: 10, qty: 30 },
  ]);

  const [patternRow, setPatternRow] = useState({
    total: 200,
    qty: 35,
    unitCost: 200 / 35,
  });

  const [totalCost, setTotalCost] = useState(0);
  const [totalUnits, setTotalUnits] = useState(0);
  const [totalUnitCost, setTotalUnitCost] = useState(0);
  const [profitPercentage, setProfitPercentage] = useState(10);
  const [profit, setProfit] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);
  const [sellingPrice, setSellingPrice] = useState(0);
  const [revenue, setRevenue] = useState(0);

  useEffect(() => {
    const itemsTotal = items.reduce(
      (acc, item) => acc + item.unitCost * item.qty,
      0
    );
    const patternTotal = patternRow.total;
    setTotalCost(itemsTotal + patternTotal);

    const itemsQty = items.reduce((acc, item) => acc + item.qty, 0);
    const itemsUnitCost = items.reduce((acc, item) => acc + item.unitCost, 0);
    setTotalUnits(itemsQty + patternRow.qty);
    setTotalUnitCost(
      itemsQty + patternRow.qty === 0 ? 0 : itemsUnitCost + patternRow.unitCost
    );

    const calculatedProfit = (profitPercentage / 100) * totalUnitCost;
    const calculatedTotalProfit = totalUnits * calculatedProfit.toFixed(2);
    setProfit(calculatedProfit);
    setTotalProfit(calculatedTotalProfit);
  }, [items, patternRow, profitPercentage, totalUnitCost, totalUnits]);

  useEffect(() => {
    const calculatedRevenue = sellingPrice * totalUnits;
    setRevenue(calculatedRevenue);
  }, [sellingPrice, totalUnits]);

  const handleSellingPriceChange = (value) => {
    const price = parseFloat(value) || 0;
    setSellingPrice(price);
  };

  const handleTotalChange = (value) => {
    const total = parseFloat(value) || 0;
    const updatedPatternRow = {
      total,
      qty: patternRow.qty,
      unitCost: patternRow.qty === 0 ? 0 : total / patternRow.qty,
    };
    setPatternRow(updatedPatternRow);
  };

  const handleUnitCostChange = (index, value) => {
    const updatedItems = [...items];
    updatedItems[index].unitCost = parseFloat(value) || 0;
    setItems(updatedItems);
  };

  const handleProfitPercentageChange = (value) => {
    const percentage = parseFloat(value) || 0;
    setProfitPercentage(percentage);
  };

  return (
    <>
      <TableContainer component={Paper}>
        <Table size="small" aria-label="simple table" className="dark-table">
          <TableHead>
            <TableRow>
              <TableCell>Description</TableCell>
              <TableCell>Unit Cost</TableCell>
              <TableCell>Qty</TableCell>
              <TableCell align="right">Total Cost</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item, index) => (
              <TableRow
                key={index}
                sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
              >
                <TableCell component="th" scope="row">
                  {item.description}
                </TableCell>
                <TableCell>
                  <input
                    value={item.unitCost}
                    style={{
                      width: "60px",
                      border: "none",
                      outline: "none",
                    }}
                    onChange={(e) =>
                      handleUnitCostChange(index, e.target.value)
                    }
                  />
                </TableCell>
                <TableCell>{item.qty}</TableCell>
                <TableCell align="right">
                  {(item.unitCost * item.qty).toFixed(2)}
                </TableCell>
              </TableRow>
            ))}
            <TableRow
              sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
            >
              <TableCell component="th" scope="row">
                Pattern
              </TableCell>
              <TableCell>{patternRow.unitCost.toFixed(2)}</TableCell>
              <TableCell>{patternRow.qty}</TableCell>
              <TableCell>
                <input
                  value={patternRow.total}
                  style={{
                    width: "60px",
                    border: "none",
                    outline: "none",
                    textAlign: "right",
                  }}
                  onChange={(e) => handleTotalChange(e.target.value)}
                />
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      <TableContainer sx={{ mt: 2 }}>
        <Table size="small" aria-label="simple table" className="dark-table">
          <TableHead>
            <TableRow>
              <TableCell sx={{ color: "#90a4ae" }} colSpan={3}>
                Total Cost
              </TableCell>
              <TableCell align="right">{totalCost.toFixed(2)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ color: "#90a4ae" }}>No of Units</TableCell>
              <TableCell align="right">{totalUnits}</TableCell>
              <TableCell sx={{ color: "#90a4ae" }}>Unit Cost</TableCell>
              <TableCell align="right">{totalUnitCost.toFixed(2)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ color: "#90a4ae" }}>Profit</TableCell>
              <TableCell align="right">
                <input
                  value={profit.toFixed(2)}
                  style={{
                    width: "60px",
                    border: "none",
                    outline: "none",
                    textAlign: "right",
                  }}
                />
              </TableCell>
              <TableCell sx={{ color: "#90a4ae" }}>Profit %</TableCell>
              <TableCell align="right">
                <input
                  value={profitPercentage}
                  style={{
                    width: "60px",
                    border: "none",
                    outline: "none",
                    textAlign: "right",
                  }}
                  onChange={(e) => handleProfitPercentageChange(e.target.value)}
                />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ color: "#90a4ae" }}>Selling Price</TableCell>
              <TableCell align="right">
                <input
                  value={sellingPrice}
                  style={{
                    width: "60px",
                    border: "none",
                    outline: "none",
                    textAlign: "right",
                  }}
                  onChange={(e) => handleSellingPriceChange(e.target.value)}
                />
              </TableCell>
              <TableCell sx={{ color: "#90a4ae" }}>Total Profit</TableCell>
              <TableCell align="right">{totalProfit.toFixed(2)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ color: "#90a4ae" }} colSpan={3}>
                Revenue
              </TableCell>
              <TableCell align="right">{revenue.toFixed(2)}</TableCell>
            </TableRow>
          </TableHead>
        </Table>
      </TableContainer>
    </>
  );
}
