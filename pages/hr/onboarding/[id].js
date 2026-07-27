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
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  Grid,
  IconButton,
  LinearProgress,
  Paper,
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
import DescriptionIcon from "@mui/icons-material/Description";
import EmailIcon from "@mui/icons-material/Email";
import KeyIcon from "@mui/icons-material/Key";
import SkipNextIcon from "@mui/icons-material/SkipNext";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import BASE_URL from "Base/api";
import { createAuthHeaders, getOrgId } from "@/components/utils/apiHelpers";
import {
  getOnboardingEmployeeLabel,
  getOnboardingProfileLabel,
} from "@/components/utils/onboardingDisplayNames";
import TemplateTaskContentDialog from "./TemplateTaskContentDialog";

// ── Status chip config ────────────────────────────────────────────────────────
const STATUS_CFG = {
  NotStarted: { label: "Not Started", color: "default" },
  InProgress:  { label: "In Progress", color: "warning" },
  Completed:   { label: "Completed",   color: "success" },
};
function StatusChip({ status }) {
  const cfg = STATUS_CFG[status] || { label: status || "—", color: "default" };
  return <Chip label={cfg.label} color={cfg.color} size="small" />;
}

// ── Type badge ────────────────────────────────────────────────────────────────
const TYPE_COLORS = {
  Document:          "info",
  Asset:             "secondary",
  Task:              "primary",
  CredentialDelivery:"warning",
};
function TypeChip({ type }) {
  return (
    <Chip label={type || "—"} color={TYPE_COLORS[type] || "default"}
      variant="outlined" size="small" />
  );
}

// ── Credential status badge ───────────────────────────────────────────────────
function CredentialStatusBadge({ status }) {
  if (status === "Delivered") return <Chip label="Delivered" color="success" size="small" icon={<KeyIcon />} />;
  if (status === "Pending")   return <Chip label="Pending" color="warning" size="small" icon={<KeyIcon />} />;
  return                             <Chip label="None" color="default" size="small" />;
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function OnboardingDetail() {
  const router = useRouter();
  const { id } = router.query;

  const [detail, setDetail]           = useState(null);
  const [tasks, setTasks]             = useState([]);
  const [loading, setLoading]         = useState(false);
  const [completing, setCompleting]   = useState(false);
  const [contentDialogOpen, setContentDialogOpen] = useState(false);
  const [contentDialogTask, setContentDialogTask] = useState(null);

  // Skip dialog
  const [skipOpen, setSkipOpen]   = useState(false);
  const [skipReason, setSkipReason] = useState("");
  const [skipping, setSkipping]   = useState(false);

  // Per-task completing state
  const [taskLoading, setTaskLoading] = useState({});

  // NeedsLogin + credential delivery
  const [needsLoginToggling, setNeedsLoginToggling]       = useState(false);
  const [deliveringCredentials, setDeliveringCredentials] = useState(false);

  // ── Fetch detail ────────────────────────────────────────────────────────────
  const fetchDetail = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/hr/onboarding/${id}`, {
        headers: createAuthHeaders(),
      });
      if (res.ok) {
        const json = await res.json();
        const data = json.result ?? json;
        setDetail(data.onboarding ?? data);
        setTasks(data.tasks ?? []);
      } else {
        toast.error("Failed to load onboarding details.");
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchDetail(); }, [fetchDetail]);

  const isSkippedOnboarding = detail?.isSkipped === true || detail?.IsSkipped === true;

  // ── Task checkboxes ─────────────────────────────────────────────────────────
  const handleTaskToggle = async (task) => {
    if (isSkippedOnboarding || task.type === "CredentialDelivery") return;

    const isDone = task.status === "Completed";
    setTaskLoading((prev) => ({ ...prev, [task.id]: true }));

    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id
          ? { ...t, status: isDone ? "Pending" : "Completed", completedOn: isDone ? null : new Date().toISOString() }
          : t
      )
    );

    const url = isDone
      ? `${BASE_URL}/hr/onboarding/tasks/${task.id}/pending`
      : `${BASE_URL}/hr/onboarding/tasks/${task.id}/complete`;

    try {
      const res  = await fetch(url, { method: "PATCH", headers: createAuthHeaders() });
      const data = await res.json();
      if (data.statusCode !== 200) {
        toast.error(data.message || "Failed to update task.");
        setTasks((prev) =>
          prev.map((t) =>
            t.id === task.id
              ? { ...t, status: isDone ? "Completed" : "Pending", completedOn: isDone ? task.completedOn : null }
              : t
          )
        );
      } else {
        fetchDetail();
      }
    } catch (err) {
      toast.error(err.message || "Network error.");
    } finally {
      setTaskLoading((prev) => ({ ...prev, [task.id]: false }));
    }
  };

  // ── Complete onboarding ─────────────────────────────────────────────────────
  const handleComplete = async () => {
    setCompleting(true);
    try {
      const res  = await fetch(`${BASE_URL}/hr/onboarding/${id}/complete`, { method: "PATCH", headers: createAuthHeaders() });
      const data = await res.json();
      if (data.statusCode === 200) { toast.success(data.message || "Onboarding completed."); fetchDetail(); }
      else                          toast.error(data.message || "Cannot complete onboarding.");
    } catch (err) {
      toast.error(err.message || "Network error.");
    } finally {
      setCompleting(false);
    }
  };

  // ── Skip onboarding ─────────────────────────────────────────────────────────
  const handleSkipConfirm = async () => {
    if (!skipReason.trim()) { toast.warning("Skip reason is required."); return; }
    setSkipping(true);
    try {
      const res  = await fetch(`${BASE_URL}/hr/onboarding/${id}/skip`, {
        method: "PATCH",
        headers: createAuthHeaders(),
        body: JSON.stringify({ OnboardingId: Number(id), SkipReason: skipReason.trim() }),
      });
      const data = await res.json();
      if (data.statusCode === 200) { toast.success("Onboarding skipped."); setSkipOpen(false); setSkipReason(""); fetchDetail(); }
      else toast.error(data.message || "Failed to skip.");
    } catch (err) { toast.error(err.message || "Network error."); }
    finally        { setSkipping(false); }
  };

  // ── NeedsLogin toggle ───────────────────────────────────────────────────────
  const handleNeedsLoginToggle = async (checked) => {
    setNeedsLoginToggling(true);
    try {
      const orgId = getOrgId() ?? 0;
      const res  = await fetch(`${BASE_URL}/hr/onboarding/${id}/needs-login`, {
        method: "PATCH", headers: createAuthHeaders(),
        body: JSON.stringify({ NeedsLogin: checked, OrgId: orgId }),
      });
      const data = await res.json();
      const ok = data.statusCode === 200 || data.StatusCode === 200;
      if (ok) {
        toast.success(checked ? "System login enabled. A credential task has been added." : "System login disabled.");
        await fetchDetail();
      } else {
        toast.error(data.message || "Failed to update login setting.");
      }
    } catch (err) { toast.error(err.message || "Network error."); }
    finally        { setNeedsLoginToggling(false); }
  };

  // ── Mark credentials delivered ──────────────────────────────────────────────
  const handleMarkCredentialDelivered = async () => {
    setDeliveringCredentials(true);
    try {
      const orgId = getOrgId() ?? 0;
      const res  = await fetch(`${BASE_URL}/hr/onboarding/${id}/credential-delivered`, {
        method: "PATCH", headers: createAuthHeaders(),
        body: JSON.stringify({ OrgId: orgId }),
      });
      const data = await res.json();
      if (data.statusCode === 200) {
        toast.success("Credentials delivered.");
        fetchDetail();
      }
      else toast.error(data.message || "Failed.");
    } catch (err) { toast.error(err.message || "Network error."); }
    finally        { setDeliveringCredentials(false); }
  };

  // ── Derived ─────────────────────────────────────────────────────────────────
  const completedCount    = tasks.filter((t) => t.status === "Completed").length;
  const totalCount        = tasks.length;
  const progress          = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const isCompleted       = detail?.status === "Completed";
  const pendingRequired   = tasks.filter(
    (t) =>
      t.isRequired &&
      t.status === "Pending" &&
      t.type !== "CredentialDelivery"
  ).length;
  const needsLogin        = detail?.needsLogin ?? detail?.NeedsLogin ?? false;
  const credentialStatus  = detail?.credentialStatus ?? detail?.CredentialStatus ?? "None";

  const empName = getOnboardingEmployeeLabel(detail);
  const profileName = getOnboardingProfileLabel(detail);

  // ── Render ──────────────────────────────────────────────────────────────────
  if (loading) return <Box display="flex" justifyContent="center" mt={6}><CircularProgress /></Box>;

  if (!detail && !loading) {
    return (
      <Box mt={4} px={2}>
        <Typography color="error">Onboarding record not found.</Typography>
        <Button onClick={() => router.push("/hr/onboarding/")} sx={{ mt: 2 }}>← Back to List</Button>
      </Box>
    );
  }

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Onboarding Details</h1>
        <ul>
          <li><Link href="/hr/onboarding/">Employee Onboarding</Link></li>
          <li>Details</li>
        </ul>
      </div>

      <Grid container spacing={2}>
        {/* ── Summary card ───────────────────────────────────────────────── */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="caption" color="text.secondary">Employee / Candidate</Typography>
                <Typography variant="subtitle1" fontWeight={600}>{empName}</Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="caption" color="text.secondary">Onboarding Profile</Typography>
                <Typography variant="subtitle1" fontWeight={600}>{profileName}</Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <Typography variant="caption" color="text.secondary">Status</Typography>
                <Box mt={0.5}><StatusChip status={detail?.status} /></Box>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <Typography variant="caption" color="text.secondary">Progress</Typography>
                <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                  <LinearProgress variant="determinate" value={progress}
                    sx={{ flex: 1, height: 8, borderRadius: 4 }}
                    color={progress === 100 ? "success" : "primary"} />
                  <Typography variant="caption">{completedCount}/{totalCount}</Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* ── System Login & Credentials ──────────────────────────────────── */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" fontWeight={600} mb={2}>System Login &amp; Credentials</Typography>

            <Box display="flex" alignItems="center" gap={2} mb={1}>
              <FormControlLabel
                control={
                  <Switch
                    checked={needsLogin}
                    onChange={(e) => handleNeedsLoginToggle(e.target.checked)}
                    disabled={isCompleted || needsLoginToggling}
                    color="primary"
                  />
                }
                label={<Typography variant="body2" fontWeight={500}>Requires System Login</Typography>}
              />
              {needsLoginToggling && <CircularProgress size={18} />}
            </Box>

            {needsLogin && !isCompleted && (
              <Alert severity="info" sx={{ mb: 2 }}>
                Credentials will be generated when onboarding completes.
              </Alert>
            )}

            {needsLogin && (
              <>
                <Divider sx={{ my: 2 }} />
                <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
                  <Typography variant="body2" fontWeight={500}>Credential Status:</Typography>
                  <CredentialStatusBadge status={credentialStatus} />
                  {credentialStatus === "Pending" && (
                    <Button
                      variant="contained" color="success" size="small"
                      startIcon={deliveringCredentials ? <CircularProgress size={14} color="inherit" /> : <KeyIcon />}
                      onClick={handleMarkCredentialDelivered}
                      disabled={deliveringCredentials}
                    >
                      {deliveringCredentials ? "Saving…" : "Mark Credentials as Delivered"}
                    </Button>
                  )}
                  {credentialStatus === "Delivered" && (
                    <Alert severity="success" sx={{ py: 0, px: 1.5 }}>
                      Credentials delivered.
                    </Alert>
                  )}
                </Box>
              </>
            )}
          </Paper>
        </Grid>

        {/* ── Tasks table ────────────────────────────────────────────────── */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, borderRadius: 2 }}>
            <Typography variant="h6" fontWeight={600} mb={2}>Checklist Tasks</Typography>

            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: 48 }}>Done</TableCell>
                    <TableCell>Title</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Assigned To</TableCell>
                    <TableCell align="center">Required</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="center">Content</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tasks.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                        <Typography variant="body2" color="text.secondary">No tasks found.</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    tasks.map((task) => {
                      const isDone       = task.status === "Completed";
                      const isBusy       = !!taskLoading[task.id];
                      const isCredTask   = task.type === "CredentialDelivery";
                      const hasTemplate  = !!(task.templateId ?? task.TemplateId);
                      const rowTplType   = task.templateType ?? task.TemplateType;
                      const isEmailTpl   = rowTplType === "Email";

                      return (
                        <React.Fragment key={task.id}>
                          <TableRow
                            sx={{
                              opacity: isDone ? 0.65 : 1,
                              background: isCredTask ? "rgba(255, 167, 38, 0.12)" : undefined,
                            }}
                          >
                            {/* Checkbox / key icon */}
                            <TableCell>
                              {isBusy ? (
                                <CircularProgress size={18} />
                              ) : isCredTask ? (
                                <KeyIcon fontSize="small" color={isDone ? "success" : "warning"} sx={{ ml: 0.5 }} />
                              ) : (
                                <Checkbox
                                  checked={isDone}
                                  disabled={isBusy || isSkippedOnboarding}
                                  onChange={() => handleTaskToggle(task)}
                                  size="small" color="success"
                                />
                              )}
                            </TableCell>

                            {/* Title */}
                            <TableCell sx={{ textDecoration: isDone ? "line-through" : "none" }}>
                              {isCredTask ? (
                                <Box display="flex" alignItems="center" gap={0.5}>
                                  <KeyIcon fontSize="inherit" color="warning" />
                                  {task.title}
                                </Box>
                              ) : task.title}
                            </TableCell>

                            <TableCell><TypeChip type={task.type} /></TableCell>
                            <TableCell>{task.assignedTo}</TableCell>
                            <TableCell align="center">
                              {task.isRequired
                                ? <Chip label="Yes" size="small" color="error" variant="outlined" />
                                : <Chip label="No"  size="small" variant="outlined" />}
                            </TableCell>
                            <TableCell>
                              {isCredTask && !isDone
                                ? <Chip label="Awaiting Delivery" size="small" color="warning" />
                                : <Chip label={isDone ? "Completed" : "Pending"} size="small" color={isDone ? "success" : "default"} />}
                            </TableCell>

                            {/* Template content */}
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
                                <Typography variant="caption" color="text.disabled">—</Typography>
                              )}
                            </TableCell>
                          </TableRow>
                        </React.Fragment>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Action buttons */}
            {!isCompleted && (
              <>
                <Divider sx={{ my: 2 }} />
                {pendingRequired > 0 && (
                  <Typography variant="caption" color="warning.main" display="block" mb={1}>
                    {pendingRequired} required task{pendingRequired > 1 ? "s" : ""} still pending.
                  </Typography>
                )}
                <Box display="flex" gap={2} justifyContent="flex-end">
                  <Button variant="outlined" color="warning" startIcon={<SkipNextIcon />} onClick={() => setSkipOpen(true)}>
                    Skip Onboarding
                  </Button>
                  <Button
                    variant="contained" color="success"
                    startIcon={completing ? <CircularProgress size={16} color="inherit" /> : <CheckCircleOutlineIcon />}
                    disabled={completing}
                    onClick={handleComplete}
                  >
                    {completing ? "Completing…" : "Complete Onboarding"}
                  </Button>
                </Box>
              </>
            )}
          </Paper>
        </Grid>
      </Grid>

      <TemplateTaskContentDialog
        open={contentDialogOpen}
        onClose={() => {
          setContentDialogOpen(false);
          setContentDialogTask(null);
        }}
        onboardingId={Number(id)}
        task={contentDialogTask}
        onboardingCompleted={isCompleted}
        onSaved={fetchDetail}
      />

      {/* Skip modal */}
      <Dialog open={skipOpen} onClose={() => setSkipOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Skip Onboarding</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Provide a reason for skipping. The onboarding will be marked as completed.
          </Typography>
          <TextField
            fullWidth multiline rows={3} label="Reason *"
            value={skipReason}
            onChange={(e) => setSkipReason(e.target.value)}
            error={skipping && !skipReason.trim()}
            helperText={skipping && !skipReason.trim() ? "Reason is required." : ""}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => { setSkipOpen(false); setSkipReason(""); }} disabled={skipping}>Cancel</Button>
          <Button variant="contained" color="warning" onClick={handleSkipConfirm}
            disabled={skipping || !skipReason.trim()}
            startIcon={skipping ? <CircularProgress size={14} color="inherit" /> : null}>
            {skipping ? "Skipping…" : "Confirm Skip"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
