import React, { useCallback, useEffect, useState } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import AssignmentIndIcon from "@mui/icons-material/AssignmentInd";
import { toast } from "react-toastify";
import BASE_URL from "Base/api";
import { formatDate } from "@/components/utils/formatHelper";

export default function TaskAssignment({ reservationId, refreshKey = 0, enabled = true }) {
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedSubTask, setSelectedSubTask] = useState(null);
  const [selectedTechnician, setSelectedTechnician] = useState("");
  const [assignNotes, setAssignNotes] = useState("");
  const [assigning, setAssigning] = useState(false);

  const fetchTasks = useCallback(async () => {
    if (!reservationId) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${BASE_URL}/PhotographyTaskBoard/GetUnassignedTasks?reservationId=${reservationId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (data.result) {
        setTasks(data.result);
      }
    } catch (e) {
      console.error("Failed to load tasks", e);
    } finally {
      setLoading(false);
    }
  }, [reservationId]);

  const fetchTechnicians = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${BASE_URL}/PhotographyTechnician/GetActive`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.result) {
        setTechnicians(data.result);
      }
    } catch (e) {
      console.error("Failed to load technicians", e);
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchTechnicians();
  }, [fetchTasks, refreshKey]);

  const handleOpenAssign = (task, subTask = null) => {
    if (!enabled) {
      toast.info("Task assignment unlocks after handover to After Wedding Manager");
      return;
    }
    setSelectedTask(task);
    setSelectedSubTask(subTask);
    setSelectedTechnician("");
    setAssignNotes("");
    setDialogOpen(true);
  };

  const handleAssign = async () => {
    if (!selectedTechnician) {
      toast.error("Please select a technician");
      return;
    }
    setAssigning(true);
    try {
      const token = localStorage.getItem("token");
      const payload = {
        reservationTaskId: selectedTask.id,
        reservationSubTaskId: selectedSubTask?.id || null,
        technicianId: selectedTechnician,
        notes: assignNotes || null,
      };
      const res = await fetch(`${BASE_URL}/PhotographyTaskBoard/AssignTask`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.statusCode === "SUCCESS" || data.statusCode === 200) {
        toast.success("Task assigned successfully");
        setDialogOpen(false);
        fetchTasks();
      } else {
        toast.error(data.message || "Failed to assign task");
      }
    } catch (e) {
      toast.error("Failed to assign task");
    } finally {
      setAssigning(false);
    }
  };

  if (tasks.length === 0 && !loading) {
    return (
      <Box sx={{ mb: 1.5, p: 1.25, border: "1px dashed", borderColor: "divider", borderRadius: 1 }}>
        <Typography variant="caption" color="text.secondary" display="block">
          {enabled
            ? "No tasks to assign yet. Generate tasks above first, then assign technicians here."
            : "Task assignment unlocks after handover to After Wedding Manager."}
        </Typography>
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
          bgcolor: "#e3f2fd",
          "&:hover": { bgcolor: loading ? "#e3f2fd" : "#bbdefb" },
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <AssignmentIndIcon sx={{ color: "#1976d2", fontSize: 20 }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#1976d2" }}>
            Task Assignment ({tasks.length})
          </Typography>
        </Stack>
        <Stack direction="row" alignItems="center" spacing={1}>
          {loading ? (
            <CircularProgress size={16} />
          ) : expanded ? (
            <ExpandLessIcon fontSize="small" />
          ) : (
            <ExpandMoreIcon fontSize="small" />
          )}
        </Stack>
      </Box>

      <Collapse in={expanded && !loading}>
        <Box
          sx={{
            maxHeight: 300,
            overflowY: "auto",
            border: "1px solid #e0e0e0",
            borderTop: 0,
            borderRadius: "0 0 4px 4px",
          }}
        >
          {tasks.map((task) => (
            <Box key={task.id} sx={{ borderBottom: "1px solid #f0f0f0" }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  p: 1,
                  bgcolor: "#fafafa",
                }}
              >
                <Box flex={1}>
                  <Typography variant="caption" fontWeight={600}>
                    {task.taskName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Due: {formatDate(task.dueDate)}
                  </Typography>
                </Box>
                {task.subTasks?.length === 0 && (
                  <Box>
                    {task.assignedTechnicians?.length > 0 ? (
                      <Chip
                        size="small"
                        label={task.assignedTechnicians.join(", ")}
                        color="success"
                        sx={{ height: 20, fontSize: 10 }}
                      />
                    ) : (
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleOpenAssign(task)}
                        title="Assign Technician"
                        disabled={!enabled}
                      >
                        <PersonAddIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Box>
                )}
              </Box>
              {task.subTasks?.length > 0 && (
                <Box sx={{ pl: 2, borderLeft: "3px solid #e0e0e0", ml: 1, mb: 1 }}>
                  {task.subTasks.map((subTask) => (
                    <Box
                      key={subTask.id}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        py: 0.5,
                        px: 1,
                      }}
                    >
                      <Box flex={1}>
                        <Typography variant="caption">{subTask.subTaskName}</Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Due: {formatDate(subTask.dueDate)}
                        </Typography>
                      </Box>
                      {subTask.assignedTechnicians?.length > 0 ? (
                        <Chip
                          size="small"
                          label={subTask.assignedTechnicians.join(", ")}
                          color="success"
                          sx={{ height: 20, fontSize: 10 }}
                        />
                      ) : (
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleOpenAssign(task, subTask)}
                          title="Assign Technician"
                          disabled={!enabled}
                        >
                          <PersonAddIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          ))}
        </Box>
      </Collapse>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Assign Technician</DialogTitle>
        <DialogContent>
          <Typography variant="body2" gutterBottom>
            <strong>Task:</strong> {selectedSubTask?.subTaskName || selectedTask?.taskName}
          </Typography>
          <FormControl fullWidth size="small" sx={{ mt: 2 }}>
            <InputLabel>Technician</InputLabel>
            <Select
              value={selectedTechnician}
              label="Technician"
              onChange={(e) => setSelectedTechnician(e.target.value)}
            >
              {technicians.map((t) => (
                <MenuItem key={t.id} value={t.id}>
                  {t.userName} {t.specialization ? `(${t.specialization})` : ""}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            size="small"
            label="Notes (optional)"
            value={assignNotes}
            onChange={(e) => setAssignNotes(e.target.value)}
            multiline
            rows={2}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAssign}
            disabled={assigning || !selectedTechnician}
          >
            {assigning ? <CircularProgress size={20} /> : "Assign"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
