import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import AddIcon from "@mui/icons-material/Add";
import HistoryIcon from "@mui/icons-material/History";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import PageHeader from "@/components/ProjectManagementModule/PageHeader";
import MetricCard from "@/components/ProjectManagementModule/MetricCard";
import TaskKanbanBoard from "@/components/ProjectManagementModule/TaskKanbanBoard";
import TaskFormDialog from "@/components/ProjectManagementModule/TaskFormDialog";
import TaskChecklistDialog from "@/components/ProjectManagementModule/TaskChecklistDialog";
import ColumnFormDialog from "@/components/ProjectManagementModule/ColumnFormDialog";
import {
  addChecklistItem,
  createBoardColumn,
  createTask,
  deleteBoardColumn,
  deleteChecklistItem,
  deleteTask,
  getProjects,
  getTaskHistory,
  getTaskBoard,
  getTeamMembers,
  getTimeline,
  moveTask,
  updateBoardColumn,
  updateChecklistItem,
  updateTask,
} from "@/Services/projectManagementService";

const MAX_COLUMNS = 15;

const TasksBoard = () => {
  const [projects, setProjects] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [board, setBoard] = useState([]);
  const [loadingBoard, setLoadingBoard] = useState(false);
  const [error, setError] = useState(null);
  const [phases, setPhases] = useState([]);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [taskDraft, setTaskDraft] = useState(null);
  const [checklistTask, setChecklistTask] = useState(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyRows, setHistoryRows] = useState([]);
  const [historyFilter, setHistoryFilter] = useState({ mode: "all", memberId: "" });
  const [historyTableFilters, setHistoryTableFilters] = useState({
    task: "",
    assignee: "",
    action: "",
    column: "",
  });
  const [historySort, setHistorySort] = useState({ field: null, direction: "asc" });
  const [completedOpen, setCompletedOpen] = useState(false);
  const [columnDialog, setColumnDialog] = useState({
    open: false,
    mode: "create",
    column: null,
  });

  // Auto-dismiss only the "can't start yet" validation after 3 seconds
  useEffect(() => {
    if (!error) return;
    const message = String(error);
    if (!message.startsWith("Can't start until")) return;
    const timer = setTimeout(() => setError(null), 3000);
    return () => clearTimeout(timer);
  }, [error]);

  const loadProjects = useCallback(async () => {
    try {
      const data = await getProjects({});
      setProjects(data ?? []);
      if (data?.length) {
        setSelectedProject((current) => current ?? data[0]);
      }
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const loadTeamMembers = useCallback(async () => {
    try {
      const data = await getTeamMembers();
      setTeamMembers(data ?? []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const loadBoard = useCallback(
    async (projectId) => {
      if (!projectId) {
        setBoard([]);
        return [];
      }

      try {
        setLoadingBoard(true);
        const data = await getTaskBoard(projectId);
        const columns = data?.columns ?? [];
        setBoard(columns);
        setError(null);
        return columns;
      } catch (err) {
        setError(err.message);
        return [];
      } finally {
        setLoadingBoard(false);
      }
    },
    []
  );

  const loadPhases = useCallback(async (projectId) => {
    if (!projectId) {
      setPhases([]);
      return [];
    }
    try {
      const data = await getTimeline(projectId);
      setPhases(data ?? []);
      return data ?? [];
    } catch (err) {
      // Don't block the board if phases fail to load
      console.error(err);
      setPhases([]);
      return [];
    }
  }, []);

  useEffect(() => {
    loadProjects();
    loadTeamMembers();
  }, [loadProjects, loadTeamMembers]);

  useEffect(() => {
    if (selectedProject?.projectId) {
      loadBoard(selectedProject.projectId);
      loadPhases(selectedProject.projectId);
    }
  }, [selectedProject, loadBoard, loadPhases]);

  const totalTaskCount = useMemo(
    () => board.reduce((acc, column) => acc + column.cards.length, 0),
    [board]
  );

  const FIVE_DAYS_MS = 5 * 24 * 60 * 60 * 1000;

  // Completed tasks older than 5 days move into the "Completed Tasks" window
  const completedTasksArchived = useMemo(() => {
    const tasks = board.flatMap((column) =>
      Array.isArray(column.cards) ? column.cards : []
    );

    const cutoff = Date.now() - FIVE_DAYS_MS;
    return tasks
      .filter((task) => task.isCompleted)
      .filter((task) => {
        const completedOnMs = task.completedOn
          ? new Date(task.completedOn).getTime()
          : null;
        if (!completedOnMs || Number.isNaN(completedOnMs)) return false;
        return completedOnMs < cutoff;
      })
      .sort((a, b) => {
        const aTime = a.completedOn ? new Date(a.completedOn).getTime() : 0;
        const bTime = b.completedOn ? new Date(b.completedOn).getTime() : 0;
        return bTime - aTime;
      });
  }, [board, FIVE_DAYS_MS]);

  const columnNameById = useMemo(() => {
    const map = new Map();
    board.forEach((col) => {
      if (!col) return;
      const name =
        col.displayName ?? col.name ?? col.title ?? col.statusLabel ?? col.statusName ?? "";
      map.set(col.columnId, name || `Column ${col.columnOrder + 1}`);
    });
    return map;
  }, [board]);

  const visibleBoard = useMemo(
    () =>
      (board ?? []).map((col) => ({
        ...col,
        // Completed tasks stay visible on the board for 5 days.
        // After 5 days (based on completedOn), they move to the Completed Tasks window.
        cards: (col.cards ?? []).filter((card) => {
          if (!card.isCompleted) return true;
          const completedOnMs = card.completedOn
            ? new Date(card.completedOn).getTime()
            : null;
          // If completedOn is missing, keep it visible (avoid losing it)
          if (!completedOnMs || Number.isNaN(completedOnMs)) return true;
          return completedOnMs >= Date.now() - FIVE_DAYS_MS;
        }),
      })),
    [board, FIVE_DAYS_MS]
  );

  const handleOpenCreateTask = (column) => {
    if (!selectedProject) return;
    if (!column) {
      setError("Please create a column before adding tasks.");
      return;
    }

    setTaskDraft({
      projectId: selectedProject.projectId,
      boardColumnId: column.columnId,
      title: "",
      description: "",
      estimatedHours: "",
      assignedMemberIds: [],
      startDate: null,
      dueDate: null,
      checklist: [],
      columnLocked: true,
    });
    setTaskDialogOpen(true);
  };

  const handleTaskSubmit = async (values) => {
    if (!selectedProject) return;

    if (taskDraft?.taskId) {
      await updateTask(taskDraft.taskId, values);
    } else {
      await createTask({
        ...values,
        projectId: selectedProject.projectId,
      });
    }

    setTaskDialogOpen(false);
    setTaskDraft(null);
    await loadBoard(selectedProject.projectId);
    await loadPhases(selectedProject.projectId);
  };

  const handleEditTask = (task) => {
    setTaskDraft({
      projectId: selectedProject?.projectId ?? null,
      taskId: task.taskId,
      boardColumnId: task.columnId,
      title: task.title,
      description: task.description,
      estimatedHours: task.estimatedHours ?? task.EstimatedHours ?? "",
      assignees: Array.isArray(task.assignees)
        ? task.assignees
        : task.assignedToMemberId != null
        ? [{ memberId: task.assignedToMemberId }]
        : [],
      startDate: task.startDate,
      dueDate: task.dueDate,
      phaseName: task.phaseName || task.PhaseName || "",
      phaseType: task.phaseType || task.PhaseType || "",
      checklist: task.checklist ?? [],
      columnLocked: false,
    });
    setTaskDialogOpen(true);
  };

  const handleDeleteTask = async (task) => {
    try {
      await deleteTask(task.taskId);
      await loadBoard(selectedProject.projectId);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleMoveTask = async (payload) => {
    try {
      await moveTask(payload.taskId, {
        targetColumnId: payload.targetColumnId,
        targetColumnOrder: payload.targetColumnOrder ?? 0,
        targetRowOrder: payload.targetRowOrder,
      });
      await loadBoard(selectedProject.projectId);
    } catch (err) {
      setError(err.message);
    }
  };

  const loadTaskHistory = useCallback(async () => {
    if (!selectedProject?.projectId) return;
    try {
      setHistoryLoading(true);
      const mode = historyFilter.mode;
      const memberId =
        mode === "member" && historyFilter.memberId ? Number(historyFilter.memberId) : null;
      const unassigned = mode === "unassigned";

      const data = await getTaskHistory({
        projectId: selectedProject.projectId,
        memberId,
        unassigned,
      });
      setHistoryRows(data ?? []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setHistoryLoading(false);
    }
  }, [selectedProject, historyFilter]);

  // Filter and sort history rows
  const filteredAndSortedHistory = useMemo(() => {
    let filtered = [...(historyRows ?? [])];

    // Apply filters
    if (historyTableFilters.task) {
      filtered = filtered.filter((row) =>
        (row.taskTitle ?? "").toLowerCase().includes(historyTableFilters.task.toLowerCase())
      );
    }

    if (historyTableFilters.assignee) {
      if (historyTableFilters.assignee === "Unassigned") {
        filtered = filtered.filter((row) => row.isUnassigned === true);
      } else {
        filtered = filtered.filter((row) =>
          (row.assigneeNames ?? []).some((name) =>
            name.toLowerCase().includes(historyTableFilters.assignee.toLowerCase())
          )
        );
      }
    }

    if (historyTableFilters.action) {
      filtered = filtered.filter((row) => {
        const eventType = row.eventType ?? "";
        if (historyTableFilters.action === "Completed") return eventType === "Completed";
        if (historyTableFilters.action === "Reopened") return eventType === "Reopened";
        if (historyTableFilters.action === "Moved/Updated") return eventType !== "Completed" && eventType !== "Reopened";
        return true;
      });
    }

    if (historyTableFilters.column) {
      filtered = filtered.filter((row) =>
        (row.columnName ?? "").toLowerCase().includes(historyTableFilters.column.toLowerCase())
      );
    }

    // Apply sorting
    if (historySort.field) {
      filtered.sort((a, b) => {
        let aVal, bVal;
        switch (historySort.field) {
          case "task":
            aVal = (a.taskTitle ?? "").toLowerCase();
            bVal = (b.taskTitle ?? "").toLowerCase();
            break;
          case "assignee":
            aVal = a.isUnassigned
              ? "unassigned"
              : (a.assigneeNames ?? []).join(", ").toLowerCase();
            bVal = b.isUnassigned
              ? "unassigned"
              : (b.assigneeNames ?? []).join(", ").toLowerCase();
            break;
          case "action":
            aVal = a.eventType ?? "";
            bVal = b.eventType ?? "";
            break;
          case "column":
            aVal = (a.columnName ?? "").toLowerCase();
            bVal = (b.columnName ?? "").toLowerCase();
            break;
          default:
            return 0;
        }
        if (aVal < bVal) return historySort.direction === "asc" ? -1 : 1;
        if (aVal > bVal) return historySort.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [historyRows, historyTableFilters, historySort]);

  // Get unique values for filter dropdowns
  const uniqueTasks = useMemo(() => {
    const tasks = new Set();
    (historyRows ?? []).forEach((row) => {
      if (row.taskTitle) tasks.add(row.taskTitle);
    });
    return Array.from(tasks).sort();
  }, [historyRows]);

  const uniqueAssignees = useMemo(() => {
    const assignees = new Set();
    (historyRows ?? []).forEach((row) => {
      if (row.isUnassigned) {
        assignees.add("Unassigned");
      } else {
        (row.assigneeNames ?? []).forEach((name) => {
          if (name) assignees.add(name);
        });
      }
    });
    return Array.from(assignees).sort();
  }, [historyRows]);

  const uniqueActions = useMemo(() => {
    const actions = new Set();
    (historyRows ?? []).forEach((row) => {
      const eventType = row.eventType ?? "";
      if (eventType === "Completed") {
        actions.add("Completed");
      } else if (eventType === "Reopened") {
        actions.add("Reopened");
      } else {
        actions.add("Moved/Updated");
      }
    });
    return Array.from(actions).sort();
  }, [historyRows]);

  const uniqueColumns = useMemo(() => {
    const columns = new Set();
    (historyRows ?? []).forEach((row) => {
      if (row.columnName) columns.add(row.columnName);
    });
    return Array.from(columns).sort();
  }, [historyRows]);

  const handleSort = (field) => {
    setHistorySort((prev) => ({
      field,
      direction: prev.field === field && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const handleAddChecklistItem = async (taskId, title) => {
    try {
      await addChecklistItem(taskId, { title });
      const columns = await loadBoard(selectedProject.projectId);
      const refreshed = (columns ?? [])
        .flatMap((column) => column.cards ?? [])
        .find((card) => card.taskId === taskId);
      if (refreshed) {
        setChecklistTask({
          ...refreshed,
          checklist: refreshed.checklist,
        });
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleChecklistToggle = async (checklistItemId, values) => {
    try {
      await updateChecklistItem(checklistItemId, values);
      const columns = await loadBoard(selectedProject.projectId);
      if (!checklistTask) return;
      const refreshed = (columns ?? [])
        .flatMap((column) => column.cards ?? [])
        .find((card) => card.taskId === checklistTask.taskId);
      if (refreshed) {
        setChecklistTask({
          ...refreshed,
          checklist: refreshed.checklist,
        });
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteChecklistItem = async (checklistItemId) => {
    try {
      await deleteChecklistItem(checklistItemId);
      await loadBoard(selectedProject.projectId);
    } catch (err) {
      setError(err.message);
    }
  };

  const openColumnDialog = (mode, column = null) => {
    setColumnDialog({
      open: true,
      mode,
      column,
    });
  };

  const closeColumnDialog = () =>
    setColumnDialog({
      open: false,
      mode: "create",
      column: null,
    });

  const handleColumnDialogSubmit = async ({ name, isStartColumn, isEndColumn, isHoldColumn }) => {
    if (!selectedProject) {
      throw new Error("Select a project before managing columns.");
    }

    if (columnDialog.mode === "create" && board.length >= MAX_COLUMNS) {
      const err = new Error(
        `Maximum of ${MAX_COLUMNS} columns allowed per project.`
      );
      setError(err.message);
      throw err;
    }

    try {
      if (columnDialog.mode === "edit" && columnDialog.column) {
        await updateBoardColumn(columnDialog.column.columnId, {
          columnId: columnDialog.column.columnId,
          name,
          workInProgressLimit: columnDialog.column.workInProgressLimit,
          isStartColumn: Boolean(isStartColumn),
          isEndColumn: Boolean(isEndColumn),
          isHoldColumn: Boolean(isHoldColumn),
        });
      } else {
        await createBoardColumn(selectedProject.projectId, {
          name,
          isStartColumn: Boolean(isStartColumn),
          isEndColumn: Boolean(isEndColumn),
          isHoldColumn: Boolean(isHoldColumn),
        });
      }

      await loadBoard(selectedProject.projectId);
      closeColumnDialog();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const handleDeleteColumn = async (column) => {
    if (!column) return;
    const columnLabel =
      column.name ?? column.title ?? column.displayName ?? "this column";
    if (!window.confirm(`Delete column "${columnLabel}"?`)) return;

    try {
      await deleteBoardColumn(column.columnId);
      await loadBoard(selectedProject.projectId);
    } catch (err) {
      setError(err.message);
    }
  };

  const metrics = useMemo(() => {
    const completionKeywords = ["done", "complete", "completed", "deployed", "approved"];
    let completedFromColumns = 0;
    let hasCompletedColumns = false;

    board.forEach((column) => {
      if (!column) return;

      const cards = Array.isArray(column.cards) ? column.cards : [];
      const columnLabelCandidate =
        column.displayName ?? column.name ?? column.title ?? column.statusLabel ?? column.statusName ?? "";
      const columnLabel = columnLabelCandidate ? columnLabelCandidate.toString().toLowerCase() : "";

      const rawStatus = column.status ?? column.stage ?? null;
      const statusString =
        typeof rawStatus === "string"
          ? rawStatus.toLowerCase()
          : typeof rawStatus === "number"
          ? rawStatus.toString()
          : "";

      const isCompletedColumn =
        (columnLabel &&
          completionKeywords.some((keyword) => columnLabel.includes(keyword))) ||
        (statusString &&
          completionKeywords.some((keyword) => statusString.includes(keyword))) ||
        (typeof rawStatus === "number" && rawStatus >= 5);

      if (isCompletedColumn) {
        completedFromColumns += cards.length;
        hasCompletedColumns = true;
      }
    });

    let completed = completedFromColumns;
    let inProgress = totalTaskCount - completedFromColumns;

    if (!hasCompletedColumns) {
      const tasks = board.flatMap((column) =>
        Array.isArray(column.cards) ? column.cards : []
      );

      const isTaskCompleted = (task) => {
        const checklist = task.checklist ?? [];
        const checklistDone =
          checklist.length > 0 && checklist.every((item) => item.isCompleted);
        return (
          task.isCompleted ||
          (typeof task.progressPercentage === "number" &&
            task.progressPercentage >= 100) ||
          checklistDone
        );
      };

      completed = tasks.filter(isTaskCompleted).length;
      inProgress = totalTaskCount - completed;
    }

    return {
      total: totalTaskCount,
      completed,
      inProgress,
    };
  }, [board, totalTaskCount]);

  return (
    <>
      <PageHeader
        title="Execution Board"
        subtitle="Create custom workflows and manage delivery stages."
        actions={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => openColumnDialog("create")}
            disabled={!selectedProject || board.length >= MAX_COLUMNS}
          >
            Add Column
          </Button>
        }
      />

      {error ? <Alert severity="error">{error}</Alert> : null}

      <Box
        sx={{
          mb: 3,
          p: 3,
          borderRadius: 3,
          border: (theme) => `1px solid ${theme.palette.divider}`,
          bgcolor: "background.paper",
        }}
      >
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <Autocomplete
            sx={{ minWidth: 280 }}
            options={projects}
            value={selectedProject}
            getOptionLabel={(option) => option.name ?? ""}
            onChange={(_, newValue) => setSelectedProject(newValue)}
            renderInput={(params) => (
              <TextField {...params} label="Select Project" />
            )}
          />
          <Box sx={{ flexGrow: 1 }} />
          <Button
            variant="outlined"
            startIcon={<CheckCircleIcon />}
            onClick={() => setCompletedOpen(true)}
            disabled={!selectedProject}
          >
            Completed Tasks
            {completedTasksArchived.length ? ` (${completedTasksArchived.length})` : ""}
          </Button>
        </Stack>
      </Box>

      {selectedProject ? (
        <>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={3}>
              <MetricCard label="Total Tasks" value={metrics.total} />
            </Grid>
            <Grid item xs={12} md={3}>
              <MetricCard
                label="Completed"
                value={metrics.completed}
                accent="success.main"
                secondary={
                  metrics.total
                    ? `${Math.round((metrics.completed / metrics.total) * 100)}%`
                    : "0%"
                }
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <MetricCard
                label="In Progress"
                value={metrics.inProgress}
                accent="primary.main"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <Box
                role="button"
                tabIndex={0}
                onClick={() => {
                  setHistoryOpen(true);
                  loadTaskHistory();
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setHistoryOpen(true);
                    loadTaskHistory();
                  }
                }}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  bgcolor: "background.paper",
                  border: (theme) => `1px solid ${theme.palette.divider}`,
                  boxShadow: (theme) =>
                    theme.palette.mode === "dark"
                      ? "0 10px 30px rgba(15, 23, 42, 0.35)"
                      : "0 12px 24px rgba(15, 23, 42, 0.06)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 1,
                  minHeight: 130,
                  cursor: "pointer",
                  "&:hover": { bgcolor: "action.hover" },
                  "&:focus-visible": {
                    outline: "2px solid",
                    outlineColor: "primary.main",
                    outlineOffset: 2,
                  },
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <HistoryIcon fontSize="small" color="primary" />
                  <Typography variant="subtitle2" color="text.secondary">
                    Task History
                  </Typography>
                </Stack>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  View timeline
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Time spent per column (minutes)
                </Typography>
              </Box>
            </Grid>
          </Grid>

          {loadingBoard ? (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
              <CircularProgress />
            </Box>
          ) : board.length ? (
            <TaskKanbanBoard
              columns={visibleBoard}
              onAddTask={handleOpenCreateTask}
              onEditTask={handleEditTask}
              onDeleteTask={handleDeleteTask}
              onMoveTask={handleMoveTask}
              onOpenChecklist={(task) => setChecklistTask(task)}
              onRenameColumn={(column) => openColumnDialog("edit", column)}
              onDeleteColumn={handleDeleteColumn}
            />
          ) : (
            <Box
              sx={{
                p: 5,
                borderRadius: 3,
                border: (theme) => `1px dashed ${theme.palette.divider}`,
                textAlign: "center",
              }}
            >
              <Typography variant="h6">No columns yet</Typography>
              <Typography variant="body2" color="text.secondary">
                Create your first column to start planning work.
              </Typography>
            </Box>
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
          <Typography variant="h6">Select a project</Typography>
          <Typography variant="body2" color="text.secondary">
            Choose a project to load its tasks and manage workflow.
          </Typography>
        </Box>
      )}

      <TaskFormDialog
        open={taskDialogOpen}
        onClose={() => {
          setTaskDialogOpen(false);
          setTaskDraft(null);
        }}
        onSubmit={handleTaskSubmit}
        initialValues={taskDraft}
        teamMembers={teamMembers}
        columns={board}
        phases={phases}
        title={taskDraft?.taskId ? "Update Task" : "New Task"}
      />

      <TaskChecklistDialog
        open={Boolean(checklistTask)}
        onClose={() => setChecklistTask(null)}
        task={checklistTask ?? { checklist: [] }}
        onToggleItem={handleChecklistToggle}
        onAddItem={handleAddChecklistItem}
        onDeleteItem={handleDeleteChecklistItem}
        onRenameItem={handleChecklistToggle}
      />

      <ColumnFormDialog
        open={columnDialog.open}
        mode={columnDialog.mode}
        initialValues={{
          name:
            columnDialog.column?.name ??
            columnDialog.column?.title ??
            columnDialog.column?.displayName ??
            "",
          isStartColumn:
            columnDialog.column?.isStartColumn ?? columnDialog.column?.IsStartColumn ?? false,
          isEndColumn:
            columnDialog.column?.isEndColumn ?? columnDialog.column?.IsEndColumn ?? false,
          isHoldColumn:
            columnDialog.column?.isHoldColumn ?? columnDialog.column?.IsHoldColumn ?? false,
        }}
        onClose={closeColumnDialog}
        onSubmit={handleColumnDialogSubmit}
      />

      <Dialog
        open={completedOpen}
        onClose={() => setCompletedOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600 }}>
          Completed Tasks (older than 5 days)
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Completed tasks stay on the board for 5 days. After 5 days they move here automatically.
          </Typography>

          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Task</TableCell>
                <TableCell>Assignees</TableCell>
                <TableCell>Last Column</TableCell>
                <TableCell>Completed On</TableCell>
                <TableCell>Due</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {completedTasksArchived.map((task) => (
                <TableRow key={`completed-${task.taskId}`}>
                  <TableCell sx={{ maxWidth: 360 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {task.title}
                    </Typography>
                    {task.description ? (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: "block" }}
                      >
                        {task.description}
                      </Typography>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    {Array.isArray(task.assignees) && task.assignees.length
                      ? task.assignees.map((a) => a.name).join(", ")
                      : task.assignedToName || "Unassigned"}
                  </TableCell>
                  <TableCell>
                    {task.columnId != null
                      ? columnNameById.get(task.columnId) || `Column ${task.columnId}`
                      : "—"}
                  </TableCell>
                  <TableCell>
                    {task.completedOn ? new Date(task.completedOn).toLocaleString() : "—"}
                  </TableCell>
                  <TableCell>
                    {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "—"}
                  </TableCell>
                  <TableCell align="right">
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={async () => {
                        if (!selectedProject) return;

                        const returnColumn = (board ?? [])
                          .slice()
                          .sort((a, b) => (a.columnOrder ?? 0) - (b.columnOrder ?? 0))
                          // prefer a non-completed-status column if status is present
                          .find((c) => c && (c.status == null || Number(c.status) < 7));

                        const targetColumnId =
                          returnColumn?.columnId ?? (board?.[0]?.columnId ?? task.columnId);

                        const assignedMemberIds =
                          Array.isArray(task.assignees) && task.assignees.length
                            ? task.assignees.map((a) => a.memberId)
                            : task.assignedToMemberId != null
                            ? [task.assignedToMemberId]
                            : [];

                        try {
                          await updateTask(task.taskId, {
                            projectId: selectedProject.projectId,
                            boardColumnId: targetColumnId,
                            title: task.title,
                            description: task.description,
                            estimatedHours: task.estimatedHours ?? task.EstimatedHours ?? null,
                            status: 3, // InProgress (backend may override based on column status)
                            assignedMemberIds,
                            startDate: task.startDate ?? null,
                            dueDate: task.dueDate ?? null,
                          });
                          await loadBoard(selectedProject.projectId);
                        } catch (err) {
                          setError(err.message);
                        }
                      }}
                    >
                      Restore
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {completedTasksArchived.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <Typography variant="body2" color="text.secondary">
                      No completed tasks older than 5 days.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setCompletedOpen(false)} color="inherit">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600 }}>Task History</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                select
                label="Filter"
                value={historyFilter.mode}
                onChange={(e) =>
                  setHistoryFilter((prev) => ({
                    ...prev,
                    mode: e.target.value,
                  }))
                }
                sx={{ minWidth: 200 }}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="unassigned">Unassigned</MenuItem>
                <MenuItem value="member">By Assignee</MenuItem>
              </TextField>

              {historyFilter.mode === "member" ? (
                <TextField
                  select
                  label="Assignee"
                  value={historyFilter.memberId}
                  onChange={(e) =>
                    setHistoryFilter((prev) => ({ ...prev, memberId: e.target.value }))
                  }
                  sx={{ minWidth: 260 }}
                >
                  <MenuItem value="">
                    <em>Select assignee</em>
                  </MenuItem>
                  {teamMembers.map((m) => (
                    <MenuItem key={m.memberId} value={m.memberId}>
                      {m.name}
                    </MenuItem>
                  ))}
                </TextField>
              ) : null}

              <Button
                variant="contained"
                onClick={loadTaskHistory}
                disabled={historyLoading || !selectedProject?.projectId}
              >
                {historyLoading ? "Loading..." : "Refresh"}
              </Button>
            </Stack>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                select
                label="Filter by Task"
                value={historyTableFilters.task}
                onChange={(e) =>
                  setHistoryTableFilters((prev) => ({ ...prev, task: e.target.value }))
                }
                sx={{ minWidth: 200 }}
              >
                <MenuItem value="">
                  <em>All Tasks</em>
                </MenuItem>
                {uniqueTasks.map((task) => (
                  <MenuItem key={task} value={task}>
                    {task}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                label="Filter by Assignee"
                value={historyTableFilters.assignee}
                onChange={(e) =>
                  setHistoryTableFilters((prev) => ({ ...prev, assignee: e.target.value }))
                }
                sx={{ minWidth: 200 }}
              >
                <MenuItem value="">
                  <em>All Assignees</em>
                </MenuItem>
                {uniqueAssignees.map((assignee) => (
                  <MenuItem key={assignee} value={assignee}>
                    {assignee}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                label="Filter by Action"
                value={historyTableFilters.action}
                onChange={(e) =>
                  setHistoryTableFilters((prev) => ({ ...prev, action: e.target.value }))
                }
                sx={{ minWidth: 200 }}
              >
                <MenuItem value="">
                  <em>All Actions</em>
                </MenuItem>
                {uniqueActions.map((action) => (
                  <MenuItem key={action} value={action}>
                    {action}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                label="Filter by Column"
                value={historyTableFilters.column}
                onChange={(e) =>
                  setHistoryTableFilters((prev) => ({ ...prev, column: e.target.value }))
                }
                sx={{ minWidth: 200 }}
              >
                <MenuItem value="">
                  <em>All Columns</em>
                </MenuItem>
                {uniqueColumns.map((column) => (
                  <MenuItem key={column} value={column}>
                    {column}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>
          </Stack>

          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    Task
                    <IconButton
                      size="small"
                      onClick={() => handleSort("task")}
                      sx={{ p: 0.5 }}
                    >
                      {historySort.field === "task" ? (
                        historySort.direction === "asc" ? (
                          <ArrowUpwardIcon fontSize="small" />
                        ) : (
                          <ArrowDownwardIcon fontSize="small" />
                        )
                      ) : (
                        <Box sx={{ opacity: 0.3 }}>
                          <ArrowUpwardIcon fontSize="small" />
                        </Box>
                      )}
                    </IconButton>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    Assignees
                    <IconButton
                      size="small"
                      onClick={() => handleSort("assignee")}
                      sx={{ p: 0.5 }}
                    >
                      {historySort.field === "assignee" ? (
                        historySort.direction === "asc" ? (
                          <ArrowUpwardIcon fontSize="small" />
                        ) : (
                          <ArrowDownwardIcon fontSize="small" />
                        )
                      ) : (
                        <Box sx={{ opacity: 0.3 }}>
                          <ArrowUpwardIcon fontSize="small" />
                        </Box>
                      )}
                    </IconButton>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    Action
                    <IconButton
                      size="small"
                      onClick={() => handleSort("action")}
                      sx={{ p: 0.5 }}
                    >
                      {historySort.field === "action" ? (
                        historySort.direction === "asc" ? (
                          <ArrowUpwardIcon fontSize="small" />
                        ) : (
                          <ArrowDownwardIcon fontSize="small" />
                        )
                      ) : (
                        <Box sx={{ opacity: 0.3 }}>
                          <ArrowUpwardIcon fontSize="small" />
                        </Box>
                      )}
                    </IconButton>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    Column
                    <IconButton
                      size="small"
                      onClick={() => handleSort("column")}
                      sx={{ p: 0.5 }}
                    >
                      {historySort.field === "column" ? (
                        historySort.direction === "asc" ? (
                          <ArrowUpwardIcon fontSize="small" />
                        ) : (
                          <ArrowDownwardIcon fontSize="small" />
                        )
                      ) : (
                        <Box sx={{ opacity: 0.3 }}>
                          <ArrowUpwardIcon fontSize="small" />
                        </Box>
                      )}
                    </IconButton>
                  </Box>
                </TableCell>
                <TableCell>Entered</TableCell>
                <TableCell>Left</TableCell>
                <TableCell align="right">Duration</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredAndSortedHistory.map((row, idx) => (
                <TableRow
                  key={`${row.taskId}-${row.enteredAt}-${idx}`}
                  sx={(theme) => {
                    const isGreen =
                      row.eventType === "Completed" && row.isTaskCurrentlyCompleted === true;
                    if (!isGreen) return {};
                    return {
                      backgroundImage: `linear-gradient(135deg, ${alpha(
                        theme.palette.success.main,
                        0.14
                      )} 0%, ${alpha(theme.palette.success.main, 0.04)} 55%, ${alpha(
                        theme.palette.success.main,
                        0
                      )} 100%)`,
                      "& td": {
                        borderBottomColor: alpha(theme.palette.success.main, 0.18),
                      },
                    };
                  }}
                >
                  <TableCell>{row.taskTitle}</TableCell>
                  <TableCell>
                    {row.isUnassigned
                      ? "Unassigned"
                      : (row.assigneeNames ?? []).join(", ") || "—"}
                  </TableCell>
                  <TableCell>
                    {row.eventType === "Completed" ? (
                      <Box
                        sx={(theme) => ({
                          display: "inline-flex",
                          alignItems: "center",
                          px: 1.25,
                          py: 0.4,
                          borderRadius: 999,
                          bgcolor: alpha(theme.palette.success.main, 0.18),
                          color: "success.dark",
                          fontWeight: 700,
                          fontSize: 12,
                        })}
                      >
                        Completed
                      </Box>
                    ) : row.eventType === "Reopened" ? (
                      <Box
                        sx={{
                          display: "inline-flex",
                          alignItems: "center",
                          px: 1.25,
                          py: 0.4,
                          borderRadius: 999,
                          border: "1px solid",
                          borderColor: "divider",
                          color: "text.secondary",
                          fontWeight: 700,
                          fontSize: 12,
                        }}
                      >
                        Reopened
                      </Box>
                    ) : (
                      <Box
                        sx={{
                          display: "inline-flex",
                          alignItems: "center",
                          px: 1.25,
                          py: 0.4,
                          borderRadius: 999,
                          border: "1px solid",
                          borderColor: "divider",
                          color: "text.secondary",
                          fontWeight: 700,
                          fontSize: 12,
                        }}
                      >
                        Moved/Updated
                      </Box>
                    )}
                  </TableCell>
                  <TableCell>{row.columnName}</TableCell>
                  <TableCell>
                    {new Date(row.enteredAt ?? row.EnteredAt).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {(row.leftAt ?? row.LeftAt) ? new Date(row.leftAt ?? row.LeftAt).toLocaleString() : "—"}
                  </TableCell>
                  <TableCell align="right">
                    {(() => {
                      // Prefer backend durationMinutes (more reliable across casing/timezone),
                      // fall back to timestamps for safety.
                      const durationMinutes =
                        row.durationMinutes ?? row.DurationMinutes ?? null;

                      let totalSeconds = null;
                      if (durationMinutes != null && Number.isFinite(Number(durationMinutes))) {
                        totalSeconds = Math.max(0, Math.round(Number(durationMinutes) * 60));
                      } else {
                        const enteredAt = row.enteredAt ?? row.EnteredAt;
                        const leftAt = row.leftAt ?? row.LeftAt;
                        const startMs = enteredAt ? new Date(enteredAt).getTime() : null;
                        const endMs = leftAt ? new Date(leftAt).getTime() : Date.now();
                        if (!startMs || Number.isNaN(startMs) || Number.isNaN(endMs) || endMs <= startMs) {
                          totalSeconds = 0;
                        } else {
                          totalSeconds = Math.floor((endMs - startMs) / 1000);
                        }
                      }

                      const hours = Math.floor(totalSeconds / 3600);
                      const minutes = Math.floor((totalSeconds % 3600) / 60);
                      const seconds = totalSeconds % 60;
                      if (hours > 0) {
                        return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
                      }
                      return `${minutes}:${String(seconds).padStart(2, "0")}`;
                    })()}
                  </TableCell>
                </TableRow>
              ))}
              {!historyLoading && filteredAndSortedHistory.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <Typography variant="body2" color="text.secondary">
                      {historyRows && historyRows.length > 0
                        ? "No history found matching the selected filters."
                        : "No history found for this filter."}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setHistoryOpen(false)} color="inherit">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default TasksBoard;

