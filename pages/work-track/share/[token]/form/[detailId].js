import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  LinearProgress,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PersonIcon from "@mui/icons-material/Person";
import ChecklistIcon from "@mui/icons-material/Checklist";
import SummarizeIcon from "@mui/icons-material/Summarize";
import VisibilityIcon from "@mui/icons-material/Visibility";
import BASE_URL from "Base/api";
import { formatDate } from "@/components/utils/formatHelper";
import SharedChecklistsReadOnly from "@/components/work-track/SharedChecklistsReadOnly";
import SharedChecklistDashboard from "@/components/work-track/SharedChecklistDashboard";
import { extractApiResult, isApiSuccess, pick } from "@/components/work-track/sharedViewHelpers";

function SummaryField({ label, value, fullWidth = false }) {
  const display = value === undefined || value === null || value === "" ? "—" : value;
  return (
    <Grid item xs={12} md={fullWidth ? 12 : 3}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body1" fontWeight="medium" sx={{ wordBreak: "break-word" }}>
        {display}
      </Typography>
    </Grid>
  );
}

export default function SharedWorkTrackFormDetail() {
  const router = useRouter();
  const { token, detailId } = useMemo(() => {
    if (!router.isReady) return { token: null, detailId: null };
    const t = router.query.token;
    const d = router.query.detailId;
    return {
      token: Array.isArray(t) ? t[0] : t,
      detailId: Array.isArray(d) ? d[0] : d,
    };
  }, [router.isReady, router.query.token, router.query.detailId]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [payload, setPayload] = useState(null);

  useEffect(() => {
    if (!token || !detailId) return;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(
          `${BASE_URL}/WorkTrack/GetSharedFormDetail?token=${encodeURIComponent(token)}&detailId=${detailId}`
        );
        const json = await res.json();
        const data = extractApiResult(json);
        if (!isApiSuccess(json, res) || !data) {
          setError(json?.message || "Shared form not found");
          setPayload(null);
        } else {
          setPayload(data);
        }
      } catch (e) {
        console.error(e);
        setError("Failed to load shared form");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token, detailId]);

  if (!router.isReady || loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !payload) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="60vh" px={2}>
        <Typography variant="h6" color="error" gutterBottom>
          {error || "Not found"}
        </Typography>
        <Button onClick={() => router.push(`/work-track/share/${token}`)}>Back to dashboard</Button>
      </Box>
    );
  }

  const wt = pick(payload, "workTrack", "WorkTrack") || {};
  const form = pick(payload, "form", "Form") || {};
  const tech = pick(payload, "technician", "Technician") || {};
  const checklists = pick(payload, "checklists", "Checklists") || [];
  const summary = pick(payload, "summary", "Summary") || {};
  const dashboard = pick(payload, "dashboard", "Dashboard") || summary;

  const merged = { ...form, ...summary };
  const taskPct = pick(merged, "taskCompletePercentage", "TaskCompletePercentage") ?? 0;
  const checklistPct = pick(summary, "checklistCompletionPercentage", "ChecklistCompletionPercentage") ?? 0;
  const completedItems = pick(summary, "completedChecklistItems", "CompletedChecklistItems") ?? 0;
  const totalItems = pick(summary, "totalChecklistItems", "TotalChecklistItems") ?? 0;
  const submissionStatus = pick(merged, "submissionStatus", "SubmissionStatus") || "Draft";
  const source = pick(merged, "source", "Source");
  const assignee = pick(tech, "assignee", "Assignee") || pick(merged, "assignee", "Assignee");

  return (
    <Box sx={{ maxWidth: 1100, mx: "auto", p: { xs: 2, md: 3 } }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2} flexWrap="wrap" gap={1}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => router.push(`/work-track/share/${token}`)}>
          Back to dashboard
        </Button>
        <Chip icon={<VisibilityIcon />} label="View only" size="small" />
      </Box>

      <Typography variant="body2" color="text.secondary" mb={0.5}>
        {pick(wt, "customerName", "CustomerName") || "—"} · {pick(wt, "projectName", "ProjectName") || "—"}
      </Typography>
      <Typography variant="h5" fontWeight="bold" mb={3}>
        {pick(form, "trackId", "TrackId") || pick(form, "equipmentDescription", "EquipmentDescription") || `Form #${detailId}`}
      </Typography>

      <SharedChecklistDashboard
        dashboard={dashboard}
        checklists={checklists}
        submissionStatus={submissionStatus}
      />

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <PersonIcon color="primary" />
            <Typography variant="h6">Technician Assignment</Typography>
          </Box>
          <Typography variant="body1">
            <strong>Assigned Technician:</strong> {assignee || "Not assigned"}
          </Typography>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={1}>
            <Box display="flex" alignItems="center" gap={1}>
              <SummarizeIcon color="primary" />
              <Typography variant="h6">Summary</Typography>
            </Box>
            <Box display="flex" gap={1}>
              <Chip label={submissionStatus} size="small" color={submissionStatus === "Completed" ? "success" : "default"} />
              <Chip
                label={source === "Excel" ? "Excel Import" : "Manual Entry"}
                size="small"
                variant="outlined"
                color={source === "Excel" ? "primary" : "default"}
              />
            </Box>
          </Box>

          <Grid container spacing={3}>
            <SummaryField label="Track ID" value={pick(merged, "trackId", "TrackId")} />
            <SummaryField label="Model Year" value={pick(merged, "modelYear", "ModelYear")} />
            <SummaryField label="Manufacturer ID" value={pick(merged, "manufacturerId", "ManufacturerId")} />
            <SummaryField label="Model ID" value={pick(merged, "modelId", "ModelId")} />
            <SummaryField label="Equipment Description" value={pick(merged, "equipmentDescription", "EquipmentDescription")} fullWidth />
            <SummaryField label="License Number" value={pick(merged, "licenseNumber", "LicenseNumber")} />
            <SummaryField label="Serial Number" value={pick(merged, "serialNumber", "SerialNumber")} />
            <SummaryField label="Meter Reading" value={pick(merged, "latestMeter1Reading", "LatestMeter1Reading")} />
            <SummaryField label="Assignee" value={assignee} />
            <SummaryField label="Status" value={pick(merged, "status", "Status")} />
            <SummaryField label="Status Code" value={pick(merged, "statusCode", "StatusCode")} />
            <SummaryField
              label="Date Completed"
              value={
                pick(merged, "dateCompleted", "DateCompleted")
                  ? formatDate(pick(merged, "dateCompleted", "DateCompleted"))
                  : null
              }
            />
            <SummaryField
              label="Created Date"
              value={
                pick(merged, "createdOn", "CreatedOn") ? formatDate(pick(merged, "createdOn", "CreatedOn")) : null
              }
            />
            <SummaryField label="MAC" value={pick(merged, "mac", "Mac")} />
            <SummaryField label="SIM" value={pick(merged, "sim", "SIM")} />
            <SummaryField label="SSID" value={pick(merged, "ssid", "SSID")} />
            <SummaryField label="WiFi Key" value={pick(merged, "wifiKey", "WifiKey")} />
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">
                Task Complete
              </Typography>
              <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                <LinearProgress
                  variant="determinate"
                  value={Number(taskPct) || 0}
                  sx={{ flex: 1, height: 8, borderRadius: 4 }}
                />
                <Typography variant="body2" fontWeight="bold">
                  {taskPct}%
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">
                Checklist Completion
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {completedItems} / {totalItems} items ({checklistPct}%)
              </Typography>
            </Grid>
            {pick(merged, "notes", "Notes") && (
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary">
                  Technician Notes
                </Typography>
                <Typography variant="body1">{pick(merged, "notes", "Notes")}</Typography>
              </Grid>
            )}
            {pick(merged, "managerNotes", "ManagerNotes") && (
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary">
                  Manager on Duty Notes
                </Typography>
                <Typography variant="body1" sx={{ color: "#7c3aed", fontWeight: 500 }}>
                  {pick(merged, "managerNotes", "ManagerNotes")}
                </Typography>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <ChecklistIcon color="primary" />
            <Typography variant="h6">Checklists</Typography>
          </Box>
          <SharedChecklistsReadOnly checklists={checklists} />
        </CardContent>
      </Card>
    </Box>
  );
}
