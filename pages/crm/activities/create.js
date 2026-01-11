import React from "react";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Stack from "@mui/material/Stack";
import Autocomplete from "@mui/material/Autocomplete";
import CircularProgress from "@mui/material/CircularProgress";
import useActivityTypes from "../../../hooks/useActivityTypes";
import useRelatedEntityTypes from "../../../hooks/useRelatedEntityTypes";
import useActivityStatuses from "../../../hooks/useActivityStatuses";
import useActivityPriorities from "../../../hooks/useActivityPriorities";
import useUsers from "../../../hooks/useUsers";
import useRelatedRecords from "../../../hooks/useRelatedRecords";
import BASE_URL from "Base/api";
import { toast } from "react-toastify";

const initialFormValues = {
  subject: "",
  type: "",
  relatedTo: "",
  relatedRecordId: "",
  startDate: "",
  endDate: "",
  priority: "",
  description: "",
  assignedTo: "",
  status: "",
};

export default function AddActivityModal({ onActivityCreated }) {
  const [open, setOpen] = React.useState(false);
  const [formValues, setFormValues] = React.useState(initialFormValues);
  const [submitting, setSubmitting] = React.useState(false);

  const { types: activityTypes } = useActivityTypes();
  const { entities: relatedEntities } = useRelatedEntityTypes();
  const { statuses: activityStatuses } = useActivityStatuses();
  const { priorities: activityPriorities } = useActivityPriorities();
  const { users } = useUsers();
  const { records: relatedRecords, isLoading: relatedRecordsLoading } = useRelatedRecords(formValues.relatedTo);

  const selectedRelatedRecord = React.useMemo(
    () => relatedRecords.find((option) => option.value === formValues.relatedRecordId) || null,
    [relatedRecords, formValues.relatedRecordId]
  );

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setFormValues(initialFormValues);
    setSubmitting(false);
  };

  const handleFieldChange = (field) => (event) => {
    const value = event.target.value;
    setFormValues((prev) => ({
      ...prev,
      [field]: value,
      ...(field === "relatedTo" ? { relatedRecordId: "" } : {}),
    }));
  };

  const handleRelatedRecordChange = (_, newValue) => {
    setFormValues((prev) => ({
      ...prev,
      relatedRecordId: newValue ? newValue.value : "",
    }));
  };

  const parseDateValue = (value) => {
    if (!value) {
      return null;
    }
    try {
      return new Date(value).toISOString();
    } catch (error) {
      return null;
    }
  };

  const validateForm = () => {
    if (!formValues.subject.trim()) {
      toast.error("Subject is required.");
      return false;
    }
    if (!formValues.type) {
      toast.error("Type is required.");
      return false;
    }
    if (!formValues.relatedTo) {
      toast.error("Related entity is required.");
      return false;
    }
    if (!formValues.relatedRecordId) {
      toast.error("Please select a related record.");
      return false;
    }
    if (!formValues.priority) {
      toast.error("Priority is required.");
      return false;
    }
    if (!formValues.assignedTo) {
      toast.error("Assigned user is required.");
      return false;
    }
    if (!formValues.status) {
      toast.error("Status is required.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    const payload = {
      Subject: formValues.subject.trim(),
      Type: Number(formValues.type),
      RelatedEntityType: Number(formValues.relatedTo),
      RelatedEntityId: Number(formValues.relatedRecordId),
      StartDate: formValues.startDate,
      EndDate: formValues.endDate,
      Priority: Number(formValues.priority),
      Description: formValues.description.trim() || null,
      AssignedTo: Number(formValues.assignedTo),
      Status: Number(formValues.status),
    };

    try {
      setSubmitting(true);
      const response = await fetch(`${BASE_URL}/CRMActivities/CreateCRMActivity`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || "Failed to create activity");
      }

      toast.success(data?.message || "Activity created successfully.");
      handleClose();
      if (typeof onActivityCreated === "function") {
        onActivityCreated();
      }
    } catch (error) {
      toast.error(error.message || "Unable to create activity");
      setSubmitting(false);
    }
  };

  return (
    <>
      <Button variant="contained" onClick={handleOpen}>
        + Add Activity
      </Button>

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>Create Activity</DialogTitle>
        <DialogContent dividers>
          <Box component="form" id="create-activity-form" onSubmit={handleSubmit} noValidate>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="h6" fontWeight={600}>
                  Activity Details
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label="Subject"
                  fullWidth
                  size="small"
                  required
                  value={formValues.subject}
                  onChange={handleFieldChange("subject")}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Type</InputLabel>
                  <Select value={formValues.type} label="Type" onChange={handleFieldChange("type")}>
                    {activityTypes.map((option) => (
                      <MenuItem key={option.value} value={String(option.value)}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Related To</InputLabel>
                  <Select value={formValues.relatedTo} label="Related To" onChange={handleFieldChange("relatedTo")}>
                    {relatedEntities.map((option) => (
                      <MenuItem key={option.value} value={String(option.value)}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <Autocomplete
                  options={relatedRecords}
                  loading={relatedRecordsLoading}
                  value={selectedRelatedRecord}
                  onChange={handleRelatedRecordChange}
                  getOptionLabel={(option) => option.label || ""}
                  isOptionEqualToValue={(option, value) => option.value === value.value}
                  disabled={!formValues.relatedTo}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Related Record"
                      size="small"
                      placeholder="Search records..."
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {relatedRecordsLoading ? <CircularProgress color="inherit" size={16} /> : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label="Start Date"
                  type="datetime-local"
                  fullWidth
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  value={formValues.startDate}
                  onChange={handleFieldChange("startDate")}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label="End Date"
                  type="datetime-local"
                  fullWidth
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  value={formValues.endDate}
                  onChange={handleFieldChange("endDate")}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select value={formValues.status} label="Status" onChange={handleFieldChange("status")}>
                    {activityStatuses.map((option) => (
                      <MenuItem key={option.value} value={String(option.value)}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Priority</InputLabel>
                  <Select value={formValues.priority} label="Priority" onChange={handleFieldChange("priority")}>
                    {activityPriorities.map((option) => (
                      <MenuItem key={option.value} value={String(option.value)}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Assigned To</InputLabel>
                  <Select value={formValues.assignedTo} label="Assigned To" onChange={handleFieldChange("assignedTo")}>
                    {users.map((user) => (
                      <MenuItem key={user.id} value={String(user.id)}>
                        {[user.firstName, user.lastName].filter(Boolean).join(" ")}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Description"
                  fullWidth
                  multiline
                  minRows={3}
                  size="small"
                  placeholder="Describe the activity..."
                  value={formValues.description}
                  onChange={handleFieldChange("description")}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Stack direction="row" spacing={2} sx={{ width: "100%", justifyContent: "flex-end", px: 1 }}>
            <Button variant="outlined" color="inherit" onClick={handleClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" form="create-activity-form" variant="contained" disabled={submitting}>
              {submitting ? "Saving..." : "Save"}
            </Button>
          </Stack>
        </DialogActions>
      </Dialog>
    </>
  );
}

