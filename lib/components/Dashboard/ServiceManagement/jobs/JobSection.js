import React from "react";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { useTheme, useMediaQuery } from "@mui/material";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { useRouter } from "next/router";
import {
  Assignment,
  ChevronRight,
  HourglassTop,
  Engineering,
  Autorenew,
  TaskAlt,
  Timeline,
} from "@mui/icons-material";
import { formatDate } from "@/components/utils/formatHelper";
import { CARD_SX, getPipelineGroup, statusDisplay, statusLabel } from "../constants";
import { useServiceDashboard } from "../ServiceDashboardProvider";

const PIPELINE_COLORS = {
  Pending: "#F59E0B",
  Assigned: "#3B82F6",
  InProgress: "#8B5CF6",
  Completed: "#10B981",
  Cancelled: "#EF4444",
};

const STATUS_CHART_COLORS = [
  "#2563EB",
  "#F59E0B",
  "#10B981",
  "#6B7280",
  "#EF4444",
  "#8B5CF6",
  "#EC4899",
  "#14B8A6",
  "#D97706",
  "#6366F1",
];

export function JobStatusChart() {
  const { statusCounts } = useServiceDashboard();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const data = Object.entries(statusCounts).map(([name, value]) => ({
    name: statusDisplay(name) === name ? name : statusDisplay(name),
    value,
  }));

  return (
    <Card sx={CARD_SX}>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
          Job Status Distribution
        </Typography>
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={data.length ? data : [{ name: "No data", value: 1 }]}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={isMobile ? 80 : 100}
              paddingAngle={2}
              dataKey="value"
            >
              {(data.length ? data : [{ name: "No data", value: 1 }]).map((entry, index) => (
                <Cell key={entry.name} fill={STATUS_CHART_COLORS[index % STATUS_CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

const PIPELINE_STAGES = [
  {
    key: "Pending",
    label: "Pending",
    hint: "New & awaiting",
    icon: HourglassTop,
    color: "#F59E0B",
    gradient: "linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%)",
    bg: "linear-gradient(145deg, #FFFBEB 0%, #FFFFFF 85%)",
  },
  {
    key: "Assigned",
    label: "Assigned",
    hint: "Technician set",
    icon: Engineering,
    color: "#3B82F6",
    gradient: "linear-gradient(135deg, #60A5FA 0%, #2563EB 100%)",
    bg: "linear-gradient(145deg, #EFF6FF 0%, #FFFFFF 85%)",
  },
  {
    key: "InProgress",
    label: "In Progress",
    hint: "Work ongoing",
    icon: Autorenew,
    color: "#8B5CF6",
    gradient: "linear-gradient(135deg, #A78BFA 0%, #7C3AED 100%)",
    bg: "linear-gradient(145deg, #F5F3FF 0%, #FFFFFF 85%)",
  },
  {
    key: "Completed",
    label: "Completed",
    hint: "Ready / delivered",
    icon: TaskAlt,
    color: "#10B981",
    gradient: "linear-gradient(135deg, #34D399 0%, #059669 100%)",
    bg: "linear-gradient(145deg, #ECFDF5 0%, #FFFFFF 85%)",
  },
];

export function JobPipelineBoard() {
  const { pipelineCounts } = useServiceDashboard();

  const stageCounts = PIPELINE_STAGES.map((s) => pipelineCounts[s.key] || 0);
  const totalInPipeline = stageCounts.reduce((sum, n) => sum + n, 0);
  const maxCount = Math.max(...stageCounts, 1);

  return (
    <Card
      sx={{
        ...CARD_SX,
        height: "100%",
        overflow: "hidden",
      }}
    >
      <CardContent sx={{ p: { xs: 2, md: 2.5 }, height: "100%" }}>
        <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 2.5, gap: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)",
                color: "#fff",
                boxShadow: "0 4px 14px rgba(79, 70, 229, 0.35)",
              }}
            >
              <Timeline sx={{ fontSize: 20 }} />
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 700, fontSize: "1rem", color: "#0F172A", lineHeight: 1.2 }}>
                Service Pipeline
              </Typography>
              <Typography sx={{ fontSize: "0.72rem", color: "#64748B" }}>
                {totalInPipeline} job{totalInPipeline === 1 ? "" : "s"} across stages
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Flow track */}
        <Box sx={{ position: "relative", px: { xs: 0, md: 1 }, pb: 1 }}>
          <Box
            sx={{
              display: { xs: "none", md: "block" },
              position: "absolute",
              top: 28,
              left: "12%",
              right: "12%",
              height: 3,
              borderRadius: 2,
              bgcolor: "#E2E8F0",
              zIndex: 0,
            }}
          />
          <Box
            sx={{
              display: { xs: "none", md: "block" },
              position: "absolute",
              top: 28,
              left: "12%",
              width: totalInPipeline > 0 ? `${Math.min(100, (stageCounts[3] / totalInPipeline) * 100)}%` : "0%",
              maxWidth: "76%",
              height: 3,
              borderRadius: 2,
              background: "linear-gradient(90deg, #F59E0B, #3B82F6, #8B5CF6, #10B981)",
              zIndex: 0,
              opacity: 0.45,
              transition: "width 0.4s ease",
            }}
          />

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" },
              gap: { xs: 1.5, md: 1.25 },
              position: "relative",
              zIndex: 1,
            }}
          >
            {PIPELINE_STAGES.map((stage, idx) => {
              const count = pipelineCounts[stage.key] || 0;
              const pct = totalInPipeline > 0 ? Math.round((count / totalInPipeline) * 100) : 0;
              const Icon = stage.icon;
              const barWidth = `${Math.max(8, (count / maxCount) * 100)}%`;

              return (
                <Box key={stage.key}>
                  <Box
                    sx={{
                      position: "relative",
                      borderRadius: 2.5,
                      p: 1.75,
                      background: stage.bg,
                      border: `1px solid ${stage.color}28`,
                      boxShadow: count > 0 ? `0 4px 16px ${stage.color}18` : "none",
                      transition: "transform 0.2s ease, box-shadow 0.2s ease",
                      "&:hover": {
                        transform: "translateY(-2px)",
                        boxShadow: `0 8px 20px ${stage.color}25`,
                      },
                    }}
                  >
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.25 }}>
                      <Box
                        sx={{
                          width: 36,
                          height: 36,
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: stage.gradient,
                          color: "#fff",
                          boxShadow: `0 4px 12px ${stage.color}40`,
                        }}
                      >
                        <Icon sx={{ fontSize: 18 }} />
                      </Box>
                      <Typography
                        sx={{
                          fontWeight: 800,
                          fontSize: "1.5rem",
                          lineHeight: 1,
                          color: stage.color,
                          letterSpacing: "-0.02em",
                        }}
                      >
                        {count}
                      </Typography>
                    </Box>

                    <Typography sx={{ fontWeight: 700, fontSize: "0.8125rem", color: "#0F172A", mb: 0.15 }}>
                      {stage.label}
                    </Typography>
                    <Typography sx={{ fontSize: "0.68rem", color: "#64748B", mb: 1.25 }}>
                      {stage.hint}
                    </Typography>

                    <Box sx={{ height: 4, borderRadius: 2, bgcolor: "#E2E8F0", overflow: "hidden" }}>
                      <Box
                        sx={{
                          height: "100%",
                          width: barWidth,
                          borderRadius: 2,
                          background: stage.gradient,
                          transition: "width 0.35s ease",
                        }}
                      />
                    </Box>
                    <Typography sx={{ fontSize: "0.65rem", color: "#94A3B8", mt: 0.5, textAlign: "right" }}>
                      {pct}% of pipeline
                    </Typography>
                  </Box>
                </Box>
              );
            })}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

const PRIORITY_STYLE = {
  2: { label: "Urgent", bg: "#FEF3C7", color: "#B45309" },
  3: { label: "Critical", bg: "#FEE2E2", color: "#DC2626" },
};

const STATUS_PILL = {
  Received: { bg: "#F1F5F9", color: "#475569" },
  Diagnosed: { bg: "#E0F2FE", color: "#0369A1" },
  AwaitingApproval: { bg: "#FEF3C7", color: "#B45309" },
  AwaitingPartsApproval: { bg: "#FFEDD5", color: "#C2410C" },
  Approved: { bg: "#DBEAFE", color: "#1D4ED8" },
  InProgress: { bg: "#EDE9FE", color: "#6D28D9" },
  OnHold: { bg: "#FEF9C3", color: "#A16207" },
  Ready: { bg: "#D1FAE5", color: "#047857" },
  Delivered: { bg: "#DCFCE7", color: "#15803D" },
  Cancelled: { bg: "#FEE2E2", color: "#B91C1C" },
  Unrepairable: { bg: "#FEE2E2", color: "#B91C1C" },
};

const ROW_GRID = {
  xs: "minmax(0, 1fr) auto",
  sm: "88px minmax(0, 1fr) 96px 108px 28px",
  md: "88px minmax(0, 1fr) minmax(0, 0.9fr) 108px 80px 28px",
};

function StatusPill({ label, statusName }) {
  const pill = STATUS_PILL[statusName] || STATUS_PILL.Received;
  return (
    <Typography
      component="span"
      noWrap
      sx={{
        display: "inline-block",
        maxWidth: "100%",
        px: 1,
        py: 0.25,
        borderRadius: 1,
        fontSize: "0.68rem",
        fontWeight: 700,
        lineHeight: 1.4,
        bgcolor: pill.bg,
        color: pill.color,
      }}
    >
      {label}
    </Typography>
  );
}

function RequestRow({ job, onOpen, showDivider }) {
  const statusName = statusLabel(job.status);
  const statusText = statusDisplay(job.status);
  const pipeline = getPipelineGroup(job.status);
  const accent = PIPELINE_COLORS[pipeline] || "#64748B";
  const priority = PRIORITY_STYLE[job.priority];
  const received = formatDate(job.receivedDate || job.createdOn);

  return (
    <Box
      onClick={onOpen}
      sx={{
        display: "grid",
        gridTemplateColumns: ROW_GRID,
        alignItems: "center",
        columnGap: { xs: 1, sm: 1.5 },
        rowGap: 0.5,
        px: { xs: 1.5, sm: 2 },
        py: 1.1,
        minHeight: 44,
        cursor: "pointer",
        borderBottom: showDivider ? "1px solid #F1F5F9" : "none",
        transition: "background 0.15s ease",
        "&:hover": {
          bgcolor: "#F8FAFC",
          "& .row-chevron": { color: accent },
        },
      }}
    >
      <Typography
        noWrap
        sx={{
          fontWeight: 700,
          fontSize: "0.75rem",
          color: "#334155",
          fontFamily: "ui-monospace, monospace",
        }}
      >
        {job.documentNo}
      </Typography>

      <Box sx={{ minWidth: 0 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, minWidth: 0 }}>
          <Typography noWrap sx={{ fontWeight: 600, fontSize: "0.8125rem", color: "#0F172A" }}>
            {job.customerName || "Walk-in"}
          </Typography>
          {priority && (
            <Typography
              component="span"
              sx={{
                flexShrink: 0,
                fontSize: "0.62rem",
                fontWeight: 700,
                px: 0.6,
                py: 0.1,
                borderRadius: 0.75,
                bgcolor: priority.bg,
                color: priority.color,
              }}
            >
              {priority.label}
            </Typography>
          )}
        </Box>
        <Typography noWrap sx={{ fontSize: "0.72rem", color: "#64748B", mt: 0.15 }}>
          {job.productName || "—"}
        </Typography>
      </Box>

      <Typography
        noWrap
        sx={{
          display: { xs: "none", md: "block" },
          fontSize: "0.75rem",
          color: job.assignedTechnicianName ? "#4F46E5" : "#94A3B8",
          fontWeight: job.assignedTechnicianName ? 600 : 400,
        }}
      >
        {job.assignedTechnicianName || "Unassigned"}
      </Typography>

      <Box sx={{ display: { xs: "none", sm: "block" }, minWidth: 0 }}>
        <StatusPill label={statusText} statusName={statusName} />
      </Box>

      <Typography
        noWrap
        sx={{
          display: { xs: "none", sm: "block" },
          fontSize: "0.72rem",
          color: "#64748B",
          textAlign: "right",
        }}
      >
        {received}
      </Typography>

      <ChevronRight
        className="row-chevron"
        sx={{ fontSize: 18, color: "#CBD5E1", justifySelf: "end" }}
      />

      {/* Mobile: status + date under main content */}
      <Box
        sx={{
          display: { xs: "flex", sm: "none" },
          gridColumn: "1 / -1",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
          pt: 0.25,
        }}
      >
        <StatusPill label={statusText} statusName={statusName} />
        <Typography sx={{ fontSize: "0.72rem", color: "#64748B" }}>{received}</Typography>
      </Box>
    </Box>
  );
}

export function RecentServiceRequests() {
  const { recentJobCards } = useServiceDashboard();
  const router = useRouter();

  return (
    <Box
      sx={{
        mt: 3,
        borderRadius: 2.5,
        overflow: "hidden",
        bgcolor: "#FFFFFF",
        border: "1px solid #E2E8F0",
        boxShadow: "0 2px 12px rgba(15, 23, 42, 0.04)",
      }}
    >
      <Box
        sx={{
          px: 2,
          py: 1.5,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 1,
          borderBottom: "1px solid #E2E8F0",
          bgcolor: "#FAFBFC",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Assignment sx={{ fontSize: 20, color: "#2563EB" }} />
          <Typography sx={{ fontWeight: 700, fontSize: "0.9375rem", color: "#0F172A" }}>
            Recent Service Requests
          </Typography>
        </Box>
        <Button
          size="small"
          onClick={() => router.push("/service/job-card/")}
          sx={{
            textTransform: "none",
            fontWeight: 600,
            fontSize: "0.8125rem",
            color: "#2563EB",
            minWidth: "auto",
            px: 1,
          }}
        >
          View all
        </Button>
      </Box>

      {recentJobCards.length > 0 && (
        <Box
          sx={{
            display: { xs: "none", sm: "grid" },
            gridTemplateColumns: ROW_GRID,
            columnGap: 1.5,
            px: 2,
            py: 0.75,
            bgcolor: "#F8FAFC",
            borderBottom: "1px solid #E2E8F0",
          }}
        >
          {["Job No", "Customer / Product", "Technician", "Status", "Received", ""].map((label, i) => (
            <Typography
              key={label || i}
              sx={{
                fontSize: "0.68rem",
                fontWeight: 700,
                color: "#64748B",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                display: i === 2 ? { xs: "none", md: "block" } : "block",
                textAlign: i === 4 ? "right" : "left",
              }}
            >
              {label}
            </Typography>
          ))}
        </Box>
      )}

      <Box
        sx={{
          maxHeight: 280,
          overflowY: "auto",
          "&::-webkit-scrollbar": { width: 6 },
          "&::-webkit-scrollbar-thumb": { bgcolor: "#CBD5E1", borderRadius: 3 },
        }}
      >
        {recentJobCards.length === 0 ? (
          <Box sx={{ py: 4, textAlign: "center" }}>
            <Typography sx={{ fontSize: "0.875rem", color: "#64748B" }}>
              No service requests yet
            </Typography>
          </Box>
        ) : (
          recentJobCards.map((jc, index) => (
            <RequestRow
              key={jc.id}
              job={jc}
              showDivider={index < recentJobCards.length - 1}
              onOpen={() => router.push(`/service/job-card/${jc.id}`)}
            />
          ))
        )}
      </Box>
    </Box>
  );
}
