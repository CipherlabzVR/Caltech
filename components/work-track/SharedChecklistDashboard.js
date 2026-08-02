import React from "react";
import {
  Box,
  Card,
  CardContent,
  Chip,
  Grid,
  LinearProgress,
  Paper,
  Typography,
} from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import AssignmentIcon from "@mui/icons-material/Assignment";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import ListAltIcon from "@mui/icons-material/ListAlt";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import { pick } from "@/components/work-track/sharedViewHelpers";

function StatTile({ gradient, icon, value, label, isCompleted, valueVariant = "h3" }) {
  return (
    <Grid item xs={6} sm={4} md={2}>
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          textAlign: "center",
          background: isCompleted ? "rgba(255,255,255,0.15)" : gradient,
          backdropFilter: "blur(10px)",
          borderRadius: 3,
          border: isCompleted ? "1px solid rgba(255,255,255,0.2)" : "none",
        }}
      >
        <Box
          sx={{
            width: 45,
            height: 45,
            borderRadius: "50%",
            background: isCompleted ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mx: "auto",
            mb: 1.5,
          }}
        >
          {icon}
        </Box>
        <Typography variant={valueVariant} fontWeight="bold" sx={{ color: "white", lineHeight: 1.2 }}>
          {value}
        </Typography>
        <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.85)", mt: 0.5, fontWeight: 500 }}>
          {label}
        </Typography>
      </Paper>
    </Grid>
  );
}

/**
 * Read-only Checklist Dashboard for shared work-track form views.
 */
export default function SharedChecklistDashboard({ dashboard, checklists = [], submissionStatus }) {
  const dash = dashboard || {};

  let totalItems = Number(pick(dash, "totalChecklistItems", "TotalChecklistItems")) || 0;
  let completedItems = Number(pick(dash, "completedChecklistItems", "CompletedChecklistItems")) || 0;
  let pendingItems = pick(dash, "pendingChecklistItems", "PendingChecklistItems");
  let totalChecklists = Number(pick(dash, "totalChecklists", "TotalChecklists")) || 0;
  let completedChecklists = Number(pick(dash, "completedChecklists", "CompletedChecklists")) || 0;
  let completionPct = Number(pick(dash, "checklistCompletionPercentage", "ChecklistCompletionPercentage"));
  const workTime =
    pick(dash, "formattedTotalDuration", "FormattedTotalDuration") ||
    pick(dash, "formattedWorkDuration", "FormattedWorkDuration") ||
    "0s";

  // Fallback: derive from checklists if dashboard stats missing
  if ((!totalItems || !totalChecklists) && Array.isArray(checklists) && checklists.length > 0) {
    totalChecklists = checklists.length;
    const items = checklists.flatMap((cl) => pick(cl, "items", "Items") || []);
    totalItems = items.length || checklists.reduce((sum, cl) => sum + (Number(pick(cl, "totalItems", "TotalItems")) || 0), 0);
    completedItems =
      items.filter((i) => pick(i, "isCompleted", "IsCompleted")).length ||
      checklists.reduce((sum, cl) => sum + (Number(pick(cl, "completedItems", "CompletedItems")) || 0), 0);
    completedChecklists = checklists.filter((cl) => {
      const t = Number(pick(cl, "totalItems", "TotalItems")) || (pick(cl, "items", "Items") || []).length;
      const c = Number(pick(cl, "completedItems", "CompletedItems")) ||
        (pick(cl, "items", "Items") || []).filter((i) => pick(i, "isCompleted", "IsCompleted")).length;
      return t > 0 && c === t;
    }).length;
  }

  if (pendingItems == null) pendingItems = Math.max(0, totalItems - completedItems);
  else pendingItems = Number(pendingItems) || 0;

  if (Number.isNaN(completionPct)) {
    completionPct = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
  } else {
    completionPct = Math.round(completionPct);
  }

  const isCompleted =
    submissionStatus === "Completed" || (totalItems > 0 && completedItems === totalItems && completionPct === 100);

  return (
    <Card
      sx={{
        mb: 3,
        background: isCompleted
          ? "linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)"
          : "linear-gradient(135deg, #ffffff 0%, #f8fafc 50%, #f1f5f9 100%)",
        color: isCompleted ? "white" : "inherit",
        border: isCompleted ? "none" : "1px solid #e2e8f0",
        boxShadow: isCompleted
          ? "0 10px 40px rgba(16, 185, 129, 0.3)"
          : "0 4px 20px rgba(0, 0, 0, 0.08)",
      }}
    >
      <CardContent>
        <Box display="flex" alignItems="center" gap={1} mb={3} flexWrap="wrap">
          <TrendingUpIcon sx={{ fontSize: 28, color: isCompleted ? "white" : "#6366f1" }} />
          <Typography variant="h6" fontWeight="bold" sx={{ color: isCompleted ? "white" : "#1e293b" }}>
            Checklist Dashboard
          </Typography>
          {isCompleted && (
            <Chip
              label="✓ COMPLETED"
              size="small"
              sx={{ ml: 1, bgcolor: "rgba(255,255,255,0.25)", color: "white", fontWeight: "bold" }}
            />
          )}
        </Box>

        <Grid container spacing={3}>
          <StatTile
            isCompleted={isCompleted}
            gradient="linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)"
            icon={<AssignmentIcon sx={{ color: "white", fontSize: 24 }} />}
            value={totalItems}
            label="Total Items"
          />
          <StatTile
            isCompleted={isCompleted}
            gradient="linear-gradient(135deg, #10b981 0%, #059669 100%)"
            icon={<CheckCircleOutlineIcon sx={{ color: "white", fontSize: 24 }} />}
            value={completedItems}
            label="Completed"
          />
          <StatTile
            isCompleted={isCompleted}
            gradient="linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
            icon={<PendingActionsIcon sx={{ color: "white", fontSize: 24 }} />}
            value={pendingItems}
            label="Pending"
          />
          <StatTile
            isCompleted={isCompleted}
            gradient="linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)"
            icon={<ListAltIcon sx={{ color: "white", fontSize: 24 }} />}
            value={totalChecklists}
            label="Checklists"
          />
          <StatTile
            isCompleted={isCompleted}
            gradient="linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)"
            icon={<DoneAllIcon sx={{ color: "white", fontSize: 24 }} />}
            value={completedChecklists}
            label="Done Lists"
          />
          <StatTile
            isCompleted={isCompleted}
            gradient="linear-gradient(135deg, #ef4444 0%, #dc2626 100%)"
            icon={<AccessTimeIcon sx={{ color: "white", fontSize: 24 }} />}
            value={workTime}
            label="Work Time"
            valueVariant="h5"
          />
        </Grid>

        <Box
          sx={{
            mt: 3,
            p: 3,
            background: isCompleted
              ? "rgba(255,255,255,0.1)"
              : "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
            borderRadius: 3,
            border: isCompleted ? "1px solid rgba(255,255,255,0.15)" : "1px solid #e2e8f0",
          }}
        >
          <Typography
            variant="subtitle1"
            sx={{ color: isCompleted ? "rgba(255,255,255,0.9)" : "#475569", mb: 1.5, fontWeight: 600 }}
          >
            Overall Completion Progress
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box sx={{ flexGrow: 1 }}>
              <LinearProgress
                variant="determinate"
                value={completionPct}
                sx={{
                  height: 14,
                  borderRadius: 7,
                  backgroundColor: isCompleted ? "rgba(255,255,255,0.2)" : "#e2e8f0",
                  "& .MuiLinearProgress-bar": {
                    borderRadius: 7,
                    background: isCompleted
                      ? "rgba(255,255,255,0.9)"
                      : completionPct === 100
                        ? "linear-gradient(90deg, #10b981 0%, #34d399 100%)"
                        : completionPct >= 50
                          ? "linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%)"
                          : "linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%)",
                  },
                }}
              />
            </Box>
            <Typography
              variant="h4"
              fontWeight="bold"
              sx={{ color: isCompleted ? "white" : "#1e293b", minWidth: 80, textAlign: "right" }}
            >
              {completionPct}%
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: isCompleted ? "rgba(255,255,255,0.7)" : "#64748b", mt: 1 }}>
            {completedItems} of {totalItems} items completed • {completedChecklists} of {totalChecklists} checklists done
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}
