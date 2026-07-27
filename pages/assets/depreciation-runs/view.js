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
  width: { lg: 650, xs: 350 },
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 4,
  borderRadius: "10px",
  maxHeight: "90vh",
  overflowY: "auto",
};

const statusColor = (status) => {
  if (status === "SUCCESS") return "success";
  if (status === "PARTIAL") return "warning";
  if (status === "FAILED") return "error";
  if (status === "REVERSED") return "default";
  return "default";
};

const Detail = ({ label, value }) => (
  <Grid item xs={12} md={4}>
    <Typography variant="caption" color="textSecondary">{label}</Typography>
    <Typography variant="body2" fontWeight="500">{value ?? "—"}</Typography>
  </Grid>
);

const apiOk = (response, data) =>
  response.ok && (data.statusCode === 200 || data.isSuccess || data.status === "SUCCESS");

export default function ViewDepreciationRun({ item, fetchItems, canUpdate = false }) {
  const [open, setOpen] = useState(false);
  const [reverseOpen, setReverseOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const canReverse = canUpdate && item.runStatus !== "REVERSED";

  const reverseRun = async () => {
    setSubmitting(true);
    try {
      const response = await fetch(`${BASE_URL}/depreciation/runs/${item.id}/reverse?reason=${encodeURIComponent(reason)}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const data = await response.json();
      if (apiOk(response, data)) {
        toast.success(data.message || "Depreciation run reversed");
        setReverseOpen(false);
        setReason("");
        setOpen(false);
        if (typeof fetchItems === "function") fetchItems();
      } else {
        toast.error(data.message || "Reverse failed");
      }
    } catch (error) {
      console.error("Reverse depreciation run error:", error);
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
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Depreciation Run Details</Typography>
          <Grid container spacing={2}>
            <Detail label="Period" value={`${item.periodYear}/${item.periodMonth}`} />
            <Detail label="Entity Id" value={item.entityId} />
            <Grid item xs={12} md={4}>
              <Typography variant="caption" color="textSecondary">Status</Typography>
              <Box><Chip size="small" label={item.runStatus || "UNKNOWN"} color={statusColor(item.runStatus)} /></Box>
            </Grid>
            <Detail label="Started On" value={item.runStartedOn ? new Date(item.runStartedOn).toLocaleString() : "—"} />
            <Detail label="Completed On" value={item.runCompletedOn ? new Date(item.runCompletedOn).toLocaleString() : "—"} />
            <Detail label="Run By" value={item.runBy} />
            <Detail label="Processed" value={item.totalAssetsProcessed} />
            <Detail label="Skipped" value={item.totalAssetsSkipped} />
            <Detail label="Failed" value={item.totalAssetsFailed} />
            <Detail label="Total Depreciation" value={item.totalDepreciationPosted} />
            <Detail label="Batch Journal Entry" value={item.batchJournalEntryId} />
            <Grid item xs={12}>
              <Typography variant="caption" color="textSecondary">Error Log</Typography>
              <Typography variant="body2" whiteSpace="pre-wrap">{item.errorLog || "—"}</Typography>
            </Grid>
            <Grid item xs={12} display="flex" justifyContent="flex-end" gap={1} mt={2}>
              <Button variant="outlined" onClick={() => setOpen(false)}>Close</Button>
              {canReverse && (
                <Button variant="contained" color="error" disabled={submitting} onClick={() => setReverseOpen(true)}>
                  Reverse
                </Button>
              )}
            </Grid>
          </Grid>
        </Box>
      </Modal>
      <Dialog open={reverseOpen} onClose={() => setReverseOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Reverse Depreciation Run</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 1 }}>
            This reverses the posted depreciation period and creates reversed schedule records.
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReverseOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" disabled={submitting} onClick={reverseRun}>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
