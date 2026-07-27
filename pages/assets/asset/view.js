import React, { useEffect, useState } from "react";
import {
  Grid,
  Typography,
  Tooltip,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Divider,
  Alert,
  Chip,
} from "@mui/material";
import Box from "@mui/material/Box";
import Modal from "@mui/material/Modal";
import VisibilityIcon from "@mui/icons-material/Visibility";
import BASE_URL from "Base/api";
import { toast } from "react-toastify";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { lg: 920, xs: 360 },
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 0,
  borderRadius: "14px",
  maxHeight: "90vh",
  overflowY: "auto",
};

const getStatusName = (statusValue) => {
  switch (statusValue) {
    case 1:
      return "Draft";
    case 2:
      return "Pending Approval";
    case 3:
      return "Active";
    case 4:
      return "In Maintenance";
    case 5:
      return "Transferred";
    case 6:
      return "Disposed";
    case 7:
      return "Retired";
    default:
      return "Unknown";
  }
};

const getStatusColor = (statusValue) => {
  switch (statusValue) {
    case 3:
      return "success";
    case 1:
    case 2:
    case 5:
      return "warning";
    case 6:
    case 7:
      return "error";
    default:
      return "default";
  }
};

export default function ViewAsset({ item, fetchItems, approve1 }) {
  const [open, setOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locationHistory, setLocationHistory] = useState([]);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  useEffect(() => {
    if (!open || !item?.id) return;

    const fetchLocationHistory = async () => {
      try {
        const response = await fetch(`${BASE_URL}/assets/${item.id}/location-history`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        const data = await response.json();
        if (
          response.ok &&
          (data.statusCode === 200 || data.isSuccess || data.status === "SUCCESS")
        ) {
          setLocationHistory(data.result || []);
        }
      } catch (error) {
        console.error("Error loading asset location history:", error);
      }
    };

    fetchLocationHistory();
  }, [open, item?.id]);

  // Asset API Calls
  const handleAction = async (action, payload = null) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`${BASE_URL}/assets/${item.id}/${action}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          ...(payload && { "Content-Type": "application/json" }),
        },
        ...(payload && { body: JSON.stringify(payload) }),
      });

      const data = await response.json();

      if (
        response.ok &&
        (data.statusCode === 200 || data.isSuccess || data.status === "SUCCESS")
      ) {
        toast.success(data.message || `Asset ${action} successful`);
        fetchItems();
        if (action === "reject") setRejectDialogOpen(false);
        setOpen(false);
      } else {
        toast.error(data.message || `Failed to ${action} asset`);
      }
    } catch (error) {
      console.error(`Error performing ${action} on asset:`, error);
      toast.error(`An error occurred while trying to ${action} the asset`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitAction = () => handleAction("submit");
  const approveAction = () => handleAction("approve");
  const rejectAction = () => {
    handleAction("reject", { reason: rejectReason });
  };

  const DetailRow = ({ label, value }) => (
    <Grid item xs={12} sm={6} md={4}>
      <Box sx={{ border: "1px solid #eef0f4", borderRadius: 2, p: 1.5, height: "100%", bgcolor: "#fafafa" }}>
        <Typography variant="caption" color="textSecondary">
          {label}
        </Typography>
        <Typography variant="body2" fontWeight="600" sx={{ mt: 0.5 }}>
          {value || "—"}
        </Typography>
      </Box>
    </Grid>
  );

  return (
    <>
      <Tooltip title="View Details" placement="top">
        <IconButton onClick={handleOpen} aria-label="view" size="small">
          <VisibilityIcon color="info" fontSize="inherit" />
        </IconButton>
      </Tooltip>

      <Modal open={open} onClose={handleClose} aria-labelledby="view-asset-modal">
        <Box sx={style}>
          <Box sx={{ p: 3, bgcolor: "#f7f9fc", borderBottom: "1px solid #e8edf3" }}>
            <Box display="flex" justifyContent="space-between" alignItems="flex-start" gap={2}>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  {item.assetName || "Asset Details"}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {item.assetCode || `Asset #${item.id}`}
                </Typography>
              </Box>
              <Chip size="small" label={getStatusName(item.status)} color={getStatusColor(item.status)} />
            </Box>
          </Box>
          <Box sx={{ p: 3 }}>
          <Grid container spacing={2}>

            {(item.isRejected || item.isReject) && (
              <Grid item xs={12}>
                <Alert severity="error">
                  <strong>This asset is rejected</strong>
                  <br />
                  <strong>Reason:</strong> {item.rejectReason || "No reason provided."}
                </Alert>
              </Grid>
            )}

            {/* General Info */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 700 }}>
                General Information
              </Typography>
              <Divider sx={{ mb: 1 }} />
            </Grid>
            <DetailRow label="Asset Code" value={item.assetCode} />
            <DetailRow label="Asset Name" value={item.assetName} />
            <DetailRow label="Status" value={getStatusName(item.status)} />
            <DetailRow label="Category" value={item.category?.categoryName} />
            <DetailRow label="Location" value={item.location?.locationName} />

            {/* Procurement & Financials */}
            <Grid item xs={12} mt={1}>
              <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 700 }}>
                Procurement & Financials
              </Typography>
              <Divider sx={{ mb: 1 }} />
            </Grid>
            <DetailRow
              label="Purchase Date"
              value={item.purchaseDate ? new Date(item.purchaseDate).toLocaleDateString() : ""}
            />
            <DetailRow
              label="Purchase Cost"
              value={`${item.currencyCode || ""} ${item.purchaseCost?.toFixed(2) || ""}`}
            />
            <DetailRow label="Salvage Value" value={item.salvageValue} />
            <DetailRow label="Useful Life (Months)" value={item.usefulLifeMonths} />
            <DetailRow label="Reducing Balance Rate" value={item.reducingBalanceRate ? `${item.reducingBalanceRate}%` : ""} />
            <DetailRow label="PO Number" value={item.poNumber} />
            <DetailRow label="GRN Number" value={item.grnNumber} />

            {/* Identification & Usage */}
            <Grid item xs={12} mt={1}>
              <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 700 }}>
                Identification & Usage
              </Typography>
              <Divider sx={{ mb: 1 }} />
            </Grid>
            <DetailRow label="Serial Number" value={item.serialNumber} />
            <DetailRow label="Model Number" value={item.modelNumber} />
            <DetailRow label="Barcode" value={item.barcode} />
            <DetailRow label="Total Production Units" value={item.totalProductionUnits} />
            <DetailRow label="Units Used To Date" value={item.unitsUsedToDate} />
            <DetailRow
              label="Warranty Expiry"
              value={item.warrantyExpiry ? new Date(item.warrantyExpiry).toLocaleDateString() : ""}
            />
            <Grid item xs={12}>
              <Typography variant="caption" color="textSecondary">
                Notes
              </Typography>
              <Typography variant="body2">{item.notes || "—"}</Typography>
            </Grid>

            <Grid item xs={12} mt={1}>
              <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 700 }}>
                Attachments
              </Typography>
              <Divider sx={{ mb: 1 }} />
              {item.attachments?.length > 0 ? (
                <Box display="flex" flexDirection="column" gap={1}>
                  {item.attachments.map((attachment) => (
                    <a
                      key={attachment.id}
                      href={attachment.storageUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {attachment.fileName}
                    </a>
                  ))}
                </Box>
              ) : (
                <Typography variant="body2">—</Typography>
              )}
            </Grid>

            <Grid item xs={12} mt={1}>
              <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 700 }}>
                Location History
              </Typography>
              <Divider sx={{ mb: 1 }} />
              {locationHistory.length > 0 ? (
                <Box display="flex" flexDirection="column" gap={1}>
                  {locationHistory.map((history) => (
                    <Box
                      key={history.id}
                      sx={{
                        border: "1px solid #e0e0e0",
                        borderRadius: 1,
                        p: 1,
                      }}
                    >
                      <Typography variant="body2" fontWeight="600">
                        {history.fromLocation?.locationName || "—"} →{" "}
                        {history.toLocation?.locationName || "—"}
                      </Typography>
                      <Typography variant="caption" color="textSecondary" display="block">
                        Moved On:{" "}
                        {history.movedOn ? new Date(history.movedOn).toLocaleString() : "—"} |
                        Moved By: {history.movedBy || "—"}
                      </Typography>
                      <Typography variant="caption" color="textSecondary" display="block">
                        Custodian: {history.fromCustodianId || "—"} →{" "}
                        {history.toCustodianId || "—"} | Department:{" "}
                        {history.fromDepartmentId || "—"} → {history.toDepartmentId || "—"}
                      </Typography>
                      {history.movementReason && (
                        <Typography variant="caption" display="block">
                          Reason: {history.movementReason}
                        </Typography>
                      )}
                    </Box>
                  ))}
                </Box>
              ) : (
                <Typography variant="body2">No location history available.</Typography>
              )}
            </Grid>

            {/* Buttons / Actions */}
            <Grid item xs={12} mt={3} display="flex" justifyContent="space-between">
              <Button variant="outlined" color="inherit" onClick={handleClose}>
                Close
              </Button>
              <Box display="flex" gap={2}>
                {/* 1 = Draft implies submitting is allowed */}
                <Button
                  variant="contained"
                  color="warning"
                  disabled={isSubmitting || item.status !== 1}
                  onClick={submitAction}
                >
                  {isSubmitting ? "Processing..." : "Submit"}
                </Button>

                {/* 2 = Pending Approval implies approve and reject are allowed */}
                {approve1 && (
                  <>
                    <Button
                      variant="contained"
                      color="error"
                      disabled={isSubmitting || item.status !== 2}
                      onClick={() => setRejectDialogOpen(true)}
                    >
                      Reject
                    </Button>

                    <Button
                      variant="contained"
                      color="success"
                      disabled={isSubmitting || item.status !== 2}
                      onClick={approveAction}
                    >
                      {isSubmitting ? "Processing..." : "Approve"}
                    </Button>
                  </>
                )}
              </Box>
            </Grid>
          </Grid>
          </Box>
        </Box>
      </Modal>

      {/* Reject Reason Dialog */}
      <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Reject Asset</DialogTitle>
        <DialogContent>
          <Typography variant="body2" mb={2}>
            Please provide a reason for rejecting this asset.
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Rejection Reason"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialogOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button onClick={rejectAction} color="error" variant="contained" disabled={isSubmitting}>
            Confirm Reject
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
