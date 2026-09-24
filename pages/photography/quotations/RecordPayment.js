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
  { value: 4, label: "Cheque" },
];

export default function RecordPayment({ quotation, fetchItems }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState(3);
  const [remark, setRemark] = useState("");
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");

  const handleOpen = () => {
    setAmount("");
    setMethod(3);
    setRemark("");
    setFile(null);
    setFileName("");
    setOpen(true);
  };
  const handleClose = () => setOpen(false);

  const handleSubmit = async () => {
    if (amount === "" || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast.error("Enter a valid payment amount");
      return;
    }
    const token = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("QuotationId", quotation.id);
    formData.append("Amount", Number(amount));
    formData.append("PaymentMethod", Number(method));
    formData.append("IsAdvance", true);
    formData.append("Remark", remark || "");
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

  return (
    <>
      <Tooltip title="Record Advance Payment" placement="top">
        <IconButton size="small" onClick={handleOpen}>
          <PaymentsIcon color="warning" fontSize="inherit" />
        </IconButton>
      </Tooltip>
      <Modal open={open} onClose={handleClose}>
        <Box sx={style} className="bg-black">
          <Typography variant="h5" sx={{ fontWeight: "500", mb: "12px" }}>
            Record Advance Payment
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={1}>
            {quotation.quotationNo} · {quotation.customerName} · Net {formatCurrency(quotation.netTotal)}
          </Typography>

          <Grid container spacing={1}>
            <Grid item xs={12} md={6}>
              <Typography sx={{ fontWeight: "500", fontSize: "14px", mb: "5px" }}>Amount</Typography>
              <TextField fullWidth size="small" value={amount} onChange={(e) => setAmount(e.target.value)} />
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
