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

export default function SumTableTest() {
  const optionDetails = JSON.parse(localStorage.getItem("QuotationDetails"));
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
  const [profitPercentage, setProfitPercentage] = useState(10);
  const [patternQuantity, setPatternQuantity] = useState(0);
  const [patternTotalCost, setPatternTotalCost] = useState(0);
  const [patternUCost, setPatternUCost] = useState(0);

  const fetchQuotationDataList = async () => {
    try {
      const response = await fetch(
        `${BASE_URL}/Inquiry/GetInquirySummeryHeaderBYOptionID?InquiryID=${optionDetails.inquiryID}&OptionId=${optionDetails.optionId}&WindowType=${optionDetails.windowType}`,
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
        `${BASE_URL}/Inquiry/GetAllInquirySummeryTableItems?InquiryID=${optionDetails.inquiryID}&OptionId=${optionDetails.optionId}&WindowType=${optionDetails.windowType}`,
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
        `${BASE_URL}/Inquiry/GetAllInquirySummeryLinesPattern?InquiryID=${optionDetails.inquiryID}&OptionId=${optionDetails.optionId}&WindowType=${optionDetails.windowType}`,
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

  const handleItemUnitCostChange = (index, value, prevUCost, prevTotal) => {
    const newItems = [...items];
    newItems[index].unitCost = value;
    newItems[index].totalCost = value * newItems[index].quantity;
    computeTotalCost(newItems, patternTotalCost);
    const item = newItems[index];
    setItems(newItems);
    const bodyData = [
      {
        InquiryID: item.inquiryID,
        InqCode: item.inqCode,
        WindowType: item.windowType,
        OptionId: item.optionId,
        InqOptionName: item.inqOptionName,
        ItemName: item.itemName,
        UnitCost: parseFloat(prevUCost),
        Quantity: item.quantity,
        TotalCost: parseFloat(prevTotal),
        ApprovedUnitCost: value ? parseFloat(value) : parseFloat(0),
        ApprovedQuantity: item.quantity,
        ApprovedTotalCost: parseFloat((value * item.quantity).toFixed(2)),
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

  const handlePatternTotalCostChange = (value, item, prevUCost, prevTotal) => {
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
        UnitCost: parseFloat(prevUCost),
        Quantity: item.quantity,
        TotalCost: parseFloat(prevTotal),
        ApprovedUnitCost: updatedpatternunitcost
          ? parseFloat(updatedpatternunitcost)
          : parseFloat(0),
        ApprovedQuantity: item.quantity,
        ApprovedTotalCost: parseFloat(value),
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
    setProfitPercentage(value);

    const PPCprofit = ((unitCost * value) / 100).toFixed();
    const PPCselprice = (
      parseFloat(PPCprofit) + parseFloat(unitCost)
    ).toFixed();
    const PPCtotprofit = noOfUnits * PPCprofit;
    const PPCrev = (parseFloat(PPCtotprofit) + parseFloat(totalCost)).toFixed();

    setProfit(PPCprofit);
    setSellingPrice(PPCselprice);
    setTotalProfit(PPCtotprofit);
    setRevenue(PPCrev);
    handleSetData(PPCprofit, value, PPCselprice, PPCtotprofit, PPCrev);
  };

  const handleSellingPriceChange = (value) => {
    setSellingPrice(value);
    const SPCprofitpercentage = ((value - unitCost) / unitCost) * 100;
    const SPCprofit = unitCost * (SPCprofitpercentage / 100);
    const SPCtotprofit = SPCprofit * noOfUnits;
    const SPCrev = (parseFloat(SPCtotprofit) + parseFloat(totalCost)).toFixed();

    setProfit(SPCprofit);
    setProfitPercentage(SPCprofitpercentage);
    setTotalProfit(SPCtotprofit);
    setRevenue(SPCrev);
    handleSetData(SPCprofit, SPCprofitpercentage, value, SPCtotprofit, SPCrev);
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

    setProfit(getprofit);
    setUnitCost(unitCostValue ? unitCostValue : 0);
    setRevenue(rev);
    setTotalProfit(totprofit);
    setSellingPrice(getselprice);

    handleSetData(getprofit, profitPercentage, getselprice, totprofit, rev);
    // }
  }, [totalCost, unitCost]);

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
                    onChange={(e) =>
                      handleItemUnitCostChange(
                        index,
                        e.target.value,
                        item.unitCost,
                        item.totalCost
                      )
                    }
                  />
                </TableCell>
                <TableCell>{item.quantity ? item.quantity : 0}</TableCell>
                <TableCell align="right">
                  {item.totalCost ? item.totalCost : 0}
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
                  onChange={(e) =>
                    handlePatternTotalCostChange(
                      e.target.value,
                      patternItem,
                      patternUCost,
                      patternTotalCost
                    )
                  }
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
              <TableCell align="right">{totalCost}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ color: "#90a4ae" }}>No of Units</TableCell>
              <TableCell align="right">{noOfUnits}</TableCell>
              <TableCell sx={{ color: "#90a4ae" }}>Unit Cost</TableCell>
              <TableCell align="right">{unitCost}</TableCell>
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
              <TableCell align="right">
                <input
                  disabled
                  value={profitPercentage}
                  style={{
                    width: "60px",
                    border: "1px solid #e5e5e5",
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
                    border: "1px solid #e5e5e5",
                  }}
                  onChange={(e) => handleSellingPriceChange(e.target.value)}
                />
              </TableCell>

              <TableCell sx={{ color: "#90a4ae" }}>Total Profit</TableCell>
              <TableCell align="right">{totalProfit}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ color: "#90a4ae" }} colSpan={3}>
                Revenue
              </TableCell>
              <TableCell align="right">{revenue}</TableCell>
            </TableRow>
          </TableHead>
        </Table>
      </TableContainer>
    </>
  );
}
