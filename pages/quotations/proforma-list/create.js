import React, { useEffect, useRef, useState } from "react";
import Grid from "@mui/material/Grid";
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
  TextField,
  Typography,
} from "@mui/material";
import Link from "next/link";
import styles from "@/styles/PageTitle.module.css";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import LoadingButton from "@/components/UIElements/Buttons/LoadingButton";
import BASE_URL from "Base/api";
import { formatCurrency, formatDate } from "@/components/utils/formatHelper";
import { useRouter } from "next/router";

const InvoiceCreate = () => {
  const router = useRouter();
  const prefillDone = useRef(false);
  const today = new Date();
  const [invoiceDate, setInvoiceDate] = useState(formatDate(today));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [totalAdvance, setTotalAdvance] = useState(0);
  const [quotations, setQuotations] = useState([]);

  const preselectInquiryFromQuery = async () => {
    const { inquiryId, customerId, customerName, inquiryCode, styleName } = router.query;
    const parsedInquiryId = inquiryId ? Number(inquiryId) : null;
    const parsedCustomerId = customerId ? Number(customerId) : null;

    if (!parsedInquiryId) return;

    // Build initial payload from query params if available
    let payload = {
      inquiryId: parsedInquiryId,
      customerId: parsedCustomerId,
      customerName: customerName || "",
      inquiryCode: inquiryCode || "",
      styleName: styleName || "",
    };

    // If we are missing key fields, fetch details by inquiry id to hydrate them
    if (!parsedCustomerId || !customerName || !inquiryCode || !styleName) {
      try {
        const response = await fetch(`${BASE_URL}/Inquiry/GetProformaInvoiceByInquiryId?inquiryId=${parsedInquiryId}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const data = await response.json();
          const result = data.result || {};
          payload = {
            inquiryId: result.inquiryId || parsedInquiryId,
            customerId: result.customerId || parsedCustomerId,
            customerName: result.customerName || customerName || "",
            inquiryCode: result.inquiryCode || inquiryCode || "",
            styleName: result.styleName || styleName || "",
          };
        }
      } catch (err) {
        console.error("Error preselecting inquiry:", err);
      }
    }

    // Only proceed if we have the identifiers we need
    if (payload.inquiryId && payload.customerId) {
      handleSelectInquiry(payload);
    }
  };

  const handleSubmit = async () => {
    if (selectedInquiry == null) {
      toast.warning("Please select a inquiry");
      return;
    }

    const invalidRow = quotations.find(
      (row) => parseFloat(row.advanceAmount) > parseFloat(row.totalAmount)
    );

    if (invalidRow) {
      toast.warning("Advance amount cannot be greater than total amount");
      return;
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
      CustomerId: selectedInquiry.customerId,
      InvoiceDate: invoiceDate,
      InquiryCode: selectedInquiry.inquiryCode,
      StyleName: selectedInquiry.styleName,
      CustomerName: selectedInquiry.customerName,
      TotalPayment: x,
      BalancePayment: z < 0 ? 0 : z,
      AdvancePayment: y,
      InquiryId: selectedInquiry.inquiryId,
      Invoices: quotations.map((row) => ({
        InvoiceDate: invoiceDate,
        AdvancePayment: row.advanceAmount,
        BalancePayment: row.balanceAmount,
        QuotationId: row.id,
      })),
    }

    try {
      setIsSubmitting(true);
      const response = await fetch(`${BASE_URL}/Inquiry/CreateProformaInvoice`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const jsonResponse = await response.json();
        if (jsonResponse.message != "") {
          toast.success(jsonResponse.result.message);
          
          // Get the created invoice ID from response or fetch it
          // First, try to get the invoice by inquiryId to get the invoice ID
          try {
            const invoiceResponse = await fetch(`${BASE_URL}/Inquiry/GetProformaInvoiceByInquiryId?inquiryId=${selectedInquiry.inquiryId}`, {
              method: "GET",
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
                "Content-Type": "application/json",
              },
            });
            
            if (invoiceResponse.ok) {
              const invoiceData = await invoiceResponse.json();
              const invoiceId = invoiceData.result?.id;
              
              if (invoiceId) {
                // Call the endpoint to move invoice to Processing tab (same method as print button)
                await fetch(`${BASE_URL}/Inquiry/MoveProformaInvoiceToProcessing?id=${invoiceId}`, {
                  method: "POST",
                  headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                    "Content-Type": "application/json",
                  },
                });
              }
            }
          } catch (error) {
            console.error("Error moving invoice to processing:", error);
          }
          
          // Store inquiryId to remove from pending list when navigating back (for immediate UI feedback)
          if (selectedInquiry && selectedInquiry.inquiryId) {
            sessionStorage.setItem("removedInquiryId", selectedInquiry.inquiryId.toString());
          }
          setSelectedInquiry(null);
          setQuotations([]);
          // Navigate back to list page (will show Processing tab)
          router.push("/quotations/proforma-list/");
        } else {
          toast.error(jsonResponse.result.message);
        }
      } else {
        toast.error("Please fill all required fields");
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectInquiry = async (inquiry) => {
    setSelectedInquiry(inquiry);
    try {
      // Try multiple statuses until we find quotation rows
      const statusesToTry = [10, 12]; // Pending, Processing
      let quotationsResult = [];

      for (const status of statusesToTry) {
        const response = await fetch(`${BASE_URL}/Inquiry/GetAllQuotationsByInquiryIdAndStatus?status=${status}&inquiryId=${inquiry.inquiryId}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) continue;
        const data = await response.json();
        const items = data.result || [];
        if (items.length > 0) {
          quotationsResult = items;
          break;
        }
      }

      const updatedResult = quotationsResult.map(item => {
        const total = parseFloat(item.totalAmount) || 0;
        const percentage = parseFloat(item.advancePaymentPercentage) || 0;
        // If advanceAmount already exists, prefer backend-calculated values
        const advanceFromBackend = item.advanceAmount !== undefined ? Number(item.advanceAmount) : null;
        const advanceAmount = advanceFromBackend !== null ? advanceFromBackend : (total * percentage) / 100;
        const balanceFromBackend = item.balanceAmount !== undefined ? Number(item.balanceAmount) : null;
        const balanceAmount = balanceFromBackend !== null ? balanceFromBackend : (total - advanceAmount);

        return {
          ...item,
          advanceAmount,
          balanceAmount: balanceAmount < 0 ? 0 : balanceAmount
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

  // When navigated from pending list, preselect the related customer/inquiry
  useEffect(() => {
    if (!router.isReady || prefillDone.current) return;
    prefillDone.current = true;
    preselectInquiryFromQuery();
  }, [router.isReady, router.query]);

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Proforma Invoice Create</h1>
        <ul>
          <li>
            <Link href="/quotations/invoice">Proforma Invoice</Link>
          </li>
          <li>Create</li>
        </ul>
      </div>

      <Grid
        container
        rowSpacing={1}
        columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}
      >
        <Grid item xs={12} sx={{ background: "#fff" }}>
          <Grid container p={1}>
            <Grid item xs={12} display="flex" justifyContent="end">
              <Box>
                <Button variant="outlined" onClick={() => navigateToBack()}>
                  <Typography sx={{ fontWeight: "bold" }}>Go Back</Typography>
                </Button>
              </Box>
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
                          </> : quotations.map((item, index) => (
                            <TableRow key={index}>
                              <TableCell>{item.documentNo}</TableCell>
                              <TableCell>{item.optionName}</TableCell>
                              <TableCell>{item.quantity}</TableCell>
                              <TableCell>{item.sellingPrice}</TableCell>
                              <TableCell>{item.advancePaymentPercentage}</TableCell>
                              <TableCell>{item.totalAmount}</TableCell>
                              <TableCell>
                                <TextField size="small" type="number" value={item.advanceAmount} onChange={(e) => handleAdvanceAmountChange(index, e.target.value)} />
                              </TableCell>
                              <TableCell>{item.balanceAmount}</TableCell>
                            </TableRow>
                          ))}
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

