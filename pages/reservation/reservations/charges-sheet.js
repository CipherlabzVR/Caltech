import React, { useEffect, useState } from "react";
import Grid from "@mui/material/Grid";
import {
  Box,
  Button,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import Link from "next/link";
import styles from "@/styles/PageTitle.module.css";
import { toast, ToastContainer } from "react-toastify";
import { useRouter } from "next/router";
import BASE_URL from "Base/api";
import { formatCurrency, formatDate } from "@/components/utils/formatHelper";
import * as XLSX from 'xlsx';


const ChargesSheet = () => {
  const router = useRouter();
  const { id } = router.query;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reservation, setReservation] = useState();
  const [grossTotal, setGrossTotal] = useState(0);
  const [refundTotal, setRefundTotal] = useState(0);
  const [discountPercentage, setDiscountPercentage] = useState("");
  const [discountValue, setDiscountValue] = useState("");
  const [netTotal, setNetTotal] = useState(0);

  const [refunds, setRefunds] = useState([
    { label: "Hair Extention Deposit", value: "" },
    { label: "Jewelry Deposit", value: "" },
  ]);

  const [charges, setCharges] = useState([
    { label: "Hair,Make-up & Dressing Charges", cost: null, qty: null, total: null },
    { label: "Wedding Bride", cost: "", qty: 1, total: 0 },
    { label: "Home Coming Bride", cost: "", qty: 1, total: 0 },
    { label: "Engagement Bride", cost: "", qty: 1, total: 0 },
    { label: "Photoshoot or Event Bride", cost: "", qty: 1, total: 0 },
    { label: "Wedding Bridesmaids", cost: "", qty: "", total: 0 },
    { label: "Going away Bridesmaids", cost: "", qty: "", total: 0 },
    { label: "Pupil Maids", cost: "", qty: "", total: 0 },
    { label: "Little Maids", cost: "", qty: "", total: 0 },
    { label: "Flower Girls", cost: "", qty: "", total: 0 },
    { label: "jewellery rental Charges", cost: null, qty: null, total: null },
    { label: "Jewelley Set for Bride", cost: "", qty: 1, total: 0 },
    { label: "Jewelley Set for Bridesmaids", cost: "", qty: "", total: 0 },
    { label: "Jewelley Set for Bride & Bridesmaids", cost: "", qty: "", total: 0 },
    { label: "Kandyan Gold Set", cost: "", qty: 1, total: 0 },
    { label: "Jeweller Changing Fee", cost: "", qty: 1, total: 0 },
    { label: "outfit Charges", cost: null, qty: null, total: null },
    { label: "Designing Charges", cost: "", qty: 1, total: 0 },
    { label: "Wedding Bridal Outfit", cost: "", qty: 1, total: 0 },
    { label: "Veil", cost: "", qty: 1, total: 0 },
    { label: "Home Coming Bridal Outfit", cost: "", qty: 1, total: 0 },
    { label: "Going away Bridal Outfit", cost: "", qty: 1, total: 0 },
    { label: "Photoshoot or Event Bridal Outfit", cost: "", qty: 1, total: 0 },
    { label: "Bridesmaids Outfit", cost: "", qty: "", total: 0 },
    { label: "Pupil Maids Outfit", cost: "", qty: "", total: 0 },
    { label: "Little Maids Outfit", cost: "", qty: "", total: 0 },
    { label: "Flower Girls' Outfit", cost: "", qty: "", total: 0 },
    { label: "other Charges", cost: null, qty: null, total: null },
    { label: "Bridal Trial", cost: "", qty: 1, total: 0 },
    { label: "Bride Touchups", cost: "", qty: 1, total: 0 },
    { label: "Bride & Bridemaids Touchups", cost: "", qty: 1, total: 0 },
    { label: "Mother's Outfit", cost: "", qty: 1, total: 0 },
    { label: "Sister's Outfit", cost: "", qty: 1, total: 0 },
    { label: "Mother's Dressing", cost: "", qty: 1, total: 0 },
    { label: "Sister's Dressing", cost: "", qty: 1, total: 0 },
    { label: "Others Dressing", cost: "", qty: 1, total: 0 },
    { label: "Transport", cost: "", qty: 1, total: 0 },
  ]);

  const fetchReservation = async () => {
    try {
      const response = await fetch(
        `${BASE_URL}/Reservation/GetReservationById?id=${id}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch");

      const data = await response.json();
      const reservationData = data.result.result;
      await setReservation(reservationData);

      const qtyUpdates = {
        "Wedding Bridesmaids": reservationData.maids,
        "Pupil Maids Outfit": reservationData.pupilMaids,
        "Little Maids Outfit": reservationData.littleMaids,
        "Flower Girls' Outfit": reservationData.flowerGirls,
        "Jewelley Set for Bridesmaids": reservationData.maids,
        "Bridesmaids Outfit": reservationData.maids,
        "Going away Bridesmaids": reservationData.maids,
        "Pupil Maids": reservationData.pupilMaids,
        "Little Maids": reservationData.littleMaids,
        "Flower Girls": reservationData.flowerGirls,
      };

      const fetchedCharges = reservationData.chargeSheetChargeSheetLineDetails;

      setCharges(prevCharges =>
        prevCharges.map(charge => {
          const matched = fetchedCharges?.find(fc => fc.description === charge.label);
          return {
            ...charge,
            qty: qtyUpdates[charge.label] ?? charge.qty,
            cost: matched?.cost ?? charge.cost,
            total: matched?.lineTotal ?? charge.total,
            qty: matched?.count ?? qtyUpdates[charge.label] ?? charge.qty,
          };
        })
      );

      if (fetchedCharges) {
        setRefunds(prevRefunds =>
          prevRefunds.map(refund => {
            const matched = fetchedCharges.find(fc => fc.description === refund.label);
            return matched ? { ...refund, value: matched.cost ?? refund.value } : refund;
          })
        );
      }

    } catch (error) {
      console.error("Error fetching:", error);
    }
  };


  useEffect(() => {
    if (id) {
      fetchReservation();
    }
  }, [id]);

  useEffect(() => {

    const gross = charges.reduce(
      (gross, row) => gross + (Number(row.total) || 0),
      0
    );
    const refund = refunds.reduce(
      (refund, row) => refund + (Number(row.value) || 0),
      0
    );

    let discount = 0;
    if (discountPercentage) {
      discount = (gross * parseFloat(discountPercentage)) / 100;
    } else if (discountValue) {
      discount = parseFloat(discountValue);
    }

    const net = gross - discount - reservation?.advancePaidAmount || 0;

    setGrossTotal(gross);
    setRefundTotal(refund);
    setNetTotal(net);
  }, [charges, refunds, discountPercentage, discountValue]);

  const handlePercentageChange = (value) => {
    setDiscountPercentage(value);
    setDiscountValue("");
  };

  const handleValueChange = (value) => {
    setDiscountValue(value);
    setDiscountPercentage("");
  };


  const handleChange = (rowIndex, field, value) => {
    const updated = [...charges];
    updated[rowIndex][field] = value;

    const cost = parseFloat(updated[rowIndex].cost) || 0;
    const qty = parseFloat(updated[rowIndex].qty) || 0;
    updated[rowIndex].total = (cost * qty).toFixed(2);

    setCharges(updated);
  };
  const handleChangeRefund = (rowIndex, field, value) => {

    const updated = [...refunds];
    updated[rowIndex][field] = value;

    const cost = parseFloat(updated[rowIndex].cost) || 0;
    const qty = parseFloat(updated[rowIndex].qty) || 0;
    updated[rowIndex].total = (cost * qty).toFixed(2);

    setRefunds(updated);
  };


  const handleLogValues = async () => {
    const discount = discountPercentage
      ? (grossTotal * discountPercentage) / 100
      : discountValue || 0;

    const chargesRows = charges
      .filter(row => row.total > 0)
      .map((row, i) => ({
        ChargeSheetHeaderId: null,
        Description: row.label,
        Count: row.qty,
        Cost: row.cost,
        LineTotal: row.total,
        IsRefund: false,
      }));

    const refundsRows = refunds
      .filter(row => row.value > 0)
      .map((row, i) => ({
        ChargeSheetHeaderId: null,
        Description: row.label,
        Count: null,
        Cost: row.value,
        LineTotal: row.value,
        IsRefund: true,
      }));
    const chargeSheetLines = [
      ...chargesRows,
      ...refundsRows,
    ];

    if (chargeSheetLines.length === 0) {
      toast.info("Please Enter Cost Prices");
      return;
    }

    const data = {
      ReservationId: reservation?.reservationId,
      CustomerName: reservation.customerName,
      DocumentNo: "",
      ReservationDocumentNo: reservation.reservationDocumentNo || "000000",
      ReservationDate: reservation?.reservationDate,
      ReservationAdvance: reservation?.advancePaidAmount || 0,
      DiscountRate: discountPercentage || 0,
      DiscountValue: discountValue || 0,
      DiscountAmount: discount || 0,
      NetAmount: netTotal || 0,
      RefundTotal: refundTotal || 0,
      ReservationDate: reservation.chargeSheetReservationDate,
      ChargeSheetLineDetails: chargeSheetLines,
    };

    try {
      setIsSubmitting(true);
      const res = await fetch(`${BASE_URL}/Reservation/CreateReservationChargeSheet`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await res.json();
      if (res.ok && result.result.result !== "") {
        toast.success(result.result.message);
      } else {
        toast.error(result.result.message || "Please fill all required fields");
      }
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const navigateToBack = () => {
    router.push({
      pathname: "/reservation/reservations/",
    });
  };

  const handleDownload = () => {
    const headerRow = [
      { v: "Charges", s: { fill: { fgColor: { rgb: "FFCCE5FF" } } } },
      { v: "Cost", s: { fill: { fgColor: { rgb: "FFCCE5FF" } } } },
      { v: "Qty", s: { fill: { fgColor: { rgb: "FFCCE5FF" } } } },
      { v: "Total Cost", s: { fill: { fgColor: { rgb: "FFCCE5FF" } } } },
    ];

    const chargeRows = charges.map(row => {
      const rowData = [{ v: row.label }];
      if (row.cost != null) rowData.push({ v: row.cost });
      if (row.qty != null) rowData.push({ v: row.qty });
      if (row.total != null) rowData.push({ v: row.total });
      return rowData;
    });

    const totals = [
      ["", "", "Gross Total", grossTotal],
      ["", "", "Refund Total", refundTotal],
      ["", "", "Net Total", netTotal],
      ["", "", "", ""],
      [{ v: "Refund", s: { fill: { fgColor: { rgb: "FFFFE5CC" } } } }, "", "", ""],
    ];

    const refundRows = refunds.map(row => [
      { v: row.label },
      "",
      "",
      { v: row.value },
    ]);

    const sheetData = [
      headerRow,
      ...chargeRows,
      ...totals,
      ...refundRows,
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Charges Sheet");

    XLSX.writeFile(workbook, `Reservation-${reservation?.chargeSheetCustomerName}.xlsx`);
  };

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1 style={{ textTransform: "capitalize" }}>{reservation?.chargeSheetCustomerName}'s Charges Sheet</h1>
        <ul>
          <li>
            <Link href="/reservation/reservations/">Reservations</Link>
          </li>
          <li>Charges Sheet</li>
        </ul>
      </div>
      <Grid
        container
        mt={1}
        rowSpacing={1}
        columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}
      >
        <Grid item xs={12} display="flex" justifyContent="space-between">
          <Typography>NIC/Passport No : {reservation?.nic} / Contact No : {reservation?.mobileNo}</Typography>
          <Button variant="outlined" color="success" onClick={handleDownload}>Download Excel</Button>
        </Grid>
        <Grid item xs={12} lg={6} mt={2}>
          <TableContainer component={Paper}>
            <Table size="small" className="dark-table">
              <TableHead>
                <TableRow>
                  <TableCell>Outfit Charges</TableCell>
                  <TableCell>Cost</TableCell>
                  <TableCell>Qty</TableCell>
                  <TableCell align="right">Total&nbsp;Cost</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {charges.map((row, index) => {
                  const isAllNull = row.cost == null && row.qty == null && row.total == null;

                  return (
                    <TableRow key={index}>
                      {isAllNull ? (
                        <TableCell colSpan={4}>
                          <Typography sx={{ fontWeight: '600', textTransform: 'uppercase' }} color="primary">{row.label}</Typography>
                        </TableCell>
                      ) : (
                        <>
                          <TableCell>{row.label}</TableCell>
                          <TableCell>
                            <TextField
                              type="number"
                              size="small"
                              fullWidth
                              value={row.cost}
                              onChange={(e) => handleChange(index, "cost", e.target.value)}
                            />
                          </TableCell>
                          <TableCell>
                            {row.qty !== 1 ? (
                              <TextField
                                type="number"
                                size="small"
                                sx={{ width: '100px' }}
                                value={row.qty}
                                onChange={(e) => handleChange(index, "qty", e.target.value)}
                              />
                            ) : (
                              ""
                            )}
                          </TableCell>
                          <TableCell align="right">{formatCurrency(row.total)}</TableCell>
                        </>
                      )}
                    </TableRow>
                  );
                })}

              </TableBody>
              <TableHead>
                <TableRow>
                  <TableCell>Total</TableCell>
                  <TableCell align="right" colSpan={3}>{formatCurrency(grossTotal)}</TableCell>
                </TableRow>
              </TableHead>
            </Table>
          </TableContainer>
        </Grid>
        <Grid item xs={12} lg={6} mt={2}>
          <TableContainer component={Paper}>
            <Table className="dark-table">
              <TableHead>
                <TableRow>
                  <TableCell>
                    <Typography variant="h6">Total Cost</Typography>
                  </TableCell>
                  <TableCell align="right" colSpan={3}>
                    <Typography variant="h6">{formatCurrency(grossTotal)}</Typography></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>
                    <Typography variant="h6">Discount</Typography>
                  </TableCell>
                  <TableCell>
                    <TextField
                      sx={{ width: '100px' }}
                      size="small"
                      placeholder="%"
                      type="number"
                      value={discountPercentage}
                      onChange={(e) => handlePercentageChange(e.target.value)}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      placeholder="value"
                      type="number"
                      value={discountValue}
                      onChange={(e) => handleValueChange(e.target.value)}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="h6">
                      {formatCurrency(discountPercentage
                        ? (grossTotal * discountPercentage) / 100
                        : discountValue || 0)}
                    </Typography>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <Typography variant="h6">Advance Payment</Typography>
                  </TableCell>
                  <TableCell align="right" colSpan={3}>
                    <Typography variant="h6">({formatCurrency(reservation?.advancePaidAmount || 0)})</Typography></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <Typography variant="h6">Net Total</Typography>
                  </TableCell>
                  <TableCell align="right" colSpan={3}>
                    <Typography variant="h6">
                      {formatCurrency(netTotal < 0 ? 0 : netTotal)}
                    </Typography>

                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
          <Typography variant="h6" my={2}>Refund</Typography>
          <TableContainer component={Paper}>
            <Table size="small" className="dark-table">
              <TableHead>
                <TableRow>
                  <TableCell>Description</TableCell>
                  <TableCell align="right">Amount</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {refunds.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell>{row.label}</TableCell>
                    <TableCell>
                      <TextField
                        type="number"
                        size="small"
                        fullWidth
                        value={row.value}
                        onChange={(e) => handleChangeRefund(index, "value", e.target.value)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableHead>
                <TableRow>
                  <TableCell>Refund Total</TableCell>
                  <TableCell align="right" colSpan={3}>{formatCurrency(refundTotal)}</TableCell>
                </TableRow>
              </TableHead>
            </Table>
          </TableContainer>
          <Box my={3} display="flex" justifyContent="space-between">
            <Button variant="outlined" onClick={() => navigateToBack()}>
              Back
            </Button>
            {reservation?.isEditEnabled ? <Button
              variant="contained"
              type="submit"
              onClick={handleLogValues}
              disabled={isSubmitting}
              startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : null}
            >
              {isSubmitting ? "Saving..." : "Save"}
            </Button> : ""}
          </Box>
        </Grid>
      </Grid>
    </>
  );
};

export default ChargesSheet;


