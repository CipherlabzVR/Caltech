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

export default function SummaryTable() {
  const [items, setItems] = useState([]);
  const optionDetails = JSON.parse(localStorage.getItem("OptionDetails"));
  const [totalCost, setTotalCost] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);
  const [revenue, setRevenue] = useState(0);
  const [totalUnits, setTotalUnits] = useState(0);
  const [profitPercentage, setProfitPercentage] = useState(10);
  const [sellingPrice, setSellingPrice] = useState(0);
  const [quotationDataList, setQuotationDataList] = useState();
  const [profit, setProfit] = useState(0);
  const [patternRow, setPatternRow] = useState({
    total: 0,
    quantity: 0,
    unitCost: 0,
  });

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
      const patternItem = data.result.find(
        (item) => item.itemName === "Pattern"
      );
      if (patternItem) {
        setPatternRow({
          total: patternItem.totalCost,
          quantity: patternItem.quantity,
          unitCost: patternItem.unitCost,
        });
      }
    } catch (error) {
      console.error("Error fetching Size List:", error);
    }
  };

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
      setQuotationDataList(data.result);
      localStorage.setItem("status", data.result?.approvedStatus);
      const intProPer = data.result?.profitPercentage;
      const intSelPri = data.result?.sellingPrice;
      const intPro = data.result?.unitProfit;
      const intTotPro = data.result?.totalProfit;
      const intRev = data.result?.revanue;
      setProfitPercentage(intProPer);
      setSellingPrice(intSelPri);
      setTotalProfit(intTotPro.toFixed(2));
      setProfit(intPro);
      setRevenue(intRev);
    } catch (error) {
      console.error("Error fetching Quotation List:", error);
    }
  };

  const handleProfitChange = (event) => {
    const newProfit = parseFloat(event.target.value) || 0;
    setProfit(newProfit);

    const newProfitPercentage = (
      (newProfit /
        (totalCost && totalUnits ? totalCost / totalUnits : 0 || 0)) *
      100
    ).toFixed(2);

    setProfitPercentage(newProfitPercentage);
  };

  useEffect(() => {
    fetchItems();
    fetchQuotationDataList();
  }, []);

  useEffect(() => {
    const itemsTotal = items.reduce((acc, item) => acc + item.totalCost, 0);
    const patternTotal = patternRow.total;
    setTotalCost(itemsTotal);

    const SelPri = (
      ((profitPercentage || 0) / 100) *
        (totalCost && totalUnits ? totalCost / totalUnits : 0) +
      (totalCost && totalUnits ? totalCost / totalUnits : 0)
    ).toFixed(2);

    const totPro =
      (
        ((profitPercentage || 0) / 100) *
        (totalCost && totalUnits ? totalCost / totalUnits : 0)
      ).toFixed(2) * (totalUnits || 0).toFixed(2);

    const rev = (
      parseFloat((totalCost || 0).toFixed(2)) +
      parseFloat(
        ((profitPercentage || 0) / 100) *
          (totalCost && totalUnits ? totalCost / totalUnits : 0)
      ).toFixed(2) *
        parseFloat((totalUnits || 0).toFixed(2))
    ).toFixed(2);

    setSellingPrice(SelPri);
    setTotalProfit(totPro.toFixed(2));
    setRevenue(rev);

    const itemsQty = items.length > 0 ? items[0].quantity : 0;
    setTotalUnits(itemsQty);
  }, [items, patternRow, profitPercentage, totalUnits]);

  const handleSellingPriceChange = (value) => {
    const price = parseFloat(value) || 0;
    setSellingPrice(price);
  };

  const handleTotalChange = (value, item) => {
    const total = parseFloat(value) || 0;

    const updatedPatternRow = {
      ...patternRow,
      total,
      unitCost: patternRow.quantity === 0 ? 0 : total / patternRow.quantity,
    };
    setPatternRow(updatedPatternRow);

    const token = localStorage.getItem("token");
    const bodyData = [
      {
        InquiryID: item.inquiryID,
        InqCode: item.inqCode,
        WindowType: item.windowType,
        OptionId: item.optionId,
        InqOptionName: item.inqOptionName,
        ItemName: item.itemName,
        UnitCost: parseFloat(value) / item.quantity,
        Quantity: item.quantity,
        TotalCost: value,
        ApprovedUnitCost: parseFloat(value) / item.quantity,
        ApprovedQuantity: item.quantity,
        ApprovedTotalCost: value,
      },
    ];
    fetch(`${BASE_URL}/Inquiry/UpdateSummeryLine`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(bodyData),
    })
      .then((response) => response.json())
      .then((data) => {
        fetchItems();
      })
      .catch((error) => {
        // toast.error(error.message || "");
      });
  };

  const handleUnitCostChange = (index, value, item) => {
    const updatedItems = [...items];
    updatedItems[index].unitCost = parseFloat(value) || 0;
    setItems(updatedItems);
    const token = localStorage.getItem("token");
    const bodyData = [
      {
        InquiryID: item.inquiryID,
        InqCode: item.inqCode,
        WindowType: item.windowType,
        OptionId: item.optionId,
        InqOptionName: item.inqOptionName,
        ItemName: item.itemName,
        UnitCost: parseFloat(value),
        Quantity: item.quantity,
        TotalCost: value * item.quantity,
        ApprovedUnitCost: parseFloat(value),
        ApprovedQuantity: item.quantity,
        ApprovedTotalCost: value * item.quantity,
      },
    ];
    fetch(`${BASE_URL}/Inquiry/UpdateSummeryLine`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(bodyData),
    })
      .then((response) => response.json())
      .then((data) => {
        fetchItems();
      })
      .catch((error) => {
        // toast.error(error.message || "");
      });
  };

  const handleProfitPercentageChange = (value) => {
    const percentage = parseFloat(value) || 0;
    setProfitPercentage(percentage);
  };

  useEffect(() => {
    const cleanData = {
      totalCost: (totalCost || 0).toFixed(2),
      unitCost: (totalCost && totalUnits ? totalCost / totalUnits : 0).toFixed(
        2
      ),
      profit: (
        ((profitPercentage || 0) / 100) *
        (totalCost && totalUnits ? totalCost / totalUnits : 0)
      ).toFixed(2),
      sellingPrice: (
        ((profitPercentage || 0) / 100) *
          (totalCost && totalUnits ? totalCost / totalUnits : 0) +
        (totalCost && totalUnits ? totalCost / totalUnits : 0)
      ).toFixed(2),
      totalUnits: totalUnits || 0,
      profitPercentage: profitPercentage || 0,
      revenue: (
        parseFloat((totalCost || 0).toFixed(2)) +
        parseFloat(
          (
            ((profitPercentage || 0) / 100) *
            (totalCost && totalUnits ? totalCost / totalUnits : 0)
          ).toFixed(2)
        ) *
          parseFloat((totalUnits || 0).toFixed(2))
      ).toFixed(2),
      totalProfit: (
        (
          ((profitPercentage || 0) / 100) *
          (totalCost && totalUnits ? totalCost / totalUnits : 0)
        ).toFixed(2) * (totalUnits || 0).toFixed(2)
      ).toFixed(2),
    };

    const profitValue = (
      ((profitPercentage || 0) / 100) *
      (totalCost && totalUnits ? totalCost / totalUnits : 0)
    ).toFixed(2);

    setProfit(profitValue);
    localStorage.setItem("data", JSON.stringify(cleanData));
  }, [totalCost, totalUnits, profitPercentage]);

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
            {items.map((item, index) => {
              const isPattern = item.itemName === "Pattern";
              return (
                <TableRow
                  key={index}
                  sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                >
                  <TableCell component="th" scope="row">
                    {item.itemName}
                  </TableCell>
                  <TableCell>
                    {isPattern ? (
                      patternRow.unitCost === null ? (
                        0
                      ) : (
                        patternRow.unitCost.toFixed(2)
                      )
                    ) : (
                      <input
                        value={item.unitCost === null ? 0 : item.unitCost}
                        style={{
                          width: "60px",
                          border: "1px solid #e5e5e5",
                        }}
                        onChange={(e) =>
                          handleUnitCostChange(index, e.target.value, item)
                        }
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    {item.quantity === null ? 0 : item.quantity}
                  </TableCell>
                  <TableCell align="right">
                    {isPattern ? (
                      <input
                        value={patternRow.total === null ? 0 : patternRow.total}
                        style={{
                          width: "60px",
                          border: "1px solid #e5e5e5",
                          textAlign: "right",
                        }}
                        onChange={(e) =>
                          handleTotalChange(e.target.value, item)
                        }
                      />
                    ) : (
                      (item.unitCost * item.quantity).toFixed(2)
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
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
              <TableCell align="right">
                {totalCost && totalUnits
                  ? (totalCost / totalUnits).toFixed(2)
                  : 0}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ color: "#90a4ae" }}>Profit</TableCell>
              <TableCell align="right">
                <input
                  value={profit}
                  type="number"
                  style={{
                    width: "60px",
                    border: "none",
                    outline: "none",
                    textAlign: "right",
                  }}
                  onChange={handleProfitChange}
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
