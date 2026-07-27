import React, { useState } from "react";
import {
  Grid,
  Typography,
  Box,
  Button,
  Modal,
  Tooltip,
  IconButton,
  Divider,
  Chip,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { lg: 620, xs: 350 },
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 0,
  borderRadius: "14px",
  maxHeight: "90vh",
  overflowY: "auto",
};

const DataRow = ({ label, value }) => (
  <Grid item xs={12} md={6}>
    <Box sx={{ border: "1px solid #eef0f4", borderRadius: 2, p: 1.5, height: "100%", bgcolor: "#fafafa" }}>
      <Typography variant="caption" color="textSecondary">{label}</Typography>
      <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>{value || 'N/A'}</Typography>
    </Box>
  </Grid>
);

export default function ViewSchedule({ item }) {
  const [open, setOpen] = useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  if (!item) return null;

  const getMaintenanceTypeText = (type) => {
    switch (type) {
      case 1: return "Preventive";
      case 2: return "Corrective";
      case 3: return "Inspection";
      case 4: return "Emergency";
      default: return "Unknown";
    }
  };

  return (
    <>
      <Tooltip title="View" placement="top">
        <IconButton onClick={handleOpen} aria-label="view" size="small">
          <VisibilityIcon color="info" fontSize="inherit" />
        </IconButton>
      </Tooltip>

      <Modal open={open} onClose={handleClose} aria-labelledby="view-schedule-modal">
        <Box sx={style}>
          <Box sx={{ p: 3, bgcolor: "#f7f9fc", borderBottom: "1px solid #e8edf3" }}>
            <Box display="flex" justifyContent="space-between" alignItems="flex-start" gap={2}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Maintenance Schedule
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {item.assetName || item.assetCode || "Asset"}
                </Typography>
              </Box>
              <Chip size="small" label={item.isActive ? 'Active' : 'Inactive'} color={item.isActive ? 'success' : 'default'} />
            </Box>
          </Box>
          <Box sx={{ p: 3 }}>
            <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 700 }}>
              Schedule Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <DataRow label="Asset" value={item.assetName || item.assetCode} />
              <DataRow label="Type" value={getMaintenanceTypeText(item.maintenanceType)} />
              <DataRow label="Interval" value={`${item.intervalDays} Days`} />
              <DataRow label="Last Maintenance" value={item.lastMaintenanceDate ? new Date(item.lastMaintenanceDate).toLocaleDateString() : 'None'} />
              <DataRow label="Next Maintenance" value={item.nextMaintenanceDate ? new Date(item.nextMaintenanceDate).toLocaleDateString() : ''} />
              <DataRow label="Estimated Cost" value={item.estimatedCost ? `$${item.estimatedCost}` : '0.00'} />
              <Grid item xs={12}>
                <Box sx={{ border: "1px solid #eef0f4", borderRadius: 2, p: 1.5, bgcolor: "#fafafa" }}>
                  <Typography variant="caption" color="textSecondary">Description</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>{item.description || "N/A"}</Typography>
                </Box>
              </Grid>
            </Grid>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
              <Button variant="contained" onClick={handleClose}>Close</Button>
            </Box>
          </Box>
        </Box>
      </Modal>
    </>
  );
}
