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
  const [commissionItem, setCommissionItem] = useState({});
  const [headerData, setHeaderData] = useState(null);

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
      const allItems = data.result || [];
      
      // Separate Commission from regular items
      const commission = allItems.find((item) => item.itemName === "Commission");
      if (commission) {
        setCommissionItem(commission);
      }
      
      // Filter out Commission from items list
      const regularItems = allItems.filter((item) => item.itemName !== "Commission");
      setItems(regularItems);
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

  const fetchHeaderData = async (inquiryId, optionId, windowType) => {
    try {
      const response = await fetch(
        `${BASE_URL}/Inquiry/GetInquirySummeryHeaderBYOptionID?InquiryID=${inquiryId}&OptionId=${optionId}&WindowType=${windowType}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok) {
        throw new Error("Failed to fetch Header Data");
      }
      const data = await response.json();
      setHeaderData(data.result);
    } catch (error) {
      console.error("Error fetching Header Data:", error);
    }
  };

  useEffect(() => {
    if (inquiry) {
      fetchItems(inquiry.inquiryId, inquiry.optionId, inquiry.windowType);
      fetchPattern(inquiry.inquiryId, inquiry.optionId, inquiry.windowType);
      fetchHeaderData(inquiry.inquiryId, inquiry.optionId, inquiry.windowType);
    }
  }, [inquiry]);

  // Helper to safely convert values to numbers
  const toNumber = (val) => {
    const num = Number(val);
    return isNaN(num) ? 0 : num;
  };

  // Get values directly from database (headerData)
  const initialCost = toNumber(headerData?.totalCost);
  const approvedCost = toNumber(headerData?.apprvedTotalCost);
  const initialUnits = toNumber(headerData?.totalUnits);
  const approvedUnits = toNumber(headerData?.apprvedTotalUnits);
  const initialUnitCost = toNumber(headerData?.unitCost);
  const approvedUnitCost = toNumber(headerData?.apprvedUnitCost);

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
            {/* Commission Row - displayed separately */}
            <TableRow
              sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
            >
              <TableCell component="th" scope="row">
                {commissionItem.itemName || "Commission"}
              </TableCell>
              <TableCell>1</TableCell>
              <TableCell align="right">
                {commissionItem.totalCost === null ? 0 : commissionItem.totalCost}
              </TableCell>
              <TableCell sx={{
                background: "#a0b8f6",
                fontWeight: 'bold',
                color:
                  commissionItem.approvedTotalCost !== commissionItem.totalCost ? "blue" : "#fff",
              }}>
                {commissionItem.approvedTotalCost === null
                  ? 0
                  : commissionItem.approvedTotalCost}
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
                {formatCurrency(headerData ? headerData.unitProfit : 0)}
              </TableCell>
              <TableCell sx={{
                background: "#a0b8f6", fontWeight: 'bold',
                color:
                  headerData && (headerData.apprvedUnitProfit !== headerData.unitProfit) ? "blue" : "#fff"
              }}>
                {formatCurrency(headerData ? headerData.apprvedUnitProfit : 0)}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ color: "#90a4ae" }}>Unit Price</TableCell>
              <TableCell align="right" sx={{ color: "#90a4ae" }}>
                {formatCurrency(headerData ? headerData.sellingPrice : 0)}
              </TableCell>
              <TableCell sx={{
                background: "#a0b8f6", fontWeight: 'bold',
                color:
                  headerData && (headerData.apprvedSellingPrice !== headerData.sellingPrice) ? "blue" : "#fff"
              }}>
                {formatCurrency(headerData ? headerData.apprvedSellingPrice : 0)}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ color: "#90a4ae" }}>Profit Percentage</TableCell>
              <TableCell align="right" sx={{ color: "#90a4ae" }}>
                {toNumber(headerData?.profitPercentage).toFixed(2)}
              </TableCell>
              <TableCell sx={{
                background: "#a0b8f6", fontWeight: 'bold',
                color:
                  headerData && (headerData.apprvedProfitPercentage !== headerData.profitPercentage) ? "blue" : "#fff"
              }}>
                {toNumber(headerData?.apprvedProfitPercentage).toFixed(2)}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ color: "#90a4ae" }}>Total Profit</TableCell>
              <TableCell align="right" sx={{ color: "#90a4ae" }}>
                {formatCurrency(headerData ? headerData.totalProfit : 0)}
              </TableCell>
              <TableCell sx={{
                background: "#a0b8f6", fontWeight: 'bold',
                color:
                  headerData && (headerData.apprvedTotalProfit !== headerData.totalProfit) ? "blue" : "#fff"
              }}>
                {formatCurrency(headerData ? headerData.apprvedTotalProfit : 0)}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ color: "#90a4ae" }}>Revenue</TableCell>
              <TableCell align="right" sx={{ color: "#90a4ae" }}>
                {formatCurrency(headerData ? headerData.revanue : 0)}
              </TableCell>
              <TableCell sx={{
                background: "#a0b8f6", fontWeight: 'bold',
                color:
                  headerData && (headerData.apprvedRevanue !== headerData.revanue) ? "blue" : "#fff"
              }}>
                {formatCurrency(headerData ? headerData.apprvedRevanue : 0)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
}
