import React, { useState } from "react";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Modal,
  Tooltip,
  Typography,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { toast } from "react-toastify";
import BASE_URL from "Base/api";

const modalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { lg: 720, xs: 350 },
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 0,
  borderRadius: "14px",
  maxHeight: "90vh",
  overflowY: "auto",
};

const disposalMethodLabel = (value) => {
  const map = {
    1: "Sale",
    2: "Write Off",
    3: "Donation",
    4: "Trade In",
    5: "Retirement",
  };
  return map[value] || "Unknown";
};

const Detail = ({ label, value }) => (
  <Grid item xs={12} md={6}>
    <Box sx={{ border: "1px solid #eef0f4", borderRadius: 2, p: 1.5, height: "100%", bgcolor: "#fafafa" }}>
      <Typography variant="caption" color="textSecondary">{label}</Typography>
      <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>{value || "—"}</Typography>
    </Box>
  </Grid>
);

const apiOk = (response, data) =>
  response.ok && (data.statusCode === 200 || data.isSuccess || data.status === "SUCCESS");

export default function ViewAssetDisposal({ item, fetchItems, canUpdate = false }) {
  const [open, setOpen] = useState(false);
  const [confirmApprove, setConfirmApprove] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const approved = Boolean(item.approvedOn);

  const approveDisposal = async () => {
    setSubmitting(true);
    try {
      const response = await fetch(`${BASE_URL}/assets/disposals/${item.id}/approve`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      if (apiOk(response, data)) {
        toast.success(data.message || "Asset disposal approved");
        setConfirmApprove(false);
        setOpen(false);
        if (typeof fetchItems === "function") fetchItems();
      } else {
        toast.error(data.message || "Approve failed");
      }
    } catch (error) {
      console.error("Asset disposal approve error:", error);
      toast.error(error.message || "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Tooltip title="View">
        <IconButton size="small" onClick={() => setOpen(true)}>
          <VisibilityIcon color="info" fontSize="inherit" />
        </IconButton>
      </Tooltip>
      <Modal open={open} onClose={() => setOpen(false)}>
        <Box sx={modalStyle}>
          <Box sx={{ p: 3, bgcolor: "#f7f9fc", borderBottom: "1px solid #e8edf3" }}>
            <Box display="flex" justifyContent="space-between" alignItems="flex-start" gap={2}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Asset Disposal Details
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {item.disposalNumber || `Disposal #${item.id}`}
                </Typography>
              </Box>
              <Chip size="small" label={approved ? "Approved" : "Pending"} color={approved ? "success" : "warning"} />
            </Box>
          </Box>
          <Box sx={{ p: 3 }}>
          <Grid container spacing={2}>
            <Detail label="Disposal No" value={item.disposalNumber} />
            <Detail label="Asset" value={`${item.asset?.assetCode || `#${item.assetId}`} - ${item.asset?.assetName || ""}`} />
            <Detail label="Method" value={disposalMethodLabel(item.disposalMethod)} />
            <Detail label="Disposal Date" value={item.disposalDate?.slice(0, 10)} />
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 700, mt: 1 }}>
                Financial Summary
              </Typography>
            </Grid>
            <Detail label="Net Book Value" value={item.netBookValueAtDisposal} />
            <Detail label="Accumulated Depreciation" value={item.accumulatedDepreciationAtDisposal} />
            <Detail label="Sale Proceeds" value={item.saleProceeds} />
            <Detail label="Gain/Loss" value={item.gainLossOnDisposal} />
            <Detail label="Buyer" value={item.buyerName} />
            <Detail label="Invoice No" value={item.invoiceNumber} />
            <Detail label="Approved On" value={item.approvedOn?.slice(0, 10)} />
            <Detail label="Journal Entry Id" value={item.journalEntryId} />
            <Grid item xs={12}>
              <Box sx={{ border: "1px solid #eef0f4", borderRadius: 2, p: 1.5, bgcolor: "#fafafa" }}>
                <Typography variant="caption" color="textSecondary">Reason</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>{item.reason || "—"}</Typography>
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ border: "1px solid #eef0f4", borderRadius: 2, p: 1.5, bgcolor: "#fafafa" }}>
                <Typography variant="caption" color="textSecondary">Notes</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>{item.notes || "—"}</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} display="flex" justifyContent="flex-end" gap={1}>
              <Button variant="outlined" onClick={() => setOpen(false)}>Close</Button>
              {canUpdate && !approved && (
                <Button variant="contained" color="success" disabled={submitting} onClick={() => setConfirmApprove(true)}>
                  Approve
                </Button>
              )}
            </Grid>
          </Grid>
          </Box>
        </Box>
      </Modal>
      <Dialog open={confirmApprove} onClose={() => setConfirmApprove(false)}>
        <DialogTitle>Approve Disposal</DialogTitle>
        <DialogContent>
          <Typography>
            Approving will mark the asset as disposed or retired and set its net book value to 0.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmApprove(false)}>Cancel</Button>
          <Button variant="contained" color="success" disabled={submitting} onClick={approveDisposal}>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
