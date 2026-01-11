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
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Stack from "@mui/material/Stack";
import Autocomplete from "@mui/material/Autocomplete";
import CircularProgress from "@mui/material/CircularProgress";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import useActivityTypes from "../../../hooks/useActivityTypes";
import useRelatedEntityTypes from "../../../hooks/useRelatedEntityTypes";
import useActivityStatuses from "../../../hooks/useActivityStatuses";
import useActivityPriorities from "../../../hooks/useActivityPriorities";
import useUsers from "../../../hooks/useUsers";
import useRelatedRecords from "../../../hooks/useRelatedRecords";
import BASE_URL from "Base/api";
import { toast } from "react-toastify";

const toLocalInputValue = (value) => {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value.substring(0, 16) || "";
  }
  const offset = date.getTimezoneOffset();
  const adjusted = new Date(date.getTime() - offset * 60000);
  return adjusted.toISOString().slice(0, 16);
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

export default function EditActivityModal({ activity, onActivityUpdated }) {
  const [open, setOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const { types: activityTypes } = useActivityTypes();
  const { entities: relatedEntities } = useRelatedEntityTypes();
  const { statuses: activityStatuses } = useActivityStatuses();
  const { priorities: activityPriorities } = useActivityPriorities();
  const { users } = useUsers();
  const [formValues, setFormValues] = React.useState({
    subject: "",
    type: "",
    relatedTo: "",
    relatedRecordId: "",
    relatedRecordLabel: "",
    description: "",
    startDate: "",
    endDate: "",
    status: "",
    priority: "",
    assignedTo: "",
  });
  const { records: relatedRecords, isLoading: relatedRecordsLoading } = useRelatedRecords(formValues.relatedTo);

  const resolveValue = React.useCallback((value, collection) => {
    if (value === null || value === undefined || value === "") {
      return "";
    }
    const stringValue = String(value);
    const byValue = collection.find((item) => String(item.value) === stringValue);
    if (byValue) return String(byValue.value);
    const byLabel = collection.find((item) => item.label === value);
    if (byLabel) return String(byLabel.value);
    return stringValue;
  }, []);

  React.useEffect(() => {
    if (open && activity) {
      const [entityLabel = "", recordLabel = ""] = activity.relatedEntityTypeName ? [activity.relatedEntityTypeName, activity.relatedEntityName || ""] : activity.relatedTo?.split(" - ") || [];

      setFormValues({
        subject: activity.subject || "",
        type: resolveValue(activity.type, activityTypes),
        relatedTo: resolveValue(activity.relatedEntityType ?? entityLabel, relatedEntities),
        relatedRecordId: activity.relatedEntityId != null ? String(activity.relatedEntityId) : "",
        relatedRecordLabel: recordLabel,
        description: activity.description || "",
        startDate: toLocalInputValue(activity.startDate),
        endDate: toLocalInputValue(activity.endDate),
        status: resolveValue(activity.status, activityStatuses),
        priority: resolveValue(activity.priority, activityPriorities),
        assignedTo: resolveValue(activity.assignedTo, users.map((user) => ({ value: user.id, label: [user.firstName, user.lastName].filter(Boolean).join(" ") }))),
      });
    }
  }, [activity, open, activityTypes, relatedEntities, activityStatuses, activityPriorities, users, resolveValue]);

  const handleFieldChange = (field) => (event) => {
    const value = event.target.value;
    setFormValues((prev) => ({
      ...prev,
      [field]: value,
      ...(field === "relatedTo" ? { relatedRecordId: "", relatedRecordLabel: "" } : {}),
    }));
  };

  const handleRelatedRecordChange = (_, newValue) => {
    setFormValues((prev) => ({
      ...prev,
      relatedRecordId: newValue ? newValue.value : "",
      relatedRecordLabel: newValue ? newValue.label : "",
    }));
  };

  const selectedRelatedRecordOption = React.useMemo(() => {
    if (!formValues.relatedRecordId && !formValues.relatedRecordLabel) {
      return null;
    }
    const match = relatedRecords.find((option) => option.value === formValues.relatedRecordId);
    if (match) {
      return match;
    }
    if (formValues.relatedRecordId || formValues.relatedRecordLabel) {
      return {
        value: formValues.relatedRecordId,
        label: formValues.relatedRecordLabel || formValues.relatedRecordId,
      };
    }
    return null;
  }, [relatedRecords, formValues.relatedRecordId, formValues.relatedRecordLabel]);

  const relatedRecordOptions = React.useMemo(() => {
    if (
      selectedRelatedRecordOption &&
      selectedRelatedRecordOption.value &&
      !relatedRecords.some((option) => option.value === selectedRelatedRecordOption.value)
    ) {
      return [selectedRelatedRecordOption, ...relatedRecords];
    }
    return relatedRecords;
  }, [relatedRecords, selectedRelatedRecordOption]);

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

    if (!activity?.id) {
      toast.error("Unable to determine activity to update.");
      return;
    }

    if (!validateForm()) {
      return;
    }

    const payload = {
      Id: activity.id,
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
      const response = await fetch(`${BASE_URL}/CRMActivities/UpdateCRMActivity`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || "Failed to update activity");
      }

      toast.success(data?.message || "Activity updated successfully.");
      setSubmitting(false);
      setOpen(false);
      if (typeof onActivityUpdated === "function") {
        onActivityUpdated();
      }
    } catch (error) {
      toast.error(error.message || "Unable to update activity");
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setSubmitting(false);
  };

  return (
    <>
      <Tooltip title="Edit">
        <IconButton size="small" aria-label="edit activity" onClick={() => setOpen(true)}>
          <EditOutlinedIcon color="primary" fontSize="inherit" />
        </IconButton>
      </Tooltip>

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>Edit Activity</DialogTitle>
        <DialogContent dividers>
          <Box component="form" id={`edit-activity-form-${activity?.id}`} onSubmit={handleSubmit} noValidate>
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
                  <Select value={formValues.type} label="Type" onChange={handleFieldChange("type")}
                  >
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
                  options={relatedRecordOptions}
                  loading={relatedRecordsLoading}
                  value={selectedRelatedRecordOption}
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
            <Button
              type="submit"
              form={`edit-activity-form-${activity?.id}`}
              variant="contained"
              disabled={submitting}
            >
              {submitting ? "Updating..." : "Update"}
            </Button>
          </Stack>
        </DialogActions>
      </Dialog>
    </>
  );
}

