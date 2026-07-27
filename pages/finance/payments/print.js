import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import { format } from "date-fns";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import PrintIcon from "@mui/icons-material/Print";
import BASE_URL from "Base/api";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { getPaymentMethods } from "@/components/types/types";

const PAYMENT_MODE_GRN = 1;
const PAYMENT_MODE_SHIPMENT_INVOICE = 2;

const FIRST_PAGE_ROW_LIMIT = 8;
const NEXT_PAGE_ROW_LIMIT = 12;

const formatDisplayDate = (value) => {
  if (!value) {
    return "-";
  }

  try {
    return format(new Date(value), "dd-MMM-yyyy");
  } catch (error) {
    return "-";
  }
};

const formatAmount = (value) => {
  const numericValue = Number(value ?? 0);
  if (Number.isNaN(numericValue)) {
    return "0.00";
  }

  return numericValue.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const getPaymentModeLabel = (mode) => {
  switch (Number(mode)) {
    case PAYMENT_MODE_GRN:
      return "Good Receive Note";
    case PAYMENT_MODE_SHIPMENT_INVOICE:
      return "Shipment Invoice";
    default:
      return "-";
  }
};

const getPaymentToLabel = (paymentTo) => {
  switch (Number(paymentTo)) {
    case 1:
      return "Supplier";
    default:
      return "-";
  }
};

export default function PaymentPrintPage() {
  const router = useRouter();
  const contentRef = useRef(null);
  const paymentId = router.query.id;
  const documentNumber = router.query.documentNumber;

  const [paymentData, setPaymentData] = useState(null);
  const [accountMap, setAccountMap] = useState({});
  const [loadingPayment, setLoadingPayment] = useState(true);

  useEffect(() => {
    if (!router.isReady || !paymentId) {
      return;
    }

    const fetchPayment = async () => {
      try {
        setLoadingPayment(true);
        const token =
          typeof window !== "undefined" ? localStorage.getItem("token") : null;

        const response = await fetch(
          `${BASE_URL}/Payments/GetPaymentById/${paymentId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          }
        );

        const data = await response.json().catch(() => null);
        const payment =
          data?.result?.result ??
          data?.result ??
          data?.data ??
          null;

        if (response.ok && payment) {
          setPaymentData(payment);
        } else {
          toast.error(data?.message || "Failed to load payment.");
        }
      } catch (error) {
        console.error("Error fetching payment:", error);
        toast.error("Failed to load payment.");
      } finally {
        setLoadingPayment(false);
      }
    };

    fetchPayment();
  }, [paymentId, router.isReady]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      return;
    }

    const fetchAccounts = async () => {
      try {
        const response = await fetch(`${BASE_URL}/ChartOfAccount/GetAll`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          return;
        }

        const data = await response.json().catch(() => null);
        const accounts = Array.isArray(data)
          ? data
          : Array.isArray(data?.result)
            ? data.result
            : [];

        const nextMap = {};
        accounts.forEach((account) => {
          nextMap[account.id] = account;
        });
        setAccountMap(nextMap);
      } catch (error) {
        console.error("Error fetching chart of accounts:", error);
      }
    };

    fetchAccounts();
  }, []);

  const lineItems =
    paymentData?.paymentsLineDetails ??
    paymentData?.PaymentsLineDetails ??
    [];

  const paymentMode = paymentData?.paymentMode ?? paymentData?.PaymentMode;
  const isShipmentMode = Number(paymentMode) === PAYMENT_MODE_SHIPMENT_INVOICE;
  const referenceColumnLabel = isShipmentMode ? "Shipment Invoice No." : "GRN No.";
  const dateColumnLabel = isShipmentMode ? "Invoice Date" : "GRN Date";

  const chartOfAccount =
    accountMap[paymentData?.chartOfAccountId ?? paymentData?.ChartOfAccountId];

  const paginatedLineItems = useMemo(() => {
    if (lineItems.length === 0) {
      return [[]];
    }

    const pages = [];
    let startIndex = 0;
    pages.push(lineItems.slice(startIndex, startIndex + FIRST_PAGE_ROW_LIMIT));
    startIndex += FIRST_PAGE_ROW_LIMIT;

    while (startIndex < lineItems.length) {
      pages.push(lineItems.slice(startIndex, startIndex + NEXT_PAGE_ROW_LIMIT));
      startIndex += NEXT_PAGE_ROW_LIMIT;
    }

    return pages;
  }, [lineItems]);

  const handleDownloadPDF = async () => {
    if (!contentRef.current) {
      return;
    }

    try {
      const pageElements = contentRef.current.querySelectorAll(
        '[data-payment-pdf-page="true"]'
      );

      if (pageElements.length === 0) {
        toast.error("No printable pages found.");
        return;
      }

      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");

      const pdf = new jsPDF({
        unit: "mm",
        format: "a4",
        orientation: "portrait",
      });

      for (let index = 0; index < pageElements.length; index += 1) {
        const canvas = await html2canvas(pageElements[index], {
          scale: 2,
          useCORS: true,
          logging: false,
          allowTaint: true,
          backgroundColor: "#ffffff",
        });

        const imgData = canvas.toDataURL("image/jpeg", 0.98);
        if (index > 0) {
          pdf.addPage();
        }
        pdf.addImage(imgData, "JPEG", 0, 0, 210, 297);
      }

      pdf.save(
        `Payment_${paymentData?.documentNo || documentNumber || "document"}.pdf`
      );
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to download PDF. Please try again.");
    }
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const renderTable = (items, isLastPage) => (
    <Box sx={{ mb: { xs: 2, sm: 3 }, borderTop: "2px solid #333", borderBottom: "2px solid #333" }}>
      <Box
        sx={{
          display: "flex",
          padding: { xs: "6px 4px", sm: "10px 6px" },
          fontWeight: 600,
          borderBottom: "1px solid #333",
          color: "black",
        }}
      >
        <Box sx={{ flex: 1.5, fontSize: { xs: "0.5rem", sm: "0.74rem" } }}>{referenceColumnLabel}</Box>
        <Box sx={{ flex: 1, fontSize: { xs: "0.5rem", sm: "0.74rem" } }}>{dateColumnLabel}</Box>
        <Box sx={{ flex: 1, textAlign: "right", fontSize: { xs: "0.5rem", sm: "0.74rem" } }}>Amount</Box>
      </Box>

      {items.length === 0 ? (
        <Box sx={{ padding: "16px" }}>
          <Typography sx={{ textAlign: "center", fontSize: { xs: "0.58rem", sm: "0.82rem" } }}>
            No line items available
          </Typography>
        </Box>
      ) : (
        items.map((item, index) => (
          <Box
            key={item.id || `${item.grnNumber || item.grnId}-${index}`}
            sx={{
              display: "flex",
              padding: { xs: "5px 4px", sm: "8px 6px" },
              borderBottom: index === items.length - 1 ? "none" : "1px solid #cfcfcf",
            }}
          >
            <Box sx={{ flex: 1.5, fontSize: { xs: "0.5rem", sm: "0.72rem" } }}>
              {item.grnNumber || item.GRNNumber || "-"}
            </Box>
            <Box sx={{ flex: 1, fontSize: { xs: "0.5rem", sm: "0.72rem" } }}>
              {formatDisplayDate(item.grnDate || item.GRNDate)}
            </Box>
            <Box sx={{ flex: 1, textAlign: "right", fontSize: { xs: "0.5rem", sm: "0.72rem" }, fontWeight: 600 }}>
              {formatAmount(item.receivedAmount ?? item.ReceivedAmount)}
            </Box>
          </Box>
        ))
      )}

      {isLastPage && (
        <Box sx={{ display: "flex", justifyContent: "flex-end", borderTop: "1px solid #333", p: { xs: "8px 4px", sm: "10px 6px" } }}>
          <Box sx={{ width: { xs: "65%", sm: "40%" } }}>
            <Box display="flex" justifyContent="space-between" pt={0.5} borderTop="2px solid #333">
              <Typography sx={{ fontSize: { xs: "0.56rem", sm: "0.84rem" }, fontWeight: 700 }}>Net Amount</Typography>
              <Typography sx={{ fontSize: { xs: "0.56rem", sm: "0.84rem" }, fontWeight: 700 }}>
                {formatAmount(paymentData?.netAmount ?? paymentData?.NetAmount)}
              </Typography>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );

  const renderPageContent = (items, pageIndex, isLastPage) => (
    <Box>
      <Box sx={{ borderTop: "2px solid #333", borderBottom: "2px solid #333", py: 1, mb: 2 }}>
        <Typography sx={{ fontWeight: "bold", textAlign: "center", fontSize: { xs: "1rem", sm: "1.5rem" }, lineHeight: 1.2 }}>
          {pageIndex === 0 ? "PAYMENT VOUCHER" : "PAYMENT VOUCHER (CONT.)"}
        </Typography>
      </Box>

      {pageIndex === 0 && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            mb: { xs: 2, sm: 2.5 },
            flexDirection: { xs: "column", sm: "row" },
            gap: 4,
          }}
        >
          <Box sx={{ flex: 1 }}>
            {[
              ["Document No", paymentData?.documentNo || documentNumber || "-"],
              ["Payment Date", formatDisplayDate(paymentData?.paymentDate || paymentData?.PaymentDate)],
              ["Payment Type", getPaymentMethods(paymentData?.paymentType ?? paymentData?.PaymentType)],
              ["Payment Mode", getPaymentModeLabel(paymentMode)],
              ["Supplier", paymentData?.supplierName || paymentData?.SupplierName || "-"],
            ].map(([label, value]) => (
              <Box key={label} sx={{ display: "grid", gridTemplateColumns: { xs: "120px 12px 1fr", sm: "140px 16px 1fr" }, alignItems: "start", mb: 1, columnGap: 1 }}>
                <Typography sx={{ fontWeight: 700, fontSize: { xs: "0.62rem", sm: "0.86rem" } }}>{label}</Typography>
                <Typography sx={{ fontWeight: 700, fontSize: { xs: "0.62rem", sm: "0.86rem" } }}>:</Typography>
                <Typography sx={{ fontSize: { xs: "0.62rem", sm: "0.86rem" } }}>{value}</Typography>
              </Box>
            ))}
          </Box>

          <Box sx={{ flex: 1 }}>
            {[
              ["Payment To", getPaymentToLabel(paymentData?.paymentTo ?? paymentData?.PaymentTo)],
              ["Reference No", paymentData?.refferanceNo || paymentData?.RefferanceNo || "-"],
              ["Remark", paymentData?.remark || paymentData?.Remark || "-"],
              [
                "Chart of Account",
                chartOfAccount
                  ? `${chartOfAccount.code} - ${chartOfAccount.description}`
                  : "-",
              ],
            ].map(([label, value]) => (
              <Box key={label} sx={{ display: "grid", gridTemplateColumns: { xs: "120px 12px 1fr", sm: "130px 16px 1fr" }, alignItems: "start", mb: 1, columnGap: 1 }}>
                <Typography sx={{ fontWeight: 700, fontSize: { xs: "0.62rem", sm: "0.86rem" } }}>{label}</Typography>
                <Typography sx={{ fontWeight: 700, fontSize: { xs: "0.62rem", sm: "0.86rem" } }}>:</Typography>
                <Typography sx={{ fontSize: { xs: "0.62rem", sm: "0.86rem" } }}>{value}</Typography>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {renderTable(items, isLastPage)}
    </Box>
  );

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        padding: { xs: 2, sm: 3, md: 4 },
        backgroundColor: "#f5f5f5",
        "@media print": {
          padding: 0,
          backgroundColor: "#fff",
        },
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: "900px",
          backgroundColor: "white",
          borderRadius: 2,
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          paddingX: 2,
          display: "flex",
          flexDirection: "column",
          "@media print": {
            maxWidth: "100%",
            borderRadius: 0,
            boxShadow: "none",
            paddingX: 0,
          },
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            width: "100%",
            marginBottom: 1,
            paddingBottom: 1,
            borderBottom: "2px solid #e0e0e0",
            flexDirection: { xs: "column", sm: "row" },
            gap: { xs: 2, sm: 0 },
            "@media print": {
              display: "none",
            },
          }}
          mt={5}
        >
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: { xs: "stretch", sm: "flex-end" }, gap: 1 }}>
            <Box display="flex" gap={1} flexWrap="wrap" justifyContent="flex-end">
              <Button variant="outlined" startIcon={<PrintIcon />} onClick={handlePrint} sx={{ textTransform: "none" }}>
                Print
              </Button>
              <Button variant="outlined" startIcon={<PictureAsPdfIcon />} onClick={handleDownloadPDF} sx={{ textTransform: "none" }}>
                Download PDF
              </Button>
            </Box>
          </Box>
        </Box>

        <Box mb={5} ref={contentRef}>
          {loadingPayment ? (
            <Box
              sx={{
                width: { xs: "100%", sm: "210mm" },
                minHeight: { xs: "auto", sm: "297mm" },
                margin: "0 auto",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                backgroundColor: "#fff",
              }}
            >
              <Typography variant="body2" color="text.secondary">
                Loading payment...
              </Typography>
            </Box>
          ) : paymentData ? (
            paginatedLineItems.map((items, pageIndex) => {
              const isLastPage = pageIndex === paginatedLineItems.length - 1;

              return (
                <Box
                  key={`payment-page-${pageIndex}`}
                  data-payment-pdf-page="true"
                  sx={{
                    width: { xs: "100%", sm: "210mm" },
                    minHeight: { xs: "auto", sm: "297mm" },
                    maxWidth: "100%",
                    margin: "0 auto",
                    marginBottom: { xs: 2, sm: isLastPage ? 0 : 4 },
                    position: "relative",
                    backgroundColor: "white",
                    padding: "0.5in",
                    boxSizing: "border-box",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    display: "flex",
                    flexDirection: "column",
                    pageBreakAfter: isLastPage ? "auto" : "always",
                    breakAfter: isLastPage ? "auto" : "page",
                    "@media print": {
                      margin: 0,
                      marginBottom: 0,
                      boxShadow: "none",
                      padding: "0.5in",
                      boxSizing: "border-box",
                      pageBreakAfter: isLastPage ? "auto" : "always",
                      breakAfter: isLastPage ? "auto" : "page",
                    },
                  }}
                >
                  <Box sx={{ position: "relative", width: "100%", mx: "auto", boxSizing: "border-box", backgroundColor: "transparent", flex: 1 }}>
                    {renderPageContent(items, pageIndex, isLastPage)}
                  </Box>
                  <Typography
                    sx={{
                      mt: 2,
                      pt: 1,
                      borderTop: "1px solid #d9d9d9",
                      textAlign: "center",
                      fontSize: { xs: "0.62rem", sm: "0.8rem" },
                      fontWeight: 600,
                    }}
                  >
                    Powered By : CBASS-AI
                  </Typography>
                </Box>
              );
            })
          ) : (
            <Box
              sx={{
                width: { xs: "100%", sm: "210mm" },
                minHeight: { xs: "auto", sm: "297mm" },
                margin: "0 auto",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                backgroundColor: "#fff",
              }}
            >
              <Typography variant="body2" color="error">
                Failed to load payment
              </Typography>
            </Box>
          )}
        </Box>

        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      </Box>
    </Box>
  );
}
