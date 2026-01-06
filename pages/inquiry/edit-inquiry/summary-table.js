import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
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

export default function SumTable({ onIsSavedChange, inquiry, onSummaryChange }) {
  const [items, setItems] = useState([]);
  const [patternItem, setPatternItem] = useState();
  const [totalCost, setTotalCost] = useState(0);
  const [noOfUnits, setNoOfUnits] = useState(0);
  const [unitCost, setUnitCost] = useState(0);
  const [profit, setProfit] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);
  const [revenue, setRevenue] = useState(0);
  const [sellingPrice, setSellingPrice] = useState(0);
  const [profitPercentage, setProfitPercentage] = useState(0);
  const [patternQuantity, setPatternQuantity] = useState(0);
  const [patternTotalCost, setPatternTotalCost] = useState(0);
  const [patternUCost, setPatternUCost] = useState(0);
  const [summaryData, setSummaryData] = useState(null);
  const [commissionItem, setCommissionItem] = useState(null);
  const [commissionTotalCost, setCommissionTotalCost] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      if (inquiry) {
        await fetchQuotationDataList(
          inquiry.inquiryId,
          inquiry.optionId,
          inquiry.windowType
        );
        await fetchItems(inquiry.inquiryId, inquiry.optionId, inquiry.windowType);
        await fetchPattern(inquiry.inquiryId, inquiry.optionId, inquiry.windowType);
      }

    };
    fetchData();
  }, [inquiry]);

  useEffect(() => {
    if (items.length > 0 || patternTotalCost > 0 || commissionTotalCost > 0) {
      const allItems = [
        ...items.map(i => ({ TotalCost: i.totalCost })),
        { TotalCost: patternTotalCost },
        { TotalCost: commissionTotalCost },
      ];
      computeTotalCost(allItems);
    }
  }, [items, patternTotalCost, commissionTotalCost]);

  const fetchQuotationDataList = async (inquiryId, optionId, windowType) => {
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
        throw new Error("Failed to fetch Quotation List");
      }
      const data = await response.json();
      if (data.result) {
        setProfit(data.result.unitProfit || 0);
        setSellingPrice(data.result.sellingPrice || 0);
        setRevenue(data.result.revanue || 0);
        setTotalCost(data.result.totalCost || 0);
        setTotalProfit(data.result.totalProfit || 0);
        setUnitCost(data.result.unitCost || 0);
        setProfitPercentage(data.result.profitPercentage || 0);
      }
    } catch (error) {
      console.error("Error fetching Quotation List:", error);
    }
  };

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
      throw new Error("Failed to fetch Summary Table Items");
    }
    const data = await response.json();
    const allItems = data.result || [];
    
    const commission = allItems.find(item => item.itemName === "Commission");
    if (commission) {
      setCommissionItem(commission);
      setCommissionTotalCost(commission.totalCost || 0);
    }

    const regularItems = allItems.filter(item => item.itemName !== "Commission");
    setItems(regularItems);

    if (regularItems.length > 0) {
      setNoOfUnits(regularItems[0].quantity || 0);
    }
  } catch (error) {
    console.error("Error fetching Summary Table Items:", error);
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
      const item = data.result[0];
      if (data.result && data.result.length > 0) {
        setPatternQuantity(item.quantity || 0);
        setPatternTotalCost(item.totalCost || 0);
        setPatternUCost(item.unitCost || 0);
        await setPatternItem(item);
      }
    } catch (error) {
      console.error("Error fetching Size List:", error);
    }
  };

  const updateIsSaved = (value) => {
    if (onIsSavedChange) {
      onIsSavedChange(value);
    }
  };

  // ✅ **Updated function to correctly save ApprovedTotalCost**
  const handleUpdateSummaryLine = async () => {
    const patternRow = patternItem ? {
      ...patternItem,
      UnitCost: patternUCost,
      TotalCost: patternTotalCost,
      ApprovedUnitCost: patternUCost, // Copy to approved
      ApprovedTotalCost: patternTotalCost, // Copy to approved
    } : null;
  
    const commissionRow = commissionItem ? {
      ...commissionItem,
      UnitCost: 0,
      TotalCost: commissionTotalCost,
      ApprovedUnitCost: 0, // Commission has no unit cost
      ApprovedTotalCost: commissionTotalCost, // ✅ **Crucial change: Save to approved cost**
    } : null;
  
    const bodyData = [
      ...items.map((item) => ({
        ...item,
        ApprovedUnitCost: item.unitCost, // Copy to approved
        ApprovedTotalCost: item.totalCost, // Copy to approved
      })),
    ];
  
    if (patternRow) bodyData.push(patternRow);
    if (commissionRow) bodyData.push(commissionRow);
  
    const allCostsForCalc = [
      ...items.map(i => ({ TotalCost: i.totalCost })),
      { TotalCost: patternTotalCost },
      { TotalCost: commissionTotalCost },
    ];
    computeTotalCost(allCostsForCalc);

    console.log(commissionRow);
    console.log(bodyData);
  
    updateIsSaved(true);
  
    try {
      const response = await fetch(`${BASE_URL}/Inquiry/UpdateSummeryLine`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(bodyData),
      });
      if (!response.ok) throw new Error("Network response was not ok");
      await response.json();
    } catch (error) {
      console.error("Update failed:", error);
    }
  };

  const handleUnitCostChange = (index, value) => {
    updateIsSaved(false);
    const newItems = [...items];
    newItems[index].unitCost = parseFloat(value) || 0;
    newItems[index].totalCost =
      (newItems[index].unitCost || 0) * (newItems[index].quantity || 0);
    setItems(newItems);
  };

  const handlePatternTotalCostChange = (value) => {
    updateIsSaved(false);
    const totalCost = parseFloat(value) || 0;
    setPatternTotalCost(totalCost);
    if (patternQuantity > 0) {
      const v = parseFloat(totalCost) / parseInt(patternQuantity);
      setPatternUCost(v.toFixed(2));
    } else {
      setPatternUCost(0);
    }
  };

  const handleCommissionTotalCostChange = (value) => {
    updateIsSaved(false);
    setCommissionTotalCost(parseFloat(value) || 0);
  };

  const handleProfitChange = (value) => {
    updateIsSaved(false);
    setProfit(value);
  };

  const handleSetData = (
    dataProfit,
    dataProPercentage,
    dataSellingPrice,
    dataTotalProfit,
    dataRevenue
  ) => {
    const data = {
      revenue: dataRevenue,
      totalProfit: dataTotalProfit,
      sellingPrice: dataSellingPrice,
      profitPercentage: dataProPercentage,
      unitCost: unitCost,
      totalCost: totalCost,
      totalUnits: noOfUnits,
      profit: dataProfit,
    };
    setSummaryData(data);
    if (onSummaryChange) {
      onSummaryChange(data);
    }
  };

  const computeTotalCost = (items) => {
    const itemsTotalCost = items.reduce(
      (acc, item) => acc + (item.TotalCost || 0),
      0
    );
    const itemUnitCost = noOfUnits > 0 ? itemsTotalCost / noOfUnits : 0;
    const totalProfit = parseFloat(profit || 0) * noOfUnits;
    const sellPrice = parseFloat(profit || 0) + parseFloat(itemUnitCost || 0);
    const revenue = parseFloat(itemsTotalCost) + parseFloat(totalProfit);
    const profitPercentage =
      itemUnitCost > 0
        ? ((parseFloat(sellPrice) - parseFloat(itemUnitCost)) /
          parseFloat(itemUnitCost)) *
        100
        : 0;
    setUnitCost(itemUnitCost.toFixed(2));
    setTotalCost(itemsTotalCost);
    setTotalProfit(totalProfit);
    setRevenue(revenue);
    setSellingPrice(sellPrice);
    setProfitPercentage(profitPercentage);
    handleSetData(profit, profitPercentage, sellPrice, totalProfit, revenue);
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
                  {item.itemName}
                </TableCell>
                <TableCell>
                  <input
                    value={item.unitCost ? item.unitCost : 0}
                    style={{
                      width: "60px",
                      border: "1px solid #e5e5e5",
                    }}
                    onChange={(e) => handleUnitCostChange(index, e.target.value)}
                  />
                </TableCell>
                <TableCell>{item.quantity ? item.quantity : 0}</TableCell>
                <TableCell align="right">
                  {item.totalCost ? item.totalCost.toFixed(2) : "0.00"}
                </TableCell>
              </TableRow>
            ))}
            <TableRow
              sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
            >
              <TableCell component="th" scope="row">
                Pattern
              </TableCell>
              <TableCell>{patternUCost}</TableCell>
              <TableCell>{patternQuantity}</TableCell>
              <TableCell align="right">
                <input
                  value={patternTotalCost}
                  style={{
                    width: "60px",
                    border: "1px solid #e5e5e5",
                  }}
                  onChange={(e) => handlePatternTotalCostChange(e.target.value)}
                />
              </TableCell>
            </TableRow>
            <TableRow
              sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
            >
              <TableCell component="th" scope="row">
                Commission
              </TableCell>
              <TableCell></TableCell>
              <TableCell></TableCell>
              <TableCell align="right">
                <input
                  value={commissionTotalCost}
                  style={{
                    width: "60px",
                    border: "1px solid #e5e5e5",
                  }}
                  onChange={(e) => handleCommissionTotalCostChange(e.target.value)}
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
              <TableCell align="right">{formatCurrency(totalCost)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ color: "#90a4ae" }}>No of Units</TableCell>
              <TableCell align="right">{noOfUnits}</TableCell>
              <TableCell sx={{ color: "#90a4ae" }}>Unit Cost</TableCell>
              <TableCell align="right">{formatCurrency(unitCost)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ color: "#90a4ae" }}>Profit</TableCell>
              <TableCell align="right">
                <input
                  value={profit}
                  style={{
                    width: "60px",
                    border: "1px solid #e5e5e5",
                  }}
                  onChange={(e) => handleProfitChange(e.target.value)}
                />
              </TableCell>
              <TableCell sx={{ color: "#90a4ae" }}>Profit (%)</TableCell>
              <TableCell align="right">{profitPercentage ? Number(profitPercentage).toFixed(2) : '0.00'}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ color: "#90a4ae" }}>Selling Price</TableCell>
              <TableCell align="right">
                {formatCurrency(sellingPrice)}
              </TableCell>
              <TableCell sx={{ color: "#90a4ae" }}>Total Profit</TableCell>
              <TableCell align="right">{formatCurrency(totalProfit)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ color: "#90a4ae" }} colSpan={3}>
                Revenue
              </TableCell>
              <TableCell align="right">{formatCurrency(revenue)}</TableCell>
            </TableRow>
          </TableHead>
        </Table>
        <Box m={1}>
          <Button
            variant="contained"
            size="small"
            onClick={() => handleUpdateSummaryLine()}
          >
            Update
          </Button>
        </Box>
      </TableContainer>
    </>
  );
}