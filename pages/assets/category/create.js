import React, { useEffect, useRef, useState } from "react";
import {
  Grid,
  Typography,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  FormHelperText,
  Switch,
  FormControlLabel,
} from "@mui/material";
import ParentCategoryAutocomplete from "./ParentCategoryAutocomplete";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Modal from "@mui/material/Modal";
import TextField from "@mui/material/TextField";
import { Field, Form, Formik } from "formik";
import BASE_URL from "Base/api";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { assetCategoryValidationSchema } from "../../../components/utils/assetCategoryValidation";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { lg: 700, xs: 350 },
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 4,
  borderRadius: "10px",
  maxHeight: "90vh",
  overflowY: "auto",
};

const depreciationMethods = [
  { value: 1, label: "Straight Line" },
  { value: 2, label: "Reducing Balance" },
  { value: 3, label: "Units of Production" },
  { value: 4, label: "No Depreciation" },
];

export default function AddAssetCategory({ fetchItems }) {
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

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    const payload = {
      categoryCode: values.CategoryCode,
      categoryName: values.CategoryName,
      parentCategoryId: values.ParentCategoryId || null,
      depreciationMethod: values.DepreciationMethod,
      defaultUsefulLifeMonths: values.DefaultUsefulLifeMonths,
      defaultSalvagePct: values.DefaultSalvagePct,
      glAssetAccount: values.GlAssetAccount,
      glAccumDepreciationAccount: values.GlAccumDepreciationAccount,
      glDepreciationExpenseAccount: values.GlDepreciationExpenseAccount,
      requiresMaintenance: values.RequiresMaintenance,
      maintenanceIntervalDays: values.RequiresMaintenance
        ? values.MaintenanceIntervalDays || null
        : null,
      isActive: values.IsActive,
    };

    try {
      console.log(payload);
      const response = await fetch(`${BASE_URL}/asset-categories`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (
        response.ok &&
        (data.statusCode === 200 || data.isSuccess || data.status === "SUCCESS")
      ) {
        toast.success(data.message || "Asset category created successfully");
        resetForm();
        setOpen(false);
        fetchItems();
      } else {
        toast.error(data.message || "Failed to create asset category");
      }
    } catch (error) {
      console.error("Error creating asset category:", error);
      toast.error("An error occurred while creating the asset category");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Button variant="outlined" onClick={handleOpen}>
        + Add New
      </Button>

      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="add-asset-category-modal"
      >
        <Box sx={style}>
          <Formik
            initialValues={{
              CategoryCode: "",
              CategoryName: "",
              ParentCategoryId: "",
              DepreciationMethod: "",
              DefaultUsefulLifeMonths: 60,
              DefaultSalvagePct: 0,
              GlAssetAccount: "",
              GlAccumDepreciationAccount: "",
              GlDepreciationExpenseAccount: "",
              RequiresMaintenance: false,
              MaintenanceIntervalDays: "",
              IsActive: true,
            }}
            validationSchema={assetCategoryValidationSchema}
            onSubmit={handleSubmit}
          >
            {({ errors, touched, values, setFieldValue, isSubmitting }) => (
              <Form>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography
                      variant="h5"
                      sx={{ fontWeight: "600", mb: 2 }}
                    >
                      Add New Asset Category
                    </Typography>
                  </Grid>

                  {/* Category Code */}
                  <Grid item xs={12} md={4}>
                    <Field
                      as={TextField}
                      fullWidth
                      label="Category Code *"
                      name="CategoryCode"
                      inputRef={inputRef}
                      inputProps={{ maxLength: 20 }}
                      error={
                        touched.CategoryCode && Boolean(errors.CategoryCode)
                      }
                      helperText={touched.CategoryCode && errors.CategoryCode}
                    />
                  </Grid>

                  {/* Category Name */}
                  <Grid item xs={12} md={8}>
                    <Field
                      as={TextField}
                      fullWidth
                      label="Category Name *"
                      name="CategoryName"
                      inputProps={{ maxLength: 100 }}
                      error={
                        touched.CategoryName && Boolean(errors.CategoryName)
                      }
                      helperText={touched.CategoryName && errors.CategoryName}
                    />
                  </Grid>

                  {/* Parent Category — searchable; first 5 from API, then search */}
                  <Grid item xs={12} md={6}>
                    <ParentCategoryAutocomplete
                      modalOpen={open}
                      value={values.ParentCategoryId}
                      onChange={(id) =>
                        setFieldValue("ParentCategoryId", id === "" ? "" : id)
                      }
                      error={
                        touched.ParentCategoryId &&
                        Boolean(errors.ParentCategoryId)
                      }
                      helperText={
                        touched.ParentCategoryId && errors.ParentCategoryId
                      }
                    />
                  </Grid>

                  {/* Depreciation Method */}
                  <Grid item xs={12} md={6}>
                    <FormControl
                      fullWidth
                      error={
                        touched.DepreciationMethod &&
                        Boolean(errors.DepreciationMethod)
                      }
                    >
                      <InputLabel>Depreciation Method *</InputLabel>
                      <Field
                        as={Select}
                        name="DepreciationMethod"
                        label="Depreciation Method *"
                      >
                        {depreciationMethods.map((m) => (
                          <MenuItem key={m.value} value={m.value}>
                            {m.label}
                          </MenuItem>
                        ))}
                      </Field>
                      {touched.DepreciationMethod &&
                        errors.DepreciationMethod && (
                          <FormHelperText>
                            {errors.DepreciationMethod}
                          </FormHelperText>
                        )}
                    </FormControl>
                  </Grid>

                  {/* Useful Life */}
                  <Grid item xs={12} md={6}>
                    <Field
                      as={TextField}
                      fullWidth
                      type="number"
                      label="Useful Life (Months) *"
                      name="DefaultUsefulLifeMonths"
                      inputProps={{ min: 1, max: 1200, step: 1 }}
                      error={
                        touched.DefaultUsefulLifeMonths &&
                        Boolean(errors.DefaultUsefulLifeMonths)
                      }
                      helperText={
                        touched.DefaultUsefulLifeMonths &&
                        errors.DefaultUsefulLifeMonths
                          ? errors.DefaultUsefulLifeMonths
                          : "e.g. 60 = 5 years"
                      }
                    />
                  </Grid>

                  {/* Salvage % */}
                  <Grid item xs={12} md={6}>
                    <Field
                      as={TextField}
                      fullWidth
                      type="number"
                      label="Salvage % * (e.g. 10 = 10%)"
                      name="DefaultSalvagePct"
                      inputProps={{ min: 0, max: 100, step: "0.01" }}
                      error={
                        touched.DefaultSalvagePct &&
                        Boolean(errors.DefaultSalvagePct)
                      }
                      helperText={
                        touched.DefaultSalvagePct && errors.DefaultSalvagePct
                      }
                    />
                  </Grid>

                  {/* GL Accounts */}
                  <Grid item xs={12} md={4}>
                    <Field
                      as={TextField}
                      fullWidth
                      label="GL Asset A/C *"
                      name="GlAssetAccount"
                      inputProps={{ maxLength: 50 }}
                      error={
                        touched.GlAssetAccount &&
                        Boolean(errors.GlAssetAccount)
                      }
                      helperText={
                        touched.GlAssetAccount && errors.GlAssetAccount
                          ? errors.GlAssetAccount
                          : "e.g. 1500"
                      }
                    />
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Field
                      as={TextField}
                      fullWidth
                      label="GL Accum. Depr. A/C *"
                      name="GlAccumDepreciationAccount"
                      inputProps={{ maxLength: 50 }}
                      error={
                        touched.GlAccumDepreciationAccount &&
                        Boolean(errors.GlAccumDepreciationAccount)
                      }
                      helperText={
                        touched.GlAccumDepreciationAccount &&
                        errors.GlAccumDepreciationAccount
                          ? errors.GlAccumDepreciationAccount
                          : "e.g. 1510"
                      }
                    />
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Field
                      as={TextField}
                      fullWidth
                      label="GL Depr. Expense A/C *"
                      name="GlDepreciationExpenseAccount"
                      inputProps={{ maxLength: 50 }}
                      error={
                        touched.GlDepreciationExpenseAccount &&
                        Boolean(errors.GlDepreciationExpenseAccount)
                      }
                      helperText={
                        touched.GlDepreciationExpenseAccount &&
                        errors.GlDepreciationExpenseAccount
                          ? errors.GlDepreciationExpenseAccount
                          : "e.g. 6100"
                      }
                    />
                  </Grid>

                  {/* Toggles */}
                  <Grid item xs={12} display="flex" gap={3}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={values.RequiresMaintenance}
                          onChange={(e) =>
                            setFieldValue(
                              "RequiresMaintenance",
                              e.target.checked
                            )
                          }
                        />
                      }
                      label="Requires Maintenance"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={values.IsActive}
                          onChange={(e) =>
                            setFieldValue("IsActive", e.target.checked)
                          }
                        />
                      }
                      label="Active"
                    />
                  </Grid>

                  {/* Maintenance Interval — only when RequiresMaintenance is on */}
                  {values.RequiresMaintenance && (
                    <Grid item xs={12} md={6}>
                      <Field
                        as={TextField}
                        fullWidth
                        type="number"
                        label="Maintenance Interval (Days) *"
                        name="MaintenanceIntervalDays"
                        inputProps={{ min: 1, max: 3650, step: 1 }}
                        error={
                          touched.MaintenanceIntervalDays &&
                          Boolean(errors.MaintenanceIntervalDays)
                        }
                        helperText={
                          touched.MaintenanceIntervalDays &&
                          errors.MaintenanceIntervalDays
                            ? errors.MaintenanceIntervalDays
                            : "e.g. 90 = every 3 months"
                        }
                      />
                    </Grid>
                  )}

                  {/* Buttons */}
                  <Grid
                    item
                    xs={12}
                    display="flex"
                    justifyContent="flex-end"
                    gap={2}
                    mt={2}
                  >
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={handleClose}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Saving..." : "Save Category"}
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
