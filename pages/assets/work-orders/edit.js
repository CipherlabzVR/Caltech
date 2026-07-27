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
  Tooltip,
  IconButton,
} from "@mui/material";
import { Field, Form, Formik } from "formik";
import BASE_URL from "Base/api";
import { toast } from "react-toastify";
import BorderColorIcon from "@mui/icons-material/BorderColor";
import AssetAutocomplete from "@/components/Assets/AssetAutocomplete";
import { workOrderEditValidationSchema } from "@/components/utils/maintenanceValidation";

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

export default function EditWorkOrder({ item, fetchItems }) {
  const [open, setOpen] = useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleSubmit = async (values, { setSubmitting }) => {
    const emptyToNull = (v) => {
      if (v === null || v === undefined) return null;
      const s = String(v).trim();
      return s === "" ? null : s;
    };

    const numOrNull = (v) => {
      if (v === "" || v === null || v === undefined) return null;
      const n = Number(v);
      return Number.isNaN(n) ? null : n;
    };

    const payload = {
      WorkOrderNumber: String(values.WorkOrderNumber || "").trim(),
      AssetId: Number(values.AssetId),
      WorkOrderType: Number(values.WorkOrderType),
      Priority: Number(values.Priority),
      Status: Number(values.Status),
      Description: String(values.Description || "").trim(),
      ScheduledDate: emptyToNull(values.ScheduledDate),
      StartedOn: emptyToNull(values.StartedOn),
      CompletedOn: emptyToNull(values.CompletedOn),
      EstimatedCost: numOrNull(values.EstimatedCost),
      ActualCost: numOrNull(values.ActualCost),
      ResolutionNotes: values.ResolutionNotes != null && String(values.ResolutionNotes).trim() !== ""
        ? String(values.ResolutionNotes).trim()
        : null,
      FaultDetails: null,
      AssignedToId: null,
      DowntimeHours: null,
      NextMaintenanceDate: null,
      MaintenanceScheduleId:
        item?.maintenanceScheduleId ?? item?.MaintenanceScheduleId ?? null,
    };

    if (
      payload.MaintenanceScheduleId !== null &&
      payload.MaintenanceScheduleId !== undefined &&
      payload.MaintenanceScheduleId !== ""
    ) {
      payload.MaintenanceScheduleId = Number(payload.MaintenanceScheduleId);
    } else {
      payload.MaintenanceScheduleId = null;
    }

    try {
      const response = await fetch(`${BASE_URL}/maintenance/work-orders/${item.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      let data = {};
      try {
        data = await response.json();
      } catch {
        /* non-JSON body */
      }

      const apiStatus = data.statusCode ?? data.StatusCode;
      const success = response.ok && Number(apiStatus) === 200;

      if (success) {
        toast.success(data.message || "Work Order updated successfully");
        setOpen(false);
        fetchItems();
      } else {
        const msg =
          data.message ||
          data.Message ||
          data.title ||
          (typeof data.errors === "object" ? JSON.stringify(data.errors) : null) ||
          "Operation failed";
        toast.error(msg);
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

      <Modal open={open} onClose={handleClose} aria-labelledby="edit-wo-modal">
        <Box sx={style}>
          <Formik
            initialValues={{
              WorkOrderNumber: item?.workOrderNumber || item?.WorkOrderNumber || "",
              AssetId: item?.assetId ?? item?.asset?.id ?? item?.AssetId ?? "",
              WorkOrderType: item?.workOrderType ?? item?.WorkOrderType ?? 1,
              Status: item?.status ?? item?.Status ?? 1,
              Priority: item?.priority ?? item?.Priority ?? 2,
              Description: item?.description || item?.Description || "",
              ScheduledDate: item?.scheduledDate
                ? String(item.scheduledDate).split("T")[0]
                : item?.ScheduledDate
                  ? String(item.ScheduledDate).split("T")[0]
                  : "",
              StartedOn: item?.startedOn
                ? String(item.startedOn).split("T")[0]
                : item?.StartedOn
                  ? String(item.StartedOn).split("T")[0]
                  : "",
              CompletedOn: item?.completedOn
                ? String(item.completedOn).split("T")[0]
                : item?.CompletedOn
                  ? String(item.CompletedOn).split("T")[0]
                  : "",
              EstimatedCost: item?.estimatedCost ?? item?.EstimatedCost ?? 0,
              ActualCost: item?.actualCost ?? item?.ActualCost ?? 0,
              ResolutionNotes: item?.resolutionNotes || item?.ResolutionNotes || "",
            }}
            validationSchema={workOrderEditValidationSchema}
            onSubmit={handleSubmit}
            enableReinitialize
          >
            {({ errors, touched, values, setFieldValue, isSubmitting }) => (
              <Form>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="h6" sx={{ fontWeight: "600", mb: 1 }}>
                      Edit Work Order: {values.WorkOrderNumber}
                    </Typography>
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
                    <FormControl fullWidth error={touched.Status && Boolean(errors.Status)}>
                      <InputLabel>Status *</InputLabel>
                      <Field as={Select} name="Status" label="Status *">
                        <MenuItem value={1}>Open</MenuItem>
                        <MenuItem value={2}>In Progress</MenuItem>
                        <MenuItem value={3}>On Hold</MenuItem>
                        <MenuItem value={4}>Completed</MenuItem>
                        <MenuItem value={5}>Cancelled</MenuItem>
                      </Field>
                    </FormControl>
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
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Field
                      as={TextField}
                      fullWidth
                      type="number"
                      label="Actual Cost"
                      name="ActualCost"
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Field
                      as={TextField}
                      fullWidth
                      multiline
                      rows={2}
                      label="Resolution Notes"
                      name="ResolutionNotes"
                    />
                  </Grid>

                  <Grid item xs={12} display="flex" justifyContent="flex-end" gap={2} mt={2}>
                    <Button variant="outlined" color="error" onClick={handleClose}>
                      Cancel
                    </Button>
                    <Button type="submit" variant="contained" color="primary" disabled={isSubmitting}>
                      {isSubmitting ? "Updating..." : "Update Work Order"}
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
