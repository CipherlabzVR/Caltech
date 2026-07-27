import React, { useState } from "react";
import {
  Box,
  Button,
  Chip,
  Grid,
  IconButton,
  Modal,
  Tooltip,
  Typography,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";

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

const statusConfig = (status) =>
  ({ 1: { label: "Projected", color: "info" }, 2: { label: "Posted", color: "success" }, 3: { label: "Reversed", color: "error" } }[status] ||
  { label: "Unknown", color: "default" });

const Detail = ({ label, value }) => (
  <Grid item xs={12} md={4}>
    <Box sx={{ border: "1px solid #eef0f4", borderRadius: 2, p: 1.5, height: "100%", bgcolor: "#fafafa" }}>
      <Typography variant="caption" color="textSecondary">{label}</Typography>
      <Typography variant="body2" fontWeight="600" sx={{ mt: 0.5 }}>{value ?? "—"}</Typography>
    </Box>
  </Grid>
);

export default function ViewDepreciationSchedule({ item }) {
  const [open, setOpen] = useState(false);
  const status = statusConfig(item.status);

  return (
    <>
      <Tooltip title="View Details">
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
                  Depreciation Schedule Details
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {item.asset?.assetCode || `Asset #${item.assetId}`} - {item.periodYear}/{item.periodMonth}
                </Typography>
              </Box>
              <Chip size="small" label={status.label} color={status.color} />
            </Box>
          </Box>
          <Box sx={{ p: 3 }}>
          <Grid container spacing={2}>
            <Detail label="Asset" value={`${item.asset?.assetCode || `#${item.assetId}`} - ${item.asset?.assetName || ""}`} />
            <Detail label="Period" value={`${item.periodYear}/${item.periodMonth}`} />
            <Detail label="Pro Rata Factor" value={item.proRataFactor} />
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 700, mt: 1 }}>
                Financial Summary
              </Typography>
            </Grid>
            <Detail label="Opening NBV" value={item.openingNetBookValue} />
            <Detail label="Depreciation Amount" value={item.depreciationAmount} />
            <Detail label="Closing NBV" value={item.closingNetBookValue} />
            <Detail label="Accumulated Depreciation" value={item.accumulatedDepreciation} />
            <Detail label="Journal Entry Id" value={item.journalEntryId} />
            <Detail label="Posted On" value={item.postedOn ? new Date(item.postedOn).toLocaleString() : "—"} />
            <Detail label="Posted By" value={item.postedBy} />
            <Grid item xs={12}>
              <Box sx={{ border: "1px solid #eef0f4", borderRadius: 2, p: 1.5, bgcolor: "#fafafa" }}>
                <Typography variant="caption" color="textSecondary">Notes</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>{item.notes || "—"}</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} display="flex" justifyContent="flex-end" gap={1} mt={2}>
              <Button variant="outlined" onClick={() => setOpen(false)}>Close</Button>
            </Grid>
          </Grid>
          </Box>
        </Box>
      </Modal>
    </>
  );
}
