import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Modal,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { Field, Form, Formik } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import BASE_URL from "Base/api";
import { DEFAULT_DELIVERY_TYPE_OPTIONS, getDeliveryTypeLabel, normalizeDeliveryTypeOptions } from "@/utils/delivery-methods";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { lg: 700, xs: "95%" },
  bgcolor: "background.paper",
  boxShadow: 24,
  p: { xs: 2, md: 3 },
  maxHeight: "90vh",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
};

const validationSchema = Yup.object().shape({
  Name: Yup.string().trim().required("Name is required"),
  BaseCharge: Yup.number()
    .typeError("Base charge must be a valid number")
    .min(0, "Base charge cannot be negative")
    .required("Base charge is required"),
  PerKMRate: Yup.number()
    .typeError("Per KM rate must be a valid number")
    .min(0, "Per KM rate cannot be negative")
    .nullable(),
  DeliveryType: Yup.mixed().required("Delivery type is required"),
  EstimatedDeliveryDays: Yup.number()
    .typeError("Estimated delivery days must be a valid number")
    .integer("Estimated delivery days must be a whole number")
    .min(0, "Estimated delivery days cannot be negative")
    .required("Estimated delivery days is required"),
  MinOrderAmount: Yup.number()
    .typeError("Minimum order amount must be a valid number")
    .min(0, "Minimum order amount cannot be negative")
    .nullable(),
  MaxOrderAmount: Yup.number()
    .typeError("Maximum order amount must be a valid number")
    .min(0, "Maximum order amount cannot be negative")
    .nullable(),
  TrackingUrlTemplate: Yup.string().trim().max(500, "Tracking URL template is too long"),
  CoverageAreas: Yup.string().trim().max(1000, "Coverage areas should be 1000 characters or less"),
  WeightBasedCharge: Yup.number()
    .typeError("Weight based charge must be a valid number")
    .min(0, "Weight based charge cannot be negative")
    .nullable(),
  Description: Yup.string().trim().max(2000, "Description is too long"),
});

const normalizeNumericField = (value) => {
  if (value === null || value === undefined) {
    return null;
  }
  if (value === "") {
    return null;
  }
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

export default function AddDeliveryMethodModal({ fetchItems, deliveryTypeOptions: externalOptions }) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [deliveryTypeOptions, setDeliveryTypeOptions] = useState(
    externalOptions && externalOptions.length > 0 ? externalOptions : DEFAULT_DELIVERY_TYPE_OPTIONS
  );

  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
    }
  }, [open]);

  useEffect(() => {
    if (externalOptions && externalOptions.length > 0) {
      setDeliveryTypeOptions(externalOptions);
      return;
    }

    if (!open) {
      return;
    }

    let isMounted = true;

    const fetchOptions = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${BASE_URL}/EnumLookup/DeliveryTypes`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          return;
        }

        const data = await response.json();
        const normalized = normalizeDeliveryTypeOptions(data);

        if (isMounted && normalized.length > 0) {
          setDeliveryTypeOptions(normalized);
        }
      } catch (error) {
        console.warn("Failed to load delivery type options:", error);
      }
    };

    fetchOptions();

    return () => {
      isMounted = false;
    };
  }, [externalOptions, open]);

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setImageFile(null);
    setImagePreview(null);
  };

  const handleImageChange = (event, setFieldValue) => {
    const file = event.currentTarget.files?.[0];
    if (!file) {
      setImageFile(null);
      setImagePreview(null);
      setFieldValue("ImageURL", null);
      return;
    }

    setImageFile(file);
    setFieldValue("ImageURL", file);

    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const buildFormData = (values) => {
    const formData = new FormData();

    const baseCharge = normalizeNumericField(values.BaseCharge);
    const estimatedDays = normalizeNumericField(values.EstimatedDeliveryDays);

    formData.append("Name", values.Name.trim());
    formData.append("IsActive", values.IsActive ? "true" : "false");
    formData.append("BaseCharge", baseCharge !== null ? String(baseCharge) : "0");
    formData.append("DeliveryType", String(Number(values.DeliveryType)));
    formData.append("SupportsCOD", values.SupportsCOD ? "true" : "false");
    formData.append("EstimatedDeliveryDays", estimatedDays !== null ? String(estimatedDays) : "0");

    const optionalNumericFields = [
      ["PerKMRate", values.PerKMRate],
      ["MinOrderAmount", values.MinOrderAmount],
      ["MaxOrderAmount", values.MaxOrderAmount],
      ["WeightBasedCharge", values.WeightBasedCharge],
    ];

    optionalNumericFields.forEach(([key, value]) => {
      const numericValue = normalizeNumericField(value);
      if (numericValue !== null) {
        formData.append(key, String(numericValue));
      }
    });

    if (values.TrackingUrlTemplate?.trim()) {
      formData.append("TrackingUrlTemplate", values.TrackingUrlTemplate.trim());
    }

    if (values.CoverageAreas?.trim()) {
      formData.append("CoverageAreas", values.CoverageAreas.trim());
    }

    if (values.Description?.trim()) {
      formData.append("Description", values.Description.trim());
    }

    if (values.ImageURL instanceof File) {
      formData.append("ImageURL", values.ImageURL);
    }

    return formData;
  };

  const handleSubmit = async (values, { resetForm }) => {
    try {
      setSubmitting(true);
      const token = localStorage.getItem("token");
      const formData = buildFormData(values);

      const response = await fetch(`${BASE_URL}/DeliveryMethods/CreateDeliveryMethod`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || data.statusCode !== 200) {
        throw new Error(data.message || "Failed to create delivery method");
      }

      toast.success(data.message || "Delivery method created successfully.");
      resetForm();
      handleClose();
      if (typeof fetchItems === "function") {
        fetchItems(true);
      }
    } catch (error) {
      toast.error(error.message || "Unable to create delivery method");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Button variant="contained" onClick={handleOpen}>
        + Add Delivery Method
      </Button>
      <Modal open={open} onClose={handleClose}>
        <Box sx={style} className="bg-black">
          <Typography variant="h6" fontWeight={600} mb={2}>
            Create Delivery Method
          </Typography>
          <Formik
            initialValues={{
              Name: "",
              BaseCharge: "",
              PerKMRate: "",
              DeliveryType: "",
              EstimatedDeliveryDays: "",
              MinOrderAmount: "",
              MaxOrderAmount: "",
              TrackingUrlTemplate: "",
              CoverageAreas: "",
              WeightBasedCharge: "",
              Description: "",
              IsActive: true,
              SupportsCOD: false,
              ImageURL: null,
            }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ errors, touched, setFieldValue, values }) => (
              <Form style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
                <Box sx={{ flexGrow: 1, overflowY: "auto", pr: 1, minHeight: 0 }}>
                  <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography fontWeight={500} fontSize={14} mb={0.5}>
                      Name *
                    </Typography>
                    <Field
                      as={TextField}
                      fullWidth
                      name="Name"
                      size="small"
                      inputRef={inputRef}
                      error={touched.Name && Boolean(errors.Name)}
                      helperText={touched.Name && errors.Name}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography fontWeight={500} fontSize={14} mb={0.5}>
                      Delivery Type *
                    </Typography>
                    <FormControl fullWidth size="small" error={touched.DeliveryType && Boolean(errors.DeliveryType)}>
                      <InputLabel>Delivery Type</InputLabel>
                      <Field
                        as={Select}
                        label="Delivery Type"
                        name="DeliveryType"
                        value={values.DeliveryType}
                      >
                        {deliveryTypeOptions.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {getDeliveryTypeLabel(option.value, deliveryTypeOptions)}
                          </MenuItem>
                        ))}
                      </Field>
                    </FormControl>
                    {touched.DeliveryType && errors.DeliveryType && (
                      <Typography variant="caption" color="error">
                        {errors.DeliveryType}
                      </Typography>
                    )}
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Typography fontWeight={500} fontSize={14} mb={0.5}>
                      Base Charge *
                    </Typography>
                    <Field
                      as={TextField}
                      fullWidth
                      name="BaseCharge"
                      size="small"
                      type="number"
                      inputProps={{ min: 0, step: "0.01" }}
                      error={touched.BaseCharge && Boolean(errors.BaseCharge)}
                      helperText={touched.BaseCharge && errors.BaseCharge}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography fontWeight={500} fontSize={14} mb={0.5}>
                      Per KM Rate
                    </Typography>
                    <Field
                      as={TextField}
                      fullWidth
                      name="PerKMRate"
                      size="small"
                      type="number"
                      inputProps={{ min: 0, step: "0.01" }}
                      error={touched.PerKMRate && Boolean(errors.PerKMRate)}
                      helperText={touched.PerKMRate && errors.PerKMRate}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Typography fontWeight={500} fontSize={14} mb={0.5}>
                      Estimated Delivery Days *
                    </Typography>
                    <Field
                      as={TextField}
                      fullWidth
                      name="EstimatedDeliveryDays"
                      size="small"
                      type="number"
                      inputProps={{ min: 0, step: 1 }}
                      error={touched.EstimatedDeliveryDays && Boolean(errors.EstimatedDeliveryDays)}
                      helperText={touched.EstimatedDeliveryDays && errors.EstimatedDeliveryDays}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography fontWeight={500} fontSize={14} mb={0.5}>
                      Weight Based Charge (per kg)
                    </Typography>
                    <Field
                      as={TextField}
                      fullWidth
                      name="WeightBasedCharge"
                      size="small"
                      type="number"
                      inputProps={{ min: 0, step: "0.01" }}
                      error={touched.WeightBasedCharge && Boolean(errors.WeightBasedCharge)}
                      helperText={touched.WeightBasedCharge && errors.WeightBasedCharge}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Typography fontWeight={500} fontSize={14} mb={0.5}>
                      Min Order Amount
                    </Typography>
                    <Field
                      as={TextField}
                      fullWidth
                      name="MinOrderAmount"
                      size="small"
                      type="number"
                      inputProps={{ min: 0, step: "0.01" }}
                      error={touched.MinOrderAmount && Boolean(errors.MinOrderAmount)}
                      helperText={touched.MinOrderAmount && errors.MinOrderAmount}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography fontWeight={500} fontSize={14} mb={0.5}>
                      Max Order Amount
                    </Typography>
                    <Field
                      as={TextField}
                      fullWidth
                      name="MaxOrderAmount"
                      size="small"
                      type="number"
                      inputProps={{ min: 0, step: "0.01" }}
                      error={touched.MaxOrderAmount && Boolean(errors.MaxOrderAmount)}
                      helperText={touched.MaxOrderAmount && errors.MaxOrderAmount}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Typography fontWeight={500} fontSize={14} mb={0.5}>
                      Tracking URL Template
                    </Typography>
                    <Field
                      as={TextField}
                      fullWidth
                      name="TrackingUrlTemplate"
                      size="small"
                      placeholder="https://tracking.example.com/{trackingNumber}"
                      error={touched.TrackingUrlTemplate && Boolean(errors.TrackingUrlTemplate)}
                      helperText={touched.TrackingUrlTemplate && errors.TrackingUrlTemplate}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Typography fontWeight={500} fontSize={14} mb={0.5}>
                      Coverage Areas (comma-separated)
                    </Typography>
                    <Field
                      as={TextField}
                      fullWidth
                      name="CoverageAreas"
                      size="small"
                      multiline
                      minRows={2}
                      placeholder="Colombo, Galle, 10001, 10002"
                      error={touched.CoverageAreas && Boolean(errors.CoverageAreas)}
                      helperText={touched.CoverageAreas && errors.CoverageAreas}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Typography fontWeight={500} fontSize={14} mb={0.5}>
                      Description
                    </Typography>
                    <Field
                      as={TextField}
                      fullWidth
                      name="Description"
                      size="small"
                      multiline
                      minRows={3}
                      placeholder="Add additional details about the delivery method..."
                      error={touched.Description && Boolean(errors.Description)}
                      helperText={touched.Description && errors.Description}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <FormControlLabel
                      control={
                        <Field
                          as={Checkbox}
                          name="IsActive"
                          checked={values.IsActive}
                          onChange={() => setFieldValue("IsActive", !values.IsActive)}
                        />
                      }
                      label="Is Active"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControlLabel
                      control={
                        <Field
                          as={Checkbox}
                          name="SupportsCOD"
                          checked={values.SupportsCOD}
                          onChange={() => setFieldValue("SupportsCOD", !values.SupportsCOD)}
                        />
                      }
                      label="Supports Cash on Delivery"
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Box display="flex" flexDirection="column" gap={1}>
                      <Typography fontWeight={500} fontSize={14}>
                        Image
                      </Typography>
                      <Button variant="outlined" component="label">
                        {imageFile ? "Change Image" : "Upload Image"}
                        <input
                          type="file"
                          accept="image/*"
                          hidden
                          onChange={(event) => handleImageChange(event, setFieldValue)}
                        />
                      </Button>
                      {imagePreview && (
                        <Box
                          component="img"
                          src={imagePreview}
                          alt="Delivery method preview"
                          sx={{ width: "100%", maxHeight: 200, objectFit: "contain", borderRadius: 1 }}
                        />
                      )}
                    </Box>
                  </Grid>
                  </Grid>
                </Box>

                <Box display="flex" justifyContent="flex-end" gap={2} mt={3}>
                  <Button variant="outlined" color="inherit" onClick={handleClose} disabled={submitting}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="contained" disabled={submitting}>
                    {submitting ? "Saving..." : "Save"}
                  </Button>
                </Box>
              </Form>
            )}
          </Formik>
        </Box>
      </Modal>
    </>
  );
}

