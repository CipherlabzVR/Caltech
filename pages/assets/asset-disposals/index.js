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
import BASE_URL from "Base/api";
import EditAssetDisposal from "./edit";
import ViewAssetDisposal from "./view";

const CATEGORY_ID = 186;

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

const apiOk = (response, data) =>
  response.ok && (data.statusCode === 200 || data.isSuccess || data.status === "SUCCESS");

function CreateDisposalModal({ fetchItems }) {
  const [open, setOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [values, setValues] = useState({
    AssetId: "",
    DisposalMethod: 1,
    DisposalDate: new Date().toISOString().slice(0, 10),
    SaleProceeds: 0,
    BuyerName: "",
    InvoiceNumber: "",
    Reason: "",
    Notes: "",
  });

  const setValue = (name, value) => setValues((prev) => ({ ...prev, [name]: value }));
  const reset = () => {
    setSelectedAsset(null);
    setValues({
      AssetId: "",
      DisposalMethod: 1,
      DisposalDate: new Date().toISOString().slice(0, 10),
      SaleProceeds: 0,
      BuyerName: "",
      InvoiceNumber: "",
      Reason: "",
      Notes: "",
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
      const response = await fetch(`${BASE_URL}/assets/disposals`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          AssetId: Number(values.AssetId),
          DisposalMethod: Number(values.DisposalMethod),
          DisposalDate: values.DisposalDate,
          SaleProceeds: Number(values.SaleProceeds || 0),
          BuyerName: values.BuyerName,
          InvoiceNumber: values.InvoiceNumber,
          Reason: values.Reason,
          Notes: values.Notes,
        }),
      });
      const data = await response.json();
      if (apiOk(response, data)) {
        toast.success(data.message || "Asset disposal created");
        handleClose();
        fetchItems();
      } else {
        toast.error(data.message || "Asset disposal create failed");
      }
    } catch (error) {
      console.error("Create asset disposal error:", error);
      toast.error(error.message || "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Button variant="contained" onClick={() => setOpen(true)}>+ New Disposal</Button>
      <Modal open={open} onClose={handleClose}>
        <Box sx={modalStyle}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>Create Asset Disposal</Typography>
            </Grid>
            <Grid item xs={12}>
              <AssetAutocomplete
                modalOpen={open}
                value={values.AssetId}
                onChange={(id) => setValue("AssetId", id)}
                onSelect={setSelectedAsset}
                label="Asset"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField select fullWidth label="Disposal Method" value={values.DisposalMethod} onChange={(e) => setValue("DisposalMethod", e.target.value)}>
                <MenuItem value={1}>Sale</MenuItem>
                <MenuItem value={2}>Write Off</MenuItem>
                <MenuItem value={3}>Donation</MenuItem>
                <MenuItem value={4}>Trade In</MenuItem>
                <MenuItem value={5}>Retirement</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth type="date" label="Disposal Date" InputLabelProps={{ shrink: true }} value={values.DisposalDate} onChange={(e) => setValue("DisposalDate", e.target.value)} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth type="number" label="Sale Proceeds" value={values.SaleProceeds} onChange={(e) => setValue("SaleProceeds", e.target.value)} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Buyer Name" value={values.BuyerName} onChange={(e) => setValue("BuyerName", e.target.value)} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Invoice Number" value={values.InvoiceNumber} onChange={(e) => setValue("InvoiceNumber", e.target.value)} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth multiline minRows={2} label="Reason" value={values.Reason} onChange={(e) => setValue("Reason", e.target.value)} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth multiline minRows={2} label="Notes" value={values.Notes} onChange={(e) => setValue("Notes", e.target.value)} />
            </Grid>
            <Grid item xs={12} display="flex" justifyContent="flex-end" gap={2}>
              <Button variant="outlined" color="error" onClick={handleClose}>Cancel</Button>
              <Button variant="contained" disabled={submitting} onClick={handleSubmit}>
                {submitting ? "Saving..." : "Save"}
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Modal>
    </>
  );
}

function DisposalDeleteAction({ item, fetchItems }) {
  const [confirm, setConfirm] = useState(false);
  const approved = Boolean(item.approvedOn);

  const deleteDisposal = async () => {
    try {
      const response = await fetch(`${BASE_URL}/assets/disposals/${item.id}/delete`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      if (apiOk(response, data)) {
        toast.success(data.message || "Asset disposal deleted");
        fetchItems();
      } else {
        toast.error(data.message || "Delete failed");
      }
    } catch (error) {
      console.error("Asset disposal delete error:", error);
      toast.error(error.message || "An error occurred");
    } finally {
      setConfirm(false);
    }
  };

  return (
    <>
      <Tooltip title={approved ? "Approved disposals cannot be deleted" : "Delete"}>
        <span>
          <IconButton size="small" color="error" disabled={approved} onClick={() => setConfirm(true)}>
            <DeleteIcon fontSize="inherit" />
          </IconButton>
        </span>
      </Tooltip>
      <Dialog open={confirm} onClose={() => setConfirm(false)}>
        <DialogTitle>Delete Disposal</DialogTitle>
        <DialogContent>
          <Typography>This will soft delete the disposal request.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirm(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={deleteDisposal}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default function AssetDisposals() {
  const { navigate, create, update, print } = IsPermissionEnabled(CATEGORY_ID) || {};
  const {
    data: disposals,
    totalCount,
    page,
    pageSize,
    search,
    setPage,
    setPageSize,
    setSearch,
    fetchData: fetchDisposals,
  } = usePaginatedFetch("assets/disposals", "", 10, false, false);

  const refreshList = () => fetchDisposals(page, search, pageSize);

  const handleSearchChange = (event) => {
    const value = event.target.value;
    setSearch(value);
    setPage(1);
    fetchDisposals(1, value, pageSize);
  };

  const handlePageChange = (_, value) => {
    setPage(value);
    fetchDisposals(value, search, pageSize);
  };

  const handlePageSizeChange = (event) => {
    const size = event.target.value;
    setPageSize(size);
    setPage(1);
    fetchDisposals(1, search, size);
  };

  if (!navigate) return <AccessDenied />;

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Asset Disposals</h1>
        <ul>
          <li>
            <Link href="/assets/asset">Assets Registry</Link>
          </li>
          <li>Asset Disposals</li>
        </ul>
      </div>

      <Grid container rowSpacing={1} columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}>
        <Grid item xs={12} lg={4} order={{ xs: 2, lg: 1 }}>
          <Search className="search-form">
            <StyledInputBase
              placeholder="Search disposal, asset, invoice..."
              inputProps={{ "aria-label": "search asset disposals" }}
              value={search}
              onChange={handleSearchChange}
            />
          </Search>
        </Grid>

        <Grid item xs={12} lg={8} mb={1} display="flex" justifyContent="end" order={{ xs: 1, lg: 2 }}>
          {create ? <CreateDisposalModal fetchItems={refreshList} /> : null}
        </Grid>

        <Grid item xs={12} order={{ xs: 3, lg: 3 }}>
          <TableContainer component={Paper}>
            <Table aria-label="asset-disposals-table" className="dark-table">
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Disposal No</TableCell>
                  <TableCell>Asset</TableCell>
                  <TableCell>Method</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>NBV</TableCell>
                  <TableCell>Proceeds</TableCell>
                  <TableCell>Gain/Loss</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {disposals.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} align="center">
                      <Typography color="error">No Asset Disposals Available</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  disposals.map((item, index) => (
                    <TableRow key={item.id}>
                      <TableCell>{(page - 1) * pageSize + index + 1}</TableCell>
                      <TableCell>{item.disposalNumber}</TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                          {item.asset?.assetCode || `#${item.assetId}`}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {item.asset?.assetName}
                        </Typography>
                      </TableCell>
                      <TableCell>{disposalMethodLabel(item.disposalMethod)}</TableCell>
                      <TableCell>{item.disposalDate?.slice(0, 10)}</TableCell>
                      <TableCell>{item.netBookValueAtDisposal}</TableCell>
                      <TableCell>{item.saleProceeds}</TableCell>
                      <TableCell>{item.gainLossOnDisposal}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={item.approvedOn ? "Approved" : "Pending"}
                          color={item.approvedOn ? "success" : "warning"}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Box display="flex" justifyContent="flex-end" gap={0.5}>
                          {print && <ViewAssetDisposal item={item} fetchItems={refreshList} canUpdate={update} />}
                          {update && <EditAssetDisposal item={item} fetchItems={refreshList} />}
                          {update && <DisposalDeleteAction item={item} fetchItems={refreshList} />}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
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
