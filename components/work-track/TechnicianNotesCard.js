import { useEffect, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useMediaQuery, useTheme } from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import CloseIcon from "@mui/icons-material/Close";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ImageIcon from "@mui/icons-material/Image";
import StickyNote2Icon from "@mui/icons-material/StickyNote2";
import { toast } from "react-toastify";
import BASE_URL from "Base/api";
import { formatDateWithTime } from "@/components/utils/formatHelper";
import CameraCaptureModal from "@/components/work-track/CameraCaptureModal";

const MAX_IMAGES = 5;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_NOTE_LENGTH = 2000;
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

function authHeaders(json) {
  const headers = {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  };
  if (json) headers["Content-Type"] = "application/json";
  return headers;
}

function notesSignature(list) {
  return (list || [])
    .map((note) => `${note.id}|${note.noteText}|${note.canDelete}|${(note.images || []).map((image) => image.id).join(",")}`)
    .join(";");
}

function normalizeNote(note) {
  const images = note?.images || note?.Images || [];
  return {
    id: note?.id ?? note?.Id,
    noteText: note?.noteText ?? note?.NoteText ?? "",
    createdByUserId: note?.createdByUserId ?? note?.CreatedByUserId,
    createdByName: note?.createdByName ?? note?.CreatedByName ?? "User",
    createdOn: note?.createdOn ?? note?.CreatedOn,
    canDelete: note?.canDelete ?? note?.CanDelete ?? false,
    images: (Array.isArray(images) ? images : []).map((image) => ({
      id: image?.id ?? image?.Id,
      imageUrl: image?.imageUrl ?? image?.ImageUrl,
      sortOrder: image?.sortOrder ?? image?.SortOrder ?? 0,
    })),
  };
}

function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export default function TechnicianNotesCard({
  workTrackDetailId,
  submissionStatus,
  allowAdd,
  title = "Notes",
  placeholder = "Write a message...",
  assignedTechnicianId,
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const fileInputRef = useRef(null);
  const threadRef = useRef(null);
  const stickToBottomRef = useRef(true);
  const statusRef = useRef(submissionStatus);
  statusRef.current = submissionStatus;
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [noteText, setNoteText] = useState("");
  const [stagedImages, setStagedImages] = useState([]);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const completed = submissionStatus === "Completed";
  const canAdd = allowAdd && !completed && workTrackDetailId;

  const applyNotes = (list) => {
    const next = Array.isArray(list) ? list.map(normalizeNote) : [];
    setNotes((prev) => (notesSignature(prev) === notesSignature(next) ? prev : next));
  };

  const loadNotes = async (silent) => {
    if (!workTrackDetailId) return;
    try {
      if (!silent) setLoading(true);
      const response = await fetch(
        `${BASE_URL}/WorkTrackDetail/GetTechnicianNotes?workTrackDetailId=${workTrackDetailId}`,
        { headers: authHeaders(false) }
      );
      const result = await response.json();
      const list = result?.result || result?.data || result?.Result || result?.Data || [];
      if (result?.statusCode && result.statusCode !== 200) {
        if (!silent && result?.message) toast(result.message, { type: "error" });
        return;
      }
      applyNotes(list);
    } catch (error) {
      console.error("Error loading technician notes:", error);
      if (!silent) toast("Failed to load notes", { type: "error" });
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    let socket;
    let closed = false;
    let retry;
    let hasOpened = false;
    loadNotes(false);

    const canDeleteNote = (note) => {
      const userType = String(localStorage.getItem("type") ?? "");
      const isAdmin = userType === "0" || userType === "1" || userType === "23";
      const mine = Number(note.createdByUserId) === Number(localStorage.getItem("userid"));
      return statusRef.current !== "Completed" && (mine || isAdmin);
    };

    const connect = () => {
      const token = localStorage.getItem("token");
      if (!token || !workTrackDetailId || closed) return;
      const httpBase = String(BASE_URL).replace(/\/api\/?$/, "");
      const wsBase = httpBase.replace(/^http/i, (scheme) => (scheme.toLowerCase() === "https" ? "wss" : "ws"));
      const url = `${wsBase}/api/ws/work-track-notes?workTrackDetailId=${encodeURIComponent(workTrackDetailId)}&access_token=${encodeURIComponent(token)}`;
      socket = new WebSocket(url);
      socket.onopen = () => {
        if (hasOpened) loadNotes(true);
        hasOpened = true;
      };
      socket.onmessage = (event) => {
        let message;
        try {
          message = JSON.parse(event.data);
        } catch (error) {
          return;
        }
        if (message?.type === "added" && message.note) {
          const note = normalizeNote(message.note);
          note.canDelete = canDeleteNote(note);
          setNotes((prev) => (prev.some((item) => item.id === note.id) ? prev : [...prev, note]));
        } else if (message?.type === "deleted") {
          const noteId = message.id ?? message.Id;
          setNotes((prev) => prev.filter((item) => item.id !== noteId));
        }
      };
      socket.onclose = () => {
        if (!closed) retry = setTimeout(connect, 2000);
      };
    };

    connect();
    return () => {
      closed = true;
      clearTimeout(retry);
      if (socket && socket.readyState < 2) socket.close();
    };
  }, [workTrackDetailId]);

  const thread = [...notes].sort((a, b) => {
    const left = new Date(a.createdOn || 0).getTime();
    const right = new Date(b.createdOn || 0).getTime();
    if (left !== right) return left - right;
    return (a.id || 0) - (b.id || 0);
  });

  useEffect(() => {
    const pane = threadRef.current;
    if (!pane || !stickToBottomRef.current) return;
    pane.scrollTop = pane.scrollHeight;
  }, [notes, loading]);

  const currentUserId = Number(localStorage.getItem("userid"));

  const resetComposer = () => {
    setNoteText("");
    setStagedImages([]);
    setSaving(false);
  };

  const addStagedImage = (dataUrl) => {
    if (!dataUrl) return;
    if (stagedImages.length >= MAX_IMAGES) {
      toast("A note can have at most 5 images", { type: "warning" });
      return;
    }
    const approxBytes = Math.ceil((dataUrl.split(",")[1]?.length || 0) * 0.75);
    if (approxBytes > MAX_IMAGE_BYTES) {
      toast("Each image must be a JPG, PNG, or WEBP up to 5 MB", { type: "warning" });
      return;
    }
    setStagedImages((prev) => [
      ...prev,
      { key: `${Date.now()}-${prev.length}`, dataUrl },
    ]);
  };

  const handleFiles = async (fileList) => {
    const files = Array.from(fileList || []);
    if (files.length === 0) return;
    let added = 0;
    for (const file of files) {
      if (stagedImages.length + added >= MAX_IMAGES) {
        toast("A note can have at most 5 images", { type: "warning" });
        break;
      }
      const type = (file.type || "").toLowerCase();
      if (!ALLOWED_TYPES.includes(type) || file.size > MAX_IMAGE_BYTES) {
        toast("Each image must be a JPG, PNG, or WEBP up to 5 MB", { type: "warning" });
        continue;
      }
      try {
        const dataUrl = await readAsDataUrl(file);
        setStagedImages((prev) => {
          if (prev.length >= MAX_IMAGES) return prev;
          return [...prev, { key: `${file.name}-${Date.now()}-${prev.length}`, dataUrl }];
        });
        added += 1;
      } catch (error) {
        console.error("Error reading image:", error);
        toast("Failed to read image", { type: "error" });
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const saveNote = async () => {
    const text = noteText.trim();
    if (!text) {
      toast("Note text is required", { type: "warning" });
      return;
    }
    if (text.length > MAX_NOTE_LENGTH) {
      toast("Note text cannot exceed 2000 characters", { type: "warning" });
      return;
    }
    if (stagedImages.length > MAX_IMAGES) {
      toast("A note can have at most 5 images", { type: "warning" });
      return;
    }

    try {
      setSaving(true);
      const response = await fetch(`${BASE_URL}/WorkTrackDetail/AddTechnicianNote`, {
        method: "POST",
        headers: authHeaders(true),
        body: JSON.stringify({
          workTrackDetailId: Number(workTrackDetailId),
          noteText: text,
          imageDatas: stagedImages.map((image) => image.dataUrl),
        }),
      });
      const result = await response.json();
      if (result?.statusCode === 200) {
        const created = normalizeNote(result?.result || result?.data || result?.Result || result?.Data || {});
        if (created?.id) {
          setNotes((prev) => [...prev.filter((note) => note.id !== created.id), created]);
        } else {
          await loadNotes();
        }
        resetComposer();
        stickToBottomRef.current = true;
      } else {
        toast(result?.message || "Failed to add note", { type: "error" });
      }
    } catch (error) {
      console.error("Error adding note:", error);
      toast("Failed to add note", { type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      const response = await fetch(`${BASE_URL}/WorkTrackDetail/DeleteTechnicianNote`, {
        method: "POST",
        headers: authHeaders(true),
        body: JSON.stringify({ id: deleteTarget.id }),
      });
      const result = await response.json();
      if (result?.statusCode === 200) {
        setNotes((prev) => prev.filter((note) => note.id !== deleteTarget.id));
        setDeleteTarget(null);
        toast(result?.message || "Note deleted", { type: "success" });
      } else {
        toast(result?.message || "Failed to delete note", { type: "error" });
      }
    } catch (error) {
      console.error("Error deleting note:", error);
      toast("Failed to delete note", { type: "error" });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ pb: canAdd ? 1.5 : 2 }}>
          <Box display="flex" alignItems="center" gap={1} mb={1.5}>
            <Typography variant="h6">
              <StickyNote2Icon sx={{ mr: 1, verticalAlign: "middle" }} />
              {title}
            </Typography>
            <Chip label={thread.length} size="small" />
          </Box>

          <Box
            ref={threadRef}
            onScroll={() => {
              const pane = threadRef.current;
              if (!pane) return;
              stickToBottomRef.current = pane.scrollHeight - pane.scrollTop - pane.clientHeight < 80;
            }}
            sx={{
              height: isMobile ? 320 : 420,
              overflowY: "auto",
              px: 1.5,
              py: 1.5,
              borderRadius: 2,
              bgcolor: "#f4f6f8",
              border: "1px solid",
              borderColor: "divider",
              display: "flex",
              flexDirection: "column",
              gap: 1.25,
            }}
          >
            {loading ? (
              <Box display="flex" justifyContent="center" alignItems="center" flex={1}>
                <CircularProgress size={24} />
              </Box>
            ) : thread.length === 0 ? (
              <Box display="flex" alignItems="center" justifyContent="center" flex={1}>
                <Typography variant="body2" color="textSecondary" textAlign="center">
                  {canAdd ? "No messages yet. Send the first note below." : "No messages yet."}
                </Typography>
              </Box>
            ) : (
              thread.map((note) => {
                const mine = Number(note.createdByUserId) === currentUserId;
                const fromTechnician = assignedTechnicianId != null
                  && Number(note.createdByUserId) === Number(assignedTechnicianId);
                return (
                  <Box
                    key={note.id}
                    display="flex"
                    justifyContent={mine ? "flex-end" : "flex-start"}
                  >
                    <Box
                      sx={{
                        maxWidth: "78%",
                        px: 1.5,
                        py: 1,
                        borderRadius: 2,
                        bgcolor: mine ? "#1976d2" : "#ffffff",
                        color: mine ? "#ffffff" : "text.primary",
                        boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
                      }}
                    >
                      <Box display="flex" alignItems="center" gap={0.5} mb={0.25}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: mine ? "rgba(255,255,255,0.92)" : "text.secondary" }}>
                          {mine ? "You" : note.createdByName}
                        </Typography>
                        <Chip
                          label={fromTechnician ? "Technician" : "Admin"}
                          size="small"
                          sx={{
                            height: 18,
                            fontSize: 10,
                            bgcolor: mine ? "rgba(255,255,255,0.2)" : fromTechnician ? "#e3f2fd" : "#ede7f6",
                            color: mine ? "#fff" : "text.primary",
                          }}
                        />
                        {note.canDelete && (
                          <IconButton
                            size="small"
                            aria-label="Delete message"
                            onClick={() => setDeleteTarget(note)}
                            sx={{ ml: "auto", color: mine ? "#fff" : "text.secondary", p: 0.25 }}
                          >
                            <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        )}
                      </Box>
                      <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                        {note.noteText}
                      </Typography>
                      {Array.isArray(note.images) && note.images.length > 0 && (
                        <Box display="flex" flexWrap="wrap" gap={0.75} mt={0.75}>
                          {note.images.map((image) => (
                            <Box
                              key={image.id}
                              component="img"
                              src={image.imageUrl}
                              alt="Attachment"
                              onClick={() => setPreviewUrl(image.imageUrl)}
                              sx={{
                                width: 64,
                                height: 64,
                                objectFit: "cover",
                                borderRadius: 1,
                                cursor: "pointer",
                              }}
                            />
                          ))}
                        </Box>
                      )}
                      <Typography variant="caption" display="block" textAlign="right" sx={{ mt: 0.5, color: mine ? "rgba(255,255,255,0.8)" : "text.secondary" }}>
                        {formatDateWithTime(note.createdOn)}
                      </Typography>
                    </Box>
                  </Box>
                );
              })
            )}
          </Box>

          {canAdd && (
            <Box mt={1.5}>
              {stagedImages.length > 0 && (
                <Box display="flex" flexWrap="wrap" gap={1} mb={1}>
                  {stagedImages.map((image) => (
                    <Box key={image.key} sx={{ position: "relative" }}>
                      <Box
                        component="img"
                        src={image.dataUrl}
                        alt="Selected"
                        sx={{ width: 56, height: 56, objectFit: "cover", borderRadius: 1 }}
                      />
                      <IconButton
                        size="small"
                        aria-label="Remove image"
                        onClick={() => setStagedImages((prev) => prev.filter((item) => item.key !== image.key))}
                        sx={{ position: "absolute", top: -8, right: -8, bgcolor: "background.paper" }}
                      >
                        <CloseIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                    </Box>
                  ))}
                </Box>
              )}
              <Box display="flex" alignItems="flex-end" gap={0.5}>
                <TextField
                  fullWidth
                  size="small"
                  multiline
                  maxRows={4}
                  placeholder={placeholder}
                  value={noteText}
                  onChange={(event) => setNoteText(event.target.value.slice(0, MAX_NOTE_LENGTH))}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      if (!saving && noteText.trim()) saveNote();
                    }
                  }}
                />
                <IconButton aria-label="Camera" onClick={() => setCameraOpen(true)} disabled={saving || stagedImages.length >= MAX_IMAGES}>
                  <CameraAltIcon />
                </IconButton>
                <IconButton aria-label="Attach photo" onClick={() => fileInputRef.current?.click()} disabled={saving || stagedImages.length >= MAX_IMAGES}>
                  <ImageIcon />
                </IconButton>
                <IconButton
                  aria-label="Send"
                  color="primary"
                  onClick={saveNote}
                  disabled={saving || noteText.trim().length === 0}
                >
                  <SendIcon />
                </IconButton>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  hidden
                  onChange={(event) => handleFiles(event.target.files)}
                />
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>

      <CameraCaptureModal
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onCapture={(imageData) => {
          addStagedImage(imageData);
          setCameraOpen(false);
        }}
        title="Attach photo"
      />

      <Dialog open={Boolean(previewUrl)} onClose={() => setPreviewUrl(null)} maxWidth="md">
        <DialogContent sx={{ p: 1 }}>
          {previewUrl && (
            <Box component="img" src={previewUrl} alt="Note attachment" sx={{ maxWidth: "100%", maxHeight: "80vh", display: "block" }} />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deleteTarget)} onClose={() => !deleting && setDeleteTarget(null)}>
        <DialogTitle>Delete note</DialogTitle>
        <DialogContent>
          <Typography>Delete this note? It will be removed from the technician and office screens.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancel</Button>
          <Button color="error" variant="contained" onClick={confirmDelete} disabled={deleting}>
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
