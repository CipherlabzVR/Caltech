import React, { useState, useEffect } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import dayjs from "dayjs";
import BASE_URL from "Base/api";
import { toast } from "react-toastify";
import useCRMAccounts from "hooks/useCRMAccounts";
import FormHelperText from "@mui/material/FormHelperText";
import DialogContentText from "@mui/material/DialogContentText";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { formatDate } from "@/components/utils/formatHelper";

export default function EditMeetingModal({ open, onClose, onSuccess, onDelete, meeting }) {
  const { accounts, isLoading: accountsLoading, error: accountsError } = useCRMAccounts();
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [accountError, setAccountError] = useState(false);
  const [formValues, setFormValues] = useState({
    subject: "",
    accountId: "",
    meetingDate: dayjs(),
    startTime: dayjs().set("hour", 9).set("minute", 0),
    endTime: dayjs().set("hour", 10).set("minute", 0),
    meetingType: 1,
    status: 0,
    cancelReason: "",
    location: "",
    meetingLink: "",
    description: "",
  });

  useEffect(() => {
    if (open) {
      setAccountError(false);
    }
    if (open && meeting) {
      // Parse meetingDate and times from the new API format
      // meetingDate is in format "2025-12-19T18:30:00" - extract just the date part
      let meetingDate = dayjs();
      let startTime = dayjs().set("hour", 9).set("minute", 0);
      let endTime = dayjs().set("hour", 10).set("minute", 0);
      
      if (meeting.meetingDate) {
        // Extract date part (before 'T') and create dayjs object
        const dateStr = meeting.meetingDate.split("T")[0];
        meetingDate = dayjs(dateStr);
      }
      
      if (meeting.startTime) {
        const [hours, minutes] = meeting.startTime.split(":").map(Number);
        startTime = dayjs().set("hour", hours).set("minute", minutes || 0);
      }
      
      if (meeting.endTime) {
        const [hours, minutes] = meeting.endTime.split(":").map(Number);
        endTime = dayjs().set("hour", hours).set("minute", minutes || 0);
      }
      
      setFormValues({
        subject: meeting.subject || meeting.title || "",
        accountId: meeting.accountId ? String(meeting.accountId) : "",
        meetingDate: meetingDate,
        startTime: startTime,
        endTime: endTime,
        meetingType: meeting.meetingType || 1,
        status: meeting.status !== undefined ? meeting.status : 0,
        cancelReason: meeting.statusRemark || "",
        location: meeting.location || "",
        meetingLink: meeting.meetingLink || "",
        description: meeting.description || meeting.notes || "",
      });
    }
  }, [open, meeting]);

  const handleFieldChange = (field) => (event) => {
    const value = event.target.value;
    setFormValues((prev) => {
      const updated = {
        ...prev,
        [field]: value,
      };
      // When meeting type changes, clear the opposite field
      if (field === "meetingType") {
        const meetingTypeNum = Number(value);
        if (meetingTypeNum === 1) {
          // Physical - clear meeting link
          updated.meetingLink = "";
        } else if (meetingTypeNum === 2) {
          // Online - clear location
          updated.location = "";
        }
      }
      return updated;
    });
  };

  const handleDateChange = (field) => (newValue) => {
    setFormValues((prev) => ({
      ...prev,
      [field]: newValue,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!meeting?.id) {
      toast.error("Unable to determine meeting to update.");
      return;
    }

    if (!formValues.subject.trim()) {
      toast.error("Meeting subject is required.");
      return;
    }

    if (!formValues.accountId) {
      setAccountError(true);
      toast.error("Please select an account.");
      return;
    }
    setAccountError(false);

    if (!formValues.meetingDate) {
      toast.error("Please select a meeting date.");
      return;
    }

    if (!formValues.startTime || !formValues.endTime) {
      toast.error("Please select start and end times.");
      return;
    }

    // Combine date with times
    const startDateTime = formValues.meetingDate
      .set("hour", formValues.startTime.hour())
      .set("minute", formValues.startTime.minute())
      .set("second", 0)
      .set("millisecond", 0);
    
    const endDateTime = formValues.meetingDate
      .set("hour", formValues.endTime.hour())
      .set("minute", formValues.endTime.minute())
      .set("second", 0)
      .set("millisecond", 0);

    if (endDateTime.isBefore(startDateTime) || endDateTime.isSame(startDateTime)) {
      toast.error("End time must be after start time.");
      return;
    }

    // Validate cancel reason when status is Canceled (3)
    if (formValues.status === 3 && !formValues.cancelReason.trim()) {
      toast.error("Please enter a cancellation reason.");
      return;
    }

    // Format TimeSpan as HH:mm:ss
    const formatTimeSpan = (time) => {
      const hours = String(time.hour()).padStart(2, "0");
      const minutes = String(time.minute()).padStart(2, "0");
      const seconds = "00";
      return `${hours}:${minutes}:${seconds}`;
    };

    const payload = {
      Id: meeting.id,
      AccountId: Number(formValues.accountId),
      MeetingDate: formatDate(formValues.meetingDate),
      Subject: formValues.subject.trim(),
      MeetingType: Number(formValues.meetingType),
      Status: Number(formValues.status),
      StartTime: formatTimeSpan(formValues.startTime),
      EndTime: formatTimeSpan(formValues.endTime),
      Location: formValues.meetingType === 1 ? (formValues.location.trim() || null) : null,
      MeetingLink: formValues.meetingType === 2 ? (formValues.meetingLink.trim() || null) : null,
      StatusRemark: formValues.status === 3 ? formValues.cancelReason.trim() : null,
      Description: formValues.description.trim() || null,
    };

    try {
      setSubmitting(true);
      const response = await fetch(`${BASE_URL}/CRMMeeting/UpdateCRMMeeting/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => null);

      if (data?.statusCode === 200) {
        toast.success(data?.message || "Meeting updated successfully.");
        onSuccess();
        onClose();
      } else {
        toast.error(data?.message || "Failed to update meeting");
      }
    } catch (error) {
      toast.error(error.message || "Unable to update meeting");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = () => {
    if (!meeting?.id) {
      toast.error("Unable to determine meeting to delete.");
      return;
    }
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!meeting?.id) {
      toast.error("Unable to determine meeting to delete.");
      return;
    }

    try {
      setDeleting(true);
      const response = await fetch(`${BASE_URL}/CRMMeeting/DeleteCRMMeeting/?id=${meeting.id}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || "Failed to delete meeting");
      }

      toast.success(data?.message || "Meeting deleted successfully.");
      setDeleteConfirmOpen(false);
      onDelete();
    } catch (error) {
      toast.error(error.message || "Unable to delete meeting");
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmOpen(false);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6">Edit Meeting</Typography>
          <IconButton size="small" onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        <Box component="form" id="edit-meeting-form" onSubmit={handleSubmit} noValidate>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="Meeting Subject"
                fullWidth
                size="small"
                required
                value={formValues.subject}
                onChange={handleFieldChange("subject")}
                placeholder="Enter meeting subject"
              />
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth size="small" required error={accountError}>
                <InputLabel>Account</InputLabel>
                <Select
                  value={formValues.accountId}
                  label="Account"
                  onChange={(e) => {
                    handleFieldChange("accountId")(e);
                    setAccountError(false);
                  }}
                  disabled={accountsLoading || accounts.length === 0}
                  error={accountError}
                >
                  {accounts.map((account) => (
                    <MenuItem key={account.id} value={String(account.id)}>
                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                        <Typography variant="body2">
                          {account.accountName || "-"}
                        </Typography>
                        {account.emailVerified === true || account.isEmailVerified === true ? (
                          <Chip
                            label="Verified"
                            color="success"
                            size="small"
                            variant="outlined"
                            sx={{ height: 20, fontSize: "0.7rem", px: "4px" }}
                          />
                        ) : null}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
                {accountError && <FormHelperText error>Please select an account</FormHelperText>}
                {accountsError && <FormHelperText error>{accountsError}</FormHelperText>}
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth size="small" required>
                <InputLabel>Meeting Type</InputLabel>
                <Select
                  value={formValues.meetingType}
                  label="Meeting Type"
                  onChange={handleFieldChange("meetingType")}
                >
                  <MenuItem value={1}>Physical</MenuItem>
                  <MenuItem value={2}>Online</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth size="small" required>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formValues.status}
                  label="Status"
                  onChange={handleFieldChange("status")}
                >
                  <MenuItem value={0}>Pending</MenuItem>
                  <MenuItem value={1}>Held</MenuItem>
                  <MenuItem value={3}>Canceled</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {formValues.status === 3 && (
              <Grid item xs={12}>
                <TextField
                  label="Cancellation Reason"
                  fullWidth
                  size="small"
                  required
                  value={formValues.cancelReason}
                  onChange={handleFieldChange("cancelReason")}
                  placeholder="Please enter the reason for cancellation"
                  multiline
                  minRows={2}
                />
              </Grid>
            )}

            <Grid item xs={12}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="Meeting Date"
                  value={formValues.meetingDate}
                  onChange={handleDateChange("meetingDate")}
                  renderInput={(params) => <TextField {...params} fullWidth size="small" required />}
                />
              </LocalizationProvider>
            </Grid>

            <Grid item xs={12} lg={6}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <TimePicker
                  label="Start Time"
                  value={formValues.startTime}
                  onChange={handleDateChange("startTime")}
                  renderInput={(params) => <TextField {...params} fullWidth size="small" required />}
                />
              </LocalizationProvider>
            </Grid>

            <Grid item xs={12} lg={6}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <TimePicker
                  label="End Time"
                  value={formValues.endTime}
                  onChange={handleDateChange("endTime")}
                  minTime={formValues.startTime}
                  renderInput={(params) => <TextField {...params} fullWidth size="small" required />}
                />
              </LocalizationProvider>
            </Grid>

            {formValues.meetingType === 1 && (
              <Grid item xs={12}>
                <TextField
                  label="Location"
                  fullWidth
                  size="small"
                  value={formValues.location}
                  onChange={handleFieldChange("location")}
                  placeholder="Meeting location (optional)"
                />
              </Grid>
            )}

            {formValues.meetingType === 2 && (
              <Grid item xs={12}>
                <TextField
                  label="Meeting Link"
                  fullWidth
                  size="small"
                  value={formValues.meetingLink}
                  onChange={handleFieldChange("meetingLink")}
                  placeholder="Online meeting link/URL (optional)"
                />
              </Grid>
            )}

            <Grid item xs={12}>
              <TextField
                label="Description"
                fullWidth
                multiline
                minRows={3}
                size="small"
                value={formValues.description}
                onChange={handleFieldChange("description")}
                placeholder="Meeting description (optional)"
              />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Stack direction="row" spacing={2} sx={{ width: "100%", justifyContent: "space-between", px: 1 }}>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteOutlineIcon />}
            onClick={handleDeleteClick}
            disabled={deleting || submitting}
          >
            Delete
          </Button>
          <Stack direction="row" spacing={2}>
            <Button variant="outlined" color="inherit" onClick={onClose} disabled={submitting || deleting}>
              Cancel
            </Button>
            <Button type="submit" form="edit-meeting-form" variant="contained" disabled={submitting || deleting}>
              {submitting ? "Updating..." : "Update Meeting"}
            </Button>
          </Stack>
        </Stack>
      </DialogActions>
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={handleDeleteCancel}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "16px",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
          },
        }}
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={2}>
            <WarningAmberIcon color="warning" />
            <Typography variant="h6" fontWeight={600}>
              Delete Meeting
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: "0.95rem", color: "text.secondary" }}>
            Are you sure you want to delete this meeting? This action cannot be undone.
          </DialogContentText>
          {meeting?.subject && (
            <Box sx={{ mt: 2, p: 1.5, bgcolor: "rgba(0, 0, 0, 0.04)", borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                Meeting: {meeting.subject}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={handleDeleteCancel}
            variant="outlined"
            disabled={deleting}
            sx={{ borderRadius: "8px", textTransform: "none" }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            variant="contained"
            color="error"
            disabled={deleting}
            sx={{ borderRadius: "8px", textTransform: "none" }}
          >
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
}

