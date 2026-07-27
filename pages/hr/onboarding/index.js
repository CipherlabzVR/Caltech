import React, { useCallback, useEffect, useState } from "react";
import styles from "@/styles/PageTitle.module.css";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  Divider,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  LinearProgress,
  MenuItem,
  Pagination,
  Paper,
  Select,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import DeleteIcon from "@mui/icons-material/Delete";
import DescriptionIcon from "@mui/icons-material/Description";
import EmailIcon from "@mui/icons-material/Email";
import KeyIcon from "@mui/icons-material/Key";
import SearchIcon from "@mui/icons-material/Search";
import SkipNextIcon from "@mui/icons-material/SkipNext";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import BASE_URL from "Base/api";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import { createAuthHeaders, getOrgId, parsePagedResponse } from "@/components/utils/apiHelpers";
import {
  getOnboardingEmployeeLabel,
  getOnboardingProfileLabel,
} from "@/components/utils/onboardingDisplayNames";
import TemplateTaskContentDialog from "./TemplateTaskContentDialog";

const PAGE_SIZE_OPTIONS = [10, 25, 50];

const STATUS_CHIP = {
  NotStarted: { label: "Not Started", color: "default" },
  InProgress:  { label: "In Progress", color: "warning" },
  Completed:   { label: "Completed",   color: "success" },
};

const TYPE_COLORS = {
  Document:           "info",
  Asset:              "secondary",
  Task:               "primary",
  CredentialDelivery: "warning",
};

function CredentialStatusBadge({ status }) {
  if (status === "Delivered") {
    return <Chip label="Delivered" color="success" size="small" icon={<KeyIcon />} />;
  }
  if (status === "Pending") {
    return <Chip label="Pending" color="warning" size="small" icon={<KeyIcon />} />;
  }
  return <Chip label="None" color="default" size="small" />;
}

function StatusChip({ status }) {
  const cfg = STATUS_CHIP[status] || { label: status, color: "default" };
  return <Chip label={cfg.label} color={cfg.color} size="small" />;
}

function TypeChip({ type }) {
  return (
    <Chip
      label={type || "—"}
      color={TYPE_COLORS[type] || "default"}
      variant="outlined"
      size="small"
    />
  );
}

export default function EmployeeOnboardingList() {
  const router = useRouter();
  const cId = sessionStorage.getItem("category");
  const { navigate } = IsPermissionEnabled(cId);

  const [rows, setRows]         = useState([]);
  const [totalCount, setTotal]  = useState(0);
  const [page, setPage]         = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading]   = useState(false);
  const [searchQuery, setSearchQuery]   = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [detailOpen, setDetailOpen]     = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [modalDetail, setModalDetail] = useState(null);
  const [modalTasks, setModalTasks]   = useState([]);
  const [modalId, setModalId]         = useState(null);
  const [taskLoading, setTaskLoading] = useState({});
  const [completingModal, setCompletingModal]   = useState(false);
  const [skipOpen, setSkipOpen]                 = useState(false);
  const [skipReason, setSkipReason]            = useState("");
  const [skippingModal, setSkippingModal]      = useState(false);

  const [listDeleteOpen, setListDeleteOpen]   = useState(false);
  const [listDeleteId, setListDeleteId]      = useState(null);
  const [listDeleteLabel, setListDeleteLabel] = useState("");
  const [listDeleting, setListDeleting]        = useState(false);

  const [contentDialogOpen, setContentDialogOpen] = useState(false);
  const [contentDialogTask, setContentDialogTask] = useState(null);
  const [needsLoginToggling, setNeedsLoginToggling] = useState(false);
  const [deliveringCredentials, setDeliveringCredentials] = useState(false);

  const openDetailModal = useCallback(async (onboardingId) => {
    setModalId(onboardingId);
    setDetailOpen(true);
    setDetailLoading(true);
    setModalDetail(null);
    setModalTasks([]);
    try {
      const res = await fetch(`${BASE_URL}/hr/onboarding/${onboardingId}`, {
        headers: createAuthHeaders(),
      });
      if (res.ok) {
        const json = await res.json();
        const data = json.result ?? json;
        setModalDetail(data.onboarding ?? data);
        setModalTasks(data.tasks ?? []);
      } else {
        toast.error("Failed to load onboarding details.");
        setDetailOpen(false);
        setModalId(null);
      }
    } catch {
      toast.error("Failed to load onboarding details.");
      setDetailOpen(false);
      setModalId(null);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const closeDetailModal = () => {
    setDetailOpen(false);
    setModalId(null);
    setModalDetail(null);
    setModalTasks([]);
    setTaskLoading({});
    setSkipOpen(false);
    setSkipReason("");
    setContentDialogOpen(false);
    setContentDialogTask(null);
  };

  const isSkippedOnboarding = modalDetail?.isSkipped === true
    || modalDetail?.IsSkipped === true;

  const syncDetailAfterTaskChange = async () => {
    if (!modalId) return;
    fetchList(page, pageSize);
    const detailRes = await fetch(
      `${BASE_URL}/hr/onboarding/${modalId}`,
      { headers: createAuthHeaders() }
    );
    if (detailRes.ok) {
      const jsonDetail = await detailRes.json();
      const payload = jsonDetail.result ?? jsonDetail;
      setModalDetail(payload.onboarding ?? payload);
      setModalTasks(payload.tasks ?? []);
    }
  };

  const handleModalTaskToggle = async (task) => {
    if (!modalId || isSkippedOnboarding || task.type === "CredentialDelivery") return;
    const isDone = task.status === "Completed";

    setTaskLoading((prev) => ({ ...prev, [task.id]: true }));

    if (isDone) {
      setModalTasks((prev) =>
        prev.map((t) =>
          t.id === task.id
            ? { ...t, status: "Pending", completedOn: null }
            : t
        )
      );
    } else {
      setModalTasks((prev) =>
        prev.map((t) =>
          t.id === task.id
            ? { ...t, status: "Completed", completedOn: new Date().toISOString() }
            : t
        )
      );
    }

    const url = isDone
      ? `${BASE_URL}/hr/onboarding/tasks/${task.id}/pending`
      : `${BASE_URL}/hr/onboarding/tasks/${task.id}/complete`;

    try {
      const res = await fetch(url, { method: "PATCH", headers: createAuthHeaders() });
      const data = await res.json();
      if (data.statusCode !== 200) {
        toast.error(
          data.message
            || (isDone ? "Failed to uncheck task." : "Failed to mark task complete.")
        );
        setModalTasks((prev) =>
          prev.map((t) =>
            t.id === task.id
              ? isDone
                ? { ...t, status: "Completed", completedOn: task.completedOn }
                : { ...t, status: "Pending", completedOn: null }
              : t
          )
        );
      } else {
        await syncDetailAfterTaskChange();
      }
    } catch (err) {
      toast.error(err.message || "Network error.");
      setModalTasks((prev) =>
        prev.map((t) =>
          t.id === task.id
            ? isDone
              ? { ...t, status: "Completed", completedOn: task.completedOn }
              : { ...t, status: "Pending", completedOn: null }
            : t
        )
      );
    } finally {
      setTaskLoading((prev) => ({ ...prev, [task.id]: false }));
    }
  };

  const modalOnboardingComplete = modalDetail?.status === "Completed";
  const pendingRequiredCount = modalTasks.filter(
    (t) =>
      t.isRequired &&
      t.status === "Pending" &&
      t.type !== "CredentialDelivery"
  ).length;

  const modalNeedsLogin =
    modalDetail?.needsLogin ?? modalDetail?.NeedsLogin ?? false;
  const modalCredentialStatus =
    modalDetail?.credentialStatus ?? modalDetail?.CredentialStatus ?? "None";

  const handleModalNeedsLoginToggle = async (checked) => {
    if (!modalId) return;
    setNeedsLoginToggling(true);
    try {
      const orgId = getOrgId() ?? 0;
      const res = await fetch(`${BASE_URL}/hr/onboarding/${modalId}/needs-login`, {
        method: "PATCH",
        headers: createAuthHeaders(),
        body: JSON.stringify({ NeedsLogin: checked, OrgId: orgId }),
      });
      const data = await res.json();
      const ok = data.statusCode === 200 || data.StatusCode === 200;
      if (ok) {
        toast.success(
          checked
            ? "System login enabled. A credential task has been added."
            : "System login disabled."
        );
        await syncDetailAfterTaskChange();
      } else {
        toast.error(data.message || "Failed to update login setting.");
      }
    } catch (err) {
      toast.error(err.message || "Network error.");
    } finally {
      setNeedsLoginToggling(false);
    }
  };

  const handleModalMarkCredentialDelivered = async () => {
    if (!modalId) return;
    setDeliveringCredentials(true);
    try {
      const orgId = getOrgId() ?? 0;
      const res = await fetch(
        `${BASE_URL}/hr/onboarding/${modalId}/credential-delivered`,
        {
          method: "PATCH",
          headers: createAuthHeaders(),
          body: JSON.stringify({ OrgId: orgId }),
        }
      );
      const data = await res.json();
      if (data.statusCode === 200) {
        toast.success("Credentials delivered.");
        await syncDetailAfterTaskChange();
      } else {
        toast.error(data.message || "Failed.");
      }
    } catch (err) {
      toast.error(err.message || "Network error.");
    } finally {
      setDeliveringCredentials(false);
    }
  };

  const handleModalCompleteOnboarding = async () => {
    if (!modalId || pendingRequiredCount > 0) {
      if (pendingRequiredCount > 0) {
        toast.warning(
          "Complete all required tasks before marking onboarding as done."
        );
      }
      return;
    }
    setCompletingModal(true);
    try {
      const res = await fetch(
        `${BASE_URL}/hr/onboarding/${modalId}/complete`,
        { method: "PATCH", headers: createAuthHeaders() }
      );
      const data = await res.json();
      if (data.statusCode === 200) {
        toast.success(data.message || "Onboarding completed.");
        await syncDetailAfterTaskChange();
      } else {
        toast.error(data.message || "Cannot complete onboarding.");
      }
    } catch (err) {
      toast.error(err.message || "Network error.");
    } finally {
      setCompletingModal(false);
    }
  };

  const handleModalSkipConfirm = async () => {
    if (!skipReason.trim()) {
      toast.warning("Skip reason is required.");
      return;
    }
    if (!modalId) return;
    setSkippingModal(true);
    try {
      const res = await fetch(
        `${BASE_URL}/hr/onboarding/${modalId}/skip`,
        {
          method: "PATCH",
          headers: createAuthHeaders(),
          body: JSON.stringify({
            OnboardingId: Number(modalId),
            SkipReason: skipReason.trim(),
          }),
        }
      );
      const data = await res.json();
      if (data.statusCode === 200) {
        toast.success("Onboarding skipped.");
        setSkipOpen(false);
        setSkipReason("");
        closeDetailModal();
        fetchList(page, pageSize);
      } else {
        toast.error(data.message || "Failed to skip onboarding.");
      }
    } catch (err) {
      toast.error(err.message || "Network error.");
    } finally {
      setSkippingModal(false);
    }
  };

  const fetchList = useCallback(
    async (p = 1, size = 10) => {
      setLoading(true);
      try {
        const skip = (p - 1) * size;
        const params = new URLSearchParams();
        params.set("skipCount", String(skip));
        params.set("maxResultCount", String(size));
        const q = searchQuery.trim();
        if (q) params.set("search", q);
        if (statusFilter && statusFilter !== "all") {
          params.set("status", statusFilter);
        }
        const res = await fetch(
          `${BASE_URL}/hr/onboarding?${params.toString()}`,
          { headers: createAuthHeaders() }
        );
        if (res.ok) {
          const json = await res.json();
          const { items, totalCount: tc } = parsePagedResponse(json);
          setRows(items);
          setTotal(tc);
        }
      } finally {
        setLoading(false);
      }
    },
    [searchQuery, statusFilter]
  );

  useEffect(() => {
    fetchList(page, pageSize);
  }, [fetchList, page, pageSize]);

  const handlePageChange = (_, value) => {
    setPage(value);
  };

  const handlePageSizeChange = (e) => {
    const size = e.target.value;
    setPageSize(size);
    setPage(1);
  };

  const handleSearchChange = (e) => {
    setPage(1);
    setSearchQuery(e.target.value);
  };

  const handleStatusFilterChange = (e) => {
    setPage(1);
    setStatusFilter(e.target.value);
  };

  const clearListFilters = () => {
    setPage(1);
    setSearchQuery("");
    setStatusFilter("all");
  };

  const openListDelete = (row) => {
    const id = row.id ?? row.Id;
    const empName = getOnboardingEmployeeLabel(row);
    const pName = getOnboardingProfileLabel(row);
    setListDeleteId(id);
    setListDeleteLabel(`${empName} — ${pName}`);
    setListDeleteOpen(true);
  };

  const closeListDelete = () => {
    if (!listDeleting) {
      setListDeleteOpen(false);
      setListDeleteId(null);
      setListDeleteLabel("");
    }
  };

  const handleListDeleteConfirm = async () => {
    if (listDeleteId == null) return;
    setListDeleting(true);
    try {
      const res = await fetch(
        `${BASE_URL}/hr/onboarding/${listDeleteId}`,
        { method: "DELETE", headers: createAuthHeaders() }
      );
      const data = await res.json();
      if (data.statusCode === 200) {
        toast.success(data.message || "Onboarding removed.");
        if (modalId != null && Number(modalId) === Number(listDeleteId)) {
          closeDetailModal();
        }
        setListDeleteOpen(false);
        setListDeleteId(null);
        setListDeleteLabel("");
        fetchList(page, pageSize);
      } else {
        toast.error(data.message || "Failed to delete onboarding.");
      }
    } catch (e) {
      toast.error(e.message || "Failed to delete onboarding.");
    } finally {
      setListDeleting(false);
    }
  };

  const hasListFilters =
    searchQuery.trim() !== "" || statusFilter !== "all";

  if (!navigate) return <AccessDenied />;

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Employee Onboarding</h1>
        <ul>
          <li><Link href="/hr/onboarding/">Employee Onboarding</Link></li>
        </ul>
      </div>

      <Grid container rowSpacing={1} columnSpacing={1}>
        {/* Assign button */}
        <Grid item xs={12} display="flex" justifyContent="flex-end" mb={1}>
          <Button
            variant="outlined"
            onClick={() => router.push("/hr/onboarding/assign")}
          >
            + Assign Onboarding
          </Button>
        </Grid>

        {/* Search and status filter (match recruitment / cycles pattern) */}
        <Grid item xs={12}>
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 2,
              alignItems: "center",
              mb: 2,
            }}
          >
            <TextField
              size="small"
              placeholder="Search by employee or profile name…"
              value={searchQuery}
              onChange={handleSearchChange}
              sx={{ flexGrow: 1, minWidth: 220, maxWidth: { sm: 420 } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" color="action" />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              select
              size="small"
              label="Status"
              value={statusFilter}
              onChange={handleStatusFilterChange}
              sx={{ minWidth: 180 }}
            >
              <MenuItem value="all">All statuses</MenuItem>
              <MenuItem value="NotStarted">Not started</MenuItem>
              <MenuItem value="InProgress">In progress</MenuItem>
              <MenuItem value="Completed">Completed</MenuItem>
            </TextField>
            {hasListFilters && (
              <Button size="small" variant="text" onClick={clearListFilters}>
                Clear filters
              </Button>
            )}
          </Box>
        </Grid>

        {/* Table */}
        <Grid item xs={12}>
          <TableContainer component={Paper}>
            <Table aria-label="onboarding-list" className="dark-table">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, textTransform: "uppercase", fontSize: "0.75rem", letterSpacing: "0.04em" }}>
                    Employee
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, textTransform: "uppercase", fontSize: "0.75rem", letterSpacing: "0.04em" }}>
                    Profile
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, textTransform: "uppercase", fontSize: "0.75rem", letterSpacing: "0.04em" }}>
                    Status
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, textTransform: "uppercase", fontSize: "0.75rem", letterSpacing: "0.04em" }}>
                    Action
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                      <CircularProgress size={28} />
                    </TableCell>
                  </TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4}>
                      <Typography color="text.secondary">
                        No onboarding records found.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row) => {
                    const empName = getOnboardingEmployeeLabel(row);
                    const profileName = getOnboardingProfileLabel(row);
                    const rowKey = row.id ?? row.Id;
                    return (
                      <TableRow key={rowKey}>
                        <TableCell>{empName}</TableCell>
                        <TableCell>{profileName}</TableCell>
                        <TableCell>
                          <StatusChip status={row.status} />
                        </TableCell>
                        <TableCell align="right">
                          <Box
                            display="inline-flex"
                            alignItems="center"
                            justifyContent="flex-end"
                            gap={0.5}
                          >
                            <Tooltip title="View details" placement="top">
                              <IconButton
                                size="small"
                                onClick={() => openDetailModal(rowKey)}
                                aria-label="View onboarding details"
                              >
                                <VisibilityIcon
                                  color="primary"
                                  fontSize="inherit"
                                />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete" placement="top">
                              <IconButton
                                size="small"
                                onClick={() => openListDelete(row)}
                                aria-label="Delete onboarding"
                              >
                                <DeleteIcon color="error" fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>

            <Grid container justifyContent="space-between" mt={2} mb={2} px={1}>
              <Pagination
                count={Math.ceil(totalCount / pageSize)}
                page={page}
                onChange={handlePageChange}
                color="primary"
                shape="rounded"
              />
              <FormControl size="small" sx={{ width: 100 }}>
                <InputLabel>Page Size</InputLabel>
                <Select
                  value={pageSize}
                  label="Page Size"
                  onChange={handlePageSizeChange}
                >
                  {PAGE_SIZE_OPTIONS.map((s) => (
                    <MenuItem key={s} value={s}>{s}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </TableContainer>
        </Grid>
      </Grid>

      <Dialog
        open={detailOpen}
        onClose={closeDetailModal}
        maxWidth="md"
        fullWidth
        scroll="paper"
        aria-labelledby="onboarding-detail-dialog-title"
      >
        <DialogTitle id="onboarding-detail-dialog-title">
          Onboarding details
        </DialogTitle>
        <DialogContent dividers>
          {detailLoading ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : modalDetail ? (
            <>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">
                    Employee
                  </Typography>
                  <Typography variant="subtitle1" fontWeight={600} display="block">
                    {getOnboardingEmployeeLabel(modalDetail)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">
                    Onboarding profile
                  </Typography>
                  <Typography variant="subtitle1" fontWeight={600} display="block">
                    {getOnboardingProfileLabel(modalDetail)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="caption" color="text.secondary">
                    Status
                  </Typography>
                  <Box mt={0.5}>
                    <StatusChip status={modalDetail.status} />
                  </Box>
                </Grid>
                <Grid item xs={12} sm={8}>
                  <Typography variant="caption" color="text.secondary">
                    Progress
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                    <LinearProgress
                      variant="determinate"
                      value={
                        modalTasks.length > 0
                          ? Math.round(
                              (modalTasks.filter((t) => t.status === "Completed")
                                .length /
                                modalTasks.length) *
                                100
                            )
                          : 0
                      }
                      sx={{ flex: 1, height: 8, borderRadius: 4 }}
                      color={
                        modalTasks.length > 0 &&
                        modalTasks.every((t) => t.status === "Completed")
                          ? "success"
                          : "primary"
                      }
                    />
                    <Typography variant="caption">
                      {modalTasks.filter((t) => t.status === "Completed").length}/
                      {modalTasks.length}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                Checklist tasks
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ width: 56 }}>Done</TableCell>
                      <TableCell>Title</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Assigned to</TableCell>
                      <TableCell>Required</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {modalTasks.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 2 }}>
                          <Typography variant="body2" color="text.secondary">
                            No tasks.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      modalTasks.map((task) => {
                        const isDone = task.status === "Completed";
                        const isBusy = !!taskLoading[task.id];
                        const isCredTask = task.type === "CredentialDelivery";
                        const hasTemplate = !!(task.templateId ?? task.TemplateId);
                        const rowTplType = task.templateType ?? task.TemplateType;
                        const isEmailTpl = rowTplType === "Email";
                        return (
                          <TableRow
                            key={task.id}
                            sx={{
                              opacity: isDone ? 0.65 : 1,
                              textDecoration: isDone && !isCredTask ? "line-through" : "none",
                              background: isCredTask ? "rgba(255, 167, 38, 0.12)" : undefined,
                            }}
                          >
                            <TableCell>
                              {isBusy ? (
                                <CircularProgress size={18} />
                              ) : isCredTask ? (
                                <KeyIcon
                                  fontSize="small"
                                  color={isDone ? "success" : "warning"}
                                  sx={{ ml: 0.5 }}
                                />
                              ) : (
                                <Checkbox
                                  checked={isDone}
                                  disabled={isBusy || isSkippedOnboarding}
                                  onChange={() => handleModalTaskToggle(task)}
                                  size="small"
                                  color="success"
                                />
                              )}
                            </TableCell>
                            <TableCell>
                              {isCredTask ? (
                                <Box display="flex" alignItems="center" gap={0.5}>
                                  <KeyIcon fontSize="inherit" color="warning" />
                                  {task.title}
                                </Box>
                              ) : (
                                task.title
                              )}
                            </TableCell>
                            <TableCell>
                              <TypeChip type={task.type} />
                            </TableCell>
                            <TableCell>{task.assignedTo}</TableCell>
                            <TableCell>
                              {task.isRequired ? (
                                <Chip label="Yes" size="small" color="error" variant="outlined" />
                              ) : (
                                <Chip label="No" size="small" variant="outlined" />
                              )}
                            </TableCell>
                            <TableCell>
                              {isCredTask && !isDone ? (
                                <Chip label="Awaiting Delivery" size="small" color="warning" />
                              ) : (
                                <Chip
                                  label={isDone ? "Completed" : "Pending"}
                                  size="small"
                                  color={isDone ? "success" : "default"}
                                />
                              )}
                            </TableCell>
                            <TableCell align="center">
                              {hasTemplate && !isCredTask ? (
                                <Tooltip
                                  title={isEmailTpl ? "Preview Email" : "View Document"}
                                >
                                  <IconButton
                                    size="small"
                                    color="primary"
                                    onClick={() => {
                                      setContentDialogTask(task);
                                      setContentDialogOpen(true);
                                    }}
                                    aria-label={isEmailTpl ? "Preview email" : "View document"}
                                  >
                                    {isEmailTpl ? (
                                      <EmailIcon fontSize="small" />
                                    ) : (
                                      <DescriptionIcon fontSize="small" />
                                    )}
                                  </IconButton>
                                </Tooltip>
                              ) : (
                                <Typography variant="caption" color="text.disabled">
                                  —
                                </Typography>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              <Paper variant="outlined" sx={{ p: 2, mt: 2, borderRadius: 1 }}>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                  System Login &amp; Credentials
                </Typography>
                <Box display="flex" alignItems="center" gap={2} mb={1}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={modalNeedsLogin}
                        onChange={(e) => handleModalNeedsLoginToggle(e.target.checked)}
                        disabled={modalOnboardingComplete || needsLoginToggling}
                        color="primary"
                      />
                    }
                    label={
                      <Typography variant="body2" fontWeight={500}>
                        Requires System Login
                      </Typography>
                    }
                  />
                  {needsLoginToggling && <CircularProgress size={18} />}
                </Box>

                {modalNeedsLogin && !modalOnboardingComplete && (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    Credentials will be generated when onboarding completes.
                  </Alert>
                )}

                {modalNeedsLogin && (
                  <>
                    <Divider sx={{ my: 1.5 }} />
                    <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
                      <Typography variant="body2" fontWeight={500}>
                        Credential status:
                      </Typography>
                      <CredentialStatusBadge status={modalCredentialStatus} />
                      {modalCredentialStatus === "Pending" && (
                        <Button
                          variant="contained"
                          color="success"
                          size="small"
                          startIcon={
                            deliveringCredentials ? (
                              <CircularProgress size={14} color="inherit" />
                            ) : (
                              <KeyIcon />
                            )
                          }
                          onClick={handleModalMarkCredentialDelivered}
                          disabled={deliveringCredentials}
                        >
                          {deliveringCredentials ? "Saving…" : "Mark Credentials as Delivered"}
                        </Button>
                      )}
                      {modalCredentialStatus === "Delivered" && (
                        <Alert severity="success" sx={{ py: 0, px: 1.5 }}>
                          Credentials delivered.
                        </Alert>
                      )}
                    </Box>
                  </>
                )}
              </Paper>

              {!modalOnboardingComplete
                && !isSkippedOnboarding
                && !detailLoading
                && modalDetail && (
                <>
                  <Divider sx={{ my: 2 }} />
                  {pendingRequiredCount > 0 && (
                    <Typography
                      variant="caption"
                      color="warning.main"
                      display="block"
                      mb={1}
                    >
                      {pendingRequiredCount} required task
                      {pendingRequiredCount > 1 ? "s" : ""} still pending. Finish
                      them, then use Done to mark this onboarding complete.
                    </Typography>
                  )}
                </>
              )}
            </>
          ) : null}
        </DialogContent>
        <DialogActions
          sx={{ px: 3, py: 2, flexWrap: "wrap", gap: 1, justifyContent: "flex-end" }}
        >
          {modalDetail && !detailLoading && !modalOnboardingComplete
            && !isSkippedOnboarding && (
            <>
              <Button
                variant="outlined"
                color="warning"
                startIcon={<SkipNextIcon />}
                onClick={() => setSkipOpen(true)}
                disabled={completingModal}
              >
                Skip onboarding
              </Button>
              <Button
                variant="contained"
                color="success"
                startIcon={
                  completingModal ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : (
                    <CheckCircleOutlineIcon />
                  )
                }
                onClick={handleModalCompleteOnboarding}
                disabled={
                  completingModal
                  || pendingRequiredCount > 0
                }
              >
                {completingModal ? "Finishing…" : "Done"}
              </Button>
            </>
          )}
          <Button onClick={closeDetailModal} variant="contained" color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <TemplateTaskContentDialog
        open={contentDialogOpen}
        onClose={() => {
          setContentDialogOpen(false);
          setContentDialogTask(null);
        }}
        onboardingId={modalId ? Number(modalId) : 0}
        task={contentDialogTask}
        onboardingCompleted={modalOnboardingComplete}
        onSaved={syncDetailAfterTaskChange}
      />

      <Dialog
        open={skipOpen}
        onClose={() => {
          if (!skippingModal) {
            setSkipOpen(false);
            setSkipReason("");
          }
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Skip onboarding</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Add a reason for skipping. The employee will be marked as completed
            for this onboarding.
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Reason *"
            value={skipReason}
            onChange={(e) => setSkipReason(e.target.value)}
            disabled={skippingModal}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => {
              setSkipOpen(false);
              setSkipReason("");
            }}
            disabled={skippingModal}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="warning"
            onClick={handleModalSkipConfirm}
            disabled={skippingModal || !skipReason.trim()}
            startIcon={skippingModal ? <CircularProgress size={14} color="inherit" /> : null}
          >
            {skippingModal ? "Skipping…" : "Confirm skip"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={listDeleteOpen}
        onClose={closeListDelete}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete onboarding</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Remove this onboarding record and its tasks? The employee can be
            assigned a new onboarding afterwards.
          </Typography>
          {listDeleteLabel ? (
            <Typography variant="body2" fontWeight={600} sx={{ mt: 1.5 }}>
              {listDeleteLabel}
            </Typography>
          ) : null}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeListDelete} disabled={listDeleting}>
            Cancel
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleListDeleteConfirm}
            disabled={listDeleting}
          >
            {listDeleting ? "Removing…" : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
