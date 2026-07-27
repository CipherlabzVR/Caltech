import React, { useState } from "react";
import Grid from "@mui/material/Grid";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Modal,
  Pagination,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import Link from "next/link";
import styles from "@/styles/PageTitle.module.css";
import { ToastContainer, toast } from "react-toastify";
import { Search, StyledInputBase } from "@/styles/main/search-styles";
import usePaginatedFetch from "@/components/hooks/usePaginatedFetch";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import AssetAutocomplete from "@/components/Assets/AssetAutocomplete";
import LocationAutocomplete from "../asset/LocationAutocomplete";
import BASE_URL from "Base/api";
import EditAssetTransfer from "./edit";
import ViewAssetTransfer from "./view";

const modalStyle = {
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

const transferTypeLabel = (value) => {
  const map = {
    1: "Inter Department",
    2: "Inter Entity",
    3: "Custodian Change",
  };
  return map[value] || "Unknown";
};

const statusConfig = (value) => {
  const map = {
    1: { label: "Pending", color: "warning" },
    2: { label: "Approved", color: "info" },
    3: { label: "Rejected", color: "error" },
    4: { label: "Completed", color: "success" },
    5: { label: "Cancelled", color: "default" },
  };
  return map[value] || { label: "Unknown", color: "default" };
};

const apiOk = (response, data) =>
  response.ok &&
  (data.statusCode === 200 || data.isSuccess || data.status === "SUCCESS");

function CreateTransferModal({ fetchItems }) {
  const [open, setOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [values, setValues] = useState({
    AssetId: "",
    TransferType: 1,
    ToLocationId: "",
    ToCustodianId: "",
    ToDepartmentId: "",
    ToEntityId: "",
    Reason: "",
  });

  const setValue = (name, value) => setValues((prev) => ({ ...prev, [name]: value }));

  const reset = () => {
    setSelectedAsset(null);
    setValues({
      AssetId: "",
      TransferType: 1,
      ToLocationId: "",
      ToCustodianId: "",
      ToDepartmentId: "",
      ToEntityId: "",
      Reason: "",
    });
  };

  const handleClose = () => {
    reset();
    setOpen(false);
  };

  const handleSubmit = async () => {
    if (!values.AssetId) {
      toast.warning("Please select an asset");
      return;
    }
    if (!values.Reason?.trim()) {
      toast.warning("Reason is required");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        AssetId: Number(values.AssetId),
        TransferType: Number(values.TransferType),
        ToLocationId: values.ToLocationId ? Number(values.ToLocationId) : null,
        ToCustodianId: values.ToCustodianId ? Number(values.ToCustodianId) : null,
        ToDepartmentId: values.ToDepartmentId ? Number(values.ToDepartmentId) : null,
        ToEntityId: values.ToEntityId ? Number(values.ToEntityId) : null,
        Reason: values.Reason,
      };

      const response = await fetch(`${BASE_URL}/assets/transfers`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (apiOk(response, data)) {
        toast.success(data.message || "Asset transfer requested");
        handleClose();
        fetchItems();
      } else {
        toast.error(data.message || "Failed to request transfer");
      }
    } catch (error) {
      console.error("Error creating transfer:", error);
      toast.error(error.message || "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Button variant="contained" onClick={() => setOpen(true)}>
        + New Transfer
      </Button>
      <Modal open={open} onClose={handleClose}>
        <Box sx={modalStyle}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Request Asset Transfer
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <AssetAutocomplete
                modalOpen={open}
                value={values.AssetId}
                onChange={(id) => setValue("AssetId", id)}
                onSelect={setSelectedAsset}
                transferableOnly
              />
            </Grid>
            {selectedAsset && (
              <Grid item xs={12}>
                <Typography variant="caption" color="textSecondary">
                  Current: {selectedAsset.location?.locationName || "No location"} | Custodian:{" "}
                  {selectedAsset.custodianId || "N/A"} | Department:{" "}
                  {selectedAsset.departmentId || "N/A"} | Entity: {selectedAsset.entityId || "N/A"}
                </Typography>
              </Grid>
            )}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Transfer Type</InputLabel>
                <Select
                  label="Transfer Type"
                  value={values.TransferType}
                  onChange={(e) => setValue("TransferType", e.target.value)}
                >
                  <MenuItem value={1}>Inter Department</MenuItem>
                  <MenuItem value={2}>Inter Entity</MenuItem>
                  <MenuItem value={3}>Custodian Change</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <LocationAutocomplete
                modalOpen={open}
                value={values.ToLocationId}
                onChange={(id) => setValue("ToLocationId", id)}
                label="To Location"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="number"
                label="To Custodian Id"
                value={values.ToCustodianId}
                onChange={(e) => setValue("ToCustodianId", e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="number"
                label="To Department Id"
                value={values.ToDepartmentId}
                onChange={(e) => setValue("ToDepartmentId", e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="number"
                label="To Entity Id"
                value={values.ToEntityId}
                onChange={(e) => setValue("ToEntityId", e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Reason *"
                value={values.Reason}
                onChange={(e) => setValue("Reason", e.target.value)}
              />
            </Grid>
            <Grid item xs={12} display="flex" justifyContent="flex-end" gap={2}>
              <Button variant="outlined" color="error" onClick={handleClose}>
                Cancel
              </Button>
              <Button variant="contained" disabled={submitting} onClick={handleSubmit}>
                {submitting ? "Saving..." : "Save Transfer"}
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Modal>
    </>
  );
}

function TransferDeleteAction({ item, fetchItems }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const canDelete = item.status === 1 || item.status === 2;

  const handleDelete = async () => {
    if (!reason.trim()) {
      toast.warning("Reason is required");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${BASE_URL}/assets/transfers/${item.id}/cancel?reason=${encodeURIComponent(reason)}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await response.json();
      if (apiOk(response, data)) {
        toast.success(data.message || "Transfer deleted");
        setOpen(false);
        setReason("");
        fetchItems();
      } else {
        toast.error(data.message || "Delete failed");
      }
    } catch (error) {
      console.error("Transfer delete error:", error);
      toast.error(error.message || "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Tooltip title={canDelete ? "Delete" : "Only pending or approved transfers can be deleted"}>
        <span>
          <IconButton size="small" color="error" disabled={!canDelete} onClick={() => setOpen(true)}>
            <DeleteIcon fontSize="inherit" />
          </IconButton>
        </span>
      </Tooltip>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Delete Transfer</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 1 }}>
            This will cancel the transfer request.
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Close</Button>
          <Button
            variant="contained"
            color="error"
            disabled={submitting || !reason.trim()}
            onClick={handleDelete}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default function AssetTransfers() {
  const cId = sessionStorage.getItem("category");
  const { navigate, create, update, print } = IsPermissionEnabled(cId);
  const {
    data: transfers,
    totalCount,
    page,
    pageSize,
    search,
    setPage,
    setPageSize,
    setSearch,
    fetchData: fetchTransfers,
  } = usePaginatedFetch("assets/transfers", "", 10, false, false);

  const refreshList = () => fetchTransfers(page, search, pageSize);

  const handleSearchChange = (event) => {
    const value = event.target.value;
    setSearch(value);
    setPage(1);
    fetchTransfers(1, value, pageSize);
  };

  const handlePageChange = (_, value) => {
    setPage(value);
    fetchTransfers(value, search, pageSize);
  };

  const handlePageSizeChange = (event) => {
    const size = event.target.value;
    setPageSize(size);
    setPage(1);
    fetchTransfers(1, search, size);
  };

  if (!navigate) return <AccessDenied />;

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Asset Transfers</h1>
        <ul>
          <li>
            <Link href="/assets/asset">Assets Registry</Link>
          </li>
          <li>Asset Transfers</li>
        </ul>
      </div>

      <Grid container rowSpacing={1} columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}>
        <Grid item xs={12} lg={4} order={{ xs: 2, lg: 1 }}>
          <Search className="search-form">
            <StyledInputBase
              placeholder="Search transfer, asset, reason..."
              inputProps={{ "aria-label": "search asset transfers" }}
              value={search}
              onChange={handleSearchChange}
            />
          </Search>
        </Grid>

        <Grid item xs={12} lg={8} mb={1} display="flex" justifyContent="end" order={{ xs: 1, lg: 2 }}>
          {create ? <CreateTransferModal fetchItems={refreshList} /> : null}
        </Grid>

        <Grid item xs={12} order={{ xs: 3, lg: 3 }}>
          <TableContainer component={Paper}>
            <Table aria-label="asset-transfers-table" className="dark-table">
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Transfer No</TableCell>
                  <TableCell>Asset</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>From</TableCell>
                  <TableCell>To</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transfers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography color="error">No Asset Transfers Available</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  transfers.map((item, index) => {
                    const status = statusConfig(item.status);
                    return (
                      <TableRow key={item.id}>
                        <TableCell>{(page - 1) * pageSize + index + 1}</TableCell>
                        <TableCell>{item.transferNumber}</TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                            {item.asset?.assetCode || `#${item.assetId}`}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {item.asset?.assetName}
                          </Typography>
                        </TableCell>
                        <TableCell>{transferTypeLabel(item.transferType)}</TableCell>
                        <TableCell>
                          <Typography variant="caption" display="block">
                            Loc: {item.fromLocation?.locationName || "—"}
                          </Typography>
                          <Typography variant="caption" display="block">
                            Dept: {item.fromDepartmentId || "—"} | Cust: {item.fromCustodianId || "—"}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" display="block">
                            Loc: {item.toLocation?.locationName || "—"}
                          </Typography>
                          <Typography variant="caption" display="block">
                            Dept: {item.toDepartmentId || "—"} | Cust: {item.toCustodianId || "—"}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip size="small" label={status.label} color={status.color} />
                        </TableCell>
                        <TableCell align="right">
                          <Box display="flex" justifyContent="flex-end" gap={0.5}>
                            {print && <ViewAssetTransfer item={item} fetchItems={refreshList} canUpdate={update} />}
                            {update && <EditAssetTransfer item={item} fetchItems={refreshList} />}
                            {update && <TransferDeleteAction item={item} fetchItems={refreshList} />}
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
            <Grid container justifyContent="space-between" mt={2} mb={2}>
              <Pagination
                count={Math.ceil(totalCount / pageSize) || 1}
                page={page}
                onChange={handlePageChange}
                color="primary"
                shape="rounded"
              />
              <FormControl size="small" sx={{ mr: 2, width: "100px" }}>
                <InputLabel>Page Size</InputLabel>
                <Select value={pageSize} label="Page Size" onChange={handlePageSizeChange}>
                  <MenuItem value={5}>5</MenuItem>
                  <MenuItem value={10}>10</MenuItem>
                  <MenuItem value={25}>25</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </TableContainer>
        </Grid>
      </Grid>
    </>
  );
}
