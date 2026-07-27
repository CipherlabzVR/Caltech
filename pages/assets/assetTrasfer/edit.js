import React, { useState } from "react";
import {
  Box,
  Button,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Modal,
  Select,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import BorderColorIcon from "@mui/icons-material/BorderColor";
import { toast } from "react-toastify";
import AssetAutocomplete from "@/components/Assets/AssetAutocomplete";
import LocationAutocomplete from "../asset/LocationAutocomplete";
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

export default function EditAssetTransfer({ item, fetchItems }) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [values, setValues] = useState({});

  const setValue = (name, value) => setValues((prev) => ({ ...prev, [name]: value }));

  const handleOpen = () => {
    setValues({
      AssetId: item.assetId || "",
      TransferType: item.transferType || 1,
      ToLocationId: item.toLocationId || "",
      ToCustodianId: item.toCustodianId || "",
      ToDepartmentId: item.toDepartmentId || "",
      ToEntityId: item.toEntityId || "",
      Reason: item.reason || "",
    });
    setOpen(true);
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
      const response = await fetch(`${BASE_URL}/assets/transfers/${item.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          AssetId: Number(values.AssetId),
          TransferType: Number(values.TransferType),
          ToLocationId: values.ToLocationId ? Number(values.ToLocationId) : null,
          ToCustodianId: values.ToCustodianId ? Number(values.ToCustodianId) : null,
          ToDepartmentId: values.ToDepartmentId ? Number(values.ToDepartmentId) : null,
          ToEntityId: values.ToEntityId ? Number(values.ToEntityId) : null,
          Reason: values.Reason,
        }),
      });
      const data = await response.json();
      if (response.ok && (data.statusCode === 200 || data.isSuccess || data.status === "SUCCESS")) {
        toast.success(data.message || "Asset transfer updated");
        setOpen(false);
        fetchItems();
      } else {
        toast.error(data.message || "Failed to update transfer");
      }
    } catch (error) {
      console.error("Error updating transfer:", error);
      toast.error(error.message || "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Tooltip title={item.status === 1 ? "Edit" : "Only pending transfers can be edited"}>
        <span>
          <IconButton size="small" onClick={handleOpen} disabled={item.status !== 1}>
            <BorderColorIcon color={item.status === 1 ? "primary" : "disabled"} fontSize="inherit" />
          </IconButton>
        </span>
      </Tooltip>
      <Modal open={open} onClose={() => setOpen(false)}>
        <Box sx={style}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>Edit Asset Transfer</Typography>
            </Grid>
            <Grid item xs={12}>
              <AssetAutocomplete
                modalOpen={open}
                value={values.AssetId}
                onChange={(id) => setValue("AssetId", id)}
                transferableOnly
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Transfer Type</InputLabel>
                <Select label="Transfer Type" value={values.TransferType || 1} onChange={(e) => setValue("TransferType", e.target.value)}>
                  <MenuItem value={1}>Inter Department</MenuItem>
                  <MenuItem value={2}>Inter Entity</MenuItem>
                  <MenuItem value={3}>Custodian Change</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <LocationAutocomplete modalOpen={open} value={values.ToLocationId} onChange={(id) => setValue("ToLocationId", id)} label="To Location" />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth type="number" label="To Custodian Id" value={values.ToCustodianId || ""} onChange={(e) => setValue("ToCustodianId", e.target.value)} />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth type="number" label="To Department Id" value={values.ToDepartmentId || ""} onChange={(e) => setValue("ToDepartmentId", e.target.value)} />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth type="number" label="To Entity Id" value={values.ToEntityId || ""} onChange={(e) => setValue("ToEntityId", e.target.value)} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth multiline rows={3} label="Reason" value={values.Reason || ""} onChange={(e) => setValue("Reason", e.target.value)} />
            </Grid>
            <Grid item xs={12} display="flex" justifyContent="flex-end" gap={2}>
              <Button variant="outlined" color="error" onClick={() => setOpen(false)}>Cancel</Button>
              <Button variant="contained" disabled={submitting} onClick={handleSubmit}>{submitting ? "Saving..." : "Save"}</Button>
            </Grid>
          </Grid>
        </Box>
      </Modal>
    </>
  );
}
