import React, { useEffect, useRef, useState } from "react";
import {
  Grid,
  Typography,
  Tooltip,
  IconButton,
} from "@mui/material";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Modal from "@mui/material/Modal";
import TextField from "@mui/material/TextField";
import { Field, Form, Formik } from "formik";
import BASE_URL from "Base/api";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import BorderColorIcon from "@mui/icons-material/BorderColor";
import CategoryAutocomplete from "./CategoryAutocomplete";
import LocationAutocomplete from "./LocationAutocomplete";
import CurrencyAutocomplete from "./CurrencyAutocomplete";
import { assetValidationSchema } from "../../../components/utils/assetValidation";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { lg: 900, xs: 350 },
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 4,
  borderRadius: "10px",
  maxHeight: "90vh",
  overflowY: "auto",
};

export default function EditAsset({ item, fetchItems }) {
  const [open, setOpen] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
      }, 100);
    }
  }, [open]);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleSubmit = async (values, { setSubmitting }) => {
    const payload = {
      assetCode: values.AssetCode,
      assetName: values.AssetName,
      categoryId: values.CategoryId,
      serialNumber: values.SerialNumber || null,
      modelNumber: values.ModelNumber || null,
      vendorId: values.VendorId || null,
      purchaseDate: values.PurchaseDate,
      purchaseCost: values.PurchaseCost,
      currencyCode: values.CurrencyCode,
      locationId: values.LocationId || null,
      custodianId: values.CustodianId || null,
      departmentId: values.DepartmentId || null,
      entityId: values.EntityId,
      barcode: values.Barcode || null,
      warrantyExpiry: values.WarrantyExpiry || null,
      usefulLifeMonths: values.UsefulLifeMonths,
      salvageValue: values.SalvageValue || null,
      poNumber: values.PoNumber || null,
      grnNumber: values.GrnNumber || null,
      reducingBalanceRate: values.ReducingBalanceRate || null,
      totalProductionUnits: values.TotalProductionUnits || null,
      unitsUsedToDate: values.UnitsUsedToDate || null,
      notes: values.Notes || null,
    };

    try {
      const response = await fetch(`${BASE_URL}/assets/${item.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      let data = {};
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const textData = await response.text();
        data = { message: textData };
      }

      if (
        response.ok &&
        (data.statusCode === 200 || data.isSuccess || data.status === "SUCCESS" || (!data.statusCode && !data.isSuccess && !data.status))
      ) {
        toast.success(data.message || "Asset updated successfully");
        setOpen(false);
        fetchItems();
      } else {
        let errorMessage = data.message || data.title || "Failed to update asset";
        if (data.errors && typeof data.errors === "object") {
          errorMessage = Object.values(data.errors).flat().join(" | ");
        } else if (data.detail) {
          errorMessage = data.detail;
        }
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error("Error updating asset:", error);
      toast.error(error.message || "An error occurred while updating the asset");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Tooltip title="Edit" placement="top">
        <IconButton onClick={handleOpen} aria-label="edit" size="small">
          <BorderColorIcon color="primary" fontSize="inherit" />
        </IconButton>
      </Tooltip>

      <Modal open={open} onClose={handleClose} aria-labelledby="edit-asset-modal">
        <Box sx={style}>
          <Formik
            initialValues={{
              AssetCode: item.assetCode || "",
              AssetName: item.assetName || "",
              CategoryId: item.categoryId || "",
              SerialNumber: item.serialNumber || "",
              ModelNumber: item.modelNumber || "",
              VendorId: item.vendorId || "",
              PurchaseDate: item.purchaseDate ? item.purchaseDate.split("T")[0] : "",
              PurchaseCost: item.purchaseCost || "",
              CurrencyCode: item.currencyCode || "LKR",
              LocationId: item.locationId || "",
              CustodianId: item.custodianId || "",
              DepartmentId: item.departmentId || "",
              EntityId: item.entityId || 1,
              Barcode: item.barcode || "",
              WarrantyExpiry: item.warrantyExpiry ? item.warrantyExpiry.split("T")[0] : "",
              UsefulLifeMonths: item.usefulLifeMonths || "",
              SalvageValue: item.salvageValue || "",
              PoNumber: item.poNumber || "",
              GrnNumber: item.grnNumber || "",
              ReducingBalanceRate: item.reducingBalanceRate || "",
              TotalProductionUnits: item.totalProductionUnits || "",
              UnitsUsedToDate: item.unitsUsedToDate || "",
              Notes: item.notes || "",
            }}
            validationSchema={assetValidationSchema}
            onSubmit={handleSubmit}
          >
            {({ errors, touched, values, setFieldValue, isSubmitting }) => (
              <Form>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="h5" sx={{ fontWeight: "600", mb: 2 }}>
                      Edit Asset
                    </Typography>
                  </Grid>

                  {/* General Info */}
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="primary">General Information</Typography>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Field
                      as={TextField}
                      fullWidth
                      label="Asset Code *"
                      name="AssetCode"
                      inputRef={inputRef}
                      error={touched.AssetCode && Boolean(errors.AssetCode)}
                      helperText={touched.AssetCode && errors.AssetCode}
                    />
                  </Grid>
                  <Grid item xs={12} md={8}>
                    <Field
                      as={TextField}
                      fullWidth
                      label="Asset Name *"
                      name="AssetName"
                      error={touched.AssetName && Boolean(errors.AssetName)}
                      helperText={touched.AssetName && errors.AssetName}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <CategoryAutocomplete
                      modalOpen={open}
                      value={values.CategoryId}
                      onChange={(id) => setFieldValue("CategoryId", id === "" ? "" : id)}
                      error={touched.CategoryId && Boolean(errors.CategoryId)}
                      helperText={touched.CategoryId && errors.CategoryId}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <LocationAutocomplete
                      modalOpen={open}
                      value={values.LocationId}
                      onChange={(id) => setFieldValue("LocationId", id === "" ? "" : id)}
                      error={touched.LocationId && Boolean(errors.LocationId)}
                      helperText={touched.LocationId && errors.LocationId}
                    />
                  </Grid>

                  {/* Procurement */}
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="primary" sx={{ mt: 1 }}>Procurement & Financials</Typography>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Field
                      as={TextField}
                      fullWidth
                      type="date"
                      InputLabelProps={{ shrink: true }}
                      label="Purchase Date *"
                      name="PurchaseDate"
                      error={touched.PurchaseDate && Boolean(errors.PurchaseDate)}
                      helperText={touched.PurchaseDate && errors.PurchaseDate}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Field
                      as={TextField}
                      fullWidth
                      type="number"
                      label="Purchase Cost *"
                      name="PurchaseCost"
                      inputProps={{ step: "0.01", min: 0 }}
                      error={touched.PurchaseCost && Boolean(errors.PurchaseCost)}
                      helperText={touched.PurchaseCost && errors.PurchaseCost}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <CurrencyAutocomplete
                      modalOpen={open}
                      value={values.CurrencyCode}
                      onChange={(code) => setFieldValue("CurrencyCode", code || "LKR")}
                      error={touched.CurrencyCode && Boolean(errors.CurrencyCode)}
                      helperText={touched.CurrencyCode && errors.CurrencyCode}
                    />
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Field
                      as={TextField}
                      fullWidth
                      type="number"
                      label="Useful Life (Months) *"
                      name="UsefulLifeMonths"
                      error={touched.UsefulLifeMonths && Boolean(errors.UsefulLifeMonths)}
                      helperText={touched.UsefulLifeMonths && errors.UsefulLifeMonths}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Field
                      as={TextField}
                      fullWidth
                      type="number"
                      label="Salvage Value"
                      name="SalvageValue"
                      inputProps={{ step: "0.01", min: 0 }}
                      error={touched.SalvageValue && Boolean(errors.SalvageValue)}
                      helperText={touched.SalvageValue && errors.SalvageValue}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Field
                      as={TextField}
                      fullWidth
                      type="number"
                      label="Reducing Balance Rate (%)"
                      name="ReducingBalanceRate"
                      inputProps={{ step: "0.01", min: 0, max: 100 }}
                      error={touched.ReducingBalanceRate && Boolean(errors.ReducingBalanceRate)}
                      helperText={touched.ReducingBalanceRate && errors.ReducingBalanceRate}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Field
                      as={TextField}
                      fullWidth
                      label="PO Number"
                      name="PoNumber"
                      error={touched.PoNumber && Boolean(errors.PoNumber)}
                      helperText={touched.PoNumber && errors.PoNumber}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Field
                      as={TextField}
                      fullWidth
                      label="GRN Number"
                      name="GrnNumber"
                      error={touched.GrnNumber && Boolean(errors.GrnNumber)}
                      helperText={touched.GrnNumber && errors.GrnNumber}
                    />
                  </Grid>

                  {/* Identification */}
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="primary" sx={{ mt: 1 }}>Identification & Usage</Typography>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Field
                      as={TextField}
                      fullWidth
                      label="Serial Number"
                      name="SerialNumber"
                      error={touched.SerialNumber && Boolean(errors.SerialNumber)}
                      helperText={touched.SerialNumber && errors.SerialNumber}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Field
                      as={TextField}
                      fullWidth
                      label="Model Number"
                      name="ModelNumber"
                      error={touched.ModelNumber && Boolean(errors.ModelNumber)}
                      helperText={touched.ModelNumber && errors.ModelNumber}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Field
                      as={TextField}
                      fullWidth
                      label="Barcode"
                      name="Barcode"
                      error={touched.Barcode && Boolean(errors.Barcode)}
                      helperText={touched.Barcode && errors.Barcode}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Field
                      as={TextField}
                      fullWidth
                      type="number"
                      label="Total Production Units (Optional)"
                      name="TotalProductionUnits"
                      error={touched.TotalProductionUnits && Boolean(errors.TotalProductionUnits)}
                      helperText={touched.TotalProductionUnits && errors.TotalProductionUnits}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Field
                      as={TextField}
                      fullWidth
                      type="number"
                      label="Units Used To Date (Optional)"
                      name="UnitsUsedToDate"
                      error={touched.UnitsUsedToDate && Boolean(errors.UnitsUsedToDate)}
                      helperText={touched.UnitsUsedToDate && errors.UnitsUsedToDate}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Field
                      as={TextField}
                      fullWidth
                      type="date"
                      InputLabelProps={{ shrink: true }}
                      label="Warranty Expiry"
                      name="WarrantyExpiry"
                      error={touched.WarrantyExpiry && Boolean(errors.WarrantyExpiry)}
                      helperText={touched.WarrantyExpiry && errors.WarrantyExpiry}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                     <Field
                        as={TextField}
                        fullWidth
                        type="number"
                        label="Entity Id *"
                        name="EntityId"
                        error={touched.EntityId && Boolean(errors.EntityId)}
                        helperText={touched.EntityId && errors.EntityId}
                      />
                  </Grid>

                  <Grid item xs={12}>
                    <Field
                      as={TextField}
                      fullWidth
                      multiline
                      rows={2}
                      label="Notes"
                      name="Notes"
                      error={touched.Notes && Boolean(errors.Notes)}
                      helperText={touched.Notes && errors.Notes}
                    />
                  </Grid>

                  {/* Buttons */}
                  <Grid item xs={12} display="flex" justifyContent="flex-end" gap={2} mt={2}>
                    <Button variant="outlined" color="error" onClick={handleClose}>
                      Cancel
                    </Button>
                    <Button type="submit" variant="contained" color="primary" disabled={isSubmitting}>
                      {isSubmitting ? "Updating..." : "Update Asset"}
                    </Button>
                  </Grid>
                </Grid>
              </Form>
            )}
          </Formik>
        </Box>
      </Modal>
    </>
  );
}
