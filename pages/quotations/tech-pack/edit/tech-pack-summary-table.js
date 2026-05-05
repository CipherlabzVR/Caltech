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

/**
 * Tech-pack-only summary table. Uses Ongoing summary APIs; when ongoing is empty, loads selected values from QuotationVersionHistory / QuotationVersionLineHistory.
 * Props: inquiry = { inquiryId (ongoingInquiryId), optionId, windowType, inquiryCode, optionName }, onIsSavedChange, onSummaryChange, originalInquiry = { inquiryId, optionId, windowType } (optional, for loading from version history)
 */
export default function TechPackSummaryTable({ onIsSavedChange, inquiry, onSummaryChange, originalInquiry }) {
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
  const [commissionItem, setCommissionItem] = useState(null);
  const [commissionTotalCost, setCommissionTotalCost] = useState(0);

  const inquiryId = inquiry?.inquiryId;
  const optionId = inquiry?.optionId;
  const windowType = inquiry?.windowType;
  const origInqId = originalInquiry?.inquiryId;
  const origOptId = originalInquiry?.optionId;
  const origWindowType = originalInquiry?.windowType;

  useEffect(() => {
    const fetchData = async () => {
      if (inquiryId == null || optionId == null || windowType == null) return;
      await fetchHeader(inquiryId, optionId, windowType);
      const ongoingItems = await fetchItems(inquiryId, optionId, windowType);
      await fetchPattern(inquiryId, optionId, windowType);

      if (origInqId != null && origOptId != null && ongoingItems.length === 0) {
        await loadFromQuotationVersionHistory(
          { inquiryId, optionId, windowType, inquiryCode: inquiry?.inquiryCode, optionName: inquiry?.optionName },
          { inquiryId: origInqId, optionId: origOptId, windowType: origWindowType ?? windowType }
        );
      }
    };
    fetchData();
  }, [inquiryId, optionId, windowType, origInqId, origOptId, origWindowType]);

  useEffect(() => {
    if (items.length > 0 || patternTotalCost > 0 || commissionTotalCost > 0) {
      const allItems = [
        ...items.map((i) => ({ TotalCost: i.totalCost })),
        { TotalCost: patternTotalCost },
        { TotalCost: commissionTotalCost },
      ];
      computeTotalCost(allItems);
    }
  }, [items, patternTotalCost, commissionTotalCost]);

  const fetchHeader = async (ongoingInquiryId, optionId, windowType) => {
    try {
      const response = await fetch(
        `${BASE_URL}/Ongoing/GetOngoingSummeryHeaderBYOptionID?ongoingInquiryId=${ongoingInquiryId}&optionId=${optionId}&windowType=${windowType}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok) throw new Error("Failed to fetch summary header");
      const data = await response.json();
      if (data.result) {
        setProfit(data.result.unitProfit || 0);
        setSellingPrice(data.result.sellingPrice || 0);
        setRevenue(data.result.revanue || 0);
        setTotalCost(data.result.totalCost || 0);
        setTotalProfit(data.result.totalProfit || 0);
        setUnitCost(data.result.unitCost || 0);
        setProfitPercentage(data.result.profitPercentage || 0);
        setNoOfUnits(data.result.totalUnits ?? data.result.apprvedTotalUnits ?? 0);
      }
    } catch (error) {
      console.error("Error fetching Ongoing summary header:", error);
    }
  };

  const fetchItems = async (ongoingInquiryId, optionId, windowType) => {
    try {
      const response = await fetch(
        `${BASE_URL}/Ongoing/GetAllOngoingSummeryLines?ongoingInquiryId=${ongoingInquiryId}&optionId=${optionId}&windowType=${windowType}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok) throw new Error("Failed to fetch summary lines");
      const data = await response.json();
      const allItems = data.result || [];

      const commission = allItems.find((item) => item.itemName === "Commission");
      if (commission) {
        setCommissionItem(commission);
        setCommissionTotalCost(commission.totalCost || 0);
      }

      const regularItems = allItems.filter((item) => item.itemName !== "Commission");
      setItems(sortItemsByDisplayOrder(regularItems));

      if (regularItems.length > 0) {
        setNoOfUnits(regularItems[0].quantity || 0);
      }
      return allItems;
    } catch (error) {
      console.error("Error fetching Ongoing summary lines:", error);
      return [];
    }
  };

  const loadFromQuotationVersionHistory = async (ongoingInquiry, originalInq) => {
    try {
      const versionRes = await fetch(
        `${BASE_URL}/Inquiry/GetLastApprovedVersion?InquiryID=${originalInq.inquiryId}&OptionId=${originalInq.optionId}&WindowType=${originalInq.windowType ?? ongoingInquiry.windowType}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (!versionRes.ok) return;
      const versionData = await versionRes.json();
      const version = versionData.result;
      if (!version) return;

      const lineRes = await fetch(
        `${BASE_URL}/Inquiry/GetQuotationVersionLineHistory?VersionHistoryId=${version.id}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (!lineRes.ok) return;
      const lineData = await lineRes.json();
      const lineItems = lineData.result || [];

      setProfit(version.unitProfit ?? version.apprvedUnitProfit ?? 0);
      setSellingPrice(version.sellingPrice ?? version.apprvedSellingPrice ?? 0);
      setRevenue(version.revanue ?? version.apprvedRevanue ?? 0);
      setTotalCost(version.totalCost ?? version.apprvedTotalCost ?? 0);
      setTotalProfit(version.totalProfit ?? version.apprvedTotalProfit ?? 0);
      setUnitCost(version.unitCost ?? version.apprvedUnitCost ?? 0);
      setProfitPercentage(version.profitPercentage ?? version.apprvedProfitPercentage ?? 0);
      setNoOfUnits(version.totalUnits ?? version.apprvedTotalUnits ?? 0);

      const commission = lineItems.find((i) => i.itemName === "Commission");
      if (commission) {
        setCommissionItem(commission);
        setCommissionTotalCost(commission.approvedTotalCost ?? commission.totalCost ?? 0);
      }
      const pattern = lineItems.find((i) => i.itemName === "Pattern");
      if (pattern) {
        setPatternQuantity(pattern.approvedQuantity ?? pattern.quantity ?? 0);
        setPatternTotalCost(pattern.approvedTotalCost ?? pattern.totalCost ?? 0);
        setPatternUCost(pattern.approvedUnitCost ?? pattern.unitCost ?? 0);
        setPatternItem(pattern);
      }
      const regular = lineItems.filter((i) => i.itemName !== "Commission" && i.itemName !== "Pattern");
      setItems(sortItemsByDisplayOrder(regular));
      if (regular.length > 0) {
        setNoOfUnits(regular[0].approvedQuantity ?? regular[0].quantity ?? 0);
      }

      await seedOngoingFromVersionHistory(ongoingInquiry, version, lineItems);
    } catch (error) {
      console.error("Error loading from quotation version history:", error);
    }
  };

  const seedOngoingFromVersionHistory = async (ongoingInquiry, version, lineItems) => {
    try {
      const headerBody = {
        InquiryID: ongoingInquiry.inquiryId,
        InqCode: ongoingInquiry.inquiryCode ?? "",
        WindowType: ongoingInquiry.windowType,
        OptionId: ongoingInquiry.optionId,
        InqOptionName: ongoingInquiry.optionName ?? "",
        TotalUnits: version.totalUnits ?? version.apprvedTotalUnits ?? 0,
        UnitCost: version.unitCost ?? version.apprvedUnitCost ?? 0,
        TotalCost: version.totalCost ?? version.apprvedTotalCost ?? 0,
        ProfitPercentage: version.profitPercentage ?? version.apprvedProfitPercentage ?? 0,
        UnitProfit: version.unitProfit ?? version.apprvedUnitProfit ?? 0,
        TotalProfit: version.totalProfit ?? version.apprvedTotalProfit ?? 0,
        SellingPrice: version.sellingPrice ?? version.apprvedSellingPrice ?? 0,
        Revanue: version.revanue ?? version.apprvedRevanue ?? 0,
        ApprovedStatus: 0,
        ApprvedTotalUnits: version.apprvedTotalUnits ?? version.totalUnits ?? 0,
        ApprvedUnitCost: version.apprvedUnitCost ?? version.unitCost ?? 0,
        ApprvedTotalCost: version.apprvedTotalCost ?? version.totalCost ?? 0,
        ApprvedProfitPercentage: version.apprvedProfitPercentage ?? version.profitPercentage ?? 0,
        ApprvedUnitProfit: version.apprvedUnitProfit ?? version.unitProfit ?? 0,
        ApprvedTotalProfit: version.apprvedTotalProfit ?? version.totalProfit ?? 0,
        ApprvedSellingPrice: version.apprvedSellingPrice ?? version.sellingPrice ?? 0,
        ApprvedRevanue: version.apprvedRevanue ?? version.revanue ?? 0,
        ProjectQty: version.projectQty ?? 0,
      };
      await fetch(`${BASE_URL}/Ongoing/CreateOrUpdateOngoingSummeryHeader`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(headerBody),
      });

      const lineBody = lineItems.map((line, idx) => ({
        InquiryID: ongoingInquiry.inquiryId,
        InqCode: ongoingInquiry.inquiryCode ?? "",
        WindowType: ongoingInquiry.windowType,
        OptionId: ongoingInquiry.optionId,
        InqOptionName: ongoingInquiry.optionName ?? "",
        ItemName: line.itemName ?? "",
        UnitCost: line.unitCost ?? line.approvedUnitCost,
        Quantity: line.quantity ?? line.approvedQuantity,
        TotalCost: line.totalCost ?? line.approvedTotalCost,
        ApprovedUnitCost: line.approvedUnitCost ?? line.unitCost,
        ApprovedQuantity: line.approvedQuantity ?? line.quantity,
        ApprovedTotalCost: line.approvedTotalCost ?? line.totalCost,
      }));
      if (lineBody.length > 0) {
        await fetch(`${BASE_URL}/Ongoing/UpdateOngoingSummeryLine`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(lineBody),
        });
      }
    } catch (err) {
      console.error("Error seeding ongoing from version history:", err);
    }
  };

  const fetchPattern = async (ongoingInquiryId, optionId, windowType) => {
    try {
      const response = await fetch(
        `${BASE_URL}/Ongoing/GetAllOngoingSummeryLinesPattern?ongoingInquiryId=${ongoingInquiryId}&optionId=${optionId}&windowType=${windowType}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok) throw new Error("Failed to fetch pattern");
      const data = await response.json();
      const item = data.result?.[0];
      if (data.result && data.result.length > 0) {
        setPatternQuantity(item.quantity || 0);
        setPatternTotalCost(item.totalCost || 0);
        setPatternUCost(item.unitCost || 0);
        setPatternItem(item);
      }
    } catch (error) {
      console.error("Error fetching Ongoing pattern:", error);
    }
  };

  const updateIsSaved = (value) => {
    if (onIsSavedChange) onIsSavedChange(value);
  };

  const handleUpdateSummaryLine = async () => {
    const patternRow = patternItem
      ? {
          ...patternItem,
          UnitCost: patternUCost,
          TotalCost: patternTotalCost,
          Quantity: patternItem.quantity ?? patternQuantity,
          ApprovedUnitCost: patternUCost,
          ApprovedTotalCost: patternTotalCost,
          ApprovedQuantity: patternQuantity,
        }
      : null;

    const commissionRow = commissionItem
      ? {
          ...commissionItem,
          UnitCost: 0,
          TotalCost: commissionTotalCost,
          ApprovedUnitCost: 0,
          ApprovedTotalCost: commissionTotalCost,
        }
      : null;

    const bodyData = [
      ...items.map((item) => ({
        ...item,
        ApprovedUnitCost: item.unitCost,
        ApprovedTotalCost: item.totalCost,
        ApprovedQuantity: item.quantity,
      })),
    ];
    if (patternRow) bodyData.push(patternRow);
    if (commissionRow) bodyData.push(commissionRow);

    const allCostsForCalc = [
      ...items.map((i) => ({ TotalCost: i.totalCost })),
      { TotalCost: patternTotalCost },
      { TotalCost: commissionTotalCost },
    ];
    computeTotalCost(allCostsForCalc);

    updateIsSaved(true);

    try {
      const response = await fetch(`${BASE_URL}/Ongoing/UpdateOngoingSummeryLine`, {
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
    newItems[index].totalCost = (newItems[index].unitCost || 0) * (newItems[index].quantity || 0);
    setItems(newItems);
  };

  const handlePatternTotalCostChange = (value) => {
    updateIsSaved(false);
    const totalCost = parseFloat(value) || 0;
    setPatternTotalCost(totalCost);
    if (patternQuantity > 0) {
      const v = parseFloat(totalCost) / parseInt(patternQuantity, 10);
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

  const handleSetData = (dataProfit, dataProPercentage, dataSellingPrice, dataTotalProfit, dataRevenue) => {
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
    if (onSummaryChange) onSummaryChange(data);
  };

  const computeTotalCost = (itemsForCalc) => {
    const itemsTotalCost = itemsForCalc.reduce((acc, item) => acc + (item.TotalCost || 0), 0);
    const itemUnitCost = noOfUnits > 0 ? itemsTotalCost / noOfUnits : 0;
    const totalProfitVal = parseFloat(profit || 0) * noOfUnits;
    const sellPrice = parseFloat(profit || 0) + parseFloat(itemUnitCost || 0);
    const revenueVal = parseFloat(itemsTotalCost) + parseFloat(totalProfitVal);
    const profitPercentageVal =
      itemUnitCost > 0
        ? ((parseFloat(sellPrice) - parseFloat(itemUnitCost)) / parseFloat(itemUnitCost)) * 100
        : 0;
    setUnitCost(itemUnitCost.toFixed(2));
    setTotalCost(itemsTotalCost);
    setTotalProfit(totalProfitVal);
    setRevenue(revenueVal);
    setSellingPrice(sellPrice);
    setProfitPercentage(profitPercentageVal);
    handleSetData(profit, profitPercentageVal, sellPrice, totalProfitVal, revenueVal);
  };

  return (
    <>
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
              <TableRow key={index} sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
                <TableCell component="th" scope="row">
                  {item.itemName}
                </TableCell>
                <TableCell align="right">
                  <input
                    value={item.unitCost ? item.unitCost : 0}
                    style={{ width: "60px", border: "1px solid #e5e5e5", textAlign: "right" }}
                    onChange={(e) => handleUnitCostChange(index, e.target.value)}
                  />
                </TableCell>
                <TableCell align="right">{item.quantity ? item.quantity : 0}</TableCell>
                <TableCell align="right">{item.totalCost ? item.totalCost.toFixed(2) : "0.00"}</TableCell>
              </TableRow>
            ))}
            <TableRow sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
              <TableCell component="th" scope="row">Commission</TableCell>
              <TableCell align="right" />
              <TableCell align="right" />
              <TableCell align="right">
                <input
                  value={commissionTotalCost}
                  style={{ width: "60px", border: "1px solid #e5e5e5", textAlign: "right" }}
                  onChange={(e) => handleCommissionTotalCostChange(e.target.value)}
                />
              </TableCell>
            </TableRow>
            <TableRow sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
              <TableCell component="th" scope="row">Pattern</TableCell>
              <TableCell align="right">{patternUCost}</TableCell>
              <TableCell align="right">{patternQuantity}</TableCell>
              <TableCell align="right">
                <input
                  value={patternTotalCost}
                  style={{ width: "60px", border: "1px solid #e5e5e5", textAlign: "right" }}
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
              <TableCell sx={{ color: "#90a4ae" }} colSpan={3}>Total Cost</TableCell>
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
                  style={{ width: "60px", border: "1px solid #e5e5e5", textAlign: "right" }}
                  onChange={(e) => handleProfitChange(e.target.value)}
                />
              </TableCell>
              <TableCell sx={{ color: "#90a4ae" }}>Profit (%)</TableCell>
              <TableCell align="right">{profitPercentage ? Number(profitPercentage).toFixed(2) : "0.00"}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ color: "#90a4ae" }}>Selling Price</TableCell>
              <TableCell align="right">{formatCurrency(sellingPrice)}</TableCell>
              <TableCell sx={{ color: "#90a4ae" }}>Total Profit</TableCell>
              <TableCell align="right">{formatCurrency(totalProfit)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ color: "#90a4ae" }} colSpan={3}>Revenue</TableCell>
              <TableCell align="right">{formatCurrency(revenue)}</TableCell>
            </TableRow>
          </TableHead>
        </Table>
        <Box m={1}>
          <Button variant="contained" size="small" onClick={() => handleUpdateSummaryLine()}>
            Update
          </Button>
        </Box>
      </TableContainer>
    </>
  );
}
