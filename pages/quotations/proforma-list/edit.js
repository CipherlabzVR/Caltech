import React, { useEffect, useState } from "react";
import Grid from "@mui/material/Grid";
import {
  Box,
  Button,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import Link from "next/link";
import styles from "@/styles/PageTitle.module.css";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import LoadingButton from "@/components/UIElements/Buttons/LoadingButton";
import BASE_URL from "Base/api";
import { formatCurrency, formatDate } from "@/components/utils/formatHelper";
import { useRouter } from "next/router";
import getSettingValueByName from "@/components/utils/getSettingValueByName";
import IsAppSettingEnabled from "@/components/utils/IsAppSettingEnabled";

const recalculateLineAmounts = (row, quantity) => {
  const sellingPrice = parseFloat(row.sellingPrice) || 0;
  const percentage = parseFloat(row.advancePaymentPercentage) || 0;
  const totalAmount = sellingPrice * quantity;
  const advanceAmount = (totalAmount * percentage) / 100;
  const balanceAmount = totalAmount - advanceAmount;

  return {
    quantity,
    totalAmount,
    advanceAmount,
    balanceAmount: balanceAmount < 0 ? 0 : balanceAmount,
  };
};

const InvoiceCreate = () => {
  const router = useRouter();
  const inquiryId = router.query.id;
  const proformaInvoiceId = router.query.proformaInvoiceId;
  const isPendingEdit = !proformaInvoiceId;
  const [invoiceDate, setInvoiceDate] = useState();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [totalAdvance, setTotalAdvance] = useState(0);
  const [quotations, setQuotations] = useState([]);

  const { data: isUnitEditEnabled } = IsAppSettingEnabled("ProformaInvoiceUnitEditTolerance");
  const { data: unitEditToleranceValue } = getSettingValueByName("ProformaInvoiceUnitEditTolerance");
  const unitEditTolerance = Math.max(0, parseFloat(unitEditToleranceValue) || 0);
  const canEditUnits = isPendingEdit && isUnitEditEnabled && unitEditTolerance > 0;

  const handleSubmit = async () => {
    const invalidRow = quotations.find(
      (row) => parseFloat(row.advanceAmount) > parseFloat(row.totalAmount)
    );

    if (invalidRow) {
      toast.warning("Advance amount cannot be greater than total amount");
      return;
    }

    if (canEditUnits) {
      const invalidUnitRow = quotations.find((row) => {
        const quantity = parseFloat(row.quantity);
        const { minUnits, maxUnits } = getUnitBounds(row);
        if (Number.isNaN(quantity)) {
          return true;
        }
        return quantity < minUnits || quantity > maxUnits;
      });

      if (invalidUnitRow) {
        const { minUnits, maxUnits } = getUnitBounds(invalidUnitRow);
        const baseQuantity = parseFloat(invalidUnitRow.baseQuantity);
        toast.warning(
          `Units must be between ${minUnits} and ${maxUnits} (original ${baseQuantity} ± ${unitEditTolerance}).`
        );
        return;
      }
    }

    const x = quotations.reduce(
      (gross, row) => gross + (Number(row.totalAmount) || 0),
      0
    );
    const y = quotations.reduce(
      (gross, row) => gross + (Number(row.advanceAmount) || 0),
      0
    );

    const z = x - y;

    const data = {
      Id: selectedInquiry.id,
      BalancePayment: z < 0 ? 0 : z,
      AdvancePayment: y,
      Invoices: quotations.map((row) => ({
        InvoiceDate: invoiceDate,
        AdvancePayment: row.advanceAmount,
        BalancePayment: row.balanceAmount,
        QuotationId: row.id,
        ...(canEditUnits ? { Quantity: parseFloat(row.quantity) } : {}),
      })),
    };

    try {
      setIsSubmitting(true);
      const response = await fetch(`${BASE_URL}/Inquiry/UpdateProformaInvoice`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const jsonResponse = await response.json();
        const result = jsonResponse.result;
        const isSuccess = result?.statusCode === 200 || result?.statusCode === "SUCCESS";

        if (isSuccess) {
          toast.success(result.message);
          if (proformaInvoiceId) {
            sessionStorage.setItem("editedInvoiceId", proformaInvoiceId.toString());
          }
          sessionStorage.setItem("switchToProcessingTab", "true");
          setTimeout(() => {
            router.push("/quotations/proforma-list/");
          }, 300);
        } else {
          toast.error(result?.message || "Failed to update proforma invoice");
        }
      } else {
        const errorResponse = await response.json().catch(() => null);
        toast.error(errorResponse?.message || "Please fill all required fields");
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchInquiry = async (id) => {
    try {
      const response = await fetch(`${BASE_URL}/Inquiry/GetProformaInvoiceByInquiryId?inquiryId=${id}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      const inv = data.result.result;
      setSelectedInquiry(inv);
      setInvoiceDate(formatDate(inv.invoiceDate));
    } catch (error) {
      console.error("Error:", error);
    }
  };

  useEffect(() => {
    if (!inquiryId) {
      return;
    }
    fetchInquiry(inquiryId);
    fetchQuotationList(inquiryId);
  }, [inquiryId]);

  const fetchQuotationList = async (inquiry) => {
    try {
      const statusesToTry = [12, 10, 2];
      let allQuotations = [];

      for (const status of statusesToTry) {
        const response = await fetch(
          `${BASE_URL}/Inquiry/GetAllQuotationsByInquiryIdAndStatus?status=${status}&inquiryId=${inquiry}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          const items = data.result || [];
          if (items.length > 0) {
            allQuotations = [...allQuotations, ...items];
          }
        }
      }

      const quotations = allQuotations.filter(
        (quotation, index, self) => index === self.findIndex((q) => q.id === quotation.id)
      );

      const updatedResult = quotations.map((item) => {
        const baseQuantity = parseFloat(item.quantity) || 0;

        if (item.advanceAmount !== undefined && item.balanceAmount !== undefined) {
          return {
            ...item,
            baseQuantity,
          };
        }

        const total = parseFloat(item.totalAmount) || 0;
        const percentage = parseFloat(item.advancePaymentPercentage) || 0;
        const advanceAmount = (total * percentage) / 100;
        const balanceAmount = total - advanceAmount;

        return {
          ...item,
          baseQuantity,
          advanceAmount,
          balanceAmount: balanceAmount < 0 ? 0 : balanceAmount,
        };
      });

      setQuotations(updatedResult);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleAdvanceAmountChange = (index, value) => {
    const newValue = parseFloat(value) || 0;

    setQuotations((prev) => {
      const updated = [...prev];
      const bal = (parseFloat(updated[index].totalAmount) || 0) - newValue;
      updated[index] = {
        ...updated[index],
        advanceAmount: newValue,
        balanceAmount: bal < 0 ? 0 : bal,
      };
      return updated;
    });
  };

  const getUnitBounds = (row) => {
    const baseQuantity = parseFloat(row.baseQuantity) || 0;
    return {
      minUnits: Math.max(1, baseQuantity - unitEditTolerance),
      maxUnits: baseQuantity + unitEditTolerance,
      baseQuantity,
    };
  };

  const isQuantityWithinBounds = (quantity, row) => {
    const { minUnits, maxUnits } = getUnitBounds(row);
    return quantity >= minUnits && quantity <= maxUnits;
  };

  const handleQuantityChange = (index, value) => {
    if (value !== "" && !/^\d+$/.test(value)) {
      return;
    }

    setQuotations((prev) => {
      const updated = [...prev];
      const row = updated[index];
      const { minUnits, maxUnits } = getUnitBounds(row);

      if (value === "") {
        updated[index] = {
          ...row,
          quantity: value,
        };
        return updated;
      }

      const parsed = parseInt(value, 10);
      if (!isQuantityWithinBounds(parsed, row)) {
        toast.warning(
          `Units must be between ${minUnits} and ${maxUnits}. Maximum allowed is ${maxUnits}.`
        );
        return prev;
      }

      updated[index] = {
        ...row,
        ...recalculateLineAmounts(row, parsed),
      };
      return updated;
    });
  };

  const handleQuantityBlur = (index) => {
    setQuotations((prev) => {
      const updated = [...prev];
      const row = updated[index];
      const { minUnits, maxUnits, baseQuantity } = getUnitBounds(row);
      const parsed = parseFloat(row.quantity);

      if (Number.isNaN(parsed)) {
        const fallback = baseQuantity || minUnits;
        updated[index] = {
          ...row,
          ...recalculateLineAmounts(row, fallback),
        };
        return updated;
      }

      if (!isQuantityWithinBounds(parsed, row)) {
        toast.warning(
          `Units must be between ${minUnits} and ${maxUnits} (original ${baseQuantity} ± ${unitEditTolerance}).`
        );
        updated[index] = {
          ...row,
          ...recalculateLineAmounts(row, baseQuantity),
        };
        return updated;
      }

      updated[index] = {
        ...row,
        ...recalculateLineAmounts(row, parsed),
      };
      return updated;
    });
  };

  const handleQuantityStep = (index, direction) => {
    setQuotations((prev) => {
      const updated = [...prev];
      const row = updated[index];
      const { minUnits, maxUnits } = getUnitBounds(row);
      const current = parseFloat(row.quantity);
      const safeCurrent = Number.isNaN(current) ? parseFloat(row.baseQuantity) || minUnits : current;
      const nextQuantity =
        direction > 0
          ? Math.min(safeCurrent + 1, maxUnits)
          : Math.max(safeCurrent - 1, minUnits);

      if (nextQuantity === safeCurrent) {
        return prev;
      }

      updated[index] = {
        ...row,
        ...recalculateLineAmounts(row, nextQuantity),
      };
      return updated;
    });
  };

  const navigateToBack = () => {
    router.push({
      pathname: "/quotations/proforma-list/",
    });
  };

  useEffect(() => {
    const total = quotations.reduce(
      (gross, row) => gross + (Number(row.advanceAmount) || 0),
      0
    );
    setTotalAdvance(total);
  }, [quotations]);

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Proforma Invoice Edit</h1>
        <ul>
          <li>
            <Link href="/quotations/invoice">Proforma Invoice</Link>
          </li>
          <li>Edit</li>
        </ul>
      </div>

      <Grid
        container
        rowSpacing={1}
        columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}
      >
        <Grid item xs={12} sx={{ background: "#fff" }}>
          <Grid container p={1}>
            <Grid item xs={12} gap={2} display="flex" justifyContent="end">
              <Grid container>
                <Grid item xs={12} display="flex" justifyContent="end" alignItems="center">
                  <Box>
                    <Button variant="outlined" onClick={() => navigateToBack()}>
                      <Typography sx={{ fontWeight: "bold" }}>Go Back</Typography>
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Grid>
            <Grid item xs={12} mt={3}>
              <Grid container spacing={1}>
                <Grid item xs={12} mt={1} display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="h6" component="label">Invoice</Typography>
                </Grid>
                <Grid item xs={12} lg={6} display="flex" justifyContent="space-between" alignItems="center">
                  <Typography component="label">Invoice Date</Typography>
                  <TextField
                    sx={{ width: "60%" }}
                    size="small"
                    fullWidth
                    type="date"
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} lg={6} display="flex" justifyContent="space-between" alignItems="center">
                  <Typography component="label">Customer Name</Typography>
                  <TextField
                    sx={{ width: "60%" }}
                    size="small"
                    fullWidth
                    disabled
                    value={selectedInquiry && selectedInquiry.customerName || ""}
                  />
                </Grid>
                <Grid item xs={12} lg={6} display="flex" justifyContent="space-between" alignItems="center">
                  <Typography component="label">Inquiry Code</Typography>
                  <TextField
                    sx={{ width: "60%" }}
                    size="small"
                    fullWidth
                    disabled
                    value={selectedInquiry && selectedInquiry.inquiryCode || ""}
                  />
                </Grid>
                <Grid item xs={12} lg={6} display="flex" justifyContent="space-between" alignItems="center">
                  <Typography component="label">Style Name</Typography>
                  <TextField
                    sx={{ width: "60%" }}
                    size="small"
                    fullWidth
                    disabled
                    value={selectedInquiry && selectedInquiry.styleName || ""}
                  />
                </Grid>
                <Grid item xs={12} mt={2} display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="h6" component="label">Confirmed Quotations</Typography>
                  {canEditUnits ? (
                    <Typography variant="body2" color="text.secondary">
                      Type or use arrows to adjust units, up to ±{unitEditTolerance} from original
                    </Typography>
                  ) : null}
                </Grid>
                <Grid item xs={12} lg={12} my={2}>
                  <TableContainer component={Paper}>
                    <Table aria-label="simple table" className="dark-table">
                      <TableHead>
                        <TableRow>
                          <TableCell>Document No</TableCell>
                          <TableCell>Option</TableCell>
                          <TableCell>Units</TableCell>
                          <TableCell>Selling Price</TableCell>
                          <TableCell>Adv. Payment (%)</TableCell>
                          <TableCell>Total Amount</TableCell>
                          <TableCell>Adv. Payment</TableCell>
                          <TableCell>Balance Payment</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {quotations.length === 0 ?
                          <>
                          </> : quotations.map((item, index) => {
                            const { minUnits, maxUnits } = getUnitBounds(item);
                            const currentUnits = parseFloat(item.quantity);
                            const hasValidQuantity = !Number.isNaN(currentUnits);
                            const effectiveUnits = hasValidQuantity
                              ? currentUnits
                              : parseFloat(item.baseQuantity) || minUnits;
                            const isAtMin = hasValidQuantity && effectiveUnits <= minUnits;
                            const isAtMax = hasValidQuantity && effectiveUnits >= maxUnits;

                            return (
                              <TableRow key={index}>
                                <TableCell>{item.documentNo}</TableCell>
                                <TableCell>{item.optionName}</TableCell>
                                <TableCell>
                                  {canEditUnits ? (
                                    <Box
                                      sx={{
                                        display: "inline-flex",
                                        alignItems: "stretch",
                                        border: "1px solid",
                                        borderColor: "divider",
                                        borderRadius: 1,
                                        overflow: "hidden",
                                        bgcolor: "background.paper",
                                      }}
                                    >
                                        <TextField
                                          size="small"
                                          type="text"
                                          value={item.quantity}
                                          onChange={(e) => handleQuantityChange(index, e.target.value)}
                                          onBlur={() => handleQuantityBlur(index)}
                                          variant="standard"
                                          InputProps={{
                                            disableUnderline: true,
                                          }}
                                          inputProps={{
                                            inputMode: "numeric",
                                            pattern: "[0-9]*",
                                            "aria-label": "Units",
                                            title: `Allowed range: ${minUnits} to ${maxUnits}`,
                                            style: {
                                              textAlign: "center",
                                              padding: "6px 4px",
                                              width: 48,
                                              fontWeight: 600,
                                            },
                                          }}
                                          sx={{
                                            "& .MuiInputBase-root": {
                                              height: "100%",
                                              alignItems: "center",
                                            },
                                          }}
                                        />
                                        <Box
                                          sx={{
                                            display: "flex",
                                            flexDirection: "column",
                                            borderLeft: "1px solid",
                                            borderColor: "divider",
                                          }}
                                        >
                                          <Tooltip title="Increase by 1" placement="top">
                                            <span>
                                              <IconButton
                                                size="small"
                                                onClick={() => handleQuantityStep(index, 1)}
                                                disabled={isAtMax}
                                                aria-label="Increase units"
                                                sx={{
                                                  borderRadius: 0,
                                                  p: 0.25,
                                                  width: 28,
                                                  height: 22,
                                                }}
                                              >
                                                <KeyboardArrowUpIcon sx={{ fontSize: 18 }} />
                                              </IconButton>
                                            </span>
                                          </Tooltip>
                                          <Tooltip title="Decrease by 1" placement="bottom">
                                            <span>
                                              <IconButton
                                                size="small"
                                                onClick={() => handleQuantityStep(index, -1)}
                                                disabled={isAtMin}
                                                aria-label="Decrease units"
                                                sx={{
                                                  borderRadius: 0,
                                                  p: 0.25,
                                                  width: 28,
                                                  height: 22,
                                                  borderTop: "1px solid",
                                                  borderColor: "divider",
                                                }}
                                              >
                                                <KeyboardArrowDownIcon sx={{ fontSize: 18 }} />
                                              </IconButton>
                                            </span>
                                          </Tooltip>
                                        </Box>
                                    </Box>
                                  ) : (
                                    item.quantity
                                  )}
                                </TableCell>
                                <TableCell>{item.sellingPrice}</TableCell>
                                <TableCell>{item.advancePaymentPercentage}</TableCell>
                                <TableCell>{item.totalAmount}</TableCell>
                                <TableCell>
                                  <TextField
                                    size="small"
                                    type="number"
                                    value={item.advanceAmount}
                                    onChange={(e) => handleAdvanceAmountChange(index, e.target.value)}
                                  />
                                </TableCell>
                                <TableCell>{item.balanceAmount}</TableCell>
                              </TableRow>
                            );
                          })}
                        <TableRow>
                          <TableCell colSpan={6}>Total Advance Payment</TableCell>
                          <TableCell colSpan={2}>
                            <Typography>{formatCurrency(totalAdvance)}</Typography>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
              </Grid>
            </Grid>
            <Grid item xs={12} my={3}>
              <LoadingButton
                loading={isSubmitting}
                handleSubmit={() => handleSubmit()}
                disabled={false}
              />
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </>
  );
};

export default InvoiceCreate;
