import React, { useState } from "react";
import Grid from "@mui/material/Grid";
import {
  Box,
  Button,
  IconButton,
  MenuItem,
  Modal,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import BorderColorIcon from "@mui/icons-material/BorderColor";
import { toast } from "react-toastify";
import AssetAutocomplete from "@/components/Assets/AssetAutocomplete";
import BASE_URL from "Base/api";

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

const apiOk = (response, data) =>
  response.ok && (data.statusCode === 200 || data.isSuccess || data.status === "SUCCESS");

export default function EditAssetDisposal({ item, fetchItems }) {
  const [open, setOpen] = useState(false);
  const [, setSelectedAsset] = useState(item.asset || null);
  const [submitting, setSubmitting] = useState(false);
  const [values, setValues] = useState({
    AssetId: item.assetId || "",
    DisposalMethod: item.disposalMethod || 1,
    DisposalDate: item.disposalDate?.slice(0, 10) || new Date().toISOString().slice(0, 10),
    SaleProceeds: item.saleProceeds ?? 0,
    BuyerName: item.buyerName || "",
    InvoiceNumber: item.invoiceNumber || "",
    JournalEntryId: item.journalEntryId || "",
    Reason: item.reason || "",
    Notes: item.notes || "",
  });

  const disabled = Boolean(item.approvedOn);
  const setValue = (name, value) => setValues((prev) => ({ ...prev, [name]: value }));

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
      const response = await fetch(`${BASE_URL}/assets/disposals/${item.id}`, {
        method: "PUT",
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
          JournalEntryId: values.JournalEntryId ? Number(values.JournalEntryId) : null,
          Reason: values.Reason,
          Notes: values.Notes,
        }),
      });
      const data = await response.json();
      if (apiOk(response, data)) {
        toast.success(data.message || "Asset disposal updated");
        setOpen(false);
        fetchItems();
      } else {
        toast.error(data.message || "Asset disposal update failed");
      }
    } catch (error) {
      console.error("Update asset disposal error:", error);
      toast.error(error.message || "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Tooltip title={disabled ? "Approved disposals cannot be edited" : ""}>
        <span>
          <IconButton size="small" disabled={disabled} onClick={() => setOpen(true)}>
            <BorderColorIcon color={disabled ? "disabled" : "primary"} fontSize="inherit" />
          </IconButton>
        </span>
      </Tooltip>
      <Modal open={open} onClose={() => setOpen(false)}>
        <Box sx={modalStyle}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>Edit Asset Disposal</Typography>
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
              <TextField fullWidth type="number" label="Journal Entry Id" value={values.JournalEntryId} onChange={(e) => setValue("JournalEntryId", e.target.value)} />
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
              <Button variant="outlined" color="error" onClick={() => setOpen(false)}>Cancel</Button>
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
