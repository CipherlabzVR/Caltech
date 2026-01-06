import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import { ProjectNo } from "Base/catelogue";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import { format } from "date-fns";
import BASE_URL from "Base/api";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { formatDate } from "@/components/utils/formatHelper";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import useLoggedUserCompanyLetterhead from "@/hooks/useLoggedUserCompanyLetterhead";

export default function CustomerInvoice() {
  const router = useRouter();
  const invoiceId = router.query.id;
  const invoiceNumber = router.query.documentNumber;
  const [invoiceData, setInvoiceData] = useState(null);
  const [loadingInvoice, setLoadingInvoice] = useState(true);
  const [quoteData, setQuoteData] = useState(null);
  const { letterheadImage } = useLoggedUserCompanyLetterhead();

  useEffect(() => {
    const fetchInvoiceData = async () => {
      if (!invoiceId) return;

      try {
        setLoadingInvoice(true);
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const response = await fetch(`${BASE_URL}/CRMInvoice/ReadCRMInvoice?id=${invoiceId}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        const data = await response.json().catch(() => null);

        if (response.ok && data?.statusCode === 200) {
          setInvoiceData(data.result);
          
          // Fetch quote data for company details
          if (data.result.quoteId) {
            try {
              const quoteResponse = await fetch(`${BASE_URL}/CRMQuotes/ReadCRMQuote?id=${data.result.quoteId}`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
              });
              const quoteResponseData = await quoteResponse.json().catch(() => null);
              if (quoteResponse.ok && quoteResponseData?.statusCode === 200) {
                setQuoteData(quoteResponseData.result);
              }
            } catch (error) {
              console.error("Error fetching quote data:", error);
            }
          }
        } else {
          console.error("Failed to fetch invoice data");
        }
      } catch (error) {
        console.error("Error fetching invoice data:", error);
      } finally {
        setLoadingInvoice(false);
      }
    };

    fetchInvoiceData();
  }, [invoiceId]);

  const currentDate = format(new Date(), "yyyy-MM-dd");
  const invoiceContentRef = useRef(null);

  const handleDownloadPDF = async () => {
    if (!invoiceContentRef.current) return;

    try {
      // Dynamically import html2pdf
      const html2pdf = (await import("html2pdf.js")).default;
      
      const element = invoiceContentRef.current;
      const opt = {
        margin: 0,
        filename: `Payment_Plan_${invoiceData?.invoiceNo || invoiceNumber || "paymentplan"}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { 
          scale: 2,
          useCORS: true,
          logging: false,
        },
        jsPDF: { 
          unit: "mm", 
          format: "a4", 
          orientation: "portrait" 
        },
      };

      await html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to download PDF. Please try again.");
    }
  };

  const formatCurrency = (value) => {
    if (value === null || value === undefined || value === "") {
      return "0.00";
    }
    const numberValue = Number(value);
    if (Number.isNaN(numberValue)) {
      return "0.00";
    }
    return numberValue.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const getPaymentStatusLabel = (status) => {
    if (status === 1) return "Pending";
    if (status === 2) return "Paid";
    return "Unknown";
  };

  const getPaymentPlanTypeLabel = (type) => {
    if (type === 1) return "Monthly";
    if (type === 2) return "Part";
    if (type === 3) return "Full";
    return "-";
  };

  const getPaymentTypeLabel = (type) => {
    if (type === 1) return "Cash";
    if (type === 2) return "Card";
    if (type === 4) return "Bank Transfer";
    if (type === 5) return "Cheque";
    if (type === 7) return "Credit";
    return "-";
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        padding: { xs: 2, sm: 3, md: 4 },
        backgroundColor: "#f5f5f5",
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
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
            marginBottom: 1,
            paddingBottom: 1,
            borderBottom: "2px solid #e0e0e0",
            flexDirection: { xs: "column", sm: "row" },
            gap: { xs: 2, sm: 0 },
          }}
        >
          <Box sx={{ width: { xs: "100%", sm: "auto" }, textAlign: { xs: "center", sm: "left" } }}>
            <img
              src={ProjectNo === 1 ? "/images/cbass-2.png" : "/images/DBlogo.png"}
              alt="Logo"
              style={{ maxWidth: "180px", height: "auto", width: "100%" }}
            />
          </Box>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: { xs: "center", sm: "flex-end" },
              gap: 1,
              "@media print": {
                display: "none",
              },
            }}
          >
            <Button
              variant="outlined"
              startIcon={<PictureAsPdfIcon />}
              onClick={handleDownloadPDF}
              sx={{ textTransform: "none", fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
            >
              Download PDF
            </Button>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5 }}>
              Date
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 600, fontSize: { xs: "0.875rem", sm: "1rem" } }}>
              {currentDate}
            </Typography>
          </Box>
        </Box>

        <Box
          ref={invoiceContentRef}
          sx={{
            width: { xs: "100%", sm: "210mm" },
            minHeight: { xs: "auto", sm: "297mm" },
            maxWidth: "100%",
            margin: "0 auto",
            marginBottom: { xs: 2, sm: 4 },
            position: "relative",
            backgroundColor: "white",
            backgroundImage: letterheadImage 
              ? { xs: "none", sm: `url('${letterheadImage}')` }
              : { xs: "none", sm: "url('/images/quotation/cbassletter.jpg')" },
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            paddingTop: { xs: "10mm", sm: "60mm", md: "70mm" },
            paddingX: { xs: "5mm", sm: "25mm", md: "30mm" },
            paddingBottom: { xs: "10mm", sm: "25mm", md: "30mm" },
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}
        >
          {loadingInvoice ? (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                minHeight: "400px",
              }}
            >
              <Typography variant="body2" color="text.secondary">
                Loading Payment Plan...
              </Typography>
            </Box>
          ) : invoiceData ? (
            <Box sx={{ position: "relative", zIndex: 1 }}>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: "bold",
                  textAlign: "center",
                  mb: { xs: 2, sm: 4 },
                  fontSize: { xs: "0.85rem", sm: "1.5rem", md: "2rem" },
                }}
              >
                PAYMENT PLAN
              </Typography>

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  mb: { xs: 2, sm: 4 },
                  flexDirection: { xs: "column", sm: "row" },
                  gap: { xs: 1, sm: 2 },
                }}
              >
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" sx={{ mb: 0.5, fontSize: { xs: "0.55rem", sm: "0.875rem" } }}>
                    {quoteData?.leadEmail || "Email Address"}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 0.5, fontSize: { xs: "0.55rem", sm: "0.875rem" } }}>
                    {quoteData?.leadMobileNumber || "Mobile No"}
                  </Typography>
                </Box>

                <Box sx={{ textAlign: { xs: "left", sm: "right" }, mt: { xs: 0.5, sm: 0 } }}>
                  <Typography variant="body2" sx={{ mb: 1, fontSize: { xs: "0.55rem", sm: "0.875rem" } }}>
                    <strong>Quote No:</strong> {quoteData?.quoteNumber || "-"}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1, fontSize: { xs: "0.55rem", sm: "0.875rem" } }}>
                    <strong>Doc. No:</strong> {invoiceData.invoiceNo || invoiceNumber || "-"}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1, fontSize: { xs: "0.55rem", sm: "0.875rem" } }}>
                    <strong>Date:</strong> {invoiceData.createdOn ? format(new Date(invoiceData.createdOn), "dd-MMM-yyyy") : currentDate}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1, fontSize: { xs: "0.55rem", sm: "0.875rem" } }}>
                    <strong>Status:</strong> {getPaymentStatusLabel(invoiceData.status)}
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: { xs: "0.55rem", sm: "0.875rem" } }}>
                    <strong>Payment Plan:</strong> {getPaymentPlanTypeLabel(invoiceData.paymentPlanType)}
                  </Typography>
                </Box>
              </Box>

              {invoiceData.crmInvoiceLines && invoiceData.crmInvoiceLines.length > 0 && (
                <Box sx={{ mb: { xs: 2, sm: 3 } }}>
                  <Box
                    sx={{
                      backgroundColor: "#bdd2e7",
                      color: "black",
                      display: "flex",
                      padding: { xs: "4px 6px", sm: "12px 16px" },
                      borderRadius: "4px 4px 0 0",
                    }}
                  >
                    <Box sx={{ flex: 2, fontWeight: 600, fontSize: { xs: "0.5rem", sm: "0.875rem" } }}>Description</Box>
                    <Box sx={{ flex: 1, textAlign: "center", fontWeight: 600, fontSize: { xs: "0.5rem", sm: "0.875rem" } }}>Date</Box>
                    <Box sx={{ flex: 1, textAlign: "center", fontWeight: 600, fontSize: { xs: "0.5rem", sm: "0.875rem" } }}>Payment Type</Box>
                    <Box sx={{ flex: 1, textAlign: "center", fontWeight: 600, fontSize: { xs: "0.5rem", sm: "0.875rem" } }}>Status</Box>
                    <Box sx={{ flex: 1, textAlign: "right", fontWeight: 600, fontSize: { xs: "0.5rem", sm: "0.875rem" } }}>Amount</Box>
                  </Box>
                  {invoiceData.crmInvoiceLines.map((line, index) => (
                    <Box
                      key={line.id || index}
                      sx={{
                        display: "flex",
                        padding: { xs: "4px 6px", sm: "12px 16px" },
                        borderBottom: "1px solid #e0e0e0",
                        backgroundColor: index % 2 === 0 ? "white" : "#f9f9f9",
                      }}
                    >
                      <Box sx={{ flex: 2, fontSize: { xs: "0.5rem", sm: "0.875rem" } }}>{line.description || "-"}</Box>
                      <Box sx={{ flex: 1, textAlign: "center", fontSize: { xs: "0.5rem", sm: "0.875rem" } }}>
                        {line.paymentDate ? format(new Date(line.paymentDate), "dd-MMM-yyyy") : "-"}
                      </Box>
                      <Box sx={{ flex: 1, textAlign: "center", fontSize: { xs: "0.5rem", sm: "0.875rem" } }}>
                        {getPaymentTypeLabel(line.paymentType)}
                      </Box>
                      <Box sx={{ flex: 1, textAlign: "center", fontSize: { xs: "0.5rem", sm: "0.875rem" } }}>
                        {line.isPaid ? "Paid" : "Pending"}
                      </Box>
                      <Box sx={{ flex: 1, textAlign: "right", fontWeight: 500, fontSize: { xs: "0.5rem", sm: "0.875rem" } }}>
                        {formatCurrency(line.amount)}
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "flex-end",
                  mt: { xs: 2, sm: 3 },
                  mb: { xs: 2, sm: 4 },
                }}
              >
                <Box sx={{ textAlign: "right", minWidth: { xs: "150px", sm: "200px" } }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                    <Typography variant="body2" sx={{ mr: 2, fontSize: { xs: "0.55rem", sm: "0.875rem" } }}>
                      Subtotal:
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500, fontSize: { xs: "0.55rem", sm: "0.875rem" } }}>
                      {formatCurrency(invoiceData.amount)}
                    </Typography>
                  </Box>
                  {/* <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                    <Typography variant="body2" sx={{ mr: 2 }}>
                      Discount:
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {formatCurrency(invoiceData.discount || 0)}
                    </Typography>
                  </Box> */}
                  <Box
                    sx={{
                      borderTop: "2px solid #1976d2",
                      paddingTop: 1,
                      mt: 2,
                    }}
                  >
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: "bold",
                        fontSize: { xs: "0.65rem", sm: "1.25rem" },
                      }}
                    >
                      Total: {formatCurrency(invoiceData.amount)}
                    </Typography>
                  </Box>
                  {invoiceData.initialPayment > 0 && (
                    <Box sx={{ mt: 2, pt: 2, borderTop: "1px solid #e0e0e0" }}>
                      <Typography variant="body2" sx={{ mb: 0.5, fontSize: { xs: "0.55rem", sm: "0.875rem" } }}>
                        <strong>Initial Payment:</strong> {formatCurrency(invoiceData.initialPayment)}
                      </Typography>
                      <Typography variant="body2" sx={{ fontSize: { xs: "0.55rem", sm: "0.875rem" } }}>
                        <strong>Due Date:</strong> {invoiceData.initialPaymentDueDate ? format(new Date(invoiceData.initialPaymentDueDate), "dd-MMM-yyyy") : "-"}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            </Box>
          ) : (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                minHeight: "400px",
              }}
            >
              <Typography variant="body2" color="error">
                Failed to load invoice data
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

