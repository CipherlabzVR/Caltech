import React from "react";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { CARD_SX, getPipelineGroup } from "../constants";
import { useServiceDashboard } from "../ServiceDashboardProvider";

function buildTechnicianRows(technicianLoad, technicians, jobCards) {
  const rows = new Map();

  const upsert = (id, name, jobCount) => {
    const key = String(id);
    if (!key || key === "undefined") return;
    const existing = rows.get(key);
    rows.set(key, {
      id: key,
      name: name || existing?.name || `Technician #${key}`,
      jobCount: jobCount ?? existing?.jobCount ?? 0,
    });
  };

  (technicianLoad || []).forEach((t) => {
    const id = t.technicianId || t.id || t.userId;
    const count = t.activeJobCount ?? t.jobCount ?? t.load ?? 0;
    upsert(
      id,
      t.fullName || t.name || t.userName || t.technicianName,
      count
    );
  });

  (technicians || []).forEach((t) => {
    const id = t.id || t.technicianId;
    upsert(id, t.name || t.fullName || t.userName, rows.get(String(id))?.jobCount ?? 0);
  });

  if (!(technicianLoad || []).length) {
    jobCards.forEach((jc) => {
      if (!jc.assignedTechnicianId) return;
      const group = getPipelineGroup(jc.status);
      if (group !== "Assigned" && group !== "InProgress") return;
      const id = jc.assignedTechnicianId;
      const key = String(id);
      const current = rows.get(key);
      upsert(id, jc.assignedTechnicianName || current?.name, (current?.jobCount ?? 0) + 1);
    });
  }

  return Array.from(rows.values()).sort((a, b) => b.jobCount - a.jobCount);
}

export function TechnicianSummaryCards() {
  const { totalTechnicians, activeTechnicians, completedJobs, pendingJobs } = useServiceDashboard();

  const cards = [
    { label: "Total Technicians", value: totalTechnicians, color: "#6366F1" },
    { label: "Active Now", value: activeTechnicians, color: "#059669" },
    { label: "Completed Jobs", value: completedJobs, color: "#10B981" },
    { label: "Pending Jobs", value: pendingJobs, color: "#F59E0B" },
  ];

  return (
    <Grid container spacing={2}>
      {cards.map((card) => (
        <Grid item xs={6} md={3} key={card.label}>
          <Card sx={{ ...CARD_SX, borderTop: `3px solid ${card.color}` }}>
            <CardContent sx={{ py: 2 }}>
              <Typography variant="h5" sx={{ fontWeight: 700, color: card.color }}>
                {card.value}
              </Typography>
              <Typography variant="body2" sx={{ color: "#6B7280" }}>
                {card.label}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}

export function TechnicianWorkloadChart() {
  const { technicianLoad, jobCards, technicians } = useServiceDashboard();

  const chartData = buildTechnicianRows(technicianLoad, technicians, jobCards)
    .slice(0, 8)
    .map((t) => ({
      name: t.name.split(" ")[0],
      jobs: t.jobCount,
    }));

  return (
    <Card sx={CARD_SX}>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
          Technician Workload
        </Typography>
        {chartData.length === 0 ? (
          <Typography color="text.secondary">No technician workload data.</Typography>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="jobs" name="Active Jobs" fill="#6366F1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

export function TechnicianAvailability() {
  const { technicians, technicianLoad, jobCards } = useServiceDashboard();

  const list = buildTechnicianRows(technicianLoad, technicians, jobCards).slice(0, 12);
  const totalAssigned = list.reduce((sum, t) => sum + t.jobCount, 0);
  const busyCount = list.filter((t) => t.jobCount > 0).length;

  return (
    <Card sx={CARD_SX}>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
          Technician Availability
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>
          {busyCount} busy · {totalAssigned} job{totalAssigned === 1 ? "" : "s"} assigned
        </Typography>
        {list.length === 0 ? (
          <Typography color="text.secondary">No technicians configured.</Typography>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {list.map((t) => {
              const busy = t.jobCount > 0;
              return (
                <Box
                  key={t.id}
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 1,
                    p: 1.5,
                    bgcolor: "#F9FAFB",
                    borderRadius: 1.5,
                    border: "1px solid",
                    borderColor: busy ? "rgba(245, 158, 11, 0.25)" : "rgba(16, 185, 129, 0.2)",
                  }}
                >
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography variant="body2" fontWeight={600} noWrap>
                      {t.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t.jobCount} assigned job{t.jobCount === 1 ? "" : "s"}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, flexShrink: 0 }}>
                    <Chip
                      label={t.jobCount}
                      size="small"
                      sx={{
                        minWidth: 32,
                        fontWeight: 700,
                        bgcolor: busy ? "rgba(245, 158, 11, 0.15)" : "rgba(16, 185, 129, 0.12)",
                        color: busy ? "#B45309" : "#047857",
                      }}
                    />
                    <Chip
                      label={busy ? "Busy" : "Available"}
                      size="small"
                      color={busy ? "warning" : "success"}
                    />
                  </Box>
                </Box>
              );
            })}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

export function AssignedWorksTable() {
  const { jobCards } = useServiceDashboard();

  const assigned = jobCards
    .filter((jc) => {
      const g = getPipelineGroup(jc.status);
      return (
        (g === "Assigned" || g === "InProgress") &&
        (jc.assignedTechnicianId || jc.assignedTechnicianName)
      );
    })
    .slice(0, 6);

  return (
    <Card sx={CARD_SX}>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
          Assigned Works
        </Typography>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Job Card</TableCell>
                <TableCell>Technician</TableCell>
                <TableCell>Customer</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {assigned.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} align="center">
                    No assigned works
                  </TableCell>
                </TableRow>
              ) : (
                assigned.map((jc) => (
                  <TableRow key={jc.id}>
                    <TableCell>{jc.documentNo}</TableCell>
                    <TableCell>{jc.assignedTechnicianName || "-"}</TableCell>
                    <TableCell>{jc.customerName}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
}
