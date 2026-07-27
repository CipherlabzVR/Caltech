import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import {
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  LinearProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import AssignmentIcon from "@mui/icons-material/Assignment";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import VisibilityIcon from "@mui/icons-material/Visibility";
import BASE_URL from "Base/api";
import { formatDate } from "@/components/utils/formatHelper";
import { extractApiResult, isApiSuccess } from "@/components/work-track/sharedViewHelpers";

export default function SharedWorkTrackDashboard() {
  const router = useRouter();
  const token = useMemo(() => {
    if (!router.isReady) return null;
    const q = router.query.token;
    return Array.isArray(q) ? q[0] : q;
  }, [router.isReady, router.query.token]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [payload, setPayload] = useState(null);

  useEffect(() => {
    if (!token) return;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(
          `${BASE_URL}/WorkTrack/GetSharedDashboard?token=${encodeURIComponent(token)}`
        );
        const json = await res.json();
        const data = extractApiResult(json);
        if (!isApiSuccess(json, res) || !data) {
          setError(json?.message || "Shared work track not found or sharing is disabled");
          setPayload(null);
        } else {
          setPayload(data);
        }
      } catch (e) {
        console.error(e);
        setError("Failed to load shared work track");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

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
        <Typography variant="body2" color="text.secondary">
          This share link may have been disabled or is invalid.
        </Typography>
      </Box>
    );
  }

  const wt = payload.workTrack || payload.WorkTrack || {};
  const dash = payload.dashboard || payload.Dashboard || {};
  const forms = payload.forms || payload.Forms || [];

  const totalItems = dash.totalItems ?? dash.TotalItems ?? 0;
  const completedItems = dash.completedItems ?? dash.CompletedItems ?? 0;
  const pendingItems = dash.pendingItems ?? dash.PendingItems ?? 0;
  const inProgressItems = dash.inProgressItems ?? dash.InProgressItems ?? 0;
  const notStartedItems = dash.notStartedItems ?? dash.NotStartedItems ?? 0;
  const overallCompletion = dash.overallCompletion ?? dash.OverallCompletion ?? 0;
  const completionRate = dash.completionRate ?? dash.CompletionRate ?? 0;

  const openForm = (detailId) => {
    router.push(`/work-track/share/${token}/form/${detailId}`);
  };

  const statCard = (label, value, icon, gradient) => (
    <Grid item xs={6} sm={4} md={2}>
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          textAlign: "center",
          background: "rgba(255,255,255,0.15)",
          borderRadius: 3,
          border: "1px solid rgba(255,255,255,0.2)",
        }}
      >
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            background: gradient,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mx: "auto",
            mb: 1,
          }}
        >
          {icon}
        </Box>
        <Typography variant="h4" fontWeight="bold" sx={{ color: "white" }}>
          {value}
        </Typography>
        <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.85)" }}>
          {label}
        </Typography>
      </Paper>
    </Grid>
  );

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", p: { xs: 2, md: 3 } }}>
      <Box display="flex" alignItems="center" gap={1} mb={1}>
        <VisibilityIcon color="action" />
        <Chip label="View only" size="small" color="default" />
      </Box>
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        Shared Work Track
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" mb={2}>
            Project Information
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Typography variant="body2" color="text.secondary">
                Customer
              </Typography>
              <Typography fontWeight="medium">{wt.customerName || wt.CustomerName || "—"}</Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="body2" color="text.secondary">
                Project
              </Typography>
              <Typography fontWeight="medium">{wt.projectName || wt.ProjectName || "—"}</Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="body2" color="text.secondary">
                Remarks
              </Typography>
              <Typography fontWeight="medium">{wt.remarks || wt.Remarks || "—"}</Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card
        sx={{
          mb: 3,
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "white",
        }}
      >
        <CardContent>
          <Box display="flex" alignItems="center" gap={1} mb={3}>
            <TrendingUpIcon />
            <Typography variant="h6" fontWeight="bold">
              Dashboard Summary
            </Typography>
          </Box>
          <Grid container spacing={2}>
            {statCard("Total Items", totalItems, <AssignmentIcon sx={{ color: "white" }} />, "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)")}
            {statCard("Completed", completedItems, <CheckCircleOutlineIcon sx={{ color: "white" }} />, "linear-gradient(135deg, #22c55e 0%, #15803d 100%)")}
            {statCard("Pending", pendingItems, <PendingActionsIcon sx={{ color: "white" }} />, "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)")}
            {statCard("In Progress", inProgressItems, <PendingActionsIcon sx={{ color: "white" }} />, "linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)")}
            {statCard("Not Started", notStartedItems, <AssignmentIcon sx={{ color: "white" }} />, "linear-gradient(135deg, #94a3b8 0%, #64748b 100%)")}
            {statCard("Overall %", `${overallCompletion}%`, <TrendingUpIcon sx={{ color: "white" }} />, "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)")}
          </Grid>
          <Box mt={3}>
            <Box display="flex" justifyContent="space-between" mb={0.5}>
              <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.9)" }}>
                Completion rate
              </Typography>
              <Typography variant="body2" fontWeight="bold">
                {completionRate}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={Number(completionRate) || 0}
              sx={{
                height: 10,
                borderRadius: 5,
                bgcolor: "rgba(255,255,255,0.2)",
                "& .MuiLinearProgress-bar": { bgcolor: "#22c55e" },
              }}
            />
          </Box>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" mb={2}>
            Saved Forms ({forms.length})
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                  <TableCell>Source</TableCell>
                  <TableCell>Track ID</TableCell>
                  <TableCell>Equipment</TableCell>
                  <TableCell>Serial No</TableCell>
                  <TableCell>Assignee</TableCell>
                  <TableCell>Task %</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {forms.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography color="text.secondary" py={3}>
                        No saved forms yet.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  forms.map((f) => {
                    const id = f.id ?? f.Id;
                    return (
                      <TableRow
                        key={id}
                        hover
                        sx={{ cursor: "pointer" }}
                        onClick={() => openForm(id)}
                      >
                        <TableCell>
                          <Chip
                            size="small"
                            variant="outlined"
                            label={(f.source || f.Source) === "Excel" ? "Excel" : "Manual"}
                            color={(f.source || f.Source) === "Excel" ? "primary" : "default"}
                          />
                        </TableCell>
                        <TableCell>{f.trackId || f.TrackId || "—"}</TableCell>
                        <TableCell>{f.equipmentDescription || f.EquipmentDescription || "—"}</TableCell>
                        <TableCell>{f.serialNumber || f.SerialNumber || "—"}</TableCell>
                        <TableCell>{f.assignee || f.Assignee || "—"}</TableCell>
                        <TableCell>
                          {(f.taskCompletePercentage ?? f.TaskCompletePercentage) != null
                            ? `${f.taskCompletePercentage ?? f.TaskCompletePercentage}%`
                            : "—"}
                        </TableCell>
                        <TableCell>{f.submissionStatus || f.SubmissionStatus || f.status || f.Status || "—"}</TableCell>
                        <TableCell>{formatDate(f.createdOn || f.CreatedOn)}</TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <Typography variant="caption" color="text.secondary" display="block" mt={1.5}>
            Click a form to view technician assignment, checklists, and summary (view only).
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
