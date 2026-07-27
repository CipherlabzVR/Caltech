import React, { useState, useEffect } from "react";
import {
  Alert,
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
import { toast } from "react-toastify";
import BASE_URL from "Base/api";
import { formatCurrency } from "@/components/utils/formatHelper";
import {
  isValidDecimalInput,
  isValidSignedDecimalInput,
  NEGATIVE_PROFIT_ERROR,
  parseDecimalInput,
  toDecimalInputValue,
  validateProfitValue,
} from "@/components/utils/summaryInquiryHelpers";

const ITEM_ORDER = ["collercuff", "trims", "embroider", "screenprint", "sublimation", "dtf", "sewing", "other", "cutting"];

const sortItemsByDisplayOrder = (items) => {
  if (!items?.length) return items ?? [];
  const orderMap = new Map(ITEM_ORDER.map((name, i) => [name.toLowerCase(), i]));
  return [...items].sort((a, b) => {
    const nameA = (a.itemName || "").toLowerCase().trim();
    const nameB = (b.itemName || "").toLowerCase().trim();
    const idxA = orderMap.has(nameA) ? orderMap.get(nameA) : -1;
    const idxB = orderMap.has(nameB) ? orderMap.get(nameB) : -1;
    if (idxA === -1 && idxB === -1) return 0;
    if (idxA === -1) return -1;
    if (idxB === -1) return 1;
    return idxA - idxB;
  });
};

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
  const [commissionInput, setCommissionInput] = useState("0");
  const [patternInput, setPatternInput] = useState("0");
  const [profitError, setProfitError] = useState("");

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
        await fetchLastApprovedLineItems(inquiry.inquiryId, inquiry.optionId);
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
  }, [items, patternTotalCost, commissionTotalCost, profit]);

  const fetchLastApprovedLineItems = async (inquiryId, optionId) => {
    try {
      // Get last approved version
      const approvedResponse = await fetch(
        `${BASE_URL}/Inquiry/GetLastApprovedVersion?InquiryID=${inquiryId}&OptionId=${optionId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (approvedResponse.ok) {
        const approvedResult = await approvedResponse.json();
        if (approvedResult.result) {
          const versionId = approvedResult.result.id;
          
          // Get line items for the last approved version
          const lineResponse = await fetch(
            `${BASE_URL}/Inquiry/GetQuotationVersionLineHistory?VersionHistoryId=${versionId}`,
            {
              method: "GET",
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
                "Content-Type": "application/json",
              },
            }
          );

          if (lineResponse.ok) {
            const lineData = await lineResponse.json();
            const approvedLineItems = lineData.result || [];
            
            // Update items with approved values (preserve display order: fabric first, then fixed sequence)
            setItems(prevItems => {
              const updated = prevItems.map(item => {
                const approvedItem = approvedLineItems.find(ai => ai.itemName === item.itemName && ai.itemName !== "Commission" && ai.itemName !== "Pattern");
                if (approvedItem) {
                  const unitCost = approvedItem.approvedUnitCost ?? approvedItem.unitCost ?? item.unitCost;
                  return {
                    ...item,
                    unitCost,
                    unitCostInput: toDecimalInputValue(unitCost),
                    totalCost: approvedItem.approvedTotalCost ?? approvedItem.totalCost ?? item.totalCost,
                    quantity: approvedItem.approvedQuantity ?? approvedItem.quantity ?? item.quantity,
                    approvedUnitCost: approvedItem.approvedUnitCost ?? approvedItem.unitCost,
                    approvedTotalCost: approvedItem.approvedTotalCost ?? approvedItem.totalCost,
                    approvedQuantity: approvedItem.approvedQuantity ?? approvedItem.quantity,
                  };
                }
                return item;
              });
              return sortItemsByDisplayOrder(updated);
            });

            // Update pattern item
            const approvedPattern = approvedLineItems.find(ai => ai.itemName === "Pattern");
            if (approvedPattern) {
              const patternCost = approvedPattern.approvedTotalCost ?? approvedPattern.totalCost ?? 0;
              setPatternUCost(approvedPattern.approvedUnitCost ?? approvedPattern.unitCost ?? 0);
              setPatternTotalCost(patternCost);
              setPatternInput(toDecimalInputValue(patternCost));
              setPatternQuantity(approvedPattern.approvedQuantity ?? approvedPattern.quantity ?? 0);
            }

            // Update commission item
            const approvedCommission = approvedLineItems.find(ai => ai.itemName === "Commission");
            if (approvedCommission) {
              const commissionCost = approvedCommission.approvedTotalCost ?? approvedCommission.totalCost ?? 0;
              setCommissionTotalCost(commissionCost);
              setCommissionInput(toDecimalInputValue(commissionCost));
            }
          }
        }
      }
    } catch (error) {
      console.error("Error fetching last approved line items:", error);
    }
  };

  const fetchQuotationDataList = async (inquiryId, optionId, windowType) => {
    try {
      // First try to get the last approved version
      const approvedResponse = await fetch(
        `${BASE_URL}/Inquiry/GetLastApprovedVersion?InquiryID=${inquiryId}&OptionId=${optionId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      let useApprovedValues = false;
      let approvedData = null;

      if (approvedResponse.ok) {
        const approvedResult = await approvedResponse.json();
        if (approvedResult.result) {
          approvedData = approvedResult.result;
          useApprovedValues = true;
        }
      }

      // Fallback to current header if no approved version exists
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
        if (useApprovedValues && approvedData) {
          // Use last approved values
          const loadedProfit = approvedData.apprvedUnitProfit || 0;
          setProfit(toDecimalInputValue(loadedProfit));
          setProfitError(loadedProfit < 0 ? NEGATIVE_PROFIT_ERROR : "");
          setSellingPrice(approvedData.apprvedSellingPrice || 0);
          setRevenue(approvedData.apprvedRevanue || 0);
          setTotalCost(approvedData.apprvedTotalCost || 0);
          setTotalProfit(approvedData.apprvedTotalProfit || 0);
          setUnitCost(approvedData.apprvedUnitCost || 0);
          setProfitPercentage(approvedData.apprvedProfitPercentage || 0);
          setNoOfUnits(approvedData.apprvedTotalUnits || 0);
        } else {
          // Use current values (fallback)
          const loadedProfit = data.result.unitProfit || 0;
          setProfit(toDecimalInputValue(loadedProfit));
          setProfitError(loadedProfit < 0 ? NEGATIVE_PROFIT_ERROR : "");
          setSellingPrice(data.result.sellingPrice || 0);
          setRevenue(data.result.revanue || 0);
          setTotalCost(data.result.totalCost || 0);
          setTotalProfit(data.result.totalProfit || 0);
          setUnitCost(data.result.unitCost || 0);
          setProfitPercentage(data.result.profitPercentage || 0);
        }
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
      setCommissionInput(toDecimalInputValue(commission.totalCost || 0));
    }

    const regularItems = allItems
      .filter(item => item.itemName !== "Commission")
      .map(item => ({
        ...item,
        unitCostInput: toDecimalInputValue(item.unitCost ?? 0),
      }));
    setItems(sortItemsByDisplayOrder(regularItems));

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
        setPatternInput(toDecimalInputValue(item.totalCost || 0));
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
    const profitValidation = validateProfitValue(profit);
    if (!profitValidation.valid) {
      setProfitError(profitValidation.message);
      toast.error(profitValidation.message);
      return;
    }

    const patternRow = patternItem ? {
      ...patternItem,
      UnitCost: patternUCost,
      TotalCost: patternTotalCost,
      Quantity: patternItem.quantity ?? patternQuantity,
      ApprovedUnitCost: patternUCost, // Copy to approved
      ApprovedTotalCost: patternTotalCost, // Copy to approved
      ApprovedQuantity: patternQuantity, // Copy to approved
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
        ApprovedQuantity: item.quantity, // Copy to approved
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
    if (!isValidDecimalInput(value)) return;

    updateIsSaved(false);
    const parsed = parseDecimalInput(value);
    const newItems = [...items];
    newItems[index].unitCostInput = value;
    newItems[index].unitCost = parsed.value;
    newItems[index].totalCost =
      (parsed.value || 0) * (newItems[index].quantity || 0);
    setItems(newItems);
  };

  const handlePatternTotalCostChange = (value) => {
    if (!isValidDecimalInput(value)) return;

    updateIsSaved(false);
    const parsed = parseDecimalInput(value);
    setPatternInput(value);
    setPatternTotalCost(parsed.value);
    if (patternQuantity > 0) {
      const v = parsed.value / parseInt(patternQuantity, 10);
      setPatternUCost(v.toFixed(2));
    } else {
      setPatternUCost(0);
    }
  };

  const handleCommissionTotalCostChange = (value) => {
    if (!isValidDecimalInput(value)) return;

    updateIsSaved(false);
    const parsed = parseDecimalInput(value);
    setCommissionInput(value);
    setCommissionTotalCost(parsed.value);
  };

  const handleProfitChange = (value) => {
    if (!isValidSignedDecimalInput(value)) return;

    updateIsSaved(false);
    setProfit(value);
    const profitValidation = validateProfitValue(value);
    setProfitError(profitValidation.valid ? "" : profitValidation.message);
  };

  const handleSetData = (
    dataProfit,
    dataProPercentage,
    dataSellingPrice,
    dataTotalProfit,
    dataRevenue
  ) => {
    const parsedProfit = parseDecimalInput(dataProfit).value;
    const data = {
      revenue: dataRevenue,
      totalProfit: dataTotalProfit,
      sellingPrice: dataSellingPrice,
      profitPercentage: dataProPercentage,
      unitCost: unitCost,
      totalCost: totalCost,
      totalUnits: noOfUnits,
      profit: parsedProfit,
      profitValid: parsedProfit >= 0,
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
    const profitValue = parseDecimalInput(profit).value;
    const totalProfit = profitValue * noOfUnits;
    const sellPrice = profitValue + parseFloat(itemUnitCost || 0);
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
    handleSetData(profitValue, profitPercentage, sellPrice, totalProfit, revenue);
  };

  return (
    <>
      {profitError ? (
        <Alert severity="error" sx={{ mb: 1 }}>
          {profitError}
        </Alert>
      ) : null}
      <TableContainer component={Paper}>
        <Table size="small" aria-label="simple table" className="dark-table">
          <TableHead>
            <TableRow>
              <TableCell>Description</TableCell>
              <TableCell align="right">Unit Cost</TableCell>
              <TableCell align="right">Qty</TableCell>
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
                <TableCell align="right">
                  <input
                    value={item.unitCostInput ?? toDecimalInputValue(item.unitCost ?? 0)}
                    inputMode="decimal"
                    style={{
                      width: "60px",
                      border: "1px solid #e5e5e5",
                      textAlign: "right",
                    }}
                    onChange={(e) => handleUnitCostChange(index, e.target.value)}
                  />
                </TableCell>
                <TableCell align="right">{item.quantity ? item.quantity : 0}</TableCell>
                <TableCell align="right">
                  {item.totalCost ? item.totalCost.toFixed(2) : "0.00"}
                </TableCell>
              </TableRow>
            ))}
            <TableRow
              sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
            >
              <TableCell component="th" scope="row">
                Commission
              </TableCell>
              <TableCell align="right"></TableCell>
              <TableCell align="right"></TableCell>
              <TableCell align="right">
                <input
                  value={commissionInput}
                  inputMode="decimal"
                  style={{
                    width: "60px",
                    border: "1px solid #e5e5e5",
                    textAlign: "right",
                  }}
                  onChange={(e) => handleCommissionTotalCostChange(e.target.value)}
                />
              </TableCell>
            </TableRow>
            <TableRow
              sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
            >
              <TableCell component="th" scope="row">
                Pattern
              </TableCell>
              <TableCell align="right">{patternUCost}</TableCell>
              <TableCell align="right">{patternQuantity}</TableCell>
              <TableCell align="right">
                <input
                  value={patternInput}
                  inputMode="decimal"
                  style={{
                    width: "60px",
                    border: "1px solid #e5e5e5",
                    textAlign: "right",
                  }}
                  onChange={(e) => handlePatternTotalCostChange(e.target.value)}
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
                  inputMode="decimal"
                  style={{
                    width: "60px",
                    border: profitError ? "1px solid #d32f2f" : "1px solid #e5e5e5",
                    textAlign: "right",
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