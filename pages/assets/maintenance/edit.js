import React, { useState } from "react";
import {
  Grid,
  Typography,
  Box,
  Button,
  Modal,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Tooltip,
  IconButton,
} from "@mui/material";
import { Field, Form, Formik } from "formik";
import BASE_URL from "Base/api";
import { toast } from "react-toastify";
import BorderColorIcon from "@mui/icons-material/BorderColor";
import AssetAutocomplete from "@/components/Assets/AssetAutocomplete";
import { scheduleValidationSchema } from "@/components/utils/maintenanceValidation";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { lg: 600, xs: 350 },
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 4,
  borderRadius: "10px",
  maxHeight: "90vh",
  overflowY: "auto",
};

export default function EditSchedule({ item, fetchItems }) {
  const [open, setOpen] = useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleSubmit = async (values, { setSubmitting }) => {
    const payload = {
      ...values,
      AssetId: Number(values.AssetId),
      MaintenanceType: Number(values.MaintenanceType),
      IntervalDays: Number(values.IntervalDays),
    };

    try {
      const response = await fetch(`${BASE_URL}/maintenance/schedules/${item.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok && data.statusCode === 200) {
        toast.success(data.message || "Schedule updated successfully");
        setOpen(false);
        fetchItems();
      } else {
        toast.error(data.message || "Operation failed");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("An error occurred");
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

      <Modal open={open} onClose={handleClose} aria-labelledby="edit-schedule-modal">
        <Box sx={style}>
          <Formik
            initialValues={{
              AssetId: item?.assetId || "",
              MaintenanceType: item?.maintenanceType || 1,
              Description: item?.description || "",
              IntervalDays: item?.intervalDays || 30,
              LastMaintenanceDate: item?.lastMaintenanceDate ? item.lastMaintenanceDate.split("T")[0] : "",
              NextMaintenanceDate: item?.nextMaintenanceDate ? item.nextMaintenanceDate.split("T")[0] : "",
              EstimatedCost: item?.estimatedCost || 0,
              IsActive: item ? item.isActive : true,
            }}
            validationSchema={scheduleValidationSchema}
            onSubmit={handleSubmit}
            enableReinitialize
          >
            {({ errors, touched, values, setFieldValue, isSubmitting }) => (
              <Form>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="h6" sx={{ fontWeight: "600", mb: 1 }}>
                      Edit Maintenance Schedule
                    </Typography>
                  </Grid>

                  <Grid item xs={12}>
                    <AssetAutocomplete
                      modalOpen={open}
                      value={values.AssetId}
                      onChange={(id) => setFieldValue("AssetId", id)}
                      error={touched.AssetId && Boolean(errors.AssetId)}
                      helperText={touched.AssetId && errors.AssetId}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth error={touched.MaintenanceType && Boolean(errors.MaintenanceType)}>
                      <InputLabel>Maintenance Type *</InputLabel>
                      <Field
                        as={Select}
                        name="MaintenanceType"
                        label="Maintenance Type *"
                      >
                        <MenuItem value={1}>Preventive</MenuItem>
                        <MenuItem value={2}>Corrective</MenuItem>
                        <MenuItem value={3}>Inspection</MenuItem>
                        <MenuItem value={4}>Emergency</MenuItem>
                      </Field>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Field
                      as={TextField}
                      fullWidth
                      type="number"
                      label="Interval (Days) *"
                      name="IntervalDays"
                      error={touched.IntervalDays && Boolean(errors.IntervalDays)}
                      helperText={touched.IntervalDays && errors.IntervalDays}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Field
                      as={TextField}
                      fullWidth
                      multiline
                      rows={2}
                      label="Description *"
                      name="Description"
                      error={touched.Description && Boolean(errors.Description)}
                      helperText={touched.Description && errors.Description}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Field
                      as={TextField}
                      fullWidth
                      type="date"
                      InputLabelProps={{ shrink: true }}
                      label="Last Maintenance"
                      name="LastMaintenanceDate"
                      error={touched.LastMaintenanceDate && Boolean(errors.LastMaintenanceDate)}
                      helperText={touched.LastMaintenanceDate && errors.LastMaintenanceDate}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Field
                      as={TextField}
                      fullWidth
                      type="date"
                      InputLabelProps={{ shrink: true }}
                      label="Next Maintenance *"
                      name="NextMaintenanceDate"
                      error={touched.NextMaintenanceDate && Boolean(errors.NextMaintenanceDate)}
                      helperText={touched.NextMaintenanceDate && errors.NextMaintenanceDate}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Field
                      as={TextField}
                      fullWidth
                      type="number"
                      label="Estimated Cost"
                      name="EstimatedCost"
                      error={touched.EstimatedCost && Boolean(errors.EstimatedCost)}
                      helperText={touched.EstimatedCost && errors.EstimatedCost}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={values.IsActive}
                          onChange={(e) => setFieldValue("IsActive", e.target.checked)}
                          color="primary"
                        />
                      }
                      label="Active"
                    />
                  </Grid>

                  <Grid item xs={12} display="flex" justifyContent="flex-end" gap={2} mt={2}>
                    <Button variant="outlined" color="error" onClick={handleClose}>
                      Cancel
                    </Button>
                    <Button type="submit" variant="contained" color="primary" disabled={isSubmitting}>
                      {isSubmitting ? "Updating..." : "Update Schedule"}
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
