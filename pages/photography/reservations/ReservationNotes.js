import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  Paper,
  Divider,
  CircularProgress,
  Chip,
  Collapse,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import SendIcon from "@mui/icons-material/Send";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ReceiptIcon from "@mui/icons-material/Receipt";
import { toast } from "react-toastify";
import photographyReservationNoteService from "@/Services/photographyReservationNoteService";
import BASE_URL from "Base/api";

const DELETE_WINDOW_MS = 60 * 1000;

export default function ReservationNotes({ reservationId, hideQuotations = false }) {
  const [notes, setNotes] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [timer, setTimer] = useState(Date.now());
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [showQuotations, setShowQuotations] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const intervalRef = useRef(null);

  const fetchNotes = useCallback(async () => {
    if (!reservationId) return;
    setLoading(true);
    try {
      const response = await photographyReservationNoteService.getNotes(reservationId);
      if (response?.result) {
        setNotes(response.result);
      }
    } catch (err) {
      console.error("Failed to fetch notes", err);
    } finally {
      setLoading(false);
    }
  }, [reservationId]);

  const fetchQuotations = useCallback(async () => {
    if (!reservationId) return;
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${BASE_URL}/PhotographyQuotation/GetQuotationsByReservation/${reservationId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      const data = await response.json();
      if (data?.result) {
        setQuotations(Array.isArray(data.result) ? data.result : [data.result]);
      }
    } catch (err) {
      console.error("Failed to fetch quotations", err);
    }
  }, [reservationId]);

  useEffect(() => {
    fetchNotes();
    if (!hideQuotations) fetchQuotations();
  }, [fetchNotes, fetchQuotations, hideQuotations]);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setTimer(Date.now());
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, []);

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    setSubmitting(true);
    try {
      const response = await photographyReservationNoteService.createNote({
        reservationId,
        content: newNote.trim(),
      });
      if (response?.statusCode === "SUCCESS" || response?.statusCode === 200) {
        toast.success("Note added");
        setNewNote("");
        fetchNotes();
      } else {
        toast.error(response?.message || "Failed to add note");
      }
    } catch (err) {
      toast.error("Failed to add note");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteNote = async (noteId) => {
    try {
      const response = await photographyReservationNoteService.deleteNote(noteId);
      if (response?.statusCode === "SUCCESS" || response?.statusCode === 200) {
        toast.success("Note deleted");
        fetchNotes();
      } else {
        toast.error(response?.message || "Failed to delete note");
      }
    } catch (err) {
      toast.error("Failed to delete note");
    }
  };

  const handleEditClick = (note) => {
    setEditingNoteId(note.id);
    setEditContent(note.content);
  };

  const handleCancelEdit = () => {
    setEditingNoteId(null);
    setEditContent("");
  };

  const formatTime = (dateString) => {
    const d = new Date(dateString);
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency: "LKR",
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  const canDelete = (note) => {
    if (!note.createdOn) return false;
    const createdTime = new Date(note.createdOn).getTime();
    return timer - createdTime <= DELETE_WINDOW_MS && note.canDelete;
  };

  const getRemainingSeconds = (note) => {
    if (!note.createdOn) return 0;
    const createdTime = new Date(note.createdOn).getTime();
    const remaining = DELETE_WINDOW_MS - (timer - createdTime);
    return Math.max(0, Math.ceil(remaining / 1000));
  };

  const getStatusColor = (status) => {
    const s = (status || "").toLowerCase();
    if (s.includes("approved")) return "success";
    if (s.includes("pending")) return "warning";
    if (s.includes("rejected")) return "error";
    if (s.includes("sent")) return "info";
    return "default";
  };

  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        bgcolor: "grey.50",
        borderRadius: 1,
        p: 1,
      }}
    >
      {/* Quotations Section */}
      {!hideQuotations && (
      <Box sx={{ mb: 1 }}>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          onClick={() => setShowQuotations(!showQuotations)}
          sx={{ cursor: "pointer", mb: 0.5 }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            💵 Quotations ({quotations.length})
          </Typography>
          {showQuotations ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
        </Box>
        <Collapse in={showQuotations}>
          {quotations.length === 0 ? (
            <Typography variant="caption" color="text.secondary" sx={{ pl: 1 }}>
              No quotations
            </Typography>
          ) : (
            <List dense sx={{ py: 0 }}>
              {quotations.map((q, idx) => (
                <Paper
                  key={q.id}
                  elevation={0}
                  sx={{
                    p: 1,
                    mb: 0.5,
                    bgcolor: "white",
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 1,
                  }}
                >
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <ReceiptIcon fontSize="small" color="primary" />
                      <Typography variant="body2" fontWeight={600}>
                        {q.quotationNo}
                      </Typography>
                      {q.version && (
                        <Chip label={`v${q.version}`} size="small" sx={{ height: 18, fontSize: 10 }} />
                      )}
                    </Box>
                    <Chip
                      label={q.statusName || q.status}
                      size="small"
                      color={getStatusColor(q.statusName)}
                      sx={{ height: 20, fontSize: 10 }}
                    />
                  </Box>
                  <Typography variant="caption" color="text.secondary" display="block">
                    {q.eventTypeName} • {q.customerName}
                  </Typography>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mt={0.5}>
                    <Typography variant="caption" color="text.secondary">
                      {q.eventDate ? new Date(q.eventDate).toLocaleDateString() : ""}
                    </Typography>
                    <Typography variant="body2" fontWeight={600} color="primary">
                      {formatCurrency(q.grandTotal || q.total)}
                    </Typography>
                  </Box>
                  {q.packageName && (
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                      📦 {q.packageName}
                    </Typography>
                  )}
                </Paper>
              ))}
            </List>
          )}
        </Collapse>
      </Box>
      )}

      {!hideQuotations && <Divider sx={{ my: 1 }} />}

      {/* Notes Section */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        onClick={() => setShowNotes(!showNotes)}
        sx={{ cursor: "pointer", mb: 0.5 }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          📝 Notes ({notes.length})
        </Typography>
        {loading ? <CircularProgress size={14} /> : showNotes ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
      </Box>

      <Collapse in={showNotes}>
      <Box sx={{ flex: 1, overflowY: "auto", mb: 1, maxHeight: 200 }}>
        {notes.length === 0 ? (
          <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 2 }}>
            No notes yet
          </Typography>
        ) : (
          notes.map((note) => {
            const isEditing = editingNoteId === note.id;
            const remainingSec = getRemainingSeconds(note);
            const deletable = canDelete(note);

            return (
              <Paper
                key={note.id}
                elevation={0}
                sx={{
                  p: 1,
                  mb: 1,
                  bgcolor: isEditing ? "action.selected" : "white",
                  border: "1px solid",
                  borderColor: deletable ? "warning.main" : "divider",
                  borderRadius: 1,
                  cursor: "pointer",
                  "&:hover": { bgcolor: "action.hover" },
                }}
                onClick={() => !isEditing && handleEditClick(note)}
              >
                {isEditing ? (
                  <Box>
                    <TextField
                      fullWidth
                      size="small"
                      multiline
                      rows={2}
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      autoFocus
                      sx={{ mb: 1 }}
                    />
                    <Box display="flex" gap={1} justifyContent="flex-end">
                      <IconButton size="small" onClick={handleCancelEdit}>
                        <CancelIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                ) : (
                  <Box>
                    <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", mb: 0.5 }}>
                      {note.content}
                    </Typography>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="caption" color="primary.main" fontWeight={500}>
                          {note.createdByUserName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                          {formatTime(note.createdOn)}
                        </Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap={0.5}>
                        {deletable && (
                          <>
                            <Chip
                              label={`${remainingSec}s`}
                              size="small"
                              color="warning"
                              sx={{ 
                                height: 20, 
                                fontSize: 11, 
                                fontWeight: 600,
                                animation: remainingSec <= 10 ? "pulse 1s infinite" : "none",
                                "@keyframes pulse": {
                                  "0%": { opacity: 1 },
                                  "50%": { opacity: 0.5 },
                                  "100%": { opacity: 1 },
                                },
                              }}
                            />
                            <IconButton
                              size="small"
                              color="error"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteNote(note.id);
                              }}
                              title="Delete"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </>
                        )}
                      </Box>
                    </Box>
                  </Box>
                )}
              </Paper>
            );
          })
        )}
      </Box>

      <Box display="flex" gap={1}>
        <TextField
          fullWidth
          size="small"
          placeholder="Add a note..."
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && handleAddNote()}
          maxRows={2}
          sx={{ bgcolor: "white" }}
        />
        <IconButton
          color="primary"
          onClick={handleAddNote}
          disabled={submitting || !newNote.trim()}
          size="small"
        >
          {submitting ? <CircularProgress size={16} /> : <SendIcon fontSize="small" />}
        </IconButton>
      </Box>
      </Collapse>
    </Box>
  );
}
