import React, { useEffect, useState, useCallback } from "react";
import styles from "@/styles/PageTitle.module.css";
import Link from "next/link";
import {
  Grid,
  Typography,
  Button,
  Box,
  Paper,
  Card,
  CardContent,
  Chip,
  Stack,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  List,
  ListItem,
  ListItemText,
  Avatar,
  Tabs,
  Tab,
  FormControlLabel,
  Switch,
  CircularProgress,
  Tooltip,
} from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import CheckIcon from "@mui/icons-material/Check";
import CommentIcon from "@mui/icons-material/Comment";
import HistoryIcon from "@mui/icons-material/History";
import WarningIcon from "@mui/icons-material/Warning";
import AssignmentIcon from "@mui/icons-material/Assignment";
import PersonIcon from "@mui/icons-material/Person";
import FilterListIcon from "@mui/icons-material/FilterList";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import BASE_URL from "Base/api";
import { formatDate } from "@/components/utils/formatHelper";
import photographyReservationNoteService from "@/Services/photographyReservationNoteService";

const STATUS_CONFIG = {
  Pending: { color: "warning", label: "Pending", bgColor: "#fff3e0" },
  InProgress: { color: "info", label: "In Progress", bgColor: "#e3f2fd" },
  Hold: { color: "error", label: "On Hold", bgColor: "#ffebee" },
  Completed: { color: "success", label: "Completed", bgColor: "#e8f5e9" },
};

export default function TaskBoard() {
  const [tasks, setTasks] = useState({ Pending: [], InProgress: [], Hold: [], Completed: [] });
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("my"); // my | all
  const [notATechnician, setNotATechnician] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [logs, setLogs] = useState([]);
  const [notes, setNotes] = useState([]);
  const [detailTab, setDetailTab] = useState(0);
  const [technicians, setTechnicians] = useState([]);
  const [selectedTechnician, setSelectedTechnician] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [userAgentType, setUserAgentType] = useState(null);
  const [roleReady, setRoleReady] = useState(false);

  const canSeeAllTasks = isAdminUser || userAgentType === 3;
  const canFilterBoard = canSeeAllTasks;

  useEffect(() => {
    if (typeof window !== "undefined") {
      const t = Number(localStorage.getItem("type"));
      setIsAdminUser(t === 0 || t === 1);
    }
    photographyReservationNoteService
      .getCurrentUserAgentType()
      .then((response) => {
        const type = response?.result?.agentType ?? response?.result?.AgentType ?? null;
        const n = type === null || type === undefined || type === "" ? NaN : Number(type);
        setUserAgentType(n === 1 || n === 2 || n === 3 ? n : null);
      })
      .catch(() => setUserAgentType(null))
      .finally(() => setRoleReady(true));
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    if (!roleReady) return;
    if (canSeeAllTasks && viewMode === "my" && notATechnician) {
      setViewMode("all");
    }
    if (!canSeeAllTasks && viewMode === "all") {
      setViewMode("my");
    }
  }, [roleReady, canSeeAllTasks, viewMode, notATechnician]);

  const fetchTasks = useCallback(async () => {
    if (!roleReady) return;
    setLoading(true);
    const token = localStorage.getItem("token");
    try {
      const useAll = viewMode === "all" && canSeeAllTasks;
      const endpoint = useAll ? "GetAllTasks" : "GetMyTasks";
      const params = new URLSearchParams({
        ShowAll: String(showAll),
        MonthsBack: "3",
      });
      if (search) params.set("Search", search);
      if (useAll && selectedTechnician) params.set("TechnicianId", String(selectedTechnician));
      if (useAll && dateFrom) params.set("DateFrom", dateFrom);
      if (useAll && dateTo) params.set("DateTo", dateTo);
      const res = await fetch(`${BASE_URL}/PhotographyTaskBoard/${endpoint}?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const result = data.result;
      const failed = data.statusCode === "FAILED" || data.statusCode === 400;
      if (result && !failed) {
        setTasks({
          Pending: result.Pending || result.pending || [],
          InProgress: result.InProgress || result.inProgress || [],
          Hold: result.Hold || result.hold || [],
          Completed: result.Completed || result.completed || [],
        });
        if (!useAll) setNotATechnician(false);
      } else if (data.message) {
        if (!useAll) {
          setNotATechnician(true);
          if (canSeeAllTasks) {
            setViewMode("all");
          } else {
            toast.error(data.message);
          }
        } else {
          toast.error(data.message);
        }
      }
    } catch (e) {
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, [roleReady, viewMode, showAll, selectedTechnician, search, dateFrom, dateTo, canSeeAllTasks]);

  const fetchTechnicians = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${BASE_URL}/PhotographyTechnician/GetActive`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.result) setTechnicians(data.result);
    } catch (e) {
      console.error("Failed to load technicians");
    }
  };

  useEffect(() => {
    fetchTasks();
    if (canSeeAllTasks) fetchTechnicians();
  }, [fetchTasks, canSeeAllTasks]);

  const handleStatusChange = async (assignmentId, newStatus) => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(
        `${BASE_URL}/PhotographyTaskBoard/UpdateStatus/${assignmentId}?status=${newStatus}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      if (data.statusCode === "SUCCESS" || data.statusCode === 200) {
        toast.success("Status updated");
        fetchTasks();
        if (selectedTask?.id === assignmentId) {
          fetchTaskDetails(assignmentId);
        }
      } else {
        toast.error(data.message || "Failed to update status");
      }
    } catch (e) {
      toast.error("Failed to update status");
    }
  };

  const fetchTaskDetails = async (assignmentId) => {
    const token = localStorage.getItem("token");
    try {
      const [detailRes, logsRes, notesRes] = await Promise.all([
        fetch(`${BASE_URL}/PhotographyTaskBoard/GetTaskDetails/${assignmentId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${BASE_URL}/PhotographyTaskBoard/GetTaskLogs/${assignmentId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${BASE_URL}/PhotographyTaskBoard/GetTaskNotes/${assignmentId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      const [detailData, logsData, notesData] = await Promise.all([
        detailRes.json(),
        logsRes.json(),
        notesRes.json(),
      ]);
      if (detailData.result) setSelectedTask(detailData.result);
      if (logsData.result) setLogs(logsData.result);
      if (notesData.result) setNotes(notesData.result);
    } catch (e) {
      console.error("Failed to load task details");
    }
  };

  const handleOpenDetails = (task) => {
    setSelectedTask(task);
    setDetailTab(0);
    fetchTaskDetails(task.id);
    setDetailsOpen(true);
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${BASE_URL}/PhotographyTaskBoard/AddNote/${selectedTask.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: newNote }),
      });
      const data = await res.json();
      if (data.statusCode === "SUCCESS" || data.statusCode === 200) {
        toast.success("Note added");
        setNewNote("");
        setNoteDialogOpen(false);
        fetchTaskDetails(selectedTask.id);
      } else {
        toast.error(data.message || "Failed to add note");
      }
    } catch (e) {
      toast.error("Failed to add note");
    }
  };

  const renderTaskCard = (task) => (
    <Card
      key={task.id}
      sx={{
        mb: 1,
        cursor: "pointer",
        border: task.isOverdue ? "2px solid #f44336" : "1px solid #e0e0e0",
        "&:hover": { boxShadow: 3 },
      }}
      onClick={() => handleOpenDetails(task)}
    >
      <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={0.5}>
          <Typography variant="body2" fontWeight={600} sx={{ flex: 1 }}>
            {task.taskName}
          </Typography>
          {task.isOverdue && (
            <Tooltip title="Overdue">
              <WarningIcon color="error" sx={{ fontSize: 18 }} />
            </Tooltip>
          )}
        </Stack>
        <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
          {task.coupleNames} • {task.cardNo}
        </Typography>
        <Stack direction="row" spacing={0.5} alignItems="center" flexWrap="wrap">
          <Chip size="small" label={formatDate(task.dueDate)} variant="outlined" sx={{ height: 20, fontSize: 10 }} />
          {task.isSubTask && (
            <Chip size="small" label="Sub-task" color="secondary" sx={{ height: 20, fontSize: 10 }} />
          )}
          {task.notesCount > 0 && (
            <Chip
              size="small"
              icon={<CommentIcon sx={{ fontSize: 12 }} />}
              label={task.notesCount}
              sx={{ height: 20, fontSize: 10 }}
            />
          )}
        </Stack>
        {viewMode === "all" && (
          <Typography variant="caption" color="primary" display="block" mt={0.5}>
            👤 {task.technicianName}
          </Typography>
        )}
      </CardContent>
    </Card>
  );

  const renderColumn = (status, items) => {
    const config = STATUS_CONFIG[status];
    return (
      <Grid item xs={12} sm={6} md={3}>
        <Paper sx={{ p: 1.5, bgcolor: config.bgColor, minHeight: 400 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
            <Typography variant="subtitle2" fontWeight={700}>
              {config.label}
            </Typography>
            <Chip size="small" label={items.length} color={config.color} />
          </Stack>
          <Box sx={{ maxHeight: 500, overflowY: "auto" }}>
            {items.length === 0 ? (
              <Typography variant="caption" color="text.secondary" align="center" display="block" py={2}>
                No tasks
              </Typography>
            ) : (
              items.map(renderTaskCard)
            )}
          </Box>
        </Paper>
      </Grid>
    );
  };

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>📋 Task Board</h1>
        <ul>
          <li>
            <Link href="/photography/reservations/">Photography</Link>
          </li>
          <li>Task Board</li>
        </ul>
      </div>

      <Paper sx={{ p: 2, mb: 2 }} className="bg-black">
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
          {canSeeAllTasks && (
            <Tabs value={viewMode} onChange={(_, v) => {
              if (v === "my" && notATechnician) {
                toast.warning("You are not registered as a technician. Please contact admin.");
                return;
              }
              setViewMode(v);
            }} sx={{ minHeight: 36 }}>
              <Tab value="my" label="My Tasks" sx={{ minHeight: 36, py: 0 }} disabled={notATechnician} />
              <Tab value="all" label="All Tasks" sx={{ minHeight: 36, py: 0 }} />
            </Tabs>
          )}
          <TextField
            size="small"
            placeholder="Search task, couple, card no..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            sx={{ minWidth: 240 }}
          />
          {canFilterBoard && viewMode === "all" && (
            <>
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>Technician</InputLabel>
                <Select
                  value={selectedTechnician}
                  label="Technician"
                  onChange={(e) => setSelectedTechnician(e.target.value)}
                >
                  <MenuItem value="">All Technicians</MenuItem>
                  {technicians.map((t) => (
                    <MenuItem key={t.id} value={t.id}>
                      {t.userName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                size="small"
                type="date"
                label="From"
                InputLabelProps={{ shrink: true }}
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
              <TextField
                size="small"
                type="date"
                label="To"
                InputLabelProps={{ shrink: true }}
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </>
          )}
          <FormControlLabel
            control={<Switch checked={showAll} onChange={(e) => setShowAll(e.target.checked)} size="small" />}
            label={<Typography variant="body2">Show all history</Typography>}
          />
          {loading && <CircularProgress size={20} />}
        </Stack>
      </Paper>

      <Grid container spacing={2}>
        {renderColumn("Pending", tasks.Pending || [])}
        {renderColumn("InProgress", tasks.InProgress || [])}
        {renderColumn("Hold", tasks.Hold || [])}
        {renderColumn("Completed", tasks.Completed || [])}
      </Grid>

      {/* Task Details Dialog */}
      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="md" fullWidth>
        {selectedTask && (
          <>
            <DialogTitle>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="h6">{selectedTask.taskName}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {selectedTask.coupleNames} • {selectedTask.cardNo}
                  </Typography>
                </Box>
                <Chip
                  label={STATUS_CONFIG[selectedTask.statusName]?.label || selectedTask.statusName}
                  color={STATUS_CONFIG[selectedTask.statusName]?.color || "default"}
                />
              </Stack>
            </DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Details
                  </Typography>
                  <Stack spacing={1}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Due Date</Typography>
                      <Typography variant="body2">{formatDate(selectedTask.dueDate)}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Assigned To</Typography>
                      <Typography variant="body2">{selectedTask.technicianName}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Assigned By</Typography>
                      <Typography variant="body2">{selectedTask.assignedByName || "-"}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Assigned On</Typography>
                      <Typography variant="body2">{formatDate(selectedTask.assignedOn)}</Typography>
                    </Box>
                    {selectedTask.assignmentNotes && (
                      <Box>
                        <Typography variant="caption" color="text.secondary">Assignment Notes</Typography>
                        <Typography variant="body2">{selectedTask.assignmentNotes}</Typography>
                      </Box>
                    )}
                  </Stack>

                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" gutterBottom>
                    Actions
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    {selectedTask.status !== 2 && (
                      <Button
                        size="small"
                        variant="contained"
                        color="info"
                        startIcon={<PlayArrowIcon />}
                        onClick={() => handleStatusChange(selectedTask.id, 2)}
                      >
                        Start
                      </Button>
                    )}
                    {selectedTask.status !== 3 && (
                      <Button
                        size="small"
                        variant="outlined"
                        color="warning"
                        startIcon={<PauseIcon />}
                        onClick={() => handleStatusChange(selectedTask.id, 3)}
                      >
                        Hold
                      </Button>
                    )}
                    {selectedTask.status !== 4 && (
                      <Button
                        size="small"
                        variant="contained"
                        color="success"
                        startIcon={<CheckIcon />}
                        onClick={() => handleStatusChange(selectedTask.id, 4)}
                      >
                        Complete
                      </Button>
                    )}
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<CommentIcon />}
                      onClick={() => setNoteDialogOpen(true)}
                    >
                      Add Note
                    </Button>
                  </Stack>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Tabs value={detailTab} onChange={(_, v) => setDetailTab(v)} sx={{ mb: 1 }}>
                    <Tab label={`Notes (${notes.length})`} />
                    <Tab label={`Activity Log (${logs.length})`} />
                  </Tabs>
                  {detailTab === 0 && (
                    <Box sx={{ maxHeight: 300, overflowY: "auto" }}>
                      {notes.length === 0 ? (
                        <Typography variant="body2" color="text.secondary" align="center" py={2}>
                          No notes yet
                        </Typography>
                      ) : (
                        <List dense>
                          {notes.map((note) => (
                            <ListItem key={note.id} sx={{ bgcolor: "#f5f5f5", mb: 0.5, borderRadius: 1 }}>
                              <ListItemText
                                primary={note.content}
                                secondary={`${note.userName} • ${new Date(note.postedOn).toLocaleString()}`}
                              />
                            </ListItem>
                          ))}
                        </List>
                      )}
                    </Box>
                  )}
                  {detailTab === 1 && (
                    <Box sx={{ maxHeight: 300, overflowY: "auto" }}>
                      {logs.length === 0 ? (
                        <Typography variant="body2" color="text.secondary" align="center" py={2}>
                          No activity yet
                        </Typography>
                      ) : (
                        <List dense>
                          {logs.map((log) => (
                            <ListItem key={log.id}>
                              <ListItemText
                                primary={
                                  <Stack direction="row" spacing={1} alignItems="center">
                                    <Typography variant="body2" fontWeight={600}>
                                      {log.action}
                                    </Typography>
                                    {log.fromStatus && log.toStatus && (
                                      <>
                                        <Chip
                                          size="small"
                                          label={STATUS_CONFIG[log.fromStatus]?.label || log.fromStatus}
                                          sx={{ height: 18, fontSize: 10 }}
                                        />
                                        <Typography variant="caption">→</Typography>
                                        <Chip
                                          size="small"
                                          label={STATUS_CONFIG[log.toStatus]?.label || log.toStatus}
                                          color={STATUS_CONFIG[log.toStatus]?.color}
                                          sx={{ height: 18, fontSize: 10 }}
                                        />
                                      </>
                                    )}
                                  </Stack>
                                }
                                secondary={`${log.userName} • ${new Date(log.loggedOn).toLocaleString()}`}
                              />
                            </ListItem>
                          ))}
                        </List>
                      )}
                    </Box>
                  )}
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDetailsOpen(false)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Add Note Dialog */}
      <Dialog open={noteDialogOpen} onClose={() => setNoteDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Note</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={3}
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Enter your note..."
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNoteDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddNote} disabled={!newNote.trim()}>
            Add Note
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
