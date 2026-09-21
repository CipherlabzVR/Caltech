import React, { useEffect, useMemo, useState } from "react";
import Grid from "@mui/material/Grid";
import Link from "next/link";
import styles from "@/styles/PageTitle.module.css";
import {
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Pagination,
  Paper,
  Radio,
  RadioGroup,
  Select,
  Switch,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import ScheduleIcon from "@mui/icons-material/Schedule";
import HistoryIcon from "@mui/icons-material/History";
import VisibilityIcon from "@mui/icons-material/Visibility";
import CancelIcon from "@mui/icons-material/Cancel";
import BASE_URL from "Base/api";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import RichTextEditor from "@/components/help-desk/RichTextEditor";
import { Search, StyledInputBase } from "@/styles/main/search-styles";
import { formatDate } from "@/components/utils/formatHelper";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const AUDIENCE_OPTIONS = [
  { value: "all", label: "All Users" },
  { value: "self", label: "Self Users" },
  { value: "parents", label: "Parents" },
  { value: "relation", label: "Relation" },
  { value: "matchmaker", label: "Matchmakers" },
  { value: "no-profile-image", label: "Users Without Profile Image" },
  { value: "no-partner-preferences", label: "Users Without Partner Preferences" },
];

const USER_TYPE_OPTIONS = [
  { value: "all", label: "All" },
  { value: "premium", label: "Premium" },
  { value: "free", label: "Free" },
];

const audienceLabel = (value) =>
  value === "selected"
    ? "Selected user(s)"
    : AUDIENCE_OPTIONS.find((opt) => opt.value === value)?.label ?? value ?? "All Users";

const userTypeLabel = (value) =>
  USER_TYPE_OPTIONS.find((opt) => opt.value === value)?.label ?? value ?? "All";

const field = (row, camel, pascal) => row?.[camel] ?? row?.[pascal] ?? "";

const statusMeta = (status) => {
  const raw = String(status ?? "");
  const n = Number(status);
  if (raw === "Pending" || n === 0) return { label: "Scheduled", color: "warning" };
  if (raw === "Sending" || n === 1) return { label: "Sending", color: "info" };
  if (raw === "Sent" || n === 2) return { label: "Sent", color: "success" };
  if (raw === "Failed" || n === 3) return { label: "Failed", color: "error" };
  if (raw === "Cancelled" || n === 4) return { label: "Cancelled", color: "default" };
  return { label: raw || "Sent", color: "success" };
};

/** Convert datetime-local (browser local) value to UTC ISO string. */
const localDateTimeToUtcIso = (localValue) => {
  if (!localValue) return null;
  const d = new Date(localValue);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
};

const formatUtcDisplay = (utcValue) => {
  if (!utcValue) return "-";
  const d = new Date(utcValue);
  if (Number.isNaN(d.getTime())) return String(utcValue);
  return d.toLocaleString();
};

/** Minimum schedule: 2 minutes from now, as datetime-local string. */
const minScheduleLocalValue = () => {
  const d = new Date(Date.now() + 2 * 60 * 1000);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/** Must match SidebarData Matrimonial → Email Center categoryId. */
const MATRIMONIAL_CATEGORY_EMAIL_CENTER = 226;

export default function MatrimonialEmailCenter() {
  const { navigate, create, permissionsLoading } = IsPermissionEnabled(
    MATRIMONIAL_CATEGORY_EMAIL_CENTER
  );

  const [activeTab, setActiveTab] = useState(0);

  const [recipientMode, setRecipientMode] = useState("filters"); // filters | selected
  const [audienceFilter, setAudienceFilter] = useState("all");
  const [userTypeFilter, setUserTypeFilter] = useState("all");
  const [recipients, setRecipients] = useState([]);
  const [recipientsLoading, setRecipientsLoading] = useState(false);

  const [userSearchInput, setUserSearchInput] = useState("");
  const [userOptions, setUserOptions] = useState([]);
  const [userSearchLoading, setUserSearchLoading] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);

  const [subject, setSubject] = useState("");
  const [htmlBody, setHtmlBody] = useState("");
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduleLocal, setScheduleLocal] = useState("");
  const [sending, setSending] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [historyItems, setHistoryItems] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyPage, setHistoryPage] = useState(0);
  const [historyRowsPerPage] = useState(10);
  const [historyTotalCount, setHistoryTotalCount] = useState(0);
  const [historySearch, setHistorySearch] = useState("");
  const [historyDetailOpen, setHistoryDetailOpen] = useState(false);
  const [historyDetail, setHistoryDetail] = useState(null);
  const [historyDetailLoading, setHistoryDetailLoading] = useState(false);

  const effectiveRecipients = useMemo(() => {
    if (recipientMode === "selected") {
      return selectedUsers;
    }
    return recipients;
  }, [recipientMode, selectedUsers, recipients]);

  const userOptionId = (opt) => opt?.id ?? opt?.Id;

  const selectableUserOptions = useMemo(() => {
    const selectedIds = new Set(selectedUsers.map(userOptionId).filter((id) => id != null));
    return userOptions.filter((opt) => !selectedIds.has(userOptionId(opt)));
  }, [userOptions, selectedUsers]);

  const fetchRecipients = async (audience = audienceFilter, userType = userTypeFilter) => {
    setRecipientsLoading(true);
    try {
      const response = await fetch(
        `${BASE_URL}/Matrimonial/GetBulkEmailRecipients?audienceFilter=${audience}&userTypeFilter=${userType}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok) throw new Error("Failed to fetch recipients");
      const data = await response.json();
      setRecipients(data.result ?? data.Result ?? []);
    } catch (error) {
      console.error("Error fetching recipients:", error);
      toast.error("Failed to load recipients");
      setRecipients([]);
    } finally {
      setRecipientsLoading(false);
    }
  };

  const searchUsers = async (term) => {
    setUserSearchLoading(true);
    try {
      const q = encodeURIComponent((term || "").trim());
      const response = await fetch(
        `${BASE_URL}/Matrimonial/SearchBulkEmailUsers?search=${q}&maxResults=20`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok) throw new Error("Failed to search users");
      const data = await response.json();
      setUserOptions(data.result ?? data.Result ?? []);
    } catch (error) {
      console.error("Error searching users:", error);
      setUserOptions([]);
    } finally {
      setUserSearchLoading(false);
    }
  };

  const fetchHistory = async (currentPage = historyPage, currentSearch = historySearch) => {
    setHistoryLoading(true);
    try {
      const skipCount = currentPage * historyRowsPerPage;
      const searchValue = currentSearch?.trim()
        ? encodeURIComponent(currentSearch.trim())
        : "null";
      const response = await fetch(
        `${BASE_URL}/Matrimonial/GetAllBulkEmailLogsPaged?SkipCount=${skipCount}&MaxResultCount=${historyRowsPerPage}&Search=${searchValue}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok) throw new Error("Failed to fetch send history");
      const data = await response.json();
      const wrap = data?.result ?? data?.Result ?? {};
      const items = wrap.items ?? wrap.Items ?? [];
      setHistoryItems(Array.isArray(items) ? items : []);
      setHistoryTotalCount(Number(wrap.totalCount ?? wrap.TotalCount ?? 0) || 0);
    } catch (error) {
      console.error("Error fetching send history:", error);
      toast.error("Failed to load send history");
      setHistoryItems([]);
      setHistoryTotalCount(0);
    } finally {
      setHistoryLoading(false);
    }
  };

  const openHistoryDetail = async (id) => {
    setHistoryDetailOpen(true);
    setHistoryDetailLoading(true);
    setHistoryDetail(null);
    try {
      const response = await fetch(`${BASE_URL}/Matrimonial/GetBulkEmailLogById?id=${id}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) throw new Error("Failed to fetch log detail");
      const data = await response.json();
      setHistoryDetail(data.result ?? data.Result ?? null);
    } catch (error) {
      console.error("Error fetching log detail:", error);
      toast.error("Failed to load email log detail");
      setHistoryDetailOpen(false);
    } finally {
      setHistoryDetailLoading(false);
    }
  };

  const cancelScheduled = async (id) => {
    try {
      const response = await fetch(`${BASE_URL}/Matrimonial/CancelScheduledBulkEmail?id=${id}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      const status = data.statusCode ?? data.StatusCode;
      const message = data.message ?? data.Message ?? "";
      if (status === 200 || status === 1 || status === "SUCCESS") {
        toast.success(message || "Scheduled email cancelled");
        fetchHistory(historyPage, historySearch);
      } else {
        toast.error(message || "Failed to cancel");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to cancel scheduled email");
    }
  };

  useEffect(() => {
    sessionStorage.setItem("category", String(MATRIMONIAL_CATEGORY_EMAIL_CENTER));
  }, []);

  useEffect(() => {
    if (activeTab === 0 && recipientMode === "filters") {
      fetchRecipients(audienceFilter, userTypeFilter);
    }
  }, [audienceFilter, userTypeFilter, activeTab, recipientMode]);

  useEffect(() => {
    if (activeTab === 0 && recipientMode === "selected") {
      const t = setTimeout(() => searchUsers(userSearchInput), 300);
      return () => clearTimeout(t);
    }
  }, [userSearchInput, activeTab, recipientMode]);

  useEffect(() => {
    if (activeTab === 1) {
      fetchHistory(historyPage, historySearch);
    }
  }, [activeTab, historyPage, historySearch]);

  const isBodyEmpty = !htmlBody || htmlBody.replace(/<[^>]+>/g, "").trim() === "";

  const handleSendClick = () => {
    if (!subject.trim()) {
      toast.error("Please enter a subject");
      return;
    }
    if (isBodyEmpty) {
      toast.error("Please enter the email body");
      return;
    }
    if (effectiveRecipients.length === 0) {
      toast.error(
        recipientMode === "selected"
          ? "Please select at least one person to email"
          : "No users match the selected filters"
      );
      return;
    }
    if (scheduleEnabled) {
      if (!scheduleLocal) {
        toast.error("Please choose a schedule date and time");
        return;
      }
      const when = new Date(scheduleLocal);
      if (Number.isNaN(when.getTime()) || when.getTime() <= Date.now() + 60 * 1000) {
        toast.error("Schedule time must be at least 1–2 minutes in the future");
        return;
      }
    }
    setConfirmOpen(true);
  };

  const handleSend = async () => {
    setConfirmOpen(false);
    setSending(true);
    try {
      const body = {
        subject: subject.trim(),
        htmlBody,
        audienceFilter: recipientMode === "selected" ? "selected" : audienceFilter,
        userTypeFilter: recipientMode === "selected" ? "all" : userTypeFilter,
        recipientUserIds:
          recipientMode === "selected"
            ? selectedUsers.map(userOptionId).filter((id) => id != null)
            : null,
        scheduledAtUtc: scheduleEnabled ? localDateTimeToUtcIso(scheduleLocal) : null,
      };

      const response = await fetch(`${BASE_URL}/Matrimonial/SendBulkEmail`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error("Failed to send emails");
      const data = await response.json();
      const status = data.statusCode ?? data.StatusCode;
      const message = data.message ?? data.Message ?? "";
      if (status === 200 || status === 1 || status === "SUCCESS") {
        toast.success(message || (scheduleEnabled ? "Email scheduled" : "Emails sent successfully"));
        setSubject("");
        setHtmlBody("");
        setScheduleEnabled(false);
        setScheduleLocal("");
        setSelectedUsers([]);
        if (activeTab === 1) {
          fetchHistory(historyPage, historySearch);
        } else {
          setActiveTab(1);
        }
      } else {
        toast.error(message || "Failed to send emails");
      }
    } catch (error) {
      console.error("Error sending bulk email:", error);
      toast.error("Failed to send emails");
    } finally {
      setSending(false);
    }
  };

  if (permissionsLoading) {
    return null;
  }

  if (!navigate) {
    return <AccessDenied />;
  }

  const detailRecipients = historyDetail?.recipients ?? historyDetail?.Recipients ?? [];
  const confirmCount = effectiveRecipients.length;

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Email Center</h1>
        <ul>
          <li>
            <Link href="/matrimonial/email-center/">Matrimonial</Link>
          </li>
        </ul>
      </div>

      <Paper sx={{ mb: 2 }}>
        <Tabs
          value={activeTab}
          onChange={(_, value) => setActiveTab(value)}
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab icon={<SendIcon />} iconPosition="start" label="Compose" />
          <Tab icon={<HistoryIcon />} iconPosition="start" label="Send History" />
        </Tabs>
      </Paper>

      {activeTab === 0 && (
        <Grid container spacing={2}>
          <Grid item xs={12} lg={5}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                Select Recipients
              </Typography>

              <FormControl component="fieldset" sx={{ mb: 2 }}>
                <RadioGroup
                  row
                  value={recipientMode}
                  onChange={(e) => setRecipientMode(e.target.value)}
                >
                  <FormControlLabel value="filters" control={<Radio size="small" />} label="Filter group" />
                  <FormControlLabel
                    value="selected"
                    control={<Radio size="small" />}
                    label="Select people"
                  />
                </RadioGroup>
              </FormControl>

              {recipientMode === "filters" ? (
                <>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Users</InputLabel>
                        <Select
                          value={audienceFilter}
                          label="Users"
                          onChange={(e) => setAudienceFilter(e.target.value)}
                        >
                          {AUDIENCE_OPTIONS.map((opt) => (
                            <MenuItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth size="small">
                        <InputLabel>User Type</InputLabel>
                        <Select
                          value={userTypeFilter}
                          label="User Type"
                          onChange={(e) => setUserTypeFilter(e.target.value)}
                        >
                          {USER_TYPE_OPTIONS.map((opt) => (
                            <MenuItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>

                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 2, mb: 1 }}>
                    <Typography variant="subtitle2">Matching Recipients</Typography>
                    {recipientsLoading ? (
                      <CircularProgress size={16} />
                    ) : (
                      <Chip size="small" color="primary" label={recipients.length} />
                    )}
                  </Box>

                  <TableContainer sx={{ maxHeight: 360, border: "1px solid #e0e0e0", borderRadius: 1 }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {!recipientsLoading && recipients.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={3} align="center" sx={{ color: "text.secondary" }}>
                              No users match the selected filters
                            </TableCell>
                          </TableRow>
                        )}
                        {recipients.map((r) => {
                          const id = r.id ?? r.Id;
                          const isPremium = r.isPremium ?? r.IsPremium;
                          return (
                            <TableRow key={id} hover>
                              <TableCell>{(r.name ?? r.Name) || "-"}</TableCell>
                              <TableCell>{r.email ?? r.Email}</TableCell>
                              <TableCell>
                                <Chip
                                  size="small"
                                  label={isPremium ? "Premium" : "Free"}
                                  color={isPremium ? "success" : "default"}
                                  variant={isPremium ? "filled" : "outlined"}
                                />
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              ) : (
                <>
                  <Autocomplete
                    multiple
                    options={selectableUserOptions}
                    loading={userSearchLoading}
                    value={selectedUsers}
                    onChange={(_, value) => setSelectedUsers(value ?? [])}
                    inputValue={userSearchInput}
                    onInputChange={(_, value, reason) => {
                      if (reason !== "reset") setUserSearchInput(value);
                    }}
                    filterSelectedOptions
                    getOptionLabel={(opt) => {
                      const name = opt?.name ?? opt?.Name ?? "";
                      const email = opt?.email ?? opt?.Email ?? "";
                      return name && email ? `${name} (${email})` : name || email || "";
                    }}
                    isOptionEqualToValue={(a, b) => userOptionId(a) === userOptionId(b)}
                    renderTags={() => null}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Search and select people"
                        size="small"
                        placeholder={
                          selectedUsers.length === 0
                            ? "Type name or email to add..."
                            : "Add another..."
                        }
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {userSearchLoading ? <CircularProgress size={16} /> : null}
                              {params.InputProps.endAdornment}
                            </>
                          ),
                        }}
                      />
                    )}
                  />

                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 2, mb: 1 }}>
                    <Typography variant="subtitle2">Selected People</Typography>
                    <Chip size="small" color="primary" label={selectedUsers.length} />
                    {selectedUsers.length > 0 && (
                      <Button size="small" onClick={() => setSelectedUsers([])}>
                        Clear all
                      </Button>
                    )}
                  </Box>

                  <TableContainer sx={{ maxHeight: 280, border: "1px solid #e0e0e0", borderRadius: 1 }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                          <TableCell sx={{ fontWeight: 600 }} align="right">
                            Remove
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedUsers.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={4} align="center" sx={{ color: "text.secondary" }}>
                              Search above to add one or more people
                            </TableCell>
                          </TableRow>
                        )}
                        {selectedUsers.map((r) => {
                          const id = userOptionId(r);
                          const isPremium = r.isPremium ?? r.IsPremium;
                          return (
                            <TableRow key={id} hover>
                              <TableCell>{(r.name ?? r.Name) || "-"}</TableCell>
                              <TableCell>{r.email ?? r.Email}</TableCell>
                              <TableCell>
                                <Chip
                                  size="small"
                                  label={isPremium ? "Premium" : "Free"}
                                  color={isPremium ? "success" : "default"}
                                  variant={isPremium ? "filled" : "outlined"}
                                />
                              </TableCell>
                              <TableCell align="right">
                                <IconButton
                                  size="small"
                                  aria-label="Remove recipient"
                                  onClick={() =>
                                    setSelectedUsers((prev) =>
                                      prev.filter((u) => userOptionId(u) !== id)
                                    )
                                  }
                                >
                                  <CancelIcon fontSize="small" />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              )}
            </Paper>
          </Grid>

          <Grid item xs={12} lg={7}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Compose Email
              </Typography>

              <TextField
                fullWidth
                size="small"
                label="Subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                sx={{ mb: 2 }}
              />

              <RichTextEditor
                value={htmlBody}
                onChange={setHtmlBody}
                placeholder="Type your email here..."
              />

              <Box
                sx={{
                  mt: 2,
                  p: 1.5,
                  border: "1px solid #e0e0e0",
                  borderRadius: 1,
                  bgcolor: "#fafafa",
                }}
              >
                <FormControlLabel
                  control={
                    <Switch
                      checked={scheduleEnabled}
                      onChange={(e) => {
                        setScheduleEnabled(e.target.checked);
                        if (e.target.checked && !scheduleLocal) {
                          setScheduleLocal(minScheduleLocalValue());
                        }
                      }}
                    />
                  }
                  label={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      <ScheduleIcon fontSize="small" />
                      <span>Schedule for later</span>
                    </Box>
                  }
                />
                {scheduleEnabled && (
                  <TextField
                    fullWidth
                    size="small"
                    type="datetime-local"
                    label="Send date & time"
                    value={scheduleLocal}
                    onChange={(e) => setScheduleLocal(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    inputProps={{ min: minScheduleLocalValue() }}
                    helperText="Uses your local time. Emails are sent automatically when due."
                    sx={{ mt: 1 }}
                  />
                )}
              </Box>

              <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, mt: 2 }}>
                <Button
                  variant="contained"
                  startIcon={
                    sending ? (
                      <CircularProgress size={18} color="inherit" />
                    ) : scheduleEnabled ? (
                      <ScheduleIcon />
                    ) : (
                      <SendIcon />
                    )
                  }
                  disabled={sending || recipientsLoading || !create}
                  onClick={handleSendClick}
                >
                  {sending
                    ? scheduleEnabled
                      ? "Scheduling..."
                      : "Sending..."
                    : scheduleEnabled
                      ? `Schedule for ${confirmCount} User${confirmCount === 1 ? "" : "s"}`
                      : `Send to ${confirmCount} User${confirmCount === 1 ? "" : "s"}`}
                </Button>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}

      {activeTab === 1 && (
        <Paper sx={{ p: 2 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Send History
            </Typography>
            <Search>
              <StyledInputBase
                placeholder="Search subject, sender, from email..."
                value={historySearch}
                onChange={(e) => {
                  setHistorySearch(e.target.value);
                  setHistoryPage(0);
                }}
              />
            </Search>
          </Box>

          <TableContainer sx={{ border: "1px solid #e0e0e0", borderRadius: 1 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>When</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Subject</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Sent By</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Filters</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Results</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="center">
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {historyLoading && (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <CircularProgress size={24} />
                    </TableCell>
                  </TableRow>
                )}
                {!historyLoading && historyItems.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ color: "text.secondary" }}>
                      No send history yet
                    </TableCell>
                  </TableRow>
                )}
                {!historyLoading &&
                  historyItems.map((row) => {
                    const id = field(row, "id", "Id");
                    const sentCount = field(row, "sentCount", "SentCount");
                    const failedCount = field(row, "failedCount", "FailedCount");
                    const totalCount = field(row, "totalCount", "TotalCount");
                    const status = field(row, "status", "Status");
                    const meta = statusMeta(status);
                    const scheduledAt = field(row, "scheduledAtUtc", "ScheduledAtUtc");
                    const sentAt = field(row, "sentAtUtc", "SentAtUtc");
                    const createdOn = field(row, "createdOn", "CreatedOn");
                    const isPending = meta.label === "Scheduled";
                    return (
                      <TableRow key={id} hover>
                        <TableCell>
                          <Chip size="small" color={meta.color} label={meta.label} />
                        </TableCell>
                        <TableCell>
                          {isPending ? (
                            <>
                              <Typography variant="body2">Scheduled</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {formatUtcDisplay(scheduledAt)}
                              </Typography>
                            </>
                          ) : (
                            <>
                              <Typography variant="body2">
                                {formatDate(sentAt || createdOn)}
                              </Typography>
                              {scheduledAt ? (
                                <Typography variant="caption" color="text.secondary" display="block">
                                  Was scheduled: {formatUtcDisplay(scheduledAt)}
                                </Typography>
                              ) : null}
                            </>
                          )}
                        </TableCell>
                        <TableCell>{field(row, "subject", "Subject")}</TableCell>
                        <TableCell>{field(row, "sentByName", "SentByName") || "-"}</TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {audienceLabel(field(row, "audienceFilter", "AudienceFilter"))}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {userTypeLabel(field(row, "userTypeFilter", "UserTypeFilter"))}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {isPending ? (
                            <Typography variant="caption" color="text.secondary">
                              Waiting — {totalCount || "?"} recipient(s)
                            </Typography>
                          ) : (
                            <>
                              <Chip size="small" color="success" label={`Sent: ${sentCount}`} sx={{ mr: 0.5 }} />
                              {Number(failedCount) > 0 && (
                                <Chip size="small" color="error" label={`Failed: ${failedCount}`} />
                              )}
                              <Typography variant="caption" display="block" color="text.secondary">
                                Total: {totalCount}
                              </Typography>
                            </>
                          )}
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="View details">
                            <IconButton size="small" onClick={() => openHistoryDetail(id)}>
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {isPending && create && (
                            <Tooltip title="Cancel schedule">
                              <IconButton size="small" color="error" onClick={() => cancelScheduled(id)}>
                                <CancelIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </TableContainer>

          {historyTotalCount > historyRowsPerPage && (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
              <Pagination
                count={Math.ceil(historyTotalCount / historyRowsPerPage)}
                page={historyPage + 1}
                onChange={(_, value) => setHistoryPage(value - 1)}
                color="primary"
              />
            </Box>
          )}
        </Paper>
      )}

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>{scheduleEnabled ? "Schedule Email" : "Send Email"}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {scheduleEnabled ? (
              <>
                Schedule &quot;{subject}&quot; for{" "}
                <strong>{formatUtcDisplay(localDateTimeToUtcIso(scheduleLocal))}</strong> to{" "}
                <strong>{confirmCount}</strong> user{confirmCount === 1 ? "" : "s"}?
                It will be sent automatically at that time.
              </>
            ) : (
              <>
                Send &quot;{subject}&quot; to <strong>{confirmCount}</strong> user
                {confirmCount === 1 ? "" : "s"} now?
              </>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSend}
            startIcon={scheduleEnabled ? <ScheduleIcon /> : <SendIcon />}
          >
            {scheduleEnabled ? "Confirm Schedule" : "Send Emails"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={historyDetailOpen}
        onClose={() => setHistoryDetailOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Email Send Log</DialogTitle>
        <DialogContent dividers>
          {historyDetailLoading && (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress />
            </Box>
          )}
          {!historyDetailLoading && historyDetail && (
            <>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">
                    Status
                  </Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <Chip
                      size="small"
                      {...(() => {
                        const m = statusMeta(field(historyDetail, "status", "Status"));
                        return { color: m.color, label: m.label };
                      })()}
                    />
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">
                    Scheduled At
                  </Typography>
                  <Typography>
                    {formatUtcDisplay(field(historyDetail, "scheduledAtUtc", "ScheduledAtUtc"))}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">
                    Sent At
                  </Typography>
                  <Typography>
                    {formatDate(
                      field(historyDetail, "sentAtUtc", "SentAtUtc") ||
                        field(historyDetail, "createdOn", "CreatedOn")
                    )}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">
                    Sent By
                  </Typography>
                  <Typography>
                    {field(historyDetail, "sentByName", "SentByName") || "-"}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">
                    Recipients
                  </Typography>
                  <Typography>
                    {audienceLabel(field(historyDetail, "audienceFilter", "AudienceFilter"))} /{" "}
                    {userTypeLabel(field(historyDetail, "userTypeFilter", "UserTypeFilter"))}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">
                    Subject
                  </Typography>
                  <Typography sx={{ fontWeight: 600 }}>
                    {field(historyDetail, "subject", "Subject")}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">
                    Email Body
                  </Typography>
                  <Box
                    sx={{
                      mt: 0.5,
                      p: 2,
                      border: "1px solid #e0e0e0",
                      borderRadius: 1,
                      maxHeight: 220,
                      overflow: "auto",
                      bgcolor: "#fafafa",
                    }}
                    dangerouslySetInnerHTML={{
                      __html: field(historyDetail, "htmlBody", "HtmlBody") || "<p>-</p>",
                    }}
                  />
                </Grid>
              </Grid>

              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                Recipients ({detailRecipients.length})
              </Typography>
              <TableContainer sx={{ maxHeight: 280, border: "1px solid #e0e0e0", borderRadius: 1 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Error</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {detailRecipients.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} align="center" sx={{ color: "text.secondary" }}>
                          No recipient results yet (scheduled emails fill this after send)
                        </TableCell>
                      </TableRow>
                    ) : (
                      detailRecipients.map((r) => {
                        const rid = field(r, "id", "Id");
                        const isSuccess = r.isSuccess ?? r.IsSuccess;
                        return (
                          <TableRow key={rid} hover>
                            <TableCell>{field(r, "recipientName", "RecipientName") || "-"}</TableCell>
                            <TableCell>{field(r, "recipientEmail", "RecipientEmail")}</TableCell>
                            <TableCell>
                              <Chip
                                size="small"
                                label={isSuccess ? "Sent" : "Failed"}
                                color={isSuccess ? "success" : "error"}
                              />
                            </TableCell>
                            <TableCell sx={{ color: "error.main", fontSize: "0.8rem" }}>
                              {field(r, "errorMessage", "ErrorMessage") || "-"}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHistoryDetailOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
