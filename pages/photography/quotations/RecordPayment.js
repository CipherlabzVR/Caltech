import React, { useState } from "react";
import {
  Grid,
  Typography,
  MenuItem,
  TextField,
  Button,
  Box,
  Modal,
  IconButton,
  Tooltip,
  styled,
} from "@mui/material";
import PaymentsIcon from "@mui/icons-material/Payments";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import BASE_URL from "Base/api";
import { formatCurrency } from "@/components/utils/formatHelper";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { lg: 460, xs: 350 },
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 2,
  maxHeight: "90vh",
  overflowY: "auto",
};

const VisuallyHiddenInput = styled("input")({
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  height: 1,
  overflow: "hidden",
  position: "absolute",
  bottom: 0,
  left: 0,
  whiteSpace: "nowrap",
  width: 1,
});

const PAYMENT_METHODS = [
  { value: 1, label: "Cash" },
  { value: 2, label: "Card" },
  { value: 3, label: "Bank Transfer" },
];

const PAYMENT_TYPES = [
  { value: "advance", label: "Advance (first payment)" },
  { value: "installment", label: "Installment / second payment" },
  { value: "final", label: "Final payment" },
];

function remainingOf(quotation, paidApproved, pendingAmount) {
  const net = Number(quotation?.netTotal) || 0;
  return Math.max(0, Number((net - Number(paidApproved || 0) - Number(pendingAmount || 0)).toFixed(2)));
}

export default function RecordPayment({
  quotation,
  fetchItems,
  canRecordPayment = true,
  paidApproved = 0,
  pendingAmount = 0,
  variant = "icon",
}) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState(3);
  const [paymentType, setPaymentType] = useState("advance");
  const [remark, setRemark] = useState("");
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");

  if (!canRecordPayment) return null;

  const remaining = remainingOf(quotation, paidApproved, pendingAmount);
  const hasPrior = Number(paidApproved) > 0;

  const handleOpen = () => {
    if (remaining <= 0) {
      toast.info("This quotation is fully paid (or already has pending payments covering the balance).");
      return;
    }
    const nextType = hasPrior ? (remaining > 0 ? "installment" : "final") : "advance";
    setPaymentType(nextType);
    setAmount(nextType === "final" ? String(remaining) : "");
    setMethod(3);
    setRemark("");
    setFile(null);
    setFileName("");
    setOpen(true);
  };
  const handleClose = () => setOpen(false);

  const applyType = (type) => {
    setPaymentType(type);
    if (type === "final") setAmount(String(remaining));
  };

  const handleSubmit = async () => {
    const paymentAmount = Number(amount);
    if (amount === "" || isNaN(paymentAmount) || paymentAmount <= 0) {
      toast.error("Enter a valid payment amount");
      return;
    }
    if (paymentAmount > remaining + 0.001) {
      toast.error(`Payment cannot exceed the remaining balance of ${formatCurrency(remaining)}`);
      return;
    }
    const token = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("QuotationId", quotation.id);
    formData.append("Amount", paymentAmount);
    formData.append("PaymentMethod", Number(method));
    formData.append("IsAdvance", paymentType === "advance");
    formData.append(
      "Remark",
      [paymentType === "final" ? "Final payment" : paymentType === "installment" ? "Installment" : "Advance", remark]
        .filter(Boolean)
        .join(" — ")
    );
    if (file) formData.append("PaySlipFile", file);

    try {
      const res = await fetch(`${BASE_URL}/PhotographyPayment/CreatePayment`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      const sc = data.statusCode ?? data.StatusCode;
      if (sc === 200 || sc === "SUCCESS") {
        toast.success(data.message || "Payment recorded for approval");
        handleClose();
        fetchItems?.();
      } else {
        toast.error(data.message || "Failed to record payment");
      }
    } catch (e) {
      toast.error(e.message || "Failed to record payment");
    }
  };

  const title =
    paymentType === "final"
      ? "Record Final Payment"
      : paymentType === "installment"
        ? "Record Installment"
        : "Record Advance Payment";

  return (
    <>
      {variant === "button" ? (
        <Button
          size="small"
          variant="contained"
          startIcon={<PaymentsIcon />}
          onClick={handleOpen}
          disabled={remaining <= 0}
          sx={{ textTransform: "none", fontSize: 12 }}
        >
          {hasPrior ? "Add payment" : "Record payment"}
        </Button>
      ) : (
        <Tooltip title={hasPrior ? "Record another payment" : "Record Advance Payment"} placement="top">
          <span>
            <IconButton size="small" onClick={handleOpen} disabled={remaining <= 0}>
              <PaymentsIcon color={remaining <= 0 ? "disabled" : "warning"} fontSize="inherit" />
            </IconButton>
          </span>
        </Tooltip>
      )}
      <Modal open={open} onClose={handleClose}>
        <Box sx={style} className="bg-black">
          <Typography variant="h5" sx={{ fontWeight: "500", mb: "12px" }}>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={1}>
            {quotation.quotationNo} · {quotation.customerName}
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={1.5}>
            Net {formatCurrency(quotation.netTotal)} · Paid {formatCurrency(paidApproved)} · Remaining {formatCurrency(remaining)}
          </Typography>

          <Grid container spacing={1}>
            <Grid item xs={12}>
              <Typography sx={{ fontWeight: "500", fontSize: "14px", mb: "5px" }}>Payment type</Typography>
              <TextField select fullWidth size="small" value={paymentType} onChange={(e) => applyType(e.target.value)}>
                {PAYMENT_TYPES.filter((t) => (hasPrior ? t.value !== "advance" : true)).map((t) => (
                  <MenuItem key={t.value} value={t.value}>
                    {t.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography sx={{ fontWeight: "500", fontSize: "14px", mb: "5px" }}>Amount</Typography>
              <TextField
                fullWidth
                size="small"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                inputProps={{ min: 0, max: remaining, step: "0.01" }}
                helperText={`Max ${formatCurrency(remaining)}`}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography sx={{ fontWeight: "500", fontSize: "14px", mb: "5px" }}>Payment Method</Typography>
              <TextField select fullWidth size="small" value={method} onChange={(e) => setMethod(e.target.value)}>
                {PAYMENT_METHODS.map((m) => (
                  <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <Typography sx={{ fontWeight: "500", fontSize: "14px", mb: "5px" }}>Remark</Typography>
              <TextField fullWidth size="small" multiline minRows={2} value={remark} onChange={(e) => setRemark(e.target.value)} />
            </Grid>
            <Grid item xs={12}>
              <Button component="label" variant="contained" startIcon={<CloudUploadIcon />} size="small">
                Upload Pay Slip
                <VisuallyHiddenInput
                  type="file"
                  onChange={(e) => {
                    setFile(e.target.files[0]);
                    setFileName(e.target.files[0]?.name || "");
                  }}
                />
              </Button>
              {fileName && (
                <Typography variant="body2" mt={1}>
                  Selected: <strong>{fileName}</strong>
                </Typography>
              )}
            </Grid>
          </Grid>

          <Box display="flex" mt={2} justifyContent="space-between">
            <Button variant="contained" color="error" onClick={handleClose} size="small">
              Cancel
            </Button>
            <Button variant="contained" onClick={handleSubmit} size="small">
              Submit for Approval
            </Button>
          </Box>
        </Box>
      </Modal>
    </>
  );
}
