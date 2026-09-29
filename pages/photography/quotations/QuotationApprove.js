import React, { useState } from "react";
import {
  Box,
  Button,
  Modal,
  Typography,
  Divider,
  Grid,
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
  width: { lg: 480, xs: 360 },
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 3,
  borderRadius: 1,
};

const isPendingApproval = (status) =>
  String(status || "").replace(/[\s_-]/g, "").toLowerCase() === "pendingapproval";

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

/**
 * QuotationApprove — Level 1 approval action.
 *
 * Gating rule (must hold BOTH):
 *   - item.statusName === "PendingApproval"
 *   - user has `approve1` permission (passed in as `canApprove`)
 *
 * The parent (list page) should already check this before rendering the
 * component at all. The internal check below is a defensive second layer
 * so this component never renders its button even if some future caller
 * forgets to gate it upstream.
 */
export default function QuotationApprove({ item, fetchItems, canApprove }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Defensive guard — status + permission must both be true.
  if (!item || !isPendingApproval(item.statusName) || !canApprove) {
    return null;
  }

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    if (!saving) setOpen(false);
  };

  const handleApprove = async () => {
    const token = localStorage.getItem("token");
    setSaving(true);
    try {
      const res = await fetch(`${BASE_URL}/PhotographyQuotation/ApproveQuotation?id=${item.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const sc = data.statusCode ?? data.StatusCode;
      if (sc === 200 || sc === "SUCCESS") {
        toast.success(data.message || "Quotation approved");
        setOpen(false);
        fetchItems?.();
      } else {
        toast.error(data.message || "Failed to approve quotation");
      }
    } catch (e) {
      toast.error(e.message || "Failed to approve quotation");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Button
        size="small"
        variant="contained"
        color="success"
        startIcon={<CheckCircleIcon />}
        onClick={handleOpen}
      >
        Approve
      </Button>
      <Modal open={open} onClose={handleClose}>
        <Box sx={style} className="bg-black">
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
            Approve this quotation?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            Once approved, this quotation can be sent to the customer.
          </Typography>
          <Divider sx={{ mb: 1 }} />
          <Row label="Quotation No" value={item.quotationNo} />
          <Row label="Customer" value={item.customerName} />
          <Row label="Mobile" value={item.customerMobileNo} />
          <Row label="Event Type" value={item.eventTypeName} />
          <Row label="Event Date" value={formatDate(item.eventDate)} />
          <Row label="Net Total" value={formatCurrency(item.netTotal)} />
          <Box display="flex" justifyContent="flex-end" gap={2} mt={3}>
            <Button variant="outlined" onClick={handleClose} disabled={saving}>
              Cancel
            </Button>
            <Button variant="contained" color="success" onClick={handleApprove} disabled={saving}>
              {saving ? "Approving…" : "Approve"}
            </Button>
          </Box>
        </Box>
      </Modal>
    </>
  );
}