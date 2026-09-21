import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import SubdirectoryArrowRightIcon from "@mui/icons-material/SubdirectoryArrowRight";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import styles from "@/styles/PageTitle.module.css";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import useApi from "@/components/utils/useApi";
import BASE_URL from "Base/api";

const CATEGORY_ID = 310;

export default function PhotographyTasks() {
  const cId = typeof window !== "undefined" ? sessionStorage.getItem("category") : null;
  const { navigate, create, update, remove } = IsPermissionEnabled(cId ?? CATEGORY_ID);

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedTask, setExpandedTask] = useState(null);
  
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [subTaskDialogOpen, setSubTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [editingSubTask, setEditingSubTask] = useState(null);
  const [parentTaskId, setParentTaskId] = useState(null);
  const [saving, setSaving] = useState(false);

  const { data: eventTypesRaw } = useApi("/PhotographyEventType/GetActiveEventTypes");
  const eventTypes = Array.isArray(eventTypesRaw) ? eventTypesRaw : [];

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${BASE_URL}/PhotographyTask/GetAllTasks`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.statusCode === 200 || data.statusCode === "SUCCESS") {
        setTasks(data.result || []);
      } else {
        toast.error(data.message || "Failed to load tasks");
      }
    } catch (error) {
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleSaveTask = async (formData) => {
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${BASE_URL}/PhotographyTask/SaveTask`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (data.statusCode === 200 || data.statusCode === "SUCCESS") {
        toast.success(editingTask ? "Task updated" : "Task created");
        setTaskDialogOpen(false);
        setEditingTask(null);
        fetchTasks();
      } else {
        toast.error(data.message || "Failed to save task");
      }
    } catch (error) {
      toast.error("Failed to save task");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTask = async (id) => {
    if (!confirm("Delete this task and all its sub-tasks?")) return;
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${BASE_URL}/PhotographyTask/DeleteTask/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.statusCode === 200 || data.statusCode === "SUCCESS") {
        toast.success("Task deleted");
        fetchTasks();
      } else {
        toast.error(data.message || "Failed to delete task");
      }
    } catch (error) {
      toast.error("Failed to delete task");
    }
  };

  const handleSaveSubTask = async (formData) => {
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${BASE_URL}/PhotographyTask/SaveSubTask`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (data.statusCode === 200 || data.statusCode === "SUCCESS") {
        toast.success(editingSubTask ? "Sub-task updated" : "Sub-task created");
        setSubTaskDialogOpen(false);
        setEditingSubTask(null);
        setParentTaskId(null);
        fetchTasks();
      } else {
        toast.error(data.message || "Failed to save sub-task");
      }
    } catch (error) {
      toast.error("Failed to save sub-task");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSubTask = async (id) => {
    if (!confirm("Delete this sub-task?")) return;
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${BASE_URL}/PhotographyTask/DeleteSubTask/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.statusCode === 200 || data.statusCode === "SUCCESS") {
        toast.success("Sub-task deleted");
        fetchTasks();
      } else {
        toast.error(data.message || "Failed to delete sub-task");
      }
    } catch (error) {
      toast.error("Failed to delete sub-task");
    }
  };

  const openTaskDialog = (task = null) => {
    setEditingTask(task);
    setTaskDialogOpen(true);
  };

  const openSubTaskDialog = (taskId, subTask = null) => {
    setParentTaskId(taskId);
    setEditingSubTask(subTask);
    setSubTaskDialogOpen(true);
  };

  if (!navigate) return <AccessDenied />;

  return (
    <>
      <ToastContainer position="bottom-left" autoClose={3000} />

      <div className={styles.pageTitle}>
        <h1>📋 Post-Wedding Tasks</h1>
        <ul>
          <li><Link href="/">Dashboard</Link></li>
          <li>Photography</li>
          <li>Task Templates</li>
        </ul>
      </div>

      <Box mb={2} display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="body2" color="text.secondary">
          Define task templates that auto-generate when reservations are handed over to After Wedding Manager.
        </Typography>
        {create && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => openTaskDialog()}>
            Add Task
          </Button>
        )}
      </Box>

      {loading ? (
        <Typography>Loading...</Typography>
      ) : tasks.length === 0 ? (
        <Alert severity="info">No tasks defined yet. Click "Add Task" to create your first task template.</Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                <TableCell width={40}></TableCell>
                <TableCell><strong>Task Name</strong></TableCell>
                <TableCell><strong>Event Type</strong></TableCell>
                <TableCell align="center"><strong>Days After Event</strong></TableCell>
                <TableCell align="center"><strong>Sub-tasks</strong></TableCell>
                <TableCell align="center"><strong>Status</strong></TableCell>
                <TableCell align="center"><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tasks.map((task) => (
                <React.Fragment key={task.id}>
                  <TableRow hover sx={{ "& > *": { borderBottom: "unset" } }}>
                    <TableCell>
                      <IconButton size="small" onClick={() => setExpandedTask(expandedTask === task.id ? null : task.id)}>
                        {expandedTask === task.id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </IconButton>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <TaskAltIcon color="primary" fontSize="small" />
                        <Typography fontWeight={600}>{task.name}</Typography>
                      </Box>
                      {task.description && (
                        <Typography variant="caption" color="text.secondary">{task.description}</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={task.eventTypeName || "All Events"}
                        color={task.eventTypeId ? "primary" : "default"}
                        variant={task.eventTypeId ? "filled" : "outlined"}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Chip size="small" label={`Day +${task.daysAfterEvent}`} />
                    </TableCell>
                    <TableCell align="center">
                      <Chip size="small" label={task.subTaskCount || 0} color={task.subTaskCount > 0 ? "info" : "default"} />
                    </TableCell>
                    <TableCell align="center">
                      <Chip size="small" label={task.isActive ? "Active" : "Inactive"} color={task.isActive ? "success" : "default"} />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Add Sub-task">
                        <IconButton size="small" onClick={() => openSubTaskDialog(task.id)} color="primary">
                          <AddIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {update && (
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => openTaskDialog(task)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {remove && (
                        <Tooltip title="Delete">
                          <IconButton size="small" color="error" onClick={() => handleDeleteTask(task.id)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={7}>
                      <Collapse in={expandedTask === task.id} timeout="auto" unmountOnExit>
                        <Box sx={{ m: 2, ml: 6 }}>
                          {task.subTasks && task.subTasks.length > 0 ? (
                            <Table size="small">
                              <TableHead>
                                <TableRow sx={{ bgcolor: "#fafafa" }}>
                                  <TableCell><strong>Sub-task Name</strong></TableCell>
                                  <TableCell align="center"><strong>Days After Parent</strong></TableCell>
                                  <TableCell align="center"><strong>Status</strong></TableCell>
                                  <TableCell align="center"><strong>Actions</strong></TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {task.subTasks.map((subTask) => (
                                  <TableRow key={subTask.id}>
                                    <TableCell>
                                      <Box display="flex" alignItems="center" gap={1}>
                                        <SubdirectoryArrowRightIcon color="action" fontSize="small" />
                                        <Typography variant="body2">{subTask.name}</Typography>
                                      </Box>
                                    </TableCell>
                                    <TableCell align="center">
                                      <Chip size="small" label={`+${subTask.daysAfterParentTask} days`} variant="outlined" />
                                    </TableCell>
                                    <TableCell align="center">
                                      <Chip size="small" label={subTask.isActive ? "Active" : "Inactive"} color={subTask.isActive ? "success" : "default"} />
                                    </TableCell>
                                    <TableCell align="center">
                                      {update && (
                                        <Tooltip title="Edit">
                                          <IconButton size="small" onClick={() => openSubTaskDialog(task.id, subTask)}>
                                            <EditIcon fontSize="small" />
                                          </IconButton>
                                        </Tooltip>
                                      )}
                                      {remove && (
                                        <Tooltip title="Delete">
                                          <IconButton size="small" color="error" onClick={() => handleDeleteSubTask(subTask.id)}>
                                            <DeleteIcon fontSize="small" />
                                          </IconButton>
                                        </Tooltip>
                                      )}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          ) : (
                            <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
                              No sub-tasks. Click + to add one.
                            </Typography>
                          )}
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Task Dialog */}
      <TaskDialog
        open={taskDialogOpen}
        onClose={() => { setTaskDialogOpen(false); setEditingTask(null); }}
        onSave={handleSaveTask}
        task={editingTask}
        eventTypes={eventTypes}
        saving={saving}
      />

      {/* Sub-Task Dialog */}
      <SubTaskDialog
        open={subTaskDialogOpen}
        onClose={() => { setSubTaskDialogOpen(false); setEditingSubTask(null); setParentTaskId(null); }}
        onSave={handleSaveSubTask}
        subTask={editingSubTask}
        taskId={parentTaskId}
        saving={saving}
      />
    </>
  );
}

function TaskDialog({ open, onClose, onSave, task, eventTypes, saving }) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    eventTypeId: "",
    daysAfterEvent: 0,
    sortOrder: 0,
    isActive: true,
  });

  useEffect(() => {
    if (task) {
      setFormData({
        id: task.id,
        name: task.name || "",
        description: task.description || "",
        eventTypeId: task.eventTypeId || "",
        daysAfterEvent: task.daysAfterEvent || 0,
        sortOrder: task.sortOrder || 0,
        isActive: task.isActive ?? true,
      });
    } else {
      setFormData({
        name: "",
        description: "",
        eventTypeId: "",
        daysAfterEvent: 0,
        sortOrder: 0,
        isActive: true,
      });
    }
  }, [task, open]);

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast.error("Task name is required");
      return;
    }
    onSave({
      ...formData,
      eventTypeId: formData.eventTypeId || null,
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{task ? "Edit Task" : "Add Task"}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Task Name *"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              select
              fullWidth
              label="Event Type"
              value={formData.eventTypeId}
              onChange={(e) => setFormData({ ...formData, eventTypeId: e.target.value })}
              helperText="Leave empty to apply to all event types"
            >
              <MenuItem value="">All Event Types</MenuItem>
              {eventTypes.map((et) => (
                <MenuItem key={et.id} value={et.id}>{et.name}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="number"
              label="Days After Event *"
              value={formData.daysAfterEvent}
              onChange={(e) => setFormData({ ...formData, daysAfterEvent: parseInt(e.target.value) || 0 })}
              helperText="Due date = Event Date + this value"
              inputProps={{ min: 0 }}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              fullWidth
              type="number"
              label="Sort Order"
              value={formData.sortOrder}
              onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
              inputProps={{ min: 0 }}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              select
              fullWidth
              label="Status"
              value={formData.isActive ? "1" : "0"}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.value === "1" })}
            >
              <MenuItem value="1">Active</MenuItem>
              <MenuItem value="0">Inactive</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function SubTaskDialog({ open, onClose, onSave, subTask, taskId, saving }) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    daysAfterParentTask: 0,
    sortOrder: 0,
    isActive: true,
  });

  useEffect(() => {
    if (subTask) {
      setFormData({
        id: subTask.id,
        taskId: taskId,
        name: subTask.name || "",
        description: subTask.description || "",
        daysAfterParentTask: subTask.daysAfterParentTask || 0,
        sortOrder: subTask.sortOrder || 0,
        isActive: subTask.isActive ?? true,
      });
    } else {
      setFormData({
        taskId: taskId,
        name: "",
        description: "",
        daysAfterParentTask: 0,
        sortOrder: 0,
        isActive: true,
      });
    }
  }, [subTask, taskId, open]);

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast.error("Sub-task name is required");
      return;
    }
    onSave({ ...formData, taskId });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{subTask ? "Edit Sub-task" : "Add Sub-task"}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Sub-task Name *"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              fullWidth
              type="number"
              label="Days After Parent Task *"
              value={formData.daysAfterParentTask}
              onChange={(e) => setFormData({ ...formData, daysAfterParentTask: parseInt(e.target.value) || 0 })}
              helperText="Due = Parent Due + this"
              inputProps={{ min: 0 }}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              fullWidth
              type="number"
              label="Sort Order"
              value={formData.sortOrder}
              onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
              inputProps={{ min: 0 }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              select
              fullWidth
              label="Status"
              value={formData.isActive ? "1" : "0"}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.value === "1" })}
            >
              <MenuItem value="1">Active</MenuItem>
              <MenuItem value="0">Inactive</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
