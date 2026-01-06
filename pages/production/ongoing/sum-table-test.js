import React, {
  useEffect,
  useState,
  useImperativeHandle,
  forwardRef,
} from "react";
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

export default function SummaryTableTest() {
  const optionDetails = JSON.parse(localStorage.getItem("OptionDetails"));
  const [items, setItems] = useState([]);
  const [dataList, setDataList] = useState({});
  const [patternUPrice, setPatternUPrice] = useState(0);
  const [patternQuantity, setPatternQuantity] = useState();
  const [patternTotalCost, setPatternTotalCost] = useState();
  const [patternItem, setPatternItem] = useState();
  const [totalCost, setTotalCost] = useState();
  const [finalUnitCost, setFinalUnitCost] = useState();
  const [finalProfit, setFinalProfit] = useState();
  const [finalSellingPrice, setFinalSellingPrice] = useState();
  const [finalTotalProfit, setFinalTotalProfit] = useState();
  const [finalRevenue, setFinalRevenue] = useState();
  const [finalProfitPercentage, setFinalProfitPercentage] = useState(10);
  const token = localStorage.getItem("token");
  const isWebkit = navigator.userAgent.toLowerCase().indexOf("webkit") > -1;

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
      setFinalProfitPercentage(data.result.profitPercentage);
      setDataList(data.result);
      setFinalRevenue(data.result.revanue);
      setFinalSellingPrice(data.result.sellingPrice);
      setFinalTotalProfit(data.result.totalProfit);
      setFinalUnitCost(data.result.unitCost);
      setTotalCost(data.result.totalCost);
      setFinalProfit(data.result.unitProfit);
    } catch (error) {
      console.error("Error fetching Quotation List:", error);
    }
  };
  const fetchPattern = async () => {
    try {
      const response = await fetch(
        `${BASE_URL}/Inquiry/GetAllInquirySummeryLinesPattern?InquiryID=${optionDetails.inquiryID}&OptionId=${optionDetails.id}&WindowType=${optionDetails.windowType}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok) {
        throw new Error("Failed to fetch Size List");
      }
      const data = await response.json();
      setPatternQuantity(data.result[0].quantity);
      setPatternTotalCost(data.result[0].totalCost);
      setPatternUPrice(data.result[0].unitCost);
      setPatternItem(data.result[0]);
    } catch (error) {
      console.error("Error fetching Size List:", error);
    }
  };
  const fetchItems = async () => {
    try {
      const response = await fetch(
        `${BASE_URL}/Inquiry/GetAllInquirySummeryTableItems?InquiryID=${optionDetails.inquiryID}&OptionId=${optionDetails.id}&WindowType=${optionDetails.windowType}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok) {
        throw new Error("Failed to fetch Size List");
      }
      const data = await response.json();
      setItems(data.result);
      let total = 0;
      data.result.forEach((item) => {
        total += parseFloat(item.totalCost ? item.totalCost : 0);
      });
      setTotalCost((total + patternTotalCost).toFixed(2));
    } catch (error) {
      console.error("Error fetching Size List:", error);
    }
  };

  useEffect(() => {
    const calcUnitCost = totalCost / patternQuantity;
    setFinalUnitCost(calcUnitCost.toFixed(2));
    const setprofit = calcUnitCost * 0.1;
    setFinalProfit(setprofit);
    setFinalSellingPrice(setprofit + calcUnitCost);
    const totprof = patternQuantity * setprofit;
    const rev = (parseFloat(totalCost) + parseFloat(totprof)).toFixed(2);
    setFinalTotalProfit(totprof.toFixed(2));
    setFinalRevenue(rev);
    const data = {
      profit: setprofit.toFixed(2),
      profitPercentage: finalProfitPercentage,
      revenue: rev,
      sellingPrice: (setprofit + calcUnitCost).toFixed(2),
      totalCost: totalCost,
      totalProfit: totprof.toFixed(2),
      totalUnits: patternQuantity,
      unitCost: calcUnitCost.toFixed(2),
    };
    const jsonData = JSON.stringify(data);
    localStorage.setItem("data", jsonData);
  }, [patternTotalCost, patternQuantity, totalCost]);

  const handleUnitCostChange = (index, newValue) => {
    const newItems = [...items];
    newItems[index].unitCost = newValue;
    newItems[index].totalCost = newValue * newItems[index].quantity;
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
        UnitCost: newValue,
        Quantity: item.quantity,
        TotalCost: newValue * item.quantity,
        ApprovedUnitCost: 0,
        ApprovedQuantity: 0,
        ApprovedTotalCost: 0,
      },
    ];
    fetch(`${BASE_URL}/Inquiry/UpdateSummeryLine`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(bodyData),
    });
    updateTotalCost();
  };
  const handlePatternChange = (newValue, item) => {
    setPatternTotalCost(newValue);
    const unitCostofPattern = newValue / patternQuantity;

    setPatternUPrice(unitCostofPattern.toFixed(2));
    const bodyData = [
      {
        InquiryID: item.inquiryID,
        InqCode: item.inqCode,
        WindowType: item.windowType,
        OptionId: item.optionId,
        InqOptionName: item.inqOptionName,
        ItemName: item.itemName,
        UnitCost: unitCostofPattern.toFixed(2),
        Quantity: item.quantity,
        TotalCost: newValue,
        ApprovedUnitCost: 0,
        ApprovedQuantity: 0,
        ApprovedTotalCost: 0,
      },
    ];
    fetch(`${BASE_URL}/Inquiry/UpdateSummeryLine`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(bodyData),
    });
    updateTotalCost();
  };

  const updateTotalCost = () => {
    let total = 0;
    items.forEach((item) => {
      total += parseFloat(item.totalCost ? item.totalCost : 0);
    });
    total += parseFloat(patternTotalCost ? patternTotalCost : 0);
    setTotalCost(total.toFixed(2));
    const data = {
      totalCost: total.toFixed(2),
    };
    const jsonData = JSON.stringify(data);
    localStorage.setItem("data", jsonData);
  };

  const handleProfitChange = (profit) => {
    setFinalProfit(profit);
    const newProfitPercentage = (
      (profit /
        (totalCost && patternQuantity ? totalCost / patternQuantity : 0 || 0)) *
      100
    ).toFixed(2);
    const setsel = (parseFloat(profit) + parseFloat(finalUnitCost)).toFixed(2);
    setFinalSellingPrice(setsel);
    setFinalProfitPercentage(newProfitPercentage);
    const gettotpro = (
      parseFloat(profit) * parseFloat(patternQuantity)
    ).toFixed(2);
    const getrev = (parseFloat(totalCost) + parseFloat(gettotpro)).toFixed(2);
    setFinalRevenue(getrev);
    setFinalTotalProfit(gettotpro);
    const data = {
      profit: profit,
      profitPercentage: newProfitPercentage,
      revenue: getrev,
      sellingPrice: setsel,
      totalCost: totalCost,
      totalProfit: gettotpro,
      totalUnits: patternQuantity,
      unitCost: finalUnitCost,
    };
    const jsonData = JSON.stringify(data);
    localStorage.setItem("data", jsonData);
  };

  const handleProfitPercentageChange = (profitPercentage) => {
    setFinalProfitPercentage(profitPercentage);
    const getnewprofit = finalUnitCost * (profitPercentage / 100);
    setFinalProfit(getnewprofit);
    const setsel1 = (
      parseFloat(getnewprofit) + parseFloat(finalUnitCost)
    ).toFixed(2);
    setFinalSellingPrice(setsel1);
    const gettotpro1 = (
      parseFloat(getnewprofit) * parseFloat(patternQuantity)
    ).toFixed(2);
    const getrev1 = (parseFloat(totalCost) + parseFloat(gettotpro1)).toFixed(2);

    setFinalRevenue(getrev1);
    setFinalTotalProfit(gettotpro1);
    const data = {
      profit: getnewprofit,
      profitPercentage: profitPercentage,
      revenue: getrev1,
      sellingPrice: setsel1,
      totalCost: totalCost,
      totalProfit: gettotpro1,
      totalUnits: patternQuantity,
      unitCost: finalUnitCost,
    };
    const jsonData = JSON.stringify(data);
    localStorage.setItem("data", jsonData);
  };

  const handleSellingPriceChange = (newselprice) => {
    setFinalSellingPrice(newselprice);
    const newprofper = ((newselprice - finalUnitCost) / finalUnitCost) * 100;
    const newprof = finalUnitCost * (newprofper / 100);
    setFinalProfitPercentage(newprofper);
    setFinalProfit(newprof);

    const gettotpro2 = (
      parseFloat(newprof) * parseFloat(patternQuantity)
    ).toFixed(2);
    const getrev2 = (parseFloat(totalCost) + parseFloat(gettotpro2)).toFixed(2);
    setFinalRevenue(getrev2);
    setFinalTotalProfit(gettotpro2);

    const data = {
      profit: newprof,
      profitPercentage: newprofper,
      revenue: getrev2,
      sellingPrice: newselprice,
      totalCost: totalCost,
      totalProfit: gettotpro2,
      totalUnits: patternQuantity,
      unitCost: finalUnitCost,
    };
    const jsonData = JSON.stringify(data);
    localStorage.setItem("data", jsonData);
  };

  useEffect(() => {
    fetchItems();
    fetchPattern();
    fetchQuotationDataList();
  }, []);

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
                      border: "none",
                      outline: "none",
                      textAlign: "right",
                      border: "1px solid #e5e5e5",
                      margin: 0,
                    }}
                    onChange={(e) =>
                      handleUnitCostChange(index, e.target.value)
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
              <TableCell>{patternUPrice}</TableCell>
              <TableCell>{patternQuantity}</TableCell>
              <TableCell align="right">
                <input
                  value={patternTotalCost}
                  style={{
                    width: "60px",
                    border: "none",
                    outline: "none",
                    textAlign: "right",
                    border: "1px solid #e5e5e5",
                  }}
                  onChange={(e) =>
                    handlePatternChange(e.target.value, patternItem)
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
              <TableCell align="right">{patternQuantity}</TableCell>
              <TableCell sx={{ color: "#90a4ae" }}>Unit Cost</TableCell>
              <TableCell align="right">{finalUnitCost}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ color: "#90a4ae" }}>Profit</TableCell>
              <TableCell align="right">
                <input
                  value={finalProfit}
                  style={{
                    width: "60px",
                    border: "none",
                    outline: "none",
                    textAlign: "right",
                  }}
                  onChange={(e) => handleProfitChange(e.target.value)}
                />
              </TableCell>

              <TableCell sx={{ color: "#90a4ae" }}>Profit %</TableCell>
              <TableCell align="right">
                <input
                  value={finalProfitPercentage}
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
                  value={finalSellingPrice}
                  style={{
                    width: "100px",
                    border: "none",
                    outline: "none",
                    textAlign: "right",
                  }}
                  onChange={(e) => handleSellingPriceChange(e.target.value)}
                />
              </TableCell>
              <TableCell sx={{ color: "#90a4ae" }}>Total Profit</TableCell>
              hello
              <TableCell align="right">{finalTotalProfit}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ color: "#90a4ae" }} colSpan={3}>
                Revenue
              </TableCell>
              <TableCell align="right">{finalRevenue}</TableCell>
            </TableRow>
          </TableHead>
        </Table>
      </TableContainer>
    </>
  );
}
