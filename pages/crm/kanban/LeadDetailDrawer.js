import React from "react";
import Drawer from "@mui/material/Drawer";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Slider from "@mui/material/Slider";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Divider from "@mui/material/Divider";
import CircularProgress from "@mui/material/CircularProgress";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import ListItemIcon from "@mui/material/ListItemIcon";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import FormHelperText from "@mui/material/FormHelperText";
import CloseIcon from "@mui/icons-material/Close";
import PhoneIcon from "@mui/icons-material/Phone";
import EmailIcon from "@mui/icons-material/Email";
import EventIcon from "@mui/icons-material/Event";
import NotificationsIcon from "@mui/icons-material/Notifications";
import NoteIcon from "@mui/icons-material/Note";
import TaskIcon from "@mui/icons-material/Task";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import BASE_URL from "Base/api";
import { toast } from "react-toastify";
import useCRMAccounts from "hooks/useCRMAccounts";

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`lead-tabpanel-${index}`}
      aria-labelledby={`lead-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
  );
}

const logTypeIcons = {
  1: <NoteIcon fontSize="small" />,
  2: <PhoneIcon fontSize="small" />,
  3: <EmailIcon fontSize="small" />,
  4: <EventIcon fontSize="small" />,
  5: <TaskIcon fontSize="small" />,
  6: <CheckCircleIcon fontSize="small" />,
  7: <NoteIcon fontSize="small" />,
  8: <NoteIcon fontSize="small" />,
};

const priorityColors = {
  1: "default",
  2: "info",
  3: "warning",
  4: "error",
};

export default function LeadDetailDrawer({ open, onClose, lead, onLeadUpdated }) {
  const [tabValue, setTabValue] = React.useState(0);
  const [formValues, setFormValues] = React.useState({});
  const [statusOptions, setStatusOptions] = React.useState([]);
  const [sourceOptions, setSourceOptions] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const { accounts, isLoading: accountsLoading } = useCRMAccounts();

  // Data states
  const [activities, setActivities] = React.useState([]);
  const [meetings, setMeetings] = React.useState([]);
  const [reminders, setReminders] = React.useState([]);
  const [logs, setLogs] = React.useState([]);
  const [loadingData, setLoadingData] = React.useState({
    activities: false,
    meetings: false,
    reminders: false,
    logs: false,
  });

  // Dialog states
  const [logDialogOpen, setLogDialogOpen] = React.useState(false);
  const [reminderDialogOpen, setReminderDialogOpen] = React.useState(false);
  const [activityDialogOpen, setActivityDialogOpen] = React.useState(false);
  const [meetingDialogOpen, setMeetingDialogOpen] = React.useState(false);
  const [logForm, setLogForm] = React.useState({ logType: 1, title: "", description: "" });
  const [reminderForm, setReminderForm] = React.useState({
    title: "",
    description: "",
    reminderDate: "",
    reminderTime: "",
    priority: 2,
  });
  const [activityForm, setActivityForm] = React.useState({
    subject: "",
    type: 0,
    priority: 1,
    startDate: "",
    endDate: "",
    description: "",
    status: 0,
  });
  const [meetingForm, setMeetingForm] = React.useState({
    subject: "",
    meetingDate: "",
    startTime: "",
    endTime: "",
    meetingType: 2,
    location: "",
    meetingLink: "",
    description: "",
  });

  // Log types and reminder priorities
  const [logTypes, setLogTypes] = React.useState([]);
  const [reminderPriorities, setReminderPriorities] = React.useState([]);
  const [activityTypes, setActivityTypes] = React.useState([]);
  const [activityPriorities, setActivityPriorities] = React.useState([]);
  const [activityStatuses, setActivityStatuses] = React.useState([]);
  const [users, setUsers] = React.useState([]);

  React.useEffect(() => {
    if (open && lead) {
      setFormValues({
        fullName: lead.leadName || lead.name || "",
        company: lead.company || "",
        email: lead.email || "",
        phone: lead.mobileNo || lead.phone || "",
        leadSource: lead.leadSource !== undefined ? String(lead.leadSource) : "",
        status: lead.leadStatus !== undefined ? String(lead.leadStatus) : "",
        leadScore: typeof lead.leadScore === "number" ? lead.leadScore : 50,
        notes: lead.description || lead.notes || "",
        accountId: lead.accountId ? String(lead.accountId) : "",
      });
      fetchEnums();
      fetchAllData();
    }
  }, [open, lead]);

  const fetchEnums = async () => {
    const token = localStorage.getItem("token");
    try {
      const [statusRes, sourceRes, logTypesRes, prioritiesRes, actTypesRes, actPrioritiesRes, actStatusesRes, usersRes] = await Promise.all([
        fetch(`${BASE_URL}/EnumLookup/LeadStatuses`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${BASE_URL}/EnumLookup/LeadSources`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${BASE_URL}/EnumLookup/LeadLogTypes`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${BASE_URL}/EnumLookup/ReminderPriorities`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${BASE_URL}/EnumLookup/ActivityTypes`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${BASE_URL}/EnumLookup/ActivityPriorities`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${BASE_URL}/EnumLookup/ActivityStatuses`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${BASE_URL}/User/GetAllUser`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const [statusData, sourceData, logTypesData, prioritiesData, actTypesData, actPrioritiesData, actStatusesData, usersData] = await Promise.all([
        statusRes.json(),
        sourceRes.json(),
        logTypesRes.json(),
        prioritiesRes.json(),
        actTypesRes.json(),
        actPrioritiesRes.json(),
        actStatusesRes.json(),
        usersRes.json(),
      ]);

      if (statusData?.result) {
        setStatusOptions(
          Object.entries(statusData.result).map(([value, label]) => ({ value, label }))
        );
      }
      if (sourceData?.result) {
        setSourceOptions(
          Object.entries(sourceData.result).map(([value, label]) => ({ value, label }))
        );
      }
      if (logTypesData?.result) {
        setLogTypes(
          Object.entries(logTypesData.result).map(([value, label]) => ({ value, label }))
        );
      }
      if (prioritiesData?.result) {
        setReminderPriorities(
          Object.entries(prioritiesData.result).map(([value, label]) => ({ value, label }))
        );
      }
      if (actTypesData?.result) {
        setActivityTypes(
          Object.entries(actTypesData.result).map(([value, label]) => ({ value, label }))
        );
      }
      if (actPrioritiesData?.result) {
        setActivityPriorities(
          Object.entries(actPrioritiesData.result).map(([value, label]) => ({ value, label }))
        );
      }
      if (actStatusesData?.result) {
        setActivityStatuses(
          Object.entries(actStatusesData.result).map(([value, label]) => ({ value, label }))
        );
      }
      if (usersData?.result) {
        setUsers(usersData.result);
      }
    } catch (error) {
      console.error("Error fetching enums:", error);
    }
  };

  const fetchAllData = async () => {
    if (!lead?.id) return;
    const leadId = lead.id;
    const token = localStorage.getItem("token");

    setLoadingData({ activities: true, meetings: true, reminders: true, logs: true });

    try {
      const [activitiesRes, meetingsRes, remindersRes, logsRes] = await Promise.all([
        fetch(`${BASE_URL}/CRMActivities/GetActivitiesByLeadId/${leadId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${BASE_URL}/CRMMeeting/GetMeetingsByLeadId/${leadId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${BASE_URL}/LeadReminder/GetRemindersByLeadId/${leadId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${BASE_URL}/LeadLog/GetLogsByLeadId/${leadId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const [activitiesData, meetingsData, remindersData, logsData] = await Promise.all([
        activitiesRes.json(),
        meetingsRes.json(),
        remindersRes.json(),
        logsRes.json(),
      ]);

      setActivities(activitiesData?.result || []);
      setMeetings(meetingsData?.result || []);
      setReminders(remindersData?.result || []);
      setLogs(logsData?.result || []);
    } catch (error) {
      console.error("Error fetching lead data:", error);
    } finally {
      setLoadingData({ activities: false, meetings: false, reminders: false, logs: false });
    }
  };

  const handleChange = (field) => (event) => {
    setFormValues((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!lead?.id) return;

    const payload = {
      Id: lead.id,
      LeadName: formValues.fullName?.trim() || "",
      Company: formValues.company?.trim() || "",
      Email: formValues.email?.trim() || "",
      MobileNo: formValues.phone?.trim() || "",
      LeadSource: Number(formValues.leadSource) || 0,
      LeadStatus: Number(formValues.status) || 1,
      LeadScore: Number(formValues.leadScore) || 0,
      Description: formValues.notes?.trim() || "",
      AccountId: formValues.accountId ? Number(formValues.accountId) : null,
      ContactId: null,
    };

    try {
      setSubmitting(true);
      const response = await fetch(`${BASE_URL}/Leads/UpdateLead`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (response.ok && data?.statusCode === 200) {
        toast.success(data?.message || "Lead updated successfully");
        onLeadUpdated?.();
      } else {
        toast.error(data?.message || "Failed to update lead");
      }
    } catch (error) {
      toast.error("Failed to update lead");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateLog = async () => {
    if (!lead?.id || !logForm.title.trim()) {
      toast.error("Title is required");
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}/LeadLog/CreateLeadLog`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          leadId: lead.id,
          logType: Number(logForm.logType),
          title: logForm.title,
          description: logForm.description,
        }),
      });

      const data = await response.json();
      if (response.ok && data?.statusCode === 200) {
        toast.success("Log added successfully");
        setLogDialogOpen(false);
        setLogForm({ logType: 1, title: "", description: "" });
        fetchAllData();
      } else {
        toast.error(data?.message || "Failed to add log");
      }
    } catch (error) {
      toast.error("Failed to add log");
    }
  };

  const handleCreateReminder = async () => {
    if (!lead?.id || !reminderForm.title.trim() || !reminderForm.reminderDate || !reminderForm.reminderTime) {
      toast.error("Title, date and time are required");
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}/LeadReminder/CreateLeadReminder`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          leadId: lead.id,
          title: reminderForm.title,
          description: reminderForm.description,
          reminderDate: reminderForm.reminderDate,
          reminderTime: reminderForm.reminderTime + ":00",
          priority: Number(reminderForm.priority),
          status: 1,
        }),
      });

      const data = await response.json();
      if (response.ok && data?.statusCode === 200) {
        toast.success("Reminder created successfully");
        setReminderDialogOpen(false);
        setReminderForm({ title: "", description: "", reminderDate: "", reminderTime: "", priority: 2 });
        fetchAllData();
      } else {
        toast.error(data?.message || "Failed to create reminder");
      }
    } catch (error) {
      toast.error("Failed to create reminder");
    }
  };

  const handleCompleteReminder = async (reminderId) => {
    try {
      const response = await fetch(`${BASE_URL}/LeadReminder/UpdateLeadReminderStatus`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: reminderId, status: 2 }),
      });

      const data = await response.json();
      if (response.ok && data?.statusCode === 200) {
        toast.success("Reminder completed");
        fetchAllData();
      } else {
        toast.error(data?.message || "Failed to complete reminder");
      }
    } catch (error) {
      toast.error("Failed to complete reminder");
    }
  };

  const handleCreateActivity = async () => {
    if (!lead?.id || !activityForm.subject.trim()) {
      toast.error("Subject is required");
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}/CRMActivities/CreateCRMActivity`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subject: activityForm.subject,
          type: Number(activityForm.type),
          relatedEntityType: 1, // Lead
          relatedEntityId: lead.id,
          priority: Number(activityForm.priority),
          startDate: activityForm.startDate || null,
          endDate: activityForm.endDate || null,
          description: activityForm.description,
          assignedTo: Number(activityForm.assignedTo) || 0,
          status: Number(activityForm.status),
        }),
      });

      const data = await response.json();
      if (response.ok && data?.statusCode === 200) {
        toast.success("Activity created successfully");
        setActivityDialogOpen(false);
        setActivityForm({ subject: "", type: 0, priority: 1, startDate: "", endDate: "", description: "", status: 0, assignedTo: "" });
        fetchAllData();
      } else {
        toast.error(data?.message || "Failed to create activity");
      }
    } catch (error) {
      toast.error("Failed to create activity");
    }
  };

  const handleCreateMeeting = async () => {
    if (!lead?.id || !meetingForm.subject.trim() || !meetingForm.meetingDate || !meetingForm.startTime) {
      toast.error("Subject, date and start time are required");
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}/CRMMeeting/CreateCRMMeeting`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          leadId: lead.id,
          accountId: lead.accountId || null,
          subject: meetingForm.subject,
          meetingDate: meetingForm.meetingDate,
          startTime: meetingForm.startTime + ":00",
          endTime: meetingForm.endTime ? meetingForm.endTime + ":00" : null,
          meetingType: Number(meetingForm.meetingType),
          location: meetingForm.location,
          meetingLink: meetingForm.meetingLink,
          description: meetingForm.description,
          status: 1,
        }),
      });

      const data = await response.json();
      if (response.ok && data?.statusCode === 200) {
        toast.success("Meeting scheduled successfully");
        setMeetingDialogOpen(false);
        setMeetingForm({ subject: "", meetingDate: "", startTime: "", endTime: "", meetingType: 2, location: "", meetingLink: "", description: "" });
        fetchAllData();
      } else {
        toast.error(data?.message || "Failed to schedule meeting");
      }
    } catch (error) {
      toast.error("Failed to schedule meeting");
    }
  };

  const isStatusLocked = lead?.leadStatus === 8 || lead?.status === 8;

  return (
    <>
      <Drawer
        anchor="right"
        open={open}
        onClose={onClose}
        PaperProps={{ sx: { width: { xs: "100%", md: 600 }, p: 0 } }}
      >
        <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
          {/* Header */}
          <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="h6" fontWeight={600}>
                  {lead?.leadName || lead?.name || "Lead Details"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {lead?.company || "No company"}
                </Typography>
              </Box>
              <IconButton onClick={onClose}>
                <CloseIcon />
              </IconButton>
            </Stack>
          </Box>

          {/* Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
            <Tabs
              value={tabValue}
              onChange={(e, v) => setTabValue(v)}
              variant="scrollable"
              scrollButtons="auto"
            >
              <Tab label="Details" />
              <Tab label="Activities" />
              <Tab label="Meetings" />
              <Tab label="Reminders" />
              <Tab label="Logs" />
            </Tabs>
          </Box>

          {/* Tab Content */}
          <Box sx={{ flexGrow: 1, overflow: "auto", p: 2 }}>
            {/* Details Tab */}
            <TabPanel value={tabValue} index={0}>
              <Box component="form" onSubmit={handleSubmit}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Account</InputLabel>
                      <Select
                        value={formValues.accountId || ""}
                        label="Account"
                        onChange={handleChange("accountId")}
                        disabled={accountsLoading}
                      >
                        <MenuItem value="">None</MenuItem>
                        {accounts.map((account) => (
                          <MenuItem key={account.id} value={String(account.id)}>
                            {account.accountName}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Lead Name"
                      fullWidth
                      size="small"
                      value={formValues.fullName || ""}
                      onChange={handleChange("fullName")}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Company"
                      fullWidth
                      size="small"
                      value={formValues.company || ""}
                      onChange={handleChange("company")}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Email"
                      type="email"
                      fullWidth
                      size="small"
                      value={formValues.email || ""}
                      onChange={handleChange("email")}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Phone"
                      fullWidth
                      size="small"
                      value={formValues.phone || ""}
                      onChange={handleChange("phone")}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Lead Source</InputLabel>
                      <Select
                        value={formValues.leadSource || ""}
                        label="Lead Source"
                        onChange={handleChange("leadSource")}
                      >
                        {sourceOptions.map((opt) => (
                          <MenuItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Status</InputLabel>
                      <Select
                        value={formValues.status || ""}
                        label="Status"
                        onChange={handleChange("status")}
                        disabled={isStatusLocked}
                      >
                        {statusOptions.map((opt) => (
                          <MenuItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </MenuItem>
                        ))}
                      </Select>
                      {isStatusLocked && (
                        <FormHelperText>Status locked after project creation</FormHelperText>
                      )}
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>
                      Lead Score: {formValues.leadScore}
                    </Typography>
                    <Slider
                      value={formValues.leadScore || 50}
                      onChange={(e, v) => setFormValues((prev) => ({ ...prev, leadScore: v }))}
                      valueLabelDisplay="auto"
                      step={5}
                      marks
                      min={0}
                      max={100}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="Notes"
                      fullWidth
                      multiline
                      minRows={3}
                      size="small"
                      value={formValues.notes || ""}
                      onChange={handleChange("notes")}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      type="submit"
                      variant="contained"
                      fullWidth
                      disabled={submitting}
                    >
                      {submitting ? "Saving..." : "Save Changes"}
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </TabPanel>

            {/* Activities Tab */}
            <TabPanel value={tabValue} index={1}>
              <Box mb={2}>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => setActivityDialogOpen(true)}
                >
                  Add Activity
                </Button>
              </Box>
              {loadingData.activities ? (
                <Box display="flex" justifyContent="center" py={4}>
                  <CircularProgress />
                </Box>
              ) : activities.length === 0 ? (
                <Typography color="text.secondary" textAlign="center" py={4}>
                  No activities found for this lead
                </Typography>
              ) : (
                <List>
                  {activities.map((activity) => (
                    <ListItem key={activity.id} divider>
                      <ListItemIcon>
                        <TaskIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary={activity.subject}
                        secondary={
                          <>
                            <Chip
                              size="small"
                              label={activity.typeName}
                              sx={{ mr: 1 }}
                            />
                            <Chip
                              size="small"
                              label={activity.statusName}
                              color={activity.status === 3 ? "success" : "default"}
                            />
                            {activity.startDate && (
                              <Typography variant="caption" display="block" mt={0.5}>
                                {new Date(activity.startDate).toLocaleDateString()}
                              </Typography>
                            )}
                          </>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </TabPanel>

            {/* Meetings Tab */}
            <TabPanel value={tabValue} index={2}>
              <Stack direction="row" spacing={1} mb={2}>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => setMeetingDialogOpen(true)}
                >
                  Schedule Meeting
                </Button>
                <Button
                  variant="outlined"
                  color="secondary"
                  startIcon={<EventIcon />}
                  onClick={() => {
                    // Open Calendly scheduling link - can be configured in settings
                    const calendlyUrl = process.env.NEXT_PUBLIC_CALENDLY_URL || "https://calendly.com";
                    const prefillName = encodeURIComponent(lead?.leadName || "");
                    const prefillEmail = encodeURIComponent(lead?.email || "");
                    window.open(`${calendlyUrl}?name=${prefillName}&email=${prefillEmail}`, "_blank");
                  }}
                >
                  Schedule via Calendly
                </Button>
              </Stack>
              {loadingData.meetings ? (
                <Box display="flex" justifyContent="center" py={4}>
                  <CircularProgress />
                </Box>
              ) : meetings.length === 0 ? (
                <Typography color="text.secondary" textAlign="center" py={4}>
                  No meetings scheduled for this lead
                </Typography>
              ) : (
                <List>
                  {meetings.map((meeting) => (
                    <ListItem key={meeting.id} divider>
                      <ListItemIcon>
                        <EventIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary={meeting.subject}
                        secondary={
                          <>
                            <Typography variant="caption" display="block">
                              {new Date(meeting.meetingDate).toLocaleDateString()} | {meeting.startTime?.substring(0, 5)} - {meeting.endTime?.substring(0, 5)}
                            </Typography>
                            <Chip
                              size="small"
                              label={meeting.meetingType === 1 ? "Physical" : "Online"}
                              color={meeting.meetingType === 1 ? "info" : "success"}
                              sx={{ mt: 0.5 }}
                            />
                            {meeting.location && (
                              <Typography variant="caption" display="block" mt={0.5}>
                                Location: {meeting.location}
                              </Typography>
                            )}
                            {meeting.meetingLink && (
                              <Typography variant="caption" display="block" mt={0.5}>
                                <a href={meeting.meetingLink} target="_blank" rel="noopener noreferrer">
                                  Join Meeting
                                </a>
                              </Typography>
                            )}
                          </>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </TabPanel>

            {/* Reminders Tab */}
            <TabPanel value={tabValue} index={3}>
              <Box mb={2}>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => setReminderDialogOpen(true)}
                >
                  Add Reminder
                </Button>
              </Box>
              {loadingData.reminders ? (
                <Box display="flex" justifyContent="center" py={4}>
                  <CircularProgress />
                </Box>
              ) : reminders.length === 0 ? (
                <Typography color="text.secondary" textAlign="center" py={4}>
                  No reminders set for this lead
                </Typography>
              ) : (
                <List>
                  {reminders.map((reminder) => (
                    <ListItem
                      key={reminder.id}
                      divider
                      secondaryAction={
                        reminder.status === 1 && (
                          <IconButton
                            edge="end"
                            onClick={() => handleCompleteReminder(reminder.id)}
                            title="Mark as completed"
                          >
                            <CheckCircleIcon color="success" />
                          </IconButton>
                        )
                      }
                    >
                      <ListItemIcon>
                        <NotificationsIcon
                          color={reminder.status === 2 ? "disabled" : "warning"}
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography
                            sx={{
                              textDecoration: reminder.status === 2 ? "line-through" : "none",
                            }}
                          >
                            {reminder.title}
                          </Typography>
                        }
                        secondary={
                          <>
                            <Typography variant="caption" display="block">
                              {new Date(reminder.reminderDate).toLocaleDateString()} at{" "}
                              {reminder.reminderTime?.substring(0, 5)}
                            </Typography>
                            <Chip
                              size="small"
                              label={reminder.priorityName}
                              color={priorityColors[reminder.priority] || "default"}
                              sx={{ mt: 0.5 }}
                            />
                          </>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </TabPanel>

            {/* Logs Tab */}
            <TabPanel value={tabValue} index={4}>
              <Box mb={2}>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => setLogDialogOpen(true)}
                >
                  Add Log
                </Button>
              </Box>
              {loadingData.logs ? (
                <Box display="flex" justifyContent="center" py={4}>
                  <CircularProgress />
                </Box>
              ) : logs.length === 0 ? (
                <Typography color="text.secondary" textAlign="center" py={4}>
                  No logs recorded for this lead
                </Typography>
              ) : (
                <List>
                  {logs.map((log) => (
                    <ListItem key={log.id} divider>
                      <ListItemIcon>{logTypeIcons[log.logType] || <NoteIcon />}</ListItemIcon>
                      <ListItemText
                        primary={log.title}
                        secondary={
                          <>
                            <Chip size="small" label={log.logTypeName} sx={{ mr: 1 }} />
                            <Typography variant="caption">
                              {new Date(log.logDate).toLocaleString()}
                            </Typography>
                            {log.description && (
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                display="block"
                                mt={0.5}
                              >
                                {log.description}
                              </Typography>
                            )}
                          </>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </TabPanel>
          </Box>
        </Box>
      </Drawer>

      {/* Add Log Dialog */}
      <Dialog open={logDialogOpen} onClose={() => setLogDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Log Entry</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <InputLabel>Log Type</InputLabel>
                <Select
                  value={logForm.logType}
                  label="Log Type"
                  onChange={(e) => setLogForm((prev) => ({ ...prev, logType: e.target.value }))}
                >
                  {logTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Title"
                fullWidth
                size="small"
                required
                value={logForm.title}
                onChange={(e) => setLogForm((prev) => ({ ...prev, title: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Description"
                fullWidth
                multiline
                minRows={3}
                size="small"
                value={logForm.description}
                onChange={(e) => setLogForm((prev) => ({ ...prev, description: e.target.value }))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLogDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateLog}>
            Add Log
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Reminder Dialog */}
      <Dialog
        open={reminderDialogOpen}
        onClose={() => setReminderDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add Reminder</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                label="Title"
                fullWidth
                size="small"
                required
                value={reminderForm.title}
                onChange={(e) =>
                  setReminderForm((prev) => ({ ...prev, title: e.target.value }))
                }
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Date"
                type="date"
                fullWidth
                size="small"
                required
                InputLabelProps={{ shrink: true }}
                value={reminderForm.reminderDate}
                onChange={(e) =>
                  setReminderForm((prev) => ({ ...prev, reminderDate: e.target.value }))
                }
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Time"
                type="time"
                fullWidth
                size="small"
                required
                InputLabelProps={{ shrink: true }}
                value={reminderForm.reminderTime}
                onChange={(e) =>
                  setReminderForm((prev) => ({ ...prev, reminderTime: e.target.value }))
                }
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <InputLabel>Priority</InputLabel>
                <Select
                  value={reminderForm.priority}
                  label="Priority"
                  onChange={(e) =>
                    setReminderForm((prev) => ({ ...prev, priority: e.target.value }))
                  }
                >
                  {reminderPriorities.map((p) => (
                    <MenuItem key={p.value} value={p.value}>
                      {p.label}
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
                minRows={2}
                size="small"
                value={reminderForm.description}
                onChange={(e) =>
                  setReminderForm((prev) => ({ ...prev, description: e.target.value }))
                }
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReminderDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateReminder}>
            Add Reminder
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Activity Dialog */}
      <Dialog
        open={activityDialogOpen}
        onClose={() => setActivityDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add Activity</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                label="Subject"
                fullWidth
                size="small"
                required
                value={activityForm.subject}
                onChange={(e) =>
                  setActivityForm((prev) => ({ ...prev, subject: e.target.value }))
                }
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Type</InputLabel>
                <Select
                  value={activityForm.type}
                  label="Type"
                  onChange={(e) =>
                    setActivityForm((prev) => ({ ...prev, type: e.target.value }))
                  }
                >
                  {activityTypes.map((t) => (
                    <MenuItem key={t.value} value={t.value}>
                      {t.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Priority</InputLabel>
                <Select
                  value={activityForm.priority}
                  label="Priority"
                  onChange={(e) =>
                    setActivityForm((prev) => ({ ...prev, priority: e.target.value }))
                  }
                >
                  {activityPriorities.map((p) => (
                    <MenuItem key={p.value} value={p.value}>
                      {p.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={activityForm.status}
                  label="Status"
                  onChange={(e) =>
                    setActivityForm((prev) => ({ ...prev, status: e.target.value }))
                  }
                >
                  {activityStatuses.map((s) => (
                    <MenuItem key={s.value} value={s.value}>
                      {s.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Assigned To</InputLabel>
                <Select
                  value={activityForm.assignedTo || ""}
                  label="Assigned To"
                  onChange={(e) =>
                    setActivityForm((prev) => ({ ...prev, assignedTo: e.target.value }))
                  }
                >
                  {users.map((user) => (
                    <MenuItem key={user.id} value={user.id}>
                      {user.fullName || user.userName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Start Date"
                type="datetime-local"
                fullWidth
                size="small"
                InputLabelProps={{ shrink: true }}
                value={activityForm.startDate}
                onChange={(e) =>
                  setActivityForm((prev) => ({ ...prev, startDate: e.target.value }))
                }
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="End Date"
                type="datetime-local"
                fullWidth
                size="small"
                InputLabelProps={{ shrink: true }}
                value={activityForm.endDate}
                onChange={(e) =>
                  setActivityForm((prev) => ({ ...prev, endDate: e.target.value }))
                }
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Description"
                fullWidth
                multiline
                minRows={2}
                size="small"
                value={activityForm.description}
                onChange={(e) =>
                  setActivityForm((prev) => ({ ...prev, description: e.target.value }))
                }
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActivityDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateActivity}>
            Add Activity
          </Button>
        </DialogActions>
      </Dialog>

      {/* Schedule Meeting Dialog */}
      <Dialog
        open={meetingDialogOpen}
        onClose={() => setMeetingDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Schedule Meeting</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                label="Subject"
                fullWidth
                size="small"
                required
                value={meetingForm.subject}
                onChange={(e) =>
                  setMeetingForm((prev) => ({ ...prev, subject: e.target.value }))
                }
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Meeting Date"
                type="date"
                fullWidth
                size="small"
                required
                InputLabelProps={{ shrink: true }}
                value={meetingForm.meetingDate}
                onChange={(e) =>
                  setMeetingForm((prev) => ({ ...prev, meetingDate: e.target.value }))
                }
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Meeting Type</InputLabel>
                <Select
                  value={meetingForm.meetingType}
                  label="Meeting Type"
                  onChange={(e) =>
                    setMeetingForm((prev) => ({ ...prev, meetingType: e.target.value }))
                  }
                >
                  <MenuItem value={1}>Physical</MenuItem>
                  <MenuItem value={2}>Online</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Start Time"
                type="time"
                fullWidth
                size="small"
                required
                InputLabelProps={{ shrink: true }}
                value={meetingForm.startTime}
                onChange={(e) =>
                  setMeetingForm((prev) => ({ ...prev, startTime: e.target.value }))
                }
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="End Time"
                type="time"
                fullWidth
                size="small"
                InputLabelProps={{ shrink: true }}
                value={meetingForm.endTime}
                onChange={(e) =>
                  setMeetingForm((prev) => ({ ...prev, endTime: e.target.value }))
                }
              />
            </Grid>
            {meetingForm.meetingType === 1 && (
              <Grid item xs={12}>
                <TextField
                  label="Location"
                  fullWidth
                  size="small"
                  value={meetingForm.location}
                  onChange={(e) =>
                    setMeetingForm((prev) => ({ ...prev, location: e.target.value }))
                  }
                />
              </Grid>
            )}
            {meetingForm.meetingType === 2 && (
              <Grid item xs={12}>
                <TextField
                  label="Meeting Link"
                  fullWidth
                  size="small"
                  placeholder="https://meet.google.com/... or https://zoom.us/..."
                  value={meetingForm.meetingLink}
                  onChange={(e) =>
                    setMeetingForm((prev) => ({ ...prev, meetingLink: e.target.value }))
                  }
                />
              </Grid>
            )}
            <Grid item xs={12}>
              <TextField
                label="Description"
                fullWidth
                multiline
                minRows={2}
                size="small"
                value={meetingForm.description}
                onChange={(e) =>
                  setMeetingForm((prev) => ({ ...prev, description: e.target.value }))
                }
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMeetingDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateMeeting}>
            Schedule Meeting
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
