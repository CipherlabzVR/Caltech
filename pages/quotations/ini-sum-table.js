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
import BASE_URL from "Base/api";
import { formatCurrency } from "@/components/utils/formatHelper";

export default function InitialSummaryTable({ inquiry }) {
  const [items, setItems] = useState([]);
  const [patternItem, setPatternItem] = useState({});

  const fetchItems = async (inquiryId, optionId, windowType) => {
    try {
      const response = await fetch(
        `${BASE_URL}/Inquiry/GetAllInquirySummeryTableItems?InquiryID=${inquiryId}&OptionId=${optionId}&WindowType=${windowType}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch Size List");
      }

      const data = await response.json();
      setItems(data.result);
    } catch (error) {
      console.error("Error fetching Size List:", error);
    }
  };

  const fetchPattern = async (inquiryId, optionId, windowType) => {
    try {
      const response = await fetch(
        `${BASE_URL}/Inquiry/GetAllInquirySummeryLinesPattern?InquiryID=${inquiryId}&OptionId=${optionId}&WindowType=${windowType}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok) {
        throw new Error("Failed to fetch Size List");
      }
      const data = await response.json();
      setPatternItem(data.result[0]);
    } catch (error) {
      console.error("Error fetching Size List:", error);
    }
  };

  useEffect(() => {
    if (inquiry) {
      fetchItems(inquiry.inquiryId, inquiry.optionId, inquiry.windowType);
      fetchPattern(inquiry.inquiryId, inquiry.optionId, inquiry.windowType);
    }
  }, [inquiry]);

  // Calculate totals
  const toNumber = (val) => {
    const num = Number(val);
    return isNaN(num) ? 0 : num;
  };

  const lines = [
    ...items,
    ...(patternItem && patternItem.itemName ? [patternItem] : []),
  ];
  const initialCost = lines.reduce((sum, line) => {
    const qty = toNumber(line.quantity);
    const unit = toNumber(line.unitCost);
    return sum + unit * qty;
  }, 0);
  const approvedCost = lines.reduce((sum, line) => {
    const qty = toNumber(line.approvedQuantity ?? line.quantity);
    const unit = toNumber(line.approvedUnitCost ?? line.unitCost);
    return sum + unit * qty;
  }, 0);
  const initialUnits = lines.reduce(
    (sum, line) => sum + toNumber(line.quantity),
    0
  );
  const approvedUnits = lines.reduce(
    (sum, line) => sum + toNumber(line.approvedQuantity ?? line.quantity),
    0
  );
  // User expects "Unit Cost" summary to be SUM of all unit costs (not average)
  const initialUnitCost = lines.reduce((sum, line) => sum + toNumber(line.unitCost), 0);
  const approvedUnitCost = lines.reduce(
    (sum, line) => sum + toNumber(line.approvedUnitCost ?? line.unitCost),
    0
  );

  return (
    <>
      <TableContainer component={Paper}>
        <Table size="small" aria-label="simple table" className="dark-table">
          <TableHead>
            <TableRow>
              <TableCell>Description</TableCell>
              <TableCell>Qty</TableCell>
              <TableCell align="right">Unit Cost</TableCell>
              <TableCell sx={{ background: "#a0b8f6", width: '200px', color: "#fff" }}>
                Approved Unit Cost
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item, index) => (
              <TableRow
                key={index}
                sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
              >
                <TableCell component="th" scope="row">
                  {item.itemName}
                </TableCell>
                <TableCell>
                  {item.quantity === null ? 0 : item.quantity}
                </TableCell>
                <TableCell align="right">
                  {item.unitCost === null ? 0 : item.unitCost}
                </TableCell>
                <TableCell
                  sx={{
                    background: "#a0b8f6",
                    fontWeight: 'bold',
                    color:
                      item.approvedUnitCost !== item.unitCost ? "blue" : "#fff",
                  }}
                >
                  {item.approvedUnitCost === null ? 0 : item.approvedUnitCost}
                </TableCell>
              </TableRow>
            ))}
            <TableRow
              sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
            >
              <TableCell component="th" scope="row">
                {patternItem.itemName}
              </TableCell>
              <TableCell>
                {patternItem.quantity === null ? 0 : patternItem.quantity}
              </TableCell>
              <TableCell align="right">
                {patternItem.unitCost === null ? 0 : patternItem.unitCost}
              </TableCell>
              <TableCell sx={{
                background: "#a0b8f6",
                fontWeight: 'bold',
                color:
                  patternItem.approvedUnitCost !== patternItem.unitCost ? "blue" : "#fff",
              }}>
                {patternItem.approvedUnitCost === null
                  ? 0
                  : patternItem.approvedUnitCost}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      <TableContainer sx={{ mt: 2, mb: 3 }}>
        <Table size="small" aria-label="simple table" className="dark-table">
          <TableHead>
            <TableRow>
              <TableCell sx={{ color: "#90a4ae" }}>Description</TableCell>
              <TableCell align="right" sx={{ color: "#90a4ae" }}>
                Initial
              </TableCell>
              <TableCell sx={{ background: "#a0b8f6", width: '200px', color: "#fff" }}>
                Approved
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell sx={{ color: "#90a4ae" }}>Total Cost</TableCell>
              <TableCell align="right" sx={{ color: "#90a4ae" }}>
                {formatCurrency(initialCost)}
              </TableCell>
              <TableCell sx={{
                background: "#a0b8f6", fontWeight: 'bold',
                color:
                  approvedCost !== initialCost ? "blue" : "#fff",
              }}>
                {formatCurrency(approvedCost)}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ color: "#90a4ae" }}>No of Units</TableCell>
              <TableCell align="right" sx={{ color: "#90a4ae" }}>
                {initialUnits}
              </TableCell>
              <TableCell sx={{
                background: "#a0b8f6", fontWeight: 'bold'
              }}>
                {approvedUnits}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ color: "#90a4ae" }}>Unit Cost</TableCell>
              <TableCell align="right" sx={{ color: "#90a4ae" }}>
                {formatCurrency(initialUnitCost)}
              </TableCell>
              <TableCell sx={{
                background: "#a0b8f6", fontWeight: 'bold',
                color:
                  approvedUnitCost !== initialUnitCost ? "blue" : "#fff"
              }}>
                {formatCurrency(approvedUnitCost)}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ color: "#90a4ae" }}>Profit</TableCell>
              <TableCell align="right" sx={{ color: "#90a4ae" }}>
                {formatCurrency(inquiry ? inquiry.unitProfit : 0)}
              </TableCell>
              <TableCell sx={{
                background: "#a0b8f6", fontWeight: 'bold',
                color:
                  inquiry && (inquiry.approvedUnitProfit !== inquiry.unitProfit) ? "blue" : "#fff"
              }}>
                {formatCurrency(inquiry ? inquiry.approvedUnitProfit : 0)}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ color: "#90a4ae" }}>Unit Price</TableCell>
              <TableCell align="right" sx={{ color: "#90a4ae" }}>
                {formatCurrency(inquiry ? inquiry.sellingPrice : 0)}
              </TableCell>
              <TableCell sx={{
                background: "#a0b8f6", fontWeight: 'bold',
                color:
                  inquiry && (inquiry.approvedSellingPrice !== inquiry.sellingPrice) ? "blue" : "#fff"
              }}>
                {formatCurrency(inquiry ? inquiry.approvedSellingPrice : 0)}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ color: "#90a4ae" }}>Profit Percentage</TableCell>
              <TableCell align="right" sx={{ color: "#90a4ae" }}>
                {formatCurrency(inquiry ? inquiry.profitPercentage : 0)}
              </TableCell>
              <TableCell sx={{
                background: "#a0b8f6", fontWeight: 'bold',
                color:
                  inquiry && (inquiry.approvedProfitPercentage !== inquiry.profitPercentage) ? "blue" : "#fff"
              }}>
                {formatCurrency(inquiry ? inquiry.approvedProfitPercentage : 0)}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ color: "#90a4ae" }}>Total Profit</TableCell>
              <TableCell align="right" sx={{ color: "#90a4ae" }}>
                {formatCurrency(inquiry ? inquiry.totalProfit : 0)}
              </TableCell>
              <TableCell sx={{
                background: "#a0b8f6", fontWeight: 'bold',
                color:
                  inquiry && (inquiry.approvedTotalProfit !== inquiry.totalProfit) ? "blue" : "#fff"
              }}>
                {formatCurrency(inquiry ? inquiry.approvedTotalProfit : 0)}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ color: "#90a4ae" }}>Revenue</TableCell>
              <TableCell align="right" sx={{ color: "#90a4ae" }}>
                {formatCurrency(inquiry ? inquiry.revenue : 0)}
              </TableCell>
              <TableCell sx={{
                background: "#a0b8f6", fontWeight: 'bold',
                color:
                  inquiry && (inquiry.approvedRevenue !== inquiry.revenue)? "blue" : "#fff"
              }}>
                {formatCurrency(inquiry ? inquiry.approvedRevenue : 0)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
}
