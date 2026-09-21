import React, { useState } from "react";
import {
  Box,
  Button,
  Modal,
  Typography,
  IconButton,
  Tooltip,
  Grid,
  Divider,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import BASE_URL from "Base/api";
import { formatCurrency, formatDate } from "@/components/utils/formatHelper";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { lg: 520, xs: 360 },
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 3,
  borderRadius: 1,
  maxHeight: "90vh",
  overflowY: "auto",
};

const Row = ({ label, value }) => (
  <Grid container sx={{ py: 0.4 }}>
    <Grid item xs={5}>
      <Typography variant="body2" color="text.secondary">{label}</Typography>
    </Grid>
    <Grid item xs={7}>
      <Typography variant="body2">{value || "-"}</Typography>
    </Grid>
  </Grid>
);

export default function ApprovePayment({ item, fetchItems }) {
  const [open, setOpen] = useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleApprove = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${BASE_URL}/PhotographyPayment/ApprovePayment?id=${item.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const sc = data.statusCode ?? data.StatusCode;
      if (sc === 200 || sc === "SUCCESS") {
        toast.success(data.message || "Payment approved");
        handleClose();
        fetchItems?.();
      } else {
        toast.error(data.message || "Failed to approve payment");
      }
    } catch (e) {
      toast.error(e.message || "Failed to approve payment");
    }
  };

  return (
    <>
      <Tooltip title="Review & Approve" placement="top">
        <IconButton size="small" onClick={handleOpen}>
          <CheckCircleIcon color="success" fontSize="inherit" />
        </IconButton>
      </Tooltip>
      <Modal open={open} onClose={handleClose}>
        <Box sx={style} className="bg-black">
          <Typography variant="h6" sx={{ fontWeight: "600", mb: "8px" }}>
            Confirm the details before approving
          </Typography>
          <Divider sx={{ mb: 1 }} />

          <Typography sx={{ fontWeight: 600, mt: 1 }}>Payment</Typography>
          <Row label="Payment No" value={item.paymentNo} />
          <Row label="Amount" value={formatCurrency(item.amount)} />
          <Row label="Method" value={item.paymentMethodName} />
          <Row label="Advance" value={item.isAdvance ? "Yes" : "No"} />
          <Row
            label="Pay Slip"
            value={item.paySlipUrl ? <a href={item.paySlipUrl} target="_blank" rel="noreferrer">View slip</a> : "-"}
          />

          <Typography sx={{ fontWeight: 600, mt: 1.5 }}>Quotation</Typography>
          <Row label="Quotation No" value={item.quotationNo} />
          <Row label="Customer" value={item.customerName} />
          <Row label="Mobile" value={item.customerMobileNo} />
          <Row label="Event Type" value={item.eventTypeName} />
          <Row label="Event Date" value={formatDate(item.eventDate)} />
          <Row label="Venue" value={item.venue} />
          <Row label="No. of Guests" value={item.noOfGuests} />
          <Row label="Makeup Artist" value={item.makeupArtist} />
          <Row label="Quotation Net Total" value={formatCurrency(item.quotationNetTotal)} />

          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1.5 }}>
            Approving the advance payment will create the booking (reservation) in the system.
          </Typography>

          <Box display="flex" justifyContent="flex-end" gap={2} mt={2}>
            <Button variant="outlined" onClick={handleClose}>
              Cancel
            </Button>
            <Button variant="contained" color="success" onClick={handleApprove}>
              Approve & Create Booking
            </Button>
          </Box>
        </Box>
      </Modal>
    </>
  );
}
