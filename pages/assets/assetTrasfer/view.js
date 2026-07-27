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
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { toast } from "react-toastify";
import BASE_URL from "Base/api";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { lg: 760, xs: 350 },
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 0,
  borderRadius: "14px",
  maxHeight: "90vh",
  overflowY: "auto",
};

const typeLabel = (value) =>
  ({ 1: "Inter Department", 2: "Inter Entity", 3: "Custodian Change" }[value] || "Unknown");

const statusConfig = (value) =>
  ({
    1: { label: "Pending", color: "warning" },
    2: { label: "Approved", color: "info" },
    3: { label: "Rejected", color: "error" },
    4: { label: "Completed", color: "success" },
    5: { label: "Cancelled", color: "default" },
  }[value] || { label: "Unknown", color: "default" });

const Detail = ({ label, value }) => (
  <Grid item xs={12} md={6}>
    <Box sx={{ border: "1px solid #eef0f4", borderRadius: 2, p: 1.5, height: "100%", bgcolor: "#fafafa" }}>
      <Typography variant="caption" color="textSecondary">{label}</Typography>
      <Typography variant="body2" fontWeight="600" sx={{ mt: 0.5 }}>{value || "—"}</Typography>
    </Box>
  </Grid>
);

const apiOk = (response, data) =>
  response.ok &&
  (data.statusCode === 200 || data.isSuccess || data.status === "SUCCESS");

export default function ViewAssetTransfer({ item, fetchItems, canUpdate = false }) {
  const [open, setOpen] = useState(false);
  const [dialog, setDialog] = useState(null);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const status = statusConfig(item.status);

  const callAction = async (action, body = null, query = "") => {
    setSubmitting(true);
    try {
      const response = await fetch(`${BASE_URL}/assets/transfers/${item.id}/${action}${query}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          ...(body && { "Content-Type": "application/json" }),
        },
        ...(body && { body: JSON.stringify(body) }),
      });
      const data = await response.json();
      if (apiOk(response, data)) {
        toast.success(data.message || "Transfer updated");
        setDialog(null);
        setReason("");
        setOpen(false);
        if (typeof fetchItems === "function") fetchItems();
      } else {
        toast.error(data.message || "Operation failed");
      }
    } catch (error) {
      console.error("Transfer action error:", error);
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
        <Box sx={style}>
          <Box sx={{ p: 3, bgcolor: "#f7f9fc", borderBottom: "1px solid #e8edf3" }}>
            <Box display="flex" justifyContent="space-between" alignItems="flex-start" gap={2}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Asset Transfer Details
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {item.transferNumber || `Transfer #${item.id}`}
                </Typography>
              </Box>
              <Chip size="small" label={status.label} color={status.color} />
            </Box>
          </Box>
          <Box sx={{ p: 3 }}>
          <Grid container spacing={2}>
            <Detail label="Transfer Number" value={item.transferNumber} />
            <Detail label="Asset" value={`${item.asset?.assetCode || `#${item.assetId}`} - ${item.asset?.assetName || ""}`} />
            <Detail label="Transfer Type" value={typeLabel(item.transferType)} />
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 700, mt: 1 }}>
                Movement Details
              </Typography>
            </Grid>
            <Detail label="From Location" value={item.fromLocation?.locationName} />
            <Detail label="To Location" value={item.toLocation?.locationName} />
            <Detail label="From Custodian" value={item.fromCustodianId} />
            <Detail label="To Custodian" value={item.toCustodianId} />
            <Detail label="From Department" value={item.fromDepartmentId} />
            <Detail label="To Department" value={item.toDepartmentId} />
            <Detail label="From Entity" value={item.fromEntityId} />
            <Detail label="To Entity" value={item.toEntityId} />
            <Detail label="Requested On" value={item.requestedOn ? new Date(item.requestedOn).toLocaleString() : ""} />
            <Detail label="Approved On" value={item.approvedOn ? new Date(item.approvedOn).toLocaleString() : ""} />
            <Detail label="Completed On" value={item.completedOn ? new Date(item.completedOn).toLocaleString() : ""} />
            <Detail label="NBV At Transfer" value={item.netBookValueAtTransfer} />
            <Grid item xs={12}>
              <Box sx={{ border: "1px solid #eef0f4", borderRadius: 2, p: 1.5, bgcolor: "#fafafa" }}>
                <Typography variant="caption" color="textSecondary">Reason / Notes</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>{item.reason || item.approvalNotes || "—"}</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} display="flex" justifyContent="flex-end" gap={1} mt={2}>
              <Button variant="outlined" onClick={() => setOpen(false)}>Close</Button>
              {canUpdate && item.status === 1 && (
                <>
                  <Button
                    variant="contained"
                    color="error"
                    disabled={submitting}
                    onClick={() => setDialog("reject")}
                  >
                    Reject
                  </Button>
                  <Button
                    variant="contained"
                    color="success"
                    disabled={submitting}
                    onClick={() => callAction("approve", {})}
                  >
                    Approve
                  </Button>
                </>
              )}
              {canUpdate && item.status === 2 && (
                <Button
                  variant="contained"
                  color="success"
                  disabled={submitting}
                  onClick={() => callAction("complete", { scanMethod: 3, movementReason: item.reason })}
                >
                  Complete
                </Button>
              )}
            </Grid>
          </Grid>
          </Box>
        </Box>
      </Modal>
      <Dialog open={Boolean(dialog)} onClose={() => setDialog(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Reject Transfer</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog(null)}>Close</Button>
          <Button
            variant="contained"
            color="error"
            disabled={submitting || !reason.trim()}
            onClick={() => callAction("reject", { reason })}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
