import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import { ProjectNo } from "Base/catelogue";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import DialogContentText from "@mui/material/DialogContentText";
import TextField from "@mui/material/TextField";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import { format, differenceInDays } from "date-fns";
import BASE_URL from "Base/api";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { formatCurrency, formatDate } from "@/components/utils/formatHelper";
import useLoggedUserCompanyLetterhead from "@/hooks/useLoggedUserCompanyLetterhead";

export default function CustomerQuote() {
  const router = useRouter();
  const quoteId = router.query.id;
  const quoteNumber = router.query.documentNumber;
  const [signatureDialogOpen, setSignatureDialogOpen] = useState(false);
  const [signature, setSignature] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectLoading, setRejectLoading] = useState(false);
  const [approveLoading, setApproveLoading] = useState(false);
  const [quoteData, setQuoteData] = useState(null);
  const [loadingQuote, setLoadingQuote] = useState(true);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const { letterheadImage } = useLoggedUserCompanyLetterhead();


  useEffect(() => {
    const fetchQuoteData = async () => {
      if (!quoteId) return;

      try {
        setLoadingQuote(true);
        const response = await fetch(`${BASE_URL}/CRMQuotes/ReadCRMQuote?id=${quoteId}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });

        const data = await response.json().catch(() => null);

        if (response.ok && data?.statusCode === 200) {
          setQuoteData(data.result);
        } else {
          console.error("Failed to fetch quote data");
        }
      } catch (error) {
        console.error("Error fetching quote data:", error);
      } finally {
        setLoadingQuote(false);
      }
    };

    fetchQuoteData();
  }, [quoteId]);

  const currentDate = format(new Date(), "yyyy-MM-dd");

  useEffect(() => {
    if (signatureDialogOpen && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    }
  }, [signatureDialogOpen]);

  const startDrawing = (e) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(
      e.clientX - rect.left,
      e.clientY - rect.top
    );
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext("2d");
    ctx.lineTo(
      e.clientX - rect.left,
      e.clientY - rect.top
    );
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignature(null);
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const signatureData = canvas.toDataURL("image/png");
      setSignature(signatureData);
      setSignatureDialogOpen(false);
    }
  };

  const hasSignature = () => {
    if (!canvasRef.current) return false;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    return imageData.data.some((channel, index) => index % 4 === 3 && channel > 0);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = canvasRef.current;
          const ctx = canvas.getContext("2d");
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          const scale = Math.min(
            canvas.width / img.width,
            canvas.height / img.height
          );
          const x = (canvas.width - img.width * scale) / 2;
          const y = (canvas.height - img.height * scale) / 2;
          ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
          setSignature(canvas.toDataURL("image/png"));
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleApprove = () => {
    if (!signature) {
      toast.warning("Please add your signature before approving.");
      setSignatureDialogOpen(true);
      return;
    }
    setConfirmDialogOpen(true);
  };

  const handleConfirmApprove = () => {
    setConfirmDialogOpen(false);
    submitApproval();
  };

  const submitApproval = async () => {
    try {
      setApproveLoading(true);
      const blob = await fetch(signature).then((res) => res.blob());

      const formData = new FormData();
      formData.append("Id", quoteId);
      formData.append("SignatureImage", blob, "signature.png");

      const response = await fetch(`${BASE_URL}/CRMQuotes/ApproveCRMQuote`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json().catch(() => null);

      if (response.ok && data?.statusCode === 200) {
        toast.success(data?.message || "Quote approved successfully!");
        setSignature(null);
        // Reload page to get updated quote data
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        toast.error(data?.message || "Failed to approve quote. Please try again.");
      }
    } catch (error) {
      console.error("Error approving quote:", error);
      toast.error("An error occurred while approving the quote.");
    } finally {
      setApproveLoading(false);
    }
  };

  const handleSignatureDialogClose = () => {
    setSignatureDialogOpen(false);
  };

  const handleReject = () => {
    setRejectDialogOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error("Please enter a rejection reason.");
      return;
    }

    if (rejectionReason.length > 2000) {
      toast.error("Rejection reason cannot exceed 2000 characters.");
      return;
    }

    setRejectLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/CRMQuotes/RejectCRMQuote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          Id: parseInt(quoteId),
          Reason: rejectionReason.trim(),
        }),
      });

      const data = await response.json().catch(() => null);

      if (response.ok && data?.statusCode === 200) {
        toast.success(data?.message || "Quote rejected successfully.");
        setRejectDialogOpen(false);
        setRejectionReason("");
        // Reload page to get updated quote data
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        toast.error(data?.message || "Failed to reject quote. Please try again.");
      }
    } catch (error) {
      console.error("Error rejecting quote:", error);
      toast.error("An error occurred while rejecting the quote.");
    } finally {
      setRejectLoading(false);
    }
  };

  const handleRejectDialogClose = () => {
    if (!rejectLoading) {
      setRejectDialogOpen(false);
      setRejectionReason("");
    }
  };

  // Check if quote was updated within 3 days
  const isUpdatedWithin3Days = () => {
    if (!quoteData?.updatedOn) return false;
    try {
      const updatedDate = new Date(quoteData.updatedOn);
      const today = new Date();
      const daysDifference = differenceInDays(today, updatedDate);
      return daysDifference <= 3;
    } catch (error) {
      console.error("Error calculating date difference:", error);
      return false;
    }
  };

  // Check if disclaimer should be shown
  const shouldShowDisclaimer = () => {
    const isApprovedOrRejected = quoteData?.status === 2 || quoteData?.status === 3;
    return isApprovedOrRejected && isUpdatedWithin3Days();
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
          }}
        >
          <Box>
            <img
              src={ProjectNo === 1 ? "/images/cbass-2.png" : "/images/DBlogo.png"}
              alt="Logo"
              style={{ maxWidth: "180px", height: "auto" }}
            />
          </Box>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
            }}
          >
            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5 }}>
              Date
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 600, fontSize: "1rem" }}>
              {currentDate}
            </Typography>
          </Box>
        </Box>

        <Box
          sx={{
            marginBottom: 1,
            padding: 3,
            backgroundColor: "#fafafa",
            borderRadius: 2,
            borderLeft: "4px solid #1976d2",
          }}
        >
          <Typography
            variant="body1"
            sx={{
              fontSize: "1rem",
              lineHeight: 1.8,
              color: "#424242",
            }}
          >
            We are pleased to present this detailed quotation for your consideration. This document outlines
            the comprehensive pricing, specifications, and terms for the products and services requested.
            Please review the details carefully, including item descriptions, quantities, unit prices, and
            applicable discounts. The quotation is valid until the date specified and reflects our commitment
            to providing you with competitive pricing and exceptional value. Should you have any questions
            or require clarification on any aspect of this quotation, please do not hesitate to contact us.
            We look forward to the opportunity to serve you and are ready to proceed upon your approval.
          </Typography>
        </Box>

        <Box
          sx={{
            width: "210mm",
            minHeight: { xs: "auto", sm: "297mm" },
            maxWidth: "100%",
            margin: "0 auto",
            marginBottom: 4,
            position: "relative",
            backgroundColor: "white",
            backgroundImage: letterheadImage 
              ? { xs: "none", sm: `url('${letterheadImage}')` }
              : { xs: "none", sm: "url('/images/quotation/cbassletter.jpg')" },
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            paddingTop: { xs: "10mm", sm: "60mm", md: "70mm" },
            paddingX: { xs: "5mm", sm: "5mm", md: "30mm" },
            paddingBottom: { xs: "10mm", sm: "25mm", md: "30mm" },
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            "@media print": {
              width: "210mm",
              minHeight: "297mm",
              margin: 0,
              paddingTop: "60mm",
              paddingX: "25mm",
              paddingBottom: "25mm",
              boxShadow: "none",
              pageBreakAfter: "always",
            },
          }}
        >
          {loadingQuote ? (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                minHeight: "400px",
              }}
            >
              <Typography variant="body2" color="text.secondary">
                Loading quote...
              </Typography>
            </Box>
          ) : quoteData ? (
            <Box sx={{ position: "relative", zIndex: 1 }}>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: "bold",
                  textAlign: "center",
                  mb: 4,
                  fontSize: { xs: "0.85rem", sm: "1.5rem", md: "2rem" },
                }}
              >
                QUOTATION
              </Typography>

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  mb: 4,
                  flexDirection: { xs: "column", sm: "row" },
                  gap: 2,
                }}
              >
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, fontSize: { xs: "0.65rem", sm: "1.25rem" } }}>
                    {quoteData?.companyName || "Company Name"}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 0.5, fontSize: { xs: "0.55rem", sm: "0.875rem" } }}>
                    {quoteData?.leadEmail || "Email Address"}
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: { xs: "0.55rem", sm: "0.875rem" } }}>
                    {quoteData?.leadMobileNumber || "Mobile No"}
                  </Typography>
                </Box>

                <Box sx={{ textAlign: { xs: "left", sm: "right" } }}>
                  <Typography variant="body2" sx={{ mb: 1, fontSize: { xs: "0.55rem", sm: "0.875rem" } }}>
                    <strong>Quotation No:</strong> {quoteData.quoteNumber || quoteNumber || "-"}
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: { xs: "0.55rem", sm: "0.875rem" } }}>
                    <strong>Date:</strong> {quoteData.createdOn ? format(new Date(quoteData.createdOn), "dd-MMM-yyyy") : currentDate}
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: { xs: "0.55rem", sm: "0.875rem" } }}>
                    <strong>Valid Until:</strong> {formatDate(quoteData.validUntil)}
                  </Typography>
                </Box>
              </Box>

              <Box>
                <Typography variant="body2" sx={{ mb: 1, fontSize: { xs: "0.55rem", sm: "0.875rem" } }}>
                  {quoteData.description || ""}
                </Typography>
              </Box>

              {quoteData.lineItems && quoteData.lineItems.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Box
                    sx={{
                      backgroundColor: "#bdd2e7",
                      color: "black",
                      display: "flex",
                      padding: "12px 16px",
                      borderRadius: "4px 4px 0 0",
                    }}
                  >
                    <Box sx={{ flex: 2, fontWeight: 600, fontSize: { xs: "0.55rem", sm: "0.875rem" } }}>Description</Box>
                    <Box sx={{ flex: 1, textAlign: "right", fontWeight: 600, fontSize: { xs: "0.55rem", sm: "0.875rem" } }}>Price</Box>
                    <Box sx={{ flex: 1, textAlign: "right", fontWeight: 600, fontSize: { xs: "0.55rem", sm: "0.875rem" } }}>Discount</Box>
                    <Box sx={{ flex: 1, textAlign: "right", fontWeight: 600, fontSize: { xs: "0.55rem", sm: "0.875rem" } }}>Total</Box>
                  </Box>
                  {quoteData.lineItems.map((item, index) => {
                    const price = parseFloat(item.price || 0);
                    const discount = parseFloat(item.discount || 0);
                    const total = price - discount;
                    return (
                      <Box
                        key={index}
                        sx={{
                          display: "flex",
                          padding: "12px 16px",
                          borderBottom: "1px solid #e0e0e0",
                          backgroundColor: index % 2 === 0 ? "white" : "#f9f9f9",
                        }}
                      >
                        <Box sx={{ flex: 2, fontSize: { xs: "0.55rem", sm: "0.875rem" } }}>{item.description || "-"}</Box>
                        <Box sx={{ flex: 1, textAlign: "right" }}>
                          <Box display="flex" gap={1} justifyContent="end">
                            <Box sx={{ fontSize: { xs: "0.55rem", sm: "0.875rem" } }}>
                            {item.qty > 1 ? `${item.qty}x` : ""}
                          </Box>
                          <Box sx={{ fontSize: { xs: "0.55rem", sm: "0.875rem" } }}>
                            {formatCurrency(item.price)}
                          </Box>
                          </Box>
                        </Box>
                        <Box sx={{ flex: 1, textAlign: "right", fontSize: { xs: "0.55rem", sm: "0.875rem" } }}>
                          {formatCurrency(item.discount)}
                        </Box>
                        <Box sx={{ flex: 1, textAlign: "right", fontWeight: 500, fontSize: { xs: "0.55rem", sm: "0.875rem" } }}>
                          {formatCurrency(item.lineTotal)}
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              )}

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "flex-end",
                  mt: 3,
                  mb: 4,
                }}
              >
                <Box sx={{ textAlign: "right", minWidth: "200px" }}>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: "bold",
                      fontSize: { xs: "0.65rem", sm: "1.25rem" },
                    }}
                  >
                    Total: {(quoteData.total || 0).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </Typography>
                </Box>
              </Box>

              <Box
                sx={{
                  mt: { xs: 8, sm: 10, md: 12 },
                  mb: 2,
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <Box sx={{ flex: 1 }}>
                    {(quoteData?.salesPersonSignature) && (
                      <Box
                        sx={{
                          maxWidth: { xs: "80px", sm: "150px" },
                          maxHeight: { xs: "30px", sm: "50px" },
                          display: "inline-block",
                        }}
                      >
                        <img
                          src={quoteData?.salesPersonSignature}
                          alt="Signature"
                          style={{
                            maxWidth: "100%",
                            width: "auto",
                            height: "auto",
                            objectFit: "contain",
                          }}
                        />
                      </Box>
                    )}
                  </Box>
                  <Box sx={{ flex: 1, display: "flex", justifyContent: "flex-end" }}>
                    {(quoteData?.signatureImage) && (
                      <Box
                        sx={{
                          maxWidth: { xs: "80px", sm: "150px" },
                          maxHeight: { xs: "30px", sm: "50px" },
                          display: "inline-block",
                        }}
                      >
                        <img
                          src={quoteData?.signatureImage}
                          alt="Signature"
                          style={{
                            maxWidth: "100%",
                            width: "auto",
                            height: "auto",
                            objectFit: "contain",
                          }}
                        />
                      </Box>
                    )}
                  </Box>
                </Box>

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 1,
                  }}
                >
                  <Box sx={{ width: { xs: "80px", sm: "150px" }, borderTop: "1px dotted #000", pt: 1 }} />
                  <Box sx={{ width: { xs: "80px", sm: "150px" }, borderTop: "1px dotted #000", pt: 1 }} />
                </Box>

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: { xs: "0.55rem", sm: "0.875rem" } }}>
                    Sales Person
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: { xs: "0.55rem", sm: "0.875rem" } }}>
                    Approved By
                  </Typography>
                </Box>

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <Typography variant="body2" sx={{ fontSize: { xs: "0.55rem", sm: "0.875rem" } }}>
                    {quoteData?.salesPersonName || "Person Name"}
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: { xs: "0.55rem", sm: "0.875rem" } }}>
                    {quoteData?.companyName || "CompanyName"}
                  </Typography>
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
                Failed to load quote data
              </Typography>
            </Box>
          )}
        </Box>
        <Box display="flex" justifyContent="center">
          {(signature || quoteData?.signatureImage) && (
            <Box
              sx={{
                border: "1px solid #e0e0e0",
                borderRadius: 1,
                padding: 1,
                backgroundColor: "#fafafa",
                mb: 1,
                width: 300
              }}
            >
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                {quoteData?.status === 2 ? "Approved Signature:" : "Signature Preview:"}
              </Typography>
              <img
                src={quoteData?.signatureImage || signature}
                alt="Signature"
                style={{ maxWidth: "200px", maxHeight: "60px", objectFit: "contain" }}
              />
            </Box>
          )}
        </Box>

        {quoteData?.status === 3 && quoteData?.rejectionReason && (
          <Box
            sx={{
              marginBottom: 2,
              padding: 2,
              backgroundColor: "#ffebee",
              borderRadius: 2,
              borderLeft: "4px solid #d32f2f",
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: "#d32f2f" }}>
              Rejection Reason:
            </Typography>
            <Typography variant="body2" sx={{ color: "#424242" }}>
              {quoteData.rejectionReason}
            </Typography>
          </Box>
        )}

        {shouldShowDisclaimer() && (
          <Box
            sx={{
              marginBottom: 2,
              padding: 2,
              backgroundColor: "#fff3cd",
              borderRadius: 2,
              borderLeft: "4px solid #ffc107",
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: "#856404" }}>
              Disclaimer:
            </Typography>
            <Typography variant="body2" sx={{ color: "#856404" }}>
              If you need to change anything in this quote, please contact your sales person.
            </Typography>
          </Box>
        )}

        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            gap: 3,
            marginTop: 2,
            paddingTop: 3,
            paddingBottom: 3,
            borderTop: "1px solid #e0e0e0",
          }}
        >
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
            <Button
              variant="contained"
              color="success"
              size="large"
              onClick={handleApprove}
              disabled={quoteData?.status !== 1 || approveLoading}
              sx={{
                minWidth: { xs: 120, sm: 150 },
                paddingX: 4,
                paddingY: 1.5,
                height: 50,
                fontSize: "1rem",
                fontWeight: 600,
                textTransform: "none",
                borderRadius: 2,
                boxShadow: quoteData?.status !== 1 || approveLoading ? "none" : "0 2px 8px rgba(76, 175, 80, 0.3)",
                "&:hover": {
                  boxShadow: quoteData?.status !== 1 || approveLoading ? "none" : "0 4px 12px rgba(76, 175, 80, 0.4)",
                },
              }}
            >
              {approveLoading
                ? "Approving..."
                : quoteData?.status === 2
                  ? "Approved"
                  : quoteData?.status === 5
                    ? "Expired"
                    : signature
                      ? "Approve"
                      : "Sign & Approve"}
            </Button>
            {signature && quoteData?.status === 1 && (
              <Button
                variant="text"
                size="small"
                onClick={() => setSignatureDialogOpen(true)}
                sx={{ textTransform: "none" }}
              >
                Re-sign
              </Button>
            )}
          </Box>
          <Button
            variant="contained"
            color="error"
            size="large"
            onClick={handleReject}
            disabled={quoteData?.status !== 1 || rejectLoading}
            sx={{
              minWidth: { xs: 120, sm: 150 },
              paddingX: 4,
              paddingY: 1.5,
              height: 50,
              fontSize: "1rem",
              fontWeight: 600,
              textTransform: "none",
              borderRadius: 2,
              boxShadow: quoteData?.status !== 1 || rejectLoading ? "none" : "0 2px 8px rgba(211, 47, 47, 0.3)",
              "&:hover": {
                boxShadow: quoteData?.status !== 1 || rejectLoading ? "none" : "0 4px 12px rgba(211, 47, 47, 0.4)",
              },
            }}
          >
            {rejectLoading
              ? "Rejecting..."
              : quoteData?.status === 3
                ? "Rejected"
                : quoteData?.status === 5
                  ? "Expired"
                  : "Reject"}
          </Button>
        </Box>
      </Box>

      <Dialog
        open={signatureDialogOpen}
        onClose={handleSignatureDialogClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
          },
        }}
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" fontWeight={600}>
              Add Your Signature
            </Typography>
            <IconButton onClick={handleSignatureDialogClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Box
              sx={{
                border: "2px solid #e0e0e0",
                borderRadius: 2,
                backgroundColor: "#fff",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <canvas
                ref={canvasRef}
                width={600}
                height={200}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={(e) => {
                  e.preventDefault();
                  const touch = e.touches[0];
                  const mouseEvent = new MouseEvent("mousedown", {
                    clientX: touch.clientX,
                    clientY: touch.clientY,
                  });
                  startDrawing(mouseEvent);
                }}
                onTouchMove={(e) => {
                  e.preventDefault();
                  const touch = e.touches[0];
                  const mouseEvent = new MouseEvent("mousemove", {
                    clientX: touch.clientX,
                    clientY: touch.clientY,
                  });
                  draw(mouseEvent);
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  stopDrawing();
                }}
                style={{
                  width: "100%",
                  height: "200px",
                  cursor: "crosshair",
                  display: "block",
                }}
              />
            </Box>
            <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
              <Button
                variant="outlined"
                onClick={clearSignature}
                size="small"
              >
                Clear
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                style={{ display: "none" }}
              />
              <Button
                variant="outlined"
                onClick={() => fileInputRef.current?.click()}
                size="small"
              >
                Upload Image
              </Button>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }} >
          <Box sx={{ width: '100%' }} display="flex" justifyContent="space-between">
            <Button onClick={handleSignatureDialogClose} variant="outlined">
              Cancel
            </Button>
            <Button
              onClick={saveSignature}
              variant="contained"
              color="primary"
              disabled={!hasSignature() || approveLoading}
            >
              Save Signature
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      <Dialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
          },
        }}
      >
        <DialogTitle>
          <Typography variant="h6" fontWeight={600}>
            Confirm Approval
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to approve this quotation? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Box sx={{ width: "100%" }} display="flex" justifyContent="space-between">
            <Button
              onClick={() => setConfirmDialogOpen(false)}
              variant="outlined"
              disabled={approveLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmApprove}
              variant="contained"
              color="success"
              disabled={approveLoading}
            >
              {approveLoading ? "Approving..." : "Confirm Approval"}
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      <Dialog
        open={rejectDialogOpen}
        onClose={handleRejectDialogClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
          },
        }}
      >
        <DialogTitle>
          <Typography variant="h6" fontWeight={600}>
            Reject Quotation
          </Typography>
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Please provide a reason for rejecting this quotation.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Rejection Reason"
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            required
            error={rejectionReason.length > 2000}
            helperText={
              rejectionReason.length > 2000
                ? "Rejection reason cannot exceed 2000 characters."
                : `${rejectionReason.length}/2000 characters`
            }
            disabled={rejectLoading}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Box sx={{ width: "100%" }} display="flex" justifyContent="space-between">
            <Button
              onClick={handleRejectDialogClose}
              variant="outlined"
              disabled={rejectLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmReject}
              variant="contained"
              color="error"
              disabled={!rejectionReason.trim() || rejectionReason.length > 2000 || rejectLoading}
            >
              {rejectLoading ? "Rejecting..." : "Reject"}
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

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
  );
}
