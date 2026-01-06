import React, { useState } from "react";
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
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import dayjs from "dayjs";
import BASE_URL from "Base/api";
import { toast } from "react-toastify";
import useCRMAccounts from "hooks/useCRMAccounts";
import FormHelperText from "@mui/material/FormHelperText";
import { formatDate } from "@/components/utils/formatHelper";

export default function CreateMeetingModal({ open, onClose, onSuccess, initialDate }) {
  const { accounts, isLoading: accountsLoading, error: accountsError } = useCRMAccounts();
  const [submitting, setSubmitting] = useState(false);
  const [accountError, setAccountError] = useState(false);
  const [formValues, setFormValues] = useState({
    subject: "",
    accountId: "",
    meetingDate: initialDate ? dayjs(initialDate) : dayjs(),
    startTime: dayjs().set("hour", 9).set("minute", 0),
    endTime: dayjs().set("hour", 10).set("minute", 0),
    meetingType: 1,
    location: "",
    meetingLink: "",
    description: "",
  });

  React.useEffect(() => {
    if (open) {
      setAccountError(false);
    }
    if (open && initialDate) {
      const initialDateValue = dayjs(initialDate);
      const today = dayjs().startOf('day');
      // If initial date is before today, use today instead
      const meetingDate = initialDateValue.isBefore(today) ? today : initialDateValue;
      setFormValues((prev) => ({
        ...prev,
        meetingDate: meetingDate,
      }));
    }
  }, [open, initialDate]);

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

    // Validate that meeting date is not in the past
    const today = dayjs().startOf('day');
    const selectedDate = formValues.meetingDate.startOf('day');
    if (selectedDate.isBefore(today)) {
      toast.error("Meeting date cannot be in the past.");
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

    // Format TimeSpan as HH:mm:ss
    const formatTimeSpan = (time) => {
      const hours = String(time.hour()).padStart(2, "0");
      const minutes = String(time.minute()).padStart(2, "0");
      const seconds = "00";
      return `${hours}:${minutes}:${seconds}`;
    };


    const payload = {
      AccountId: Number(formValues.accountId),
      MeetingDate: formatDate(formValues.meetingDate),
      Subject: formValues.subject.trim(),
      MeetingType: Number(formValues.meetingType),
      StartTime: formatTimeSpan(formValues.startTime),
      EndTime: formatTimeSpan(formValues.endTime),
      Location: formValues.meetingType === 1 ? (formValues.location.trim() || null) : null,
      MeetingLink: formValues.meetingType === 2 ? (formValues.meetingLink.trim() || null) : null,
      StatusRemark: null,
      Status: 0,
      Description: formValues.description.trim() || null,
    };

    try {
      setSubmitting(true);
      const response = await fetch(`${BASE_URL}/CRMMeeting/CreateCRMMeeting/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => null);

      if (data?.statusCode === 200) {
        toast.success(data?.message || "Meeting scheduled successfully.");
        onSuccess();
        resetForm();
        onClose();
      } else {
        toast.error(data?.message || "Failed to create meeting");
      }
    } catch (error) {
      toast.error(error.message || "Unable to schedule meeting");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormValues({
      subject: "",
      accountId: "",
      meetingDate: dayjs(),
      startTime: dayjs().set("hour", 9).set("minute", 0),
      endTime: dayjs().set("hour", 10).set("minute", 0),
      meetingType: 1,
      location: "",
      meetingLink: "",
      description: "",
    });
    setAccountError(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6">Schedule Meeting</Typography>
          <IconButton size="small" onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        <Box component="form" id="create-meeting-form" onSubmit={handleSubmit} noValidate>
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
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="Meeting Date"
                  value={formValues.meetingDate}
                  onChange={handleDateChange("meetingDate")}
                  minDate={dayjs().startOf('day')}
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
        <Stack direction="row" spacing={2} sx={{ width: "100%", justifyContent: "flex-end", px: 1 }}>
          <Button variant="outlined" color="inherit" onClick={handleClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" form="create-meeting-form" variant="contained" disabled={submitting}>
            {submitting ? "Saving..." : "Schedule Meeting"}
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
}

