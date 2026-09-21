import React, { useCallback, useEffect, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Collapse,
  Divider,
  IconButton,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import WarningIcon from "@mui/icons-material/Warning";
import AssignmentIcon from "@mui/icons-material/Assignment";
import PlaylistAddCheckIcon from "@mui/icons-material/PlaylistAddCheck";
import { toast } from "react-toastify";
import BASE_URL from "Base/api";
import { formatDate } from "@/components/utils/formatHelper";

function isSuccess(data) {
  const code = data?.statusCode ?? data?.StatusCode;
  return code === 200 || code === "SUCCESS" || code === "Success" || String(code).toUpperCase() === "SUCCESS";
}

/**
 * @param {{ reservationId: number, embedded?: boolean, enabled?: boolean, onChanged?: () => void }} props
 * embedded=true: always visible/expanded inside Tasks tab (no blank hide)
 * enabled=false: view-only until After Wedding Manager
 */
export default function ReservationTasks({ reservationId, embedded = false, enabled = true, onChanged }) {
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [taskGroups, setTaskGroups] = useState([]);
  const [expandedGroup, setExpandedGroup] = useState(null);
  const [updating, setUpdating] = useState({});
  const [expanded, setExpanded] = useState(embedded);

  const fetchTasks = useCallback(async () => {
    if (!reservationId) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${BASE_URL}/PhotographyTask/GetReservationTasks/${reservationId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (isSuccess(data)) {
        const result = data.result ?? data.Result ?? {};
        const groups = result.taskGroups ?? result.TaskGroups ?? [];
        setTaskGroups(Array.isArray(groups) ? groups : []);
        if (groups?.length > 0) {
          setExpandedGroup(groups[0].eventType ?? groups[0].EventType);
          if (embedded) setExpanded(true);
        }
      } else {
        setTaskGroups([]);
      }
    } catch (error) {
      console.error("Failed to load tasks", error);
      setTaskGroups([]);
    } finally {
      setLoading(false);
    }
  }, [reservationId, embedded]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleGenerate = async () => {
    if (!enabled) {
      toast.info("Task work unlocks after handover to After Wedding Manager");
      return;
    }
    setGenerating(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${BASE_URL}/PhotographyTask/GenerateTasksForReservation/${reservationId}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await response.json();
      if (isSuccess(data)) {
        toast.success(data.message || data.Message || "Tasks generated");
        await fetchTasks();
        onChanged?.();
      } else {
        toast.error(data.message || data.Message || "Failed to generate tasks");
      }
    } catch {
      toast.error("Failed to generate tasks");
    } finally {
      setGenerating(false);
    }
  };

  const handleToggleTask = async (taskId, isCompleted) => {
    if (!enabled) {
      toast.info("Task work unlocks after handover to After Wedding Manager");
      return;
    }
    setUpdating((prev) => ({ ...prev, [`task-${taskId}`]: true }));
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${BASE_URL}/PhotographyTask/ToggleTaskCompletion`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reservationTaskId: taskId, isCompleted }),
      });
      const data = await response.json();
      if (isSuccess(data)) {
        fetchTasks();
      } else {
        toast.error(data.message || "Failed to update task");
      }
    } catch {
      toast.error("Failed to update task");
    } finally {
      setUpdating((prev) => ({ ...prev, [`task-${taskId}`]: false }));
    }
  };

  const handleToggleSubTask = async (subTaskId, isCompleted) => {
    if (!enabled) {
      toast.info("Task work unlocks after handover to After Wedding Manager");
      return;
    }
    setUpdating((prev) => ({ ...prev, [`subtask-${subTaskId}`]: true }));
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${BASE_URL}/PhotographyTask/ToggleSubTaskCompletion`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reservationSubTaskId: subTaskId, isCompleted }),
      });
      const data = await response.json();
      if (isSuccess(data)) {
        fetchTasks();
      } else {
        toast.error(data.message || "Failed to update sub-task");
      }
    } catch {
      toast.error("Failed to update sub-task");
    } finally {
      setUpdating((prev) => ({ ...prev, [`subtask-${subTaskId}`]: false }));
    }
  };

  const getProgress = (tasks) => {
    const list = tasks || [];
    const total = list.reduce((acc, t) => acc + 1 + (t.subTasks?.length || t.SubTasks?.length || 0), 0);
    const completed = list.reduce((acc, t) => {
      const subs = t.subTasks || t.SubTasks || [];
      return acc + (t.isCompleted || t.IsCompleted ? 1 : 0) + subs.filter((s) => s.isCompleted || s.IsCompleted).length;
    }, 0);
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  const totalTasks = taskGroups.reduce((acc, g) => acc + (g.tasks || g.Tasks || []).length, 0);
  const completedTasks = taskGroups.reduce(
    (acc, g) => acc + (g.tasks || g.Tasks || []).filter((t) => t.isCompleted || t.IsCompleted).length,
    0
  );
  const overallProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const totalOverdue = taskGroups.reduce(
    (acc, g) => acc + (g.tasks || g.Tasks || []).filter((t) => t.isOverdue || t.IsOverdue).length,
    0
  );

  const emptyState = (
    <Box sx={{ p: 2, textAlign: "center" }}>
      <Typography variant="body2" color="text.secondary" mb={1.5}>
        {enabled
          ? "No tasks for this reservation yet."
          : "Tasks will be available after handover to After Wedding Manager."}
      </Typography>
      {enabled && (
        <>
          <Button
            size="small"
            variant="contained"
            startIcon={generating ? <CircularProgress size={14} color="inherit" /> : <PlaylistAddCheckIcon />}
            onClick={handleGenerate}
            disabled={generating}
            sx={{ textTransform: "none" }}
          >
            {generating ? "Generating…" : "Generate Tasks"}
          </Button>
          <Typography variant="caption" color="text.secondary" display="block" mt={1}>
            Uses active task templates for this event type.
          </Typography>
        </>
      )}
    </Box>
  );

  const listBody =
    taskGroups.length === 0 ? (
      emptyState
    ) : (
      taskGroups.map((group) => {
        const eventType = group.eventType ?? group.EventType;
        const eventTypeName = group.eventTypeName ?? group.EventTypeName;
        const eventDate = group.eventDate ?? group.EventDate;
        const tasks = group.tasks || group.Tasks || [];
        const progress = getProgress(tasks);
        const overdueCount = tasks.filter((t) => t.isOverdue || t.IsOverdue).length;

        return (
          <Box key={eventType}>
            <Box
              onClick={() => setExpandedGroup(expandedGroup === eventType ? null : eventType)}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                p: 1,
                bgcolor: "#fafafa",
                borderBottom: "1px solid #e0e0e0",
                cursor: "pointer",
                "&:hover": { bgcolor: "#f5f5f5" },
              }}
            >
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <Typography variant="caption" fontWeight={600}>
                  {eventTypeName}
                </Typography>
                <Chip size="small" label={formatDate(eventDate)} variant="outlined" sx={{ height: 18, fontSize: 9 }} />
              </Stack>
              <Stack direction="row" alignItems="center" spacing={0.5}>
                {overdueCount > 0 && <WarningIcon sx={{ fontSize: 14, color: "error.main" }} />}
                <Chip
                  size="small"
                  label={`${progress}%`}
                  sx={{ height: 18, fontSize: 9 }}
                  color={progress === 100 ? "success" : "default"}
                />
                {expandedGroup === eventType ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
              </Stack>
            </Box>
            <Collapse in={expandedGroup === eventType}>
              <LinearProgress
                variant="determinate"
                value={progress}
                sx={{ height: 3 }}
                color={progress === 100 ? "success" : "primary"}
              />
              {tasks.map((task, idx) => (
                <Box key={task.id || task.Id}>
                  {idx > 0 && <Divider />}
                  <TaskItem
                    task={task}
                    onToggle={handleToggleTask}
                    onToggleSubTask={handleToggleSubTask}
                    updating={updating}
                    disabled={!enabled}
                  />
                </Box>
              ))}
            </Collapse>
          </Box>
        );
      })
    );

  if (embedded) {
    return (
      <Box sx={{ mb: 1 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <AssignmentIcon sx={{ color: "#9c27b0", fontSize: 18 }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              Tasks {totalTasks > 0 ? `(${completedTasks}/${totalTasks})` : ""}
            </Typography>
            {totalOverdue > 0 && (
              <Chip size="small" color="error" label={`${totalOverdue} overdue`} sx={{ height: 20, fontSize: 10 }} />
            )}
          </Stack>
          {totalTasks > 0 && (
            <Chip
              size="small"
              label={`${overallProgress}%`}
              color={overallProgress === 100 ? "success" : overallProgress > 50 ? "primary" : "default"}
              sx={{ height: 20, fontSize: 10 }}
            />
          )}
        </Box>
        {loading ? (
          <Box display="flex" justifyContent="center" py={2}>
            <CircularProgress size={22} />
          </Box>
        ) : (
          <Box sx={{ maxHeight: 360, overflowY: "auto", border: "1px solid #e0e0e0", borderRadius: 1 }}>
            {listBody}
          </Box>
        )}
      </Box>
    );
  }

  return (
    <Box sx={{ mb: 2 }}>
      <Box
        onClick={() => !loading && setExpanded(!expanded)}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: loading ? "default" : "pointer",
          p: 1,
          borderRadius: 1,
          bgcolor: "#f3e5f5",
          "&:hover": { bgcolor: loading ? "#f3e5f5" : "#e1bee7" },
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <AssignmentIcon sx={{ color: "#9c27b0", fontSize: 20 }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#9c27b0" }}>
            Tasks ({completedTasks}/{totalTasks})
          </Typography>
          {totalOverdue > 0 && (
            <Chip size="small" color="error" label={`${totalOverdue} overdue`} sx={{ height: 20, fontSize: 10 }} />
          )}
        </Stack>
        <Stack direction="row" alignItems="center" spacing={1}>
          {loading ? (
            <CircularProgress size={16} />
          ) : (
            <>
              <Chip
                size="small"
                label={`${overallProgress}%`}
                color={overallProgress === 100 ? "success" : overallProgress > 50 ? "primary" : "default"}
                sx={{ height: 20, fontSize: 10 }}
              />
              {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
            </>
          )}
        </Stack>
      </Box>

      <Collapse in={expanded && !loading}>
        <Box sx={{ maxHeight: 300, overflowY: "auto", border: "1px solid #e0e0e0", borderTop: 0, borderRadius: "0 0 4px 4px" }}>
          {listBody}
        </Box>
      </Collapse>
    </Box>
  );
}

function TaskItem({ task, onToggle, onToggleSubTask, updating, disabled = false }) {
  const id = task.id ?? task.Id;
  const isCompleted = task.isCompleted ?? task.IsCompleted;
  const isOverdue = task.isOverdue ?? task.IsOverdue;
  const taskName = task.taskName ?? task.TaskName;
  const dueDate = task.dueDate ?? task.DueDate;
  const subTasks = task.subTasks || task.SubTasks || [];
  const isUpdating = updating[`task-${id}`];
  const [showSubs, setShowSubs] = useState(false);

  return (
    <Box sx={{ px: 1.5, py: 0.5, bgcolor: isOverdue ? "rgba(211,47,47,0.05)" : "transparent", opacity: disabled ? 0.7 : 1 }}>
      <Stack direction="row" alignItems="center" spacing={0.5}>
        <Checkbox
          size="small"
          checked={!!isCompleted}
          onChange={(e) => onToggle(id, e.target.checked)}
          disabled={disabled || isUpdating}
          icon={<RadioButtonUncheckedIcon fontSize="small" />}
          checkedIcon={<CheckCircleIcon fontSize="small" />}
          color="success"
          sx={{ p: 0.25 }}
        />
        <Box flex={1} minWidth={0}>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 600,
              textDecoration: isCompleted ? "line-through" : "none",
              color: isCompleted ? "text.disabled" : isOverdue ? "error.main" : "text.primary",
              display: "block",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {taskName}
          </Typography>
        </Box>
        <Chip
          size="small"
          label={formatDate(dueDate)}
          color={isOverdue ? "error" : "default"}
          variant="outlined"
          sx={{ height: 18, fontSize: 9, flexShrink: 0 }}
        />
        {subTasks.length > 0 && (
          <IconButton size="small" onClick={() => setShowSubs(!showSubs)} sx={{ p: 0 }}>
            {showSubs ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
          </IconButton>
        )}
      </Stack>

      {subTasks.length > 0 && (
        <Collapse in={showSubs}>
          <Box sx={{ ml: 3, mt: 0.5, borderLeft: "2px solid #e0e0e0", pl: 1 }}>
            {subTasks.map((subTask) => (
              <SubTaskItem
                key={subTask.id || subTask.Id}
                subTask={subTask}
                onToggle={onToggleSubTask}
                updating={updating}
                disabled={disabled}
              />
            ))}
          </Box>
        </Collapse>
      )}
    </Box>
  );
}

function SubTaskItem({ subTask, onToggle, updating, disabled = false }) {
  const id = subTask.id ?? subTask.Id;
  const isCompleted = subTask.isCompleted ?? subTask.IsCompleted;
  const isOverdue = subTask.isOverdue ?? subTask.IsOverdue;
  const name = subTask.subTaskName ?? subTask.SubTaskName;
  const dueDate = subTask.dueDate ?? subTask.DueDate;
  const isUpdating = updating[`subtask-${id}`];

  return (
    <Stack direction="row" alignItems="center" spacing={0.5} sx={{ py: 0.25 }}>
      <Checkbox
        size="small"
        checked={!!isCompleted}
        onChange={(e) => onToggle(id, e.target.checked)}
        disabled={disabled || isUpdating}
        icon={<RadioButtonUncheckedIcon sx={{ fontSize: 14 }} />}
        checkedIcon={<CheckCircleIcon sx={{ fontSize: 14 }} />}
        color="success"
        sx={{ p: 0.25 }}
      />
      <Typography
        variant="caption"
        sx={{
          flex: 1,
          textDecoration: isCompleted ? "line-through" : "none",
          color: isCompleted ? "text.disabled" : isOverdue ? "error.main" : "text.primary",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {name}
      </Typography>
      <Chip
        size="small"
        label={formatDate(dueDate)}
        color={isOverdue ? "error" : "default"}
        variant="outlined"
        sx={{ fontSize: 8, height: 16, flexShrink: 0 }}
      />
    </Stack>
  );
}
