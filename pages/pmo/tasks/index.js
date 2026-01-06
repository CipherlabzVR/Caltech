import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  Grid,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
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
  getTaskBoard,
  getTeamMembers,
  moveTask,
  updateBoardColumn,
  updateChecklistItem,
  updateTask,
} from "@/Services/projectManagementService";

const MAX_COLUMNS = 15;
const MAX_TASKS = 500;

const TasksBoard = () => {
  const [projects, setProjects] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [board, setBoard] = useState([]);
  const [loadingBoard, setLoadingBoard] = useState(false);
  const [error, setError] = useState(null);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [taskDraft, setTaskDraft] = useState(null);
  const [checklistTask, setChecklistTask] = useState(null);
  const [columnDialog, setColumnDialog] = useState({
    open: false,
    mode: "create",
    column: null,
  });

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

  useEffect(() => {
    loadProjects();
    loadTeamMembers();
  }, [loadProjects, loadTeamMembers]);

  useEffect(() => {
    if (selectedProject?.projectId) {
      loadBoard(selectedProject.projectId);
    }
  }, [selectedProject, loadBoard]);

  const totalTaskCount = useMemo(
    () => board.reduce((acc, column) => acc + column.cards.length, 0),
    [board]
  );

  const remainingCapacity = Math.max(MAX_TASKS - totalTaskCount, 0);

  const handleOpenCreateTask = (column) => {
    if (!selectedProject) return;
    if (!column) {
      setError("Please create a column before adding tasks.");
      return;
    }

    if (totalTaskCount >= MAX_TASKS) {
      setError(`Maximum of ${MAX_TASKS} tasks allowed per project.`);
      return;
    }

    setTaskDraft({
      projectId: selectedProject.projectId,
      boardColumnId: column.columnId,
      title: "",
      description: "",
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
      if (totalTaskCount >= MAX_TASKS) {
        throw new Error(`Maximum of ${MAX_TASKS} tasks allowed per project.`);
      }
      await createTask({
        ...values,
        projectId: selectedProject.projectId,
      });
    }

    setTaskDialogOpen(false);
    setTaskDraft(null);
    await loadBoard(selectedProject.projectId);
  };

  const handleEditTask = (task) => {
    setTaskDraft({
      projectId: selectedProject?.projectId ?? null,
      taskId: task.taskId,
      boardColumnId: task.columnId,
      title: task.title,
      description: task.description,
      assignees: Array.isArray(task.assignees)
        ? task.assignees
        : task.assignedToMemberId != null
        ? [{ memberId: task.assignedToMemberId }]
        : [],
      startDate: task.startDate,
      dueDate: task.dueDate,
      checklist: task.checklist ?? [],
      columnLocked: false,
    });
    setTaskDialogOpen(true);
  };

  const handleDeleteTask = async (task) => {
    await deleteTask(task.taskId);
    const columns = await loadBoard(selectedProject.projectId);
    setBoard(columns);
  };

  const handleMoveTask = async (payload) => {
    await moveTask(payload.taskId, {
      targetColumnId: payload.targetColumnId,
      targetColumnOrder: payload.targetColumnOrder ?? 0,
      targetRowOrder: payload.targetRowOrder,
    });
    const columns = await loadBoard(selectedProject.projectId);
    setBoard(columns);
  };

  const handleAddChecklistItem = async (taskId, title) => {
    await addChecklistItem(taskId, { title });
    const columns = await loadBoard(selectedProject.projectId);
    const refreshed = columns
      .flatMap((column) => column.cards)
      .find((card) => card.taskId === taskId);
    if (refreshed) {
      setChecklistTask({
        ...refreshed,
        checklist: refreshed.checklist,
      });
    }
    setBoard(columns);
  };

  const handleChecklistToggle = async (checklistItemId, values) => {
    await updateChecklistItem(checklistItemId, values);
    const columns = await loadBoard(selectedProject.projectId);
    if (!checklistTask) return;
    const refreshed = columns
      .flatMap((column) => column.cards)
      .find((card) => card.taskId === checklistTask.taskId);
    if (refreshed) {
      setChecklistTask({
        ...refreshed,
        checklist: refreshed.checklist,
      });
    }
    setBoard(columns);
  };

  const handleDeleteChecklistItem = async (checklistItemId) => {
    await deleteChecklistItem(checklistItemId);
    const columns = await loadBoard(selectedProject.projectId);
    setBoard(columns);
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

  const handleColumnDialogSubmit = async ({ name }) => {
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
        });
      } else {
        await createBoardColumn(selectedProject.projectId, { name });
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
      capacity: MAX_TASKS,
      remainingSlots: remainingCapacity,
    };
  }, [board, totalTaskCount, remainingCapacity]);

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
              <MetricCard
                label="Available Capacity"
                value={metrics.remainingSlots}
                accent="warning.main"
                secondary={`Max ${metrics.capacity}`}
              />
            </Grid>
          </Grid>

          {loadingBoard ? (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
              <CircularProgress />
            </Box>
          ) : board.length ? (
            <TaskKanbanBoard
              columns={board}
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
        }}
        onClose={closeColumnDialog}
        onSubmit={handleColumnDialogSubmit}
      />
    </>
  );
};

export default TasksBoard;

