import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  alpha,
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Paper,
  Stack,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/DeleteOutline";
import EditIcon from "@mui/icons-material/Edit";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import PageHeader from "@/components/ProjectManagementModule/PageHeader";
import MetricCard from "@/components/ProjectManagementModule/MetricCard";
import FinancialRecordFormDialog from "@/components/ProjectManagementModule/FinancialRecordFormDialog";
import dayjs from "dayjs";
import {
  createFinancialRecord,
  deleteFinancialRecord,
  updateFinancialRecord,
  getAllFinancialRecords,
  getAllFinancialSummary,
  getFinancialRecords,
  getFinancialSummary,
  getProjects,
  getTaskBoard,
  getTeamMembers,
} from "@/Services/projectManagementService";

// Category mapping for fallback display
const categoryMap = {
  1: "General",
  2: "Salary",
  3: "Server Cost",
  4: "Database Cost",
  5: "Infrastructure",
  6: "Operational Expense",
  7: "Travel",
  8: "Marketing",
  9: "Other",
  10: "Project Billing",
  11: "Change Request",
  12: "Maintenance",
  13: "Consulting",
  14: "Product Sales",
  15: "Other Income",
};

const getCategoryName = (record) => {
  if (record.categoryName) {
    return record.categoryName;
  }
  // Fallback to mapping if categoryName is not available
  return categoryMap[record.category] || record.category?.toString() || "Unknown";
};

const FinancialsPage = () => {
  const [projects, setProjects] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [summary, setSummary] = useState(null);
  const [records, setRecords] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [recordDefaults, setRecordDefaults] = useState(null);
  const [editingRecord, setEditingRecord] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0); // 0=Projects, 1=Actual Rate, 2=Estimation Rate

  // Members (labor costing)
  const [laborLoading, setLaborLoading] = useState(false);
  const [laborTasks, setLaborTasks] = useState([]);
  const [laborAdjustments, setLaborAdjustments] = useState({});
  const [postLaborOpen, setPostLaborOpen] = useState(false);
  const [postingLabor, setPostingLabor] = useState(false);

  const ALL_PROJECTS_OPTION = useMemo(
    () => ({ projectId: 0, name: "All Projects", __allProjects: true }),
    []
  );

  const isAllProjectsSelected = Boolean(selectedProject?.__allProjects);

  const projectOptions = useMemo(
    () => [ALL_PROJECTS_OPTION, ...(projects ?? [])],
    [ALL_PROJECTS_OPTION, projects]
  );

  const loadProjects = useCallback(async () => {
    try {
      const data = await getProjects({});
      setProjects(data ?? []);
      if (data?.length && !selectedProject) {
        setSelectedProject(data[0]);
      }
    } catch (err) {
      setError(err.message);
    }
  }, [selectedProject]);

  const loadTeamMembers = useCallback(async () => {
    try {
      const data = await getTeamMembers();
      setTeamMembers(data ?? []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const loadLaborTasks = useCallback(async (projectId, showLoading = true) => {
    if (!projectId) {
      setLaborTasks([]);
      return;
    }

    try {
      if (showLoading) {
        setLaborLoading(true);
      }
      const data = await getTaskBoard(projectId);
      const columns = data?.columns ?? [];
      const flattened = columns.flatMap((col) =>
        (col?.cards ?? []).map((card) => ({
          ...card,
          columnId: col.columnId,
          columnTitle: col.title,
        }))
      );
      setLaborTasks(flattened ?? []);
    } catch (err) {
      console.error(err);
      setLaborTasks([]);
    } finally {
      if (showLoading) {
        setLaborLoading(false);
      }
    }
  }, []);

  const loadFinancials = useCallback(
    async (projectId) => {
      try {
        const [summaryResponse, recordsResponse] = projectId
          ? await Promise.all([getFinancialSummary(projectId), getFinancialRecords(projectId)])
          : await Promise.all([getAllFinancialSummary(), getAllFinancialRecords()]);
        setSummary(summaryResponse);
        setRecords(recordsResponse ?? []);
        setError(null);
      } catch (err) {
        setError(err.message);
      }
    },
    []
  );

  useEffect(() => {
    loadProjects();
    loadTeamMembers();
  }, [loadProjects, loadTeamMembers]);

  useEffect(() => {
    if (selectedProject?.__allProjects) {
      loadFinancials(null);
      return;
    }
    if (selectedProject?.projectId) {
      loadFinancials(selectedProject.projectId);
    }
  }, [selectedProject, loadFinancials]);

  // Auto-refresh labor tasks and team members when Actual Rate or Est Rate tabs are active
  useEffect(() => {
    if (activeTab !== 1 && activeTab !== 2) return;
    if (selectedProject?.__allProjects) return;
    if (!selectedProject?.projectId) return;

    // Load immediately with loading indicator
    loadLaborTasks(selectedProject.projectId, true);
    loadTeamMembers();

    // Set up polling every 10 seconds (background refresh, no loading indicator)
    const intervalId = setInterval(() => {
      loadLaborTasks(selectedProject.projectId, false);
      loadTeamMembers();
    }, 10000);

    // Cleanup interval on unmount or when dependencies change
    return () => {
      clearInterval(intervalId);
    };
  }, [activeTab, selectedProject, loadLaborTasks, loadTeamMembers]);

  const handleCreateRecord = async (values) => {
    if (!selectedProject || selectedProject.__allProjects) return;
    await createFinancialRecord({
      ...values,
      projectId: selectedProject.projectId,
    });
    setDialogOpen(false);
    setRecordDefaults(null);
    setEditingRecord(null);
    await loadFinancials(selectedProject.projectId);
  };

  const handleUpdateRecord = async (values) => {
    if (!editingRecord) return;
    await updateFinancialRecord(editingRecord.financialRecordId, values);
    setDialogOpen(false);
    setRecordDefaults(null);
    setEditingRecord(null);
    await loadFinancials(isAllProjectsSelected ? null : selectedProject.projectId);
  };

  const handleEditRecord = (record) => {
    setEditingRecord(record);
    setRecordDefaults({
      recordType: record.recordType,
      category: record.category,
      amount: record.amount,
      recordDate: dayjs(record.recordDate).format("YYYY-MM-DD"),
      relatedMemberId: record.relatedMemberId || null,
      reference: record.reference || "",
      notes: record.notes || "",
    });
    setDialogOpen(true);
  };

  const handleDeleteRecord = async (recordId) => {
    await deleteFinancialRecord(recordId);
    await loadFinancials(isAllProjectsSelected ? null : selectedProject.projectId);
  };

  const totals = useMemo(() => {
    const income = records
      .filter((record) => record.recordType === 1)
      .reduce((acc, record) => acc + record.amount, 0);
    const expense = records
      .filter((record) => record.recordType === 2)
      .reduce((acc, record) => acc + record.amount, 0);
    return { income, expense };
  }, [records]);

  const handleOpenRecordDialog = (recordType) => {
    setRecordDefaults({
      recordType,
      category: 1,
      amount: 0,
      recordDate: dayjs().format("YYYY-MM-DD"),
      relatedMemberId: null,
      reference: "",
      notes: "",
    });
    setDialogOpen(true);
  };

  const budget = summary?.totalBudget ??
    (isAllProjectsSelected
      ? 0
      : (selectedProject?.budgetAmount ?? selectedProject?.fullAmount ?? 0));
  const advance = summary?.totalAdvance ??
    (isAllProjectsSelected ? 0 : (selectedProject?.advancedAmount ?? 0));
  const due =
    summary?.totalDue ?? Math.max((summary?.totalBudget ?? budget) - advance, 0);

  const incomeTotal = totals.income;
  const expenseTotal = totals.expense;
  const ledgerNet = incomeTotal - expenseTotal;

  const profit =
    summary?.profitOrLoss ??
    ((summary?.totalIncome ?? budget + incomeTotal) - expenseTotal);

  const teamById = useMemo(() => {
    const map = new Map();
    (teamMembers ?? []).forEach((m) => {
      if (!m) return;
      map.set(m.memberId, m);
    });
    return map;
  }, [teamMembers]);

  const getTaskAssigneeIds = useCallback((task) => {
    const assignees = Array.isArray(task?.assignees)
      ? task.assignees
      : Array.isArray(task?.Assignees)
      ? task.Assignees
      : [];

    const idsFromAssignees = assignees
      .map((a) => a?.memberId ?? a?.MemberId ?? null)
      .filter((id) => Number.isFinite(Number(id)) && Number(id) > 0)
      .map((id) => Number(id));

    const legacy = task?.assignedToMemberId ?? task?.AssignedToMemberId ?? null;
    const legacyId =
      Number.isFinite(Number(legacy)) && Number(legacy) > 0 ? Number(legacy) : null;

    const ids = [...idsFromAssignees, ...(legacyId ? [legacyId] : [])];
    return Array.from(new Set(ids));
  }, []);

  const laborRows = useMemo(() => {
    const statsByMember = new Map(); // memberId -> { actualHours, estHours, taskCount, taskTitles: Set }

    (laborTasks ?? []).forEach((task) => {
      const actualHoursRaw = task?.actualHours ?? task?.ActualHours ?? 0;
      const actualHours = Number.isFinite(Number(actualHoursRaw))
        ? Number(actualHoursRaw)
        : 0;
      if (actualHours <= 0) return;

      const estHoursRaw = task?.estimatedHours ?? task?.EstimatedHours ?? 0;
      const estHours = Number.isFinite(Number(estHoursRaw)) ? Number(estHoursRaw) : 0;

      const assigneeIds = getTaskAssigneeIds(task);
      if (!assigneeIds.length) return;

      const splitHours = actualHours / assigneeIds.length;
      const splitEstHours = estHours > 0 ? estHours / assigneeIds.length : 0;
      const taskTitle = task?.title ?? task?.Title ?? "";

      assigneeIds.forEach((memberId) => {
        const current =
          statsByMember.get(memberId) ?? {
            actualHours: 0,
            estHours: 0,
            taskCount: 0,
            taskTitles: new Set(),
          };

        if (taskTitle) current.taskTitles.add(taskTitle);

        statsByMember.set(memberId, {
          actualHours: current.actualHours + splitHours,
          estHours: current.estHours + splitEstHours,
          taskCount: current.taskCount + 1,
          taskTitles: current.taskTitles,
        });
      });
    });

    return Array.from(statsByMember.entries())
      .map(([memberId, info]) => {
        const member = teamById.get(memberId);
        const hourlyRateRaw = member?.hourlyRate ?? member?.HourlyRate ?? 0;
        const hourlyRate = Number.isFinite(Number(hourlyRateRaw))
          ? Number(hourlyRateRaw)
          : 0;

        const adj = laborAdjustments[memberId] ?? {};
        const otHours = Number.isFinite(Number(adj.otHours)) ? Number(adj.otHours) : 0;
        const otMultiplier = Number.isFinite(Number(adj.otMultiplier))
          ? Number(adj.otMultiplier)
          : 1.5;
        const incentive = Number.isFinite(Number(adj.incentive))
          ? Number(adj.incentive)
          : 0;

        const hours = Math.round(info.actualHours * 100) / 100;
        const estHours = Math.round(info.estHours * 100) / 100;

        // "Estimated" displayed in the table is Estimated HOURS (not cost).
        const estimated = estHours;

        // Total uses actual hours (plus OT/incentives) for real costing.
        const actualCost = hours * hourlyRate;
        const otAmount = otHours * hourlyRate * otMultiplier;
        const total = actualCost + otAmount + incentive;

        return {
          memberId,
          memberName: member?.name ?? `Member ${memberId}`,
          taskCount: info.taskCount,
          hours,
          estHours,
          hourlyRate,
          estimated,
          otHours,
          otMultiplier,
          incentive,
          otAmount,
          total,
          taskTitles: Array.from(info.taskTitles ?? []),
        };
      })
      .sort((a, b) => b.total - a.total);
  }, [laborTasks, laborAdjustments, teamById, getTaskAssigneeIds]);

  const laborTotals = useMemo(
    () =>
      laborRows.reduce(
        (acc, row) => ({
          hours: acc.hours + (row.hours || 0),
          estimated: acc.estimated + (row.estimated || 0),
          ot: acc.ot + (row.otAmount || 0),
          incentive: acc.incentive + (row.incentive || 0),
          total: acc.total + (row.total || 0),
        }),
        { hours: 0, estimated: 0, ot: 0, incentive: 0, total: 0 }
      ),
    [laborRows]
  );

  // Estimation Rate tab: EstimatedHours × HourlyRate (split across assignees).
  const estimationRows = useMemo(() => {
    const statsByMember = new Map(); // memberId -> { estHours, taskCount, taskTitles:Set }

    (laborTasks ?? []).forEach((task) => {
      const estHoursRaw = task?.estimatedHours ?? task?.EstimatedHours ?? 0;
      const estHours = Number.isFinite(Number(estHoursRaw)) ? Number(estHoursRaw) : 0;
      if (estHours <= 0) return;

      const assigneeIds = getTaskAssigneeIds(task);
      if (!assigneeIds.length) return;

      const splitEstHours = estHours / assigneeIds.length;
      const taskTitle = task?.title ?? task?.Title ?? "";

      assigneeIds.forEach((memberId) => {
        const current =
          statsByMember.get(memberId) ?? {
            estHours: 0,
            taskCount: 0,
            taskTitles: new Set(),
          };

        if (taskTitle) current.taskTitles.add(taskTitle);

        statsByMember.set(memberId, {
          estHours: current.estHours + splitEstHours,
          taskCount: current.taskCount + 1,
          taskTitles: current.taskTitles,
        });
      });
    });

    return Array.from(statsByMember.entries())
      .map(([memberId, info]) => {
        const member = teamById.get(memberId);
        const hourlyRateRaw = member?.hourlyRate ?? member?.HourlyRate ?? 0;
        const hourlyRate = Number.isFinite(Number(hourlyRateRaw)) ? Number(hourlyRateRaw) : 0;

        const estHours = Math.round(info.estHours * 100) / 100;
        const estimation = Math.round(estHours * hourlyRate * 100) / 100;

        return {
          memberId,
          memberName: member?.name ?? `Member ${memberId}`,
          taskCount: info.taskCount,
          estHours,
          hourlyRate,
          estimation,
          taskTitles: Array.from(info.taskTitles ?? []),
        };
      })
      .sort((a, b) => b.estimation - a.estimation);
  }, [laborTasks, teamById, getTaskAssigneeIds]);

  const estimationTotals = useMemo(
    () =>
      estimationRows.reduce(
        (acc, row) => ({
          estHours: acc.estHours + (row.estHours || 0),
          estimation: acc.estimation + (row.estimation || 0),
        }),
        { estHours: 0, estimation: 0 }
      ),
    [estimationRows]
  );

  const setLaborAdjustment = (memberId, patch) => {
    setLaborAdjustments((prev) => ({
      ...prev,
      [memberId]: {
        ...(prev[memberId] ?? {}),
        ...patch,
      },
    }));
  };

  const handlePostLaborToLedger = async () => {
    if (!selectedProject?.projectId || isAllProjectsSelected) return;

    const rowsToPost = laborRows.filter((r) => r.total > 0);
    if (!rowsToPost.length) {
      setPostLaborOpen(false);
      return;
    }

    try {
      setPostingLabor(true);
      const recordDate = `${dayjs().format("YYYY-MM-DD")}T00:00:00`;

      await Promise.all(
        rowsToPost.map((row) =>
          createFinancialRecord({
            projectId: selectedProject.projectId,
            recordType: 2, // Expense
            category: 2, // Salary
            amount: Math.round(row.total * 100) / 100,
            recordDate,
            relatedMemberId: row.memberId,
            reference: "Labor Cost",
            notes: `Hours: ${row.hours} @ ${row.hourlyRate}\nOT: ${row.otHours}h x ${row.otMultiplier}\nIncentive: ${row.incentive}\nTasks: ${row.taskCount}`,
          })
        )
      );

      setPostLaborOpen(false);
      await loadFinancials(selectedProject.projectId);
    } catch (err) {
      setError(err.message);
    } finally {
      setPostingLabor(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Financial Control"
        subtitle="Track budget utilisation, burn rate and net profitability per project."
      />

      {error ? <Alert severity="error">{error}</Alert> : null}

      <Paper
        elevation={0}
        sx={{
          mb: 3,
          p: 3,
          borderRadius: 3,
          border: (theme) => `1px solid ${theme.palette.divider}`,
        }}
      >
        <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ md: "center" }}>
          <Autocomplete
            sx={{ maxWidth: 450, minWidth: 320 }}
            options={projectOptions}
            value={selectedProject}
            getOptionLabel={(option) => option.name ?? ""}
            onChange={(_, newValue) => setSelectedProject(newValue)}
            renderInput={(params) => <TextField {...params} label="Select Project" />}
          />
          <Tabs value={activeTab} onChange={(_, next) => setActiveTab(next)}>
            <Tab label="Projects" />
            <Tab label="Actual Rate" />
            <Tab label="Est Rate" />
          </Tabs>
        </Stack>
      </Paper>

      {selectedProject ? (
        <>
          {activeTab === 0 ? (
          <>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={3}>
              <MetricCard
                label="Project Budget"
                value={budget.toLocaleString()}
                accent="primary.main"
                secondary={`Advance: ${advance.toLocaleString()}`}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <MetricCard
                label="Due Amount"
                value={due.toLocaleString()}
                accent="warning.main"
                secondary="Budget - Advanced"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <MetricCard
                label="Ledger Income"
                value={incomeTotal.toLocaleString()}
                accent="success.main"
                secondary="Sum of income records"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <MetricCard
                label="Ledger Expenses"
                value={expenseTotal.toLocaleString()}
                accent="error.main"
                secondary="Sum of expense records"
              />
            </Grid>
          </Grid>

          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12}>
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 2.5, md: 3 },
                  borderRadius: 4,
                  border: (theme) => `1px solid ${theme.palette.divider}`,
                  overflow: "hidden",
                  position: "relative",
                  bgcolor: "background.paper",
                  backgroundImage: (theme) => {
                    const color =
                      profit >= 0 ? theme.palette.success.main : theme.palette.error.main;
                    return `linear-gradient(135deg, ${alpha(color, 0.14)} 0%, ${alpha(
                      color,
                      0.04
                    )} 55%, ${alpha(color, 0)} 100%)`;
                  },
                }}
              >
                <Stack
                  direction={{ xs: "column", md: "row" }}
                  spacing={2}
                  alignItems={{ xs: "flex-start", md: "center" }}
                  justifyContent="space-between"
                >
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Net Profit
                    </Typography>
                    <Typography
                      variant="h3"
                      sx={{
                        fontWeight: 900,
                        letterSpacing: -0.6,
                        color: profit >= 0 ? "success.main" : "error.main",
                        mt: 0.5,
                      }}
                    >
                      {profit.toLocaleString()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      Income − Expense • {incomeTotal.toLocaleString()} −{" "}
                      {expenseTotal.toLocaleString()}
                    </Typography>
                  </Box>

                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                    <Chip
                      icon={profit >= 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
                      label={profit >= 0 ? "Profit" : "Loss"}
                      color={profit >= 0 ? "success" : "error"}
                      variant="outlined"
                    />
                    <Chip
                      label={`Net (records): ${ledgerNet.toLocaleString()}`}
                      variant="outlined"
                    />
                  </Stack>
                </Stack>
              </Paper>
            </Grid>
          </Grid>

          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              border: (theme) => `1px solid ${theme.palette.divider}`,
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Ledger
            </Typography>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1}
              sx={{ mb: 2 }}
            >
              <Button
                variant="contained"
                color="error"
                startIcon={<AddIcon />}
                onClick={() => handleOpenRecordDialog(2)}
                disabled={isAllProjectsSelected}
              >
                Add Expense
              </Button>
              <Button
                variant="outlined"
                color="success"
                startIcon={<AddIcon />}
                onClick={() => handleOpenRecordDialog(1)}
                disabled={isAllProjectsSelected}
              >
                Add Income
              </Button>
            </Stack>
            {isAllProjectsSelected ? (
              <Alert severity="info" sx={{ mb: 2 }}>
                Showing financials for all projects. Select a specific project to add new
                income/expense records.
              </Alert>
            ) : null}
            <Table size="small">
              <TableHead>
                <TableRow>
                  {isAllProjectsSelected ? <TableCell>Project</TableCell> : null}
                  <TableCell>Type</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Reference</TableCell>
                  <TableCell>Member</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {records.map((record) => (
                  <TableRow key={record.financialRecordId}>
                    {isAllProjectsSelected ? (
                      <TableCell>{record.projectName ?? "—"}</TableCell>
                    ) : null}
                    <TableCell>
                      <Box
                        sx={{
                          px: 1.5,
                          py: 0.5,
                          borderRadius: 999,
                          display: "inline-flex",
                          bgcolor:
                            record.recordType === 1
                              ? "success.light"
                              : "error.light",
                          color:
                            record.recordType === 1
                              ? "success.dark"
                              : "error.dark",
                          fontWeight: 600,
                        }}
                      >
                        {record.recordType === 1 ? "Income" : "Expense"}
                      </Box>
                    </TableCell>
                    <TableCell>{getCategoryName(record)}</TableCell>
                    <TableCell>{record.amount.toLocaleString()}</TableCell>
                    <TableCell>
                      {new Date(record.recordDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{record.reference ?? "—"}</TableCell>
                    <TableCell>{record.relatedMemberName ?? "—"}</TableCell>
                    <TableCell align="right">
                      <IconButton
                        color="primary"
                        onClick={() => handleEditRecord(record)}
                        size="small"
                        sx={{ mr: 0.5 }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() => handleDeleteRecord(record.financialRecordId)}
                        size="small"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {!records.length ? (
                  <TableRow>
                    <TableCell colSpan={isAllProjectsSelected ? 8 : 7}>
                      <Box
                        sx={{
                          py: 4,
                          textAlign: "center",
                          color: "text.secondary",
                        }}
                      >
                        No records found. Start logging advances, salaries, infra and
                        other costs.
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
            <Stack direction="row" justifyContent="flex-end" spacing={3} sx={{ mt: 2 }}>
              <Typography variant="body2">
                Ledger Income: <strong>{incomeTotal.toLocaleString()}</strong>
              </Typography>
              <Typography variant="body2">
                Ledger Expenses: <strong>{expenseTotal.toLocaleString()}</strong>
              </Typography>
              <Typography variant="body2">
                Income - Expense: <strong>{ledgerNet.toLocaleString()}</strong>
              </Typography>
            </Stack>
          </Paper>
          </>
          ) : activeTab === 1 ? (
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 3,
                border: (theme) => `1px solid ${theme.palette.divider}`,
              }}
            >
              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={1.5}
                alignItems={{ md: "center" }}
                justifyContent="space-between"
                sx={{ mb: 2 }}
              >
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Actual Rate
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Costs are calculated from task Actual Hours and split equally across assignees.
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  color="error"
                  onClick={() => setPostLaborOpen(true)}
                  disabled={isAllProjectsSelected || !laborRows.length}
                >
                  Post as Expense to Ledger
                </Button>
              </Stack>

              {isAllProjectsSelected ? (
                <Alert severity="info" sx={{ mb: 2 }}>
                  Select a specific project to calculate member hours and post labor costs.
                </Alert>
              ) : null}

              {laborLoading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Member</TableCell>
                        <TableCell align="right">Tasks</TableCell>
                        <TableCell align="right">Hours</TableCell>
                        <TableCell align="right">Hourly Rate</TableCell>
                        <TableCell align="right">Estimated Hours</TableCell>
                        <TableCell align="right">OT (hours)</TableCell>
                        <TableCell align="right">OT x</TableCell>
                        <TableCell align="right">Incentive</TableCell>
                        <TableCell align="right">Total</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {laborRows.map((row) => (
                        <TableRow key={`labor-${row.memberId}`}>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {row.memberName}
                            </Typography>
                            {row.taskTitles?.length ? (
                              <Tooltip
                                title={row.taskTitles.join(", ")}
                                arrow
                                placement="top-start"
                              >
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  sx={{ display: "block", maxWidth: 360 }}
                                >
                                  {row.taskTitles.slice(0, 3).join(", ")}
                                  {row.taskTitles.length > 3
                                    ? ` +${row.taskTitles.length - 3} more`
                                    : ""}
                                </Typography>
                              </Tooltip>
                            ) : null}
                          </TableCell>
                          <TableCell align="right">
                            <Tooltip
                              title={row.taskTitles?.length ? row.taskTitles.join(", ") : "—"}
                              arrow
                            >
                              <Box component="span">{row.taskCount}</Box>
                            </Tooltip>
                          </TableCell>
                          <TableCell align="right">{row.hours.toLocaleString()}</TableCell>
                          <TableCell align="right">{row.hourlyRate.toLocaleString()}</TableCell>
                          <TableCell align="right">{row.estimated.toLocaleString()}</TableCell>
                          <TableCell align="right" sx={{ minWidth: 120 }}>
                            <TextField
                              size="small"
                              type="number"
                              value={row.otHours}
                              onChange={(e) =>
                                setLaborAdjustment(row.memberId, { otHours: e.target.value })
                              }
                              inputProps={{ min: 0, step: "0.25" }}
                            />
                          </TableCell>
                          <TableCell align="right" sx={{ minWidth: 100 }}>
                            <TextField
                              size="small"
                              type="number"
                              value={row.otMultiplier}
                              onChange={(e) =>
                                setLaborAdjustment(row.memberId, {
                                  otMultiplier: e.target.value,
                                })
                              }
                              inputProps={{ min: 0, step: "0.1" }}
                            />
                          </TableCell>
                          <TableCell align="right" sx={{ minWidth: 140 }}>
                            <TextField
                              size="small"
                              type="number"
                              value={row.incentive}
                              onChange={(e) =>
                                setLaborAdjustment(row.memberId, { incentive: e.target.value })
                              }
                              inputProps={{ min: 0, step: "1" }}
                            />
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700 }}>
                            {row.total.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                      {!laborRows.length ? (
                        <TableRow>
                          <TableCell colSpan={9}>
                            <Box sx={{ py: 4, textAlign: "center", color: "text.secondary" }}>
                              No labor data yet. Ensure tasks have Start Time + End Time and are assigned to members.
                            </Box>
                          </TableCell>
                        </TableRow>
                      ) : null}
                    </TableBody>
                  </Table>

                  {laborRows.length ? (
                    <Stack
                      direction={{ xs: "column", md: "row" }}
                      spacing={2}
                      justifyContent="flex-end"
                      sx={{ mt: 2 }}
                    >
                      <Typography variant="body2">
                        Hours:{" "}
                        <strong>
                          {(Math.round(laborTotals.hours * 100) / 100).toLocaleString()}
                        </strong>
                      </Typography>
                      <Typography variant="body2">
                        Estimated Hours: <strong>{laborTotals.estimated.toLocaleString()}</strong>
                      </Typography>
                      <Typography variant="body2">
                        OT: <strong>{laborTotals.ot.toLocaleString()}</strong>
                      </Typography>
                      <Typography variant="body2">
                        Incentive: <strong>{laborTotals.incentive.toLocaleString()}</strong>
                      </Typography>
                      <Typography variant="body2">
                        Total: <strong>{laborTotals.total.toLocaleString()}</strong>
                      </Typography>
                    </Stack>
                  ) : null}
                </>
              )}
            </Paper>
          ) : (
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 3,
                border: (theme) => `1px solid ${theme.palette.divider}`,
              }}
            >
              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={1.5}
                alignItems={{ md: "center" }}
                justifyContent="space-between"
                sx={{ mb: 2 }}
              >
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Estimation Rate
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Estimation is calculated as Estimated Hours × Hourly Rate and split equally across assignees.
                  </Typography>
                </Box>
              </Stack>

              {isAllProjectsSelected ? (
                <Alert severity="info" sx={{ mb: 2 }}>
                  Select a specific project to calculate estimation rates.
                </Alert>
              ) : null}

              {laborLoading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Member</TableCell>
                        <TableCell align="right">Tasks</TableCell>
                        <TableCell align="right">Estimated Hours</TableCell>
                        <TableCell align="right">Hourly Rate</TableCell>
                        <TableCell align="right">Estimation</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {estimationRows.map((row) => (
                        <TableRow key={`est-${row.memberId}`}>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {row.memberName}
                            </Typography>
                            {row.taskTitles?.length ? (
                              <Tooltip title={row.taskTitles.join(", ")} arrow placement="top-start">
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  sx={{ display: "block", maxWidth: 360 }}
                                >
                                  {row.taskTitles.slice(0, 3).join(", ")}
                                  {row.taskTitles.length > 3
                                    ? ` +${row.taskTitles.length - 3} more`
                                    : ""}
                                </Typography>
                              </Tooltip>
                            ) : null}
                          </TableCell>
                          <TableCell align="right">{row.taskCount}</TableCell>
                          <TableCell align="right">{row.estHours.toLocaleString()}</TableCell>
                          <TableCell align="right">{row.hourlyRate.toLocaleString()}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700 }}>
                            {row.estimation.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                      {!estimationRows.length ? (
                        <TableRow>
                          <TableCell colSpan={5}>
                            <Box sx={{ py: 4, textAlign: "center", color: "text.secondary" }}>
                              No estimation data yet. Ensure tasks have Estimated Hours and are assigned to members.
                            </Box>
                          </TableCell>
                        </TableRow>
                      ) : null}
                    </TableBody>
                  </Table>

                  {estimationRows.length ? (
                    <Stack
                      direction={{ xs: "column", md: "row" }}
                      spacing={2}
                      justifyContent="flex-end"
                      sx={{ mt: 2 }}
                    >
                      <Typography variant="body2">
                        Estimated Hours:{" "}
                        <strong>
                          {(Math.round(estimationTotals.estHours * 100) / 100).toLocaleString()}
                        </strong>
                      </Typography>
                      <Typography variant="body2">
                        Estimation: <strong>{estimationTotals.estimation.toLocaleString()}</strong>
                      </Typography>
                    </Stack>
                  ) : null}
                </>
              )}
            </Paper>
          )}
        </>
      ) : (
        <Box
          sx={{
            p: 5,
            borderRadius: 3,
            border: (theme) => `1px dashed ${theme.palette.divider}`,
            textAlign: "center",
          }}
        >
          Select a project to view financial details.
        </Box>
      )}

      <FinancialRecordFormDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setRecordDefaults(null);
          setEditingRecord(null);
        }}
        onSubmit={editingRecord ? handleUpdateRecord : handleCreateRecord}
        teamMembers={teamMembers}
        initialValues={recordDefaults ?? undefined}
        title={
          editingRecord
            ? editingRecord.recordType === 1
              ? "Edit Income"
              : "Edit Expense"
            : recordDefaults?.recordType === 1
            ? "Add Income"
            : recordDefaults?.recordType === 2
            ? "Add Expense"
            : "New Financial Record"
        }
      />

      <Dialog open={postLaborOpen} onClose={() => setPostLaborOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>Post Member Costs to Ledger</DialogTitle>
        <DialogContent dividers>
          <Alert severity="warning">
            This will create Salary expense records for each member (one record per member). Avoid posting the same
            period twice.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setPostLaborOpen(false)} color="inherit" disabled={postingLabor}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handlePostLaborToLedger}
            disabled={postingLabor}
          >
            {postingLabor ? "Posting..." : "Post Expenses"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default FinancialsPage;

