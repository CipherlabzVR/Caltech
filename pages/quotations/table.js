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

export default function TableData({ onIsSavedChange, inquiry, onSummaryChange }) {
  const [items, setItems] = useState([]);
  const [patternItem, setPatternItem] = useState({});
  const [patternQuantity, setPatternQuantity] = useState(0);
  const [patternTotalCost, setPatternTotalCost] = useState(0);
  const [patternUCost, setPatternUCost] = useState(0);
  const [commissionItem, setCommissionItem] = useState({});
  const [commissionTotalCost, setCommissionTotalCost] = useState(0);

  const [totalCost, setTotalCost] = useState(0);
  const [noOfUnits, setNoOfUnits] = useState(0);
  const [finalUnitCost, setFinalUnitCost] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);
  const [revenue, setRevenue] = useState(0);
  const [sellingPrice, setSellingPrice] = useState(0);
  const [profitPercentage, setProfitPercentage] = useState(10);
  const [rawProfit, setRawProfit] = useState("");

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
        ...items.map((i) => ({ TotalCost: i.approvedTotalCost })),
        { TotalCost: patternTotalCost },
        { TotalCost: commissionTotalCost },
      ];
      computeTotalCost(allItems);
    }
  }, [items, patternTotalCost, commissionTotalCost]);

  // ✅ **Updated fetchItems with fallback logic**
  const fetchItems = async (inquiryId, optionId, windowType) => {
    try {
      const response = await fetch(
        `${BASE_URL}/Inquiry/GetAllInquirySummeryTableItems?InquiryID=${inquiryId}&OptionId=${optionId}&WindowType=${windowType}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      if (!response.ok) throw new Error("Failed to fetch items");

      const data = await response.json();
      const allItems = (data.result || []).map(item => {
        // If approved cost is 0, use the initial cost from the previous table.
        if (!item.approvedTotalCost || item.approvedTotalCost === 0) {
            item.approvedTotalCost = item.totalCost;
            item.approvedUnitCost = item.unitCost;
        }
        if (!item.approvedQuantity) {
            item.approvedQuantity = item.quantity;
        }
        return item;
      });

      const commission = allItems.find(
        (item) => item.itemName === "Commission"
      );
      if (commission) {
        setCommissionItem(commission);
        setCommissionTotalCost(commission.approvedTotalCost || 0);
      }

      const regularItems = allItems.filter(
        (item) => item.itemName !== "Commission"
      );
      setItems(regularItems);
      setNoOfUnits(regularItems[0]?.quantity ?? 0);
    } catch (error) {
      console.error(error);
    }
  };

  // ✅ **Updated fetchPattern with fallback logic**
  const fetchPattern = async (inquiryId, optionId, windowType) => {
    try {
      const response = await fetch(
        `${BASE_URL}/Inquiry/GetAllInquirySummeryLinesPattern?InquiryID=${inquiryId}&OptionId=${optionId}&WindowType=${windowType}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      if (!response.ok) throw new Error("Failed to fetch pattern");

      const data = await response.json();
      const pattern = data.result[0];
      if (!pattern) return;

      // If approved cost is 0, use the initial cost from the previous table.
      if (!pattern.approvedTotalCost || pattern.approvedTotalCost === 0) {
        pattern.approvedTotalCost = pattern.totalCost;
        pattern.approvedUnitCost = pattern.unitCost;
      }

      const qty = pattern.approvedQuantity ?? 0;
      const totalCost = pattern.approvedTotalCost ?? 0;
      const unitCost = qty > 0 ? totalCost / qty : 0;

      setPatternQuantity(qty);
      setPatternTotalCost(totalCost);
      setPatternUCost(unitCost);
      setPatternItem(pattern);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchQuotationDataList = async (inquiryId, optionId, windowType) => {
    try {
      const response = await fetch(
        `${BASE_URL}/Inquiry/GetInquirySummeryHeaderBYOptionID?InquiryID=${inquiryId}&OptionId=${optionId}&WindowType=${windowType}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      if (!response.ok) throw new Error("Failed to fetch summary");

      const data = await response.json();
      if (!data.result) return;
      setTotalCost(data.result.apprvedTotalCost || 0);
      setRawProfit(data.result.apprvedUnitProfit || 0);
      setFinalUnitCost(data.result.apprvedUnitCost || 0);
      setRevenue(data.result.apprvedRevanue || 0);
      setTotalProfit(data.result.apprvedTotalProfit || 0);
      setProfitPercentage(data.result.apprvedProfitPercentage || 0);
    } catch (error) {
      console.error(error);
    }
  };

  const updateIsSaved = (value) => {
    if (onIsSavedChange) {
      onIsSavedChange(value);
    }
  };

  const handleItemUnitCostChange = (index, value) => {
    updateIsSaved(false);
    const newItems = [...items];
    const cost = parseFloat(value) || 0;
    const tcost = parseFloat(cost) * newItems[index].quantity || 0;
    newItems[index].approvedUnitCost = cost;
    newItems[index].approvedTotalCost = tcost;
    setItems(newItems);
  };

  const handlePatternTotalCostChange = (value) => {
    updateIsSaved(false);
    const cost = parseFloat(value) || 0;
    const unitCost = patternQuantity > 0 ? cost / patternQuantity : 0;
    setPatternTotalCost(cost);
    setPatternUCost(unitCost);
    setPatternItem({
      ...patternItem,
      approvedUnitCost: unitCost,
      approvedTotalCost: cost,
    });
  };

  const handleCommissionTotalCostChange = (value) => {
    updateIsSaved(false);
    setCommissionTotalCost(parseFloat(value) || 0);
  };

  const handleProfitChange = (value) => {
    updateIsSaved(false);
    const profitValue = parseFloat(value) || 0;
    setRawProfit(profitValue);
  };

  const handleCalculate = async () => {
    const calculatedValues = [
      ...items.map((item) => ({
        ...item,
        approvedUnitCost: item.approvedUnitCost,
        approvedTotalCost: item.approvedTotalCost,
      })),
      {
        ...patternItem,
        approvedTotalCost: patternTotalCost,
        approvedUnitCost: patternUCost,
      },
      {
        ...commissionItem,
        approvedTotalCost: commissionTotalCost,
        approvedUnitCost: 0,
      },
    ];
    if (calculatedValues.length > 0) {
      const allItems = [
        ...items.map((i) => ({ TotalCost: i.approvedTotalCost })),
        { TotalCost: patternTotalCost },
        { TotalCost: commissionTotalCost },
      ];
      computeTotalCost(allItems);
    }

    updateIsSaved(true);

    await fetch(`${BASE_URL}/Inquiry/UpdateSummeryLine`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(calculatedValues),
    });
  };

  const handleSetData = (
    dataProfit,
    dataProPercentage,
    dataSellingPrice,
    dataTotalProfit,
    dataRevenue,
    dataTotalCost,
    dataUnitCost
  ) => {
    const data = {
      revenue: dataRevenue,
      totalProfit: dataTotalProfit,
      sellingPrice: dataSellingPrice,
      profitPercentage: dataProPercentage,
      unitCost: dataUnitCost,
      totalCost: dataTotalCost,
      totalUnits: noOfUnits,
      profit: dataProfit,
    };
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
    const totalProfit = parseFloat(rawProfit || 0) * noOfUnits;
    const sellPrice = parseFloat(rawProfit || 0) + parseFloat(itemUnitCost || 0);
    const revenue = parseFloat(itemsTotalCost) + parseFloat(totalProfit);
    const profitPercentage =
      itemUnitCost > 0
        ? ((parseFloat(sellPrice) - parseFloat(itemUnitCost)) /
            parseFloat(itemUnitCost)) *
          100
        : 0;

    setFinalUnitCost(itemUnitCost.toFixed(2));
    setTotalCost(itemsTotalCost);
    setTotalProfit(totalProfit);
    setRevenue(revenue);
    setSellingPrice(sellPrice);
    setProfitPercentage(profitPercentage);
    handleSetData(
      rawProfit,
      profitPercentage,
      sellPrice,
      totalProfit,
      revenue,
      itemsTotalCost,
      itemUnitCost
    );
    updateIsSaved(true);
  };

  return (
    <>
      <TableContainer component={Paper}>
        <Table size="small" className="dark-table">
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
              <TableRow key={index}>
                <TableCell>{item.itemName}</TableCell>
                <TableCell>
                  <input
                    value={item.approvedUnitCost}
                    style={{ width: "60px", border: "1px solid #e5e5e5" }}
                    onChange={(e) =>
                      handleItemUnitCostChange(index, e.target.value)
                    }
                  />
                </TableCell>
                <TableCell>{item.approvedQuantity}</TableCell>
                <TableCell align="right">
                  {Number(item.approvedTotalCost).toFixed(2)}
                </TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell>Pattern</TableCell>
              <TableCell>{patternUCost.toFixed(2)}</TableCell>
              <TableCell>{patternQuantity}</TableCell>
              <TableCell align="right">
                <input
                  value={patternTotalCost}
                  style={{ width: "60px", border: "1px solid #e5e5e5" }}
                  onChange={(e) =>
                    handlePatternTotalCostChange(e.target.value)
                  }
                />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Commission</TableCell>
              <TableCell></TableCell>
              <TableCell></TableCell>
              <TableCell align="right">
                <input
                  value={commissionTotalCost}
                  style={{ width: "60px", border: "1px solid #e5e5e5" }}
                  onChange={(e) =>
                    handleCommissionTotalCostChange(e.target.value)
                  }
                />
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      <TableContainer sx={{ mt: 2 }}>
        <Table size="small" className="dark-table">
          <TableHead>
            <TableRow>
              <TableCell colSpan={3} sx={{ color: "#90a4ae" }}>
                Total Cost
              </TableCell>
              <TableCell align="right">{formatCurrency(totalCost)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ color: "#90a4ae" }}>No of Units</TableCell>
              <TableCell align="right">{noOfUnits}</TableCell>
              <TableCell sx={{ color: "#90a4ae" }}>Unit Cost</TableCell>
              <TableCell align="right">
                {formatCurrency(finalUnitCost)}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ color: "#90a4ae" }}>Profit</TableCell>
              <TableCell align="right">
                <input
                  value={rawProfit}
                  style={{ width: "60px", border: "1px solid #e5e5e5" }}
                  onChange={(e) => handleProfitChange(e.target.value)}
                />
              </TableCell>
              <TableCell sx={{ color: "#90a4ae" }}>Profit (%)</TableCell>
              <TableCell align="right">
                {profitPercentage ? Number(profitPercentage).toFixed(2) : "0.00"}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ color: "#90a4ae" }}>Selling Price</TableCell>
              <TableCell align="right">
                {formatCurrency(sellingPrice)}
              </TableCell>
              <TableCell sx={{ color: "#90a4ae" }}>Total Profit</TableCell>
              <TableCell align="right">
                {formatCurrency(totalProfit)}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ color: "#90a4ae" }} colSpan={3}>
                Revenue
              </TableCell>
              <TableCell align="right">{formatCurrency(revenue)}</TableCell>
            </TableRow>
          </TableHead>
        </Table>
      </TableContainer>

      <Box mt={2}>
        <Button variant="contained" onClick={handleCalculate}>
          Calculate
        </Button>
      </Box>
    </>
  );
}