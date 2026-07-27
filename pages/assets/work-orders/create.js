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
} from "@mui/material";
import { Field, Form, Formik } from "formik";
import BASE_URL from "Base/api";
import { toast } from "react-toastify";
import AssetAutocomplete from "@/components/Assets/AssetAutocomplete";
import { workOrderValidationSchema } from "@/components/utils/maintenanceValidation";

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

export default function CreateWorkOrder({ fetchItems }) {
  const [open, setOpen] = useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    const payload = {
      ...values,
      AssetId: Number(values.AssetId),
      WorkOrderType: Number(values.WorkOrderType),
      Priority: Number(values.Priority),
      Status: Number(values.Status),
    };

    try {
      const response = await fetch(`${BASE_URL}/maintenance/work-orders`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok && data.statusCode === 200) {
        toast.success(data.message || "Work Order created successfully");
        resetForm();
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
      <Button variant="contained" onClick={handleOpen}>
        + New Work Order
      </Button>

      <Modal open={open} onClose={handleClose} aria-labelledby="create-wo-modal">
        <Box sx={style}>
          <Formik
            initialValues={{
              WorkOrderNumber: `WO-${Date.now().toString().slice(-6)}`,
              AssetId: "",
              WorkOrderType: 1,
              Status: 1,
              Priority: 2,
              Description: "",
              ScheduledDate: "",
              EstimatedCost: 0,
            }}
            validationSchema={workOrderValidationSchema}
            onSubmit={handleSubmit}
          >
            {({ errors, touched, values, setFieldValue, isSubmitting }) => (
              <Form>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="h6" sx={{ fontWeight: "600", mb: 1 }}>
                      Create Maintenance Work Order
                    </Typography>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Field
                      as={TextField}
                      fullWidth
                      label="WO Number *"
                      name="WorkOrderNumber"
                      error={touched.WorkOrderNumber && Boolean(errors.WorkOrderNumber)}
                      helperText={touched.WorkOrderNumber && errors.WorkOrderNumber}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <AssetAutocomplete
                      modalOpen={open}
                      value={values.AssetId}
                      onChange={(id) => setFieldValue("AssetId", id)}
                      error={touched.AssetId && Boolean(errors.AssetId)}
                      helperText={touched.AssetId && errors.AssetId}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth error={touched.WorkOrderType && Boolean(errors.WorkOrderType)}>
                      <InputLabel>Type *</InputLabel>
                      <Field as={Select} name="WorkOrderType" label="Type *">
                        <MenuItem value={1}>Preventive</MenuItem>
                        <MenuItem value={2}>Corrective</MenuItem>
                        <MenuItem value={3}>Inspection</MenuItem>
                        <MenuItem value={4}>Emergency</MenuItem>
                      </Field>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth error={touched.Priority && Boolean(errors.Priority)}>
                      <InputLabel>Priority *</InputLabel>
                      <Field as={Select} name="Priority" label="Priority *">
                        <MenuItem value={1}>Low</MenuItem>
                        <MenuItem value={2}>Medium</MenuItem>
                        <MenuItem value={3}>High</MenuItem>
                        <MenuItem value={4}>Critical</MenuItem>
                      </Field>
                    </FormControl>
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
                      label="Scheduled Date"
                      name="ScheduledDate"
                      error={touched.ScheduledDate && Boolean(errors.ScheduledDate)}
                      helperText={touched.ScheduledDate && errors.ScheduledDate}
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

                  <Grid item xs={12} display="flex" justifyContent="flex-end" gap={2} mt={2}>
                    <Button variant="outlined" color="error" onClick={handleClose}>
                      Cancel
                    </Button>
                    <Button type="submit" variant="contained" color="primary" disabled={isSubmitting}>
                      {isSubmitting ? "Creating..." : "Create Work Order"}
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
