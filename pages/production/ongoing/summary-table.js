import React, { useState, useEffect } from "react";
import {
  Input,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import BASE_URL from "Base/api";

export default function SumTable() {
  const optionDetails = JSON.parse(localStorage.getItem("OptionDetails"));
  const [items, setItems] = useState([]);
  const [headerData, setHeaderData] = useState({});
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

  const fetchQuotationDataList = async () => {
    try {
      const response = await fetch(
        `${BASE_URL}/Inquiry/GetInquirySummeryHeaderBYOptionID?InquiryID=${optionDetails.inquiryID}&OptionId=${optionDetails.id}&WindowType=${optionDetails.windowType}`,
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
        setHeaderData(data.result);
        setProfit(data.result.unitProfit);
        setSellingPrice(data.result.sellingPrice);
        setRevenue(data.result.revanue);
        setTotalProfit(data.result.totalProfit);
        setProfitPercentage(data.result.profitPercentage);
      }
    } catch (error) {
      console.error("Error fetching Quotation List:", error);
    }
  };

  const fetchItems = async () => {
    try {
      const response = await fetch(
        `${BASE_URL}/Inquiry/GetAllInquirySummeryTableItems?InquiryID=${optionDetails.inquiryID}&OptionId=${optionDetails.id}&WindowType=${optionDetails.windowType}`,
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
      setNoOfUnits(data.result[0].quantity);
    } catch (error) {
      console.error("Error fetching Size List:", error);
    }
  };

  const fetchPattern = async () => {
    try {
      const response = await fetch(
        `${BASE_URL}/Inquiry/GetAllInquirySummeryLinesPattern?InquiryID=${optionDetails.inquiryID}&OptionId=${optionDetails.id}&WindowType=${optionDetails.windowType}`,
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
      setPatternQuantity(data.result[0].quantity ? data.result[0].quantity : 0);
      setPatternTotalCost(
        data.result[0].totalCost ? data.result[0].totalCost : 0
      );
      setPatternUCost(data.result[0].unitCost ? data.result[0].unitCost : 0);
      setPatternItem(data.result[0]);
    } catch (error) {
      console.error("Error fetching Size List:", error);
    }
  };

  const handleItemUnitCostChange = (index, value) => {
    const validInput = /^\d*\.?\d{0,2}$/;

    if (!validInput.test(value)) return;

    const newItems = [...items];
    newItems[index].unitCost = value;
    newItems[index].totalCost = value * newItems[index].quantity;
    setItems(newItems);
    computeTotalCost(newItems, patternTotalCost);

    const item = newItems[index];
    const bodyData = [
      {
        InquiryID: item.inquiryID,
        InqCode: item.inqCode,
        WindowType: item.windowType,
        OptionId: item.optionId,
        InqOptionName: item.inqOptionName,
        ItemName: item.itemName,
        UnitCost: value ? parseFloat(value) : 0,
        Quantity: item.quantity,
        TotalCost: parseFloat((value * item.quantity).toFixed(2)),
        ApprovedUnitCost: value ? parseFloat(value) : 0,
        ApprovedQuantity: item.quantity,
        ApprovedTotalCost: value * item.quantity,
      },
    ];

    fetch(`${BASE_URL}/Inquiry/UpdateSummeryLine`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(bodyData),
    });
  };

  const handlePatternTotalCostChange = (value, item) => {
    const validInput = /^\d*\.?\d{0,2}$/;

    if (!validInput.test(value)) return;

    setPatternTotalCost(value);
    const updatedpatternunitcost = (value / patternQuantity).toFixed(2);
    setPatternUCost(updatedpatternunitcost);
    computeTotalCost(items, value);

    const bodyData = [
      {
        InquiryID: item.inquiryID,
        InqCode: item.inqCode,
        WindowType: item.windowType,
        OptionId: item.optionId,
        InqOptionName: item.inqOptionName,
        ItemName: item.itemName,
        UnitCost: updatedpatternunitcost
          ? updatedpatternunitcost
          : parseFloat(0),
        Quantity: item.quantity,
        TotalCost: value ? parseFloat(value) : parseFloat(0),
        ApprovedUnitCost: updatedpatternunitcost
          ? parseFloat(updatedpatternunitcost)
          : parseFloat(0),
        ApprovedQuantity: item.quantity,
        ApprovedTotalCost: value ? parseFloat(value) : parseFloat(0),
      },
    ];

    fetch(`${BASE_URL}/Inquiry/UpdateSummeryLine`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(bodyData),
    });
  };

  const handleProfitChange = (value) => {
    const validInput = /^\d*\.?\d{0,2}$/;

    if (!validInput.test(value)) return;

    setProfit(value);

    const newProfitPercentage = (
      (value / (totalCost && noOfUnits ? totalCost / noOfUnits : 0 || 0)) *
      100
    ).toFixed(2);

    const PCselprice = (parseFloat(unitCost) + parseFloat(value)).toFixed(2);
    const PCtotprofit = (value * noOfUnits).toFixed(2);
    const PCrev = (parseFloat(totalCost) + parseFloat(PCtotprofit)).toFixed(2);

    setRevenue(PCrev);
    setProfitPercentage(newProfitPercentage);
    setSellingPrice(PCselprice ? PCselprice : 0);
    setTotalProfit(PCtotprofit);
    handleSetData(value, newProfitPercentage, PCselprice, PCtotprofit, PCrev);
  };

  const handleProfitPercentageChange = (value) => {
    const validInput = /^\d*\.?\d{0,2}$/;

    if (!validInput.test(value)) return;

    setProfitPercentage(value);

    const PPCprofit = ((unitCost * value) / 100).toFixed(2);
    const PPCselprice = (parseFloat(PPCprofit) + parseFloat(unitCost)).toFixed(
      2
    );
    const PPCtotprofit = (noOfUnits * PPCprofit).toFixed(2);
    const PPCrev = (parseFloat(PPCtotprofit) + parseFloat(totalCost)).toFixed(
      2
    );

    setProfit(PPCprofit);
    setSellingPrice(PPCselprice);
    setTotalProfit(PPCtotprofit);
    setRevenue(PPCrev);
    handleSetData(PPCprofit, value, PPCselprice, PPCtotprofit, PPCrev);
  };

  const handleSellingPriceChange = (value) => {
    const validInput = /^\d*\.?\d{0,2}$/;

    if (!validInput.test(value)) return;

    setSellingPrice(value);

    const SPCprofitpercentage = ((value - unitCost) / unitCost) * 100;
    const SPCprofit = unitCost * (SPCprofitpercentage / 100);
    const SPCtotprofit = SPCprofit * noOfUnits;
    const SPCrev = (parseFloat(SPCtotprofit) + parseFloat(totalCost)).toFixed(
      2
    );

    setProfit(SPCprofit);
    setProfitPercentage(SPCprofitpercentage.toFixed(2));
    setTotalProfit(SPCtotprofit.toFixed(2));
    setRevenue(SPCrev);
    handleSetData(
      SPCprofit,
      SPCprofitpercentage.toFixed(2),
      value,
      SPCtotprofit.toFixed(2),
      SPCrev
    );
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

    localStorage.setItem("data", JSON.stringify(data));
  };

  const computeTotalCost = (items, patternTotalCost) => {
    const itemsTotalCost = items.reduce(
      (acc, item) => acc + (item.totalCost || 0),
      0
    );
    const updatedTotalCost =
      parseFloat(itemsTotalCost) + parseFloat(patternTotalCost);
    setTotalCost(updatedTotalCost.toFixed(2));

    const UCprofit = (unitCost * profitPercentage) / 100;
    const UCselPrice = parseFloat(unitCost) + parseFloat(UCprofit);
    const UCtotprofit = UCprofit * noOfUnits;
    const UCRev = parseFloat(UCtotprofit) + parseFloat(totalCost);
    setProfit(UCprofit);
    setSellingPrice(UCselPrice);
    setTotalProfit(UCtotprofit);
    setRevenue(UCRev);
  };

  useEffect(() => {
    const fetchData = async () => {
      await fetchQuotationDataList();
      await fetchItems();
      await fetchPattern();
      computeTotalCost(items, patternTotalCost);
    };
    fetchData();

    const unitCostValue = (totalCost / noOfUnits).toFixed(2);
    const getprofit = ((unitCostValue * profitPercentage) / 100).toFixed();
    const getselprice = (
      parseFloat(unitCostValue) + parseFloat(getprofit)
    ).toFixed(2);
    const totprofit = (getprofit * noOfUnits).toFixed(2);
    const rev = parseFloat(totprofit) + parseFloat(totalCost);

    setProfit(parseInt(getprofit));
    setUnitCost(unitCostValue ? parseInt(unitCostValue) : 0);
    setRevenue(parseInt(rev));
    setTotalProfit(parseFloat(totprofit));
    setSellingPrice(parseInt(getselprice));

    handleSetData(getprofit, profitPercentage, getselprice, totprofit, rev);
  }, [totalCost, unitCost]);

  return (
    <>
      <TableContainer component={Paper}>
        <Table size="small" aria-label="simple table" className="dark-table">
          <TableHead>
            <TableRow>
              <TableCell>Description</TableCell>
              <TableCell>Unit </TableCell>
              <TableCell align="center">consumption</TableCell>
              <TableCell>Order Qty</TableCell>
              <TableCell align="center">Requirement</TableCell>
              <TableCell align="center">Supplier</TableCell>
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
                  {item.itemName.toLowerCase().includes("lacoste") ||
                  item.itemName.toLowerCase().includes("wetlook") ||
                  item.itemName.toLowerCase().includes("elastic")
                    ? "Y"
                    : ""}

                  {item.itemName.toLowerCase().includes("coller") ||
                  item.itemName.toLowerCase().includes("dtf")
                    ? "PCS"
                    : ""}

                  {item.itemName.toLowerCase().includes("embroider") ||
                  item.itemName.toLowerCase().includes("sewing")
                    ? "CORD"
                    : ""}

                  {item.itemName.toLowerCase().includes("sublimation")
                    ? "ROLE"
                    : ""}

                  {item.itemName.toLowerCase().includes("other") ? (
                    <input
                      value={""}
                      style={{
                        width: "60px",
                        border: "1px solid #e5e5e5",
                      }}
                      onChange={(e) => {}}
                    />
                  ) : (
                    ""
                  )}
                </TableCell>
                <TableCell align="center">
                  {item.quantity ? item.quantity / noOfUnits : 0}
                </TableCell>

                <TableCell>
                  <input
                    value={item.unitCost ? item.unitCost : 0}
                    style={{
                      width: "60px",
                      border: "1px solid #e5e5e5",
                    }}
                    onChange={(e) =>
                      handleItemUnitCostChange(index, e.target.value)
                    }
                  />
                </TableCell>

                <TableCell align="center">
                  {item.quantity ? item.quantity : 0}
                </TableCell>

                <TableCell align="center">
                  {item.itemName.toLowerCase().includes("lacoste") ||
                  item.itemName.toLowerCase().includes("wetlook") ||
                  item.itemName.toLowerCase().includes("elastic")
                    ? "TMA"
                    : ""}

                  {item.itemName.toLowerCase().includes("coller") ||
                  item.itemName.toLowerCase().includes("dtf")
                    ? "WATTALA"
                    : ""}

                  {item.itemName.toLowerCase().includes("embroider") ||
                  item.itemName.toLowerCase().includes("sewing")
                    ? "TMA"
                    : ""}

                  {item.itemName.toLowerCase().includes("sublimation")
                    ? "ROLE"
                    : ""}

                  {item.itemName.toLowerCase().includes("other") ? (
                    <input
                      value={""}
                      style={{
                        width: "60px",
                        border: "1px solid #e5e5e5",
                      }}
                      onChange={(e) => {}}
                    />
                  ) : (
                    ""
                  )}
                </TableCell>
              </TableRow>
            ))}
            <TableRow
              sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
            >
              <TableCell component="th" scope="row">
                Pattern
              </TableCell>

              <TableCell>
                <input
                  value={""}
                  style={{
                    width: "60px",
                    border: "1px solid #e5e5e5",
                  }}
                  onChange={(e) => {}}
                />
              </TableCell>

              <TableCell align="center">
                {patternQuantity / noOfUnits}
              </TableCell>
              <TableCell align="left">
                <input
                  value={patternTotalCost}
                  style={{
                    width: "60px",
                    border: "1px solid #e5e5e5",
                  }}
                  onChange={(e) =>
                    handlePatternTotalCostChange(e.target.value, patternItem)
                  }
                />
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
}
