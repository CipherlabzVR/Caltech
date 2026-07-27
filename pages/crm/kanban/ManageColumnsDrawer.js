import React from "react";
import Drawer from "@mui/material/Drawer";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Divider from "@mui/material/Divider";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import { toast } from "react-toastify";
import BASE_URL from "Base/api";

const DEFAULT_COLOR = "#1976d2";

const authHeaders = () => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export default function ManageColumnsDrawer({ open, onClose, onChanged }) {
  const [columns, setColumns] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState(null);

  const [newTitle, setNewTitle] = React.useState("");
  const [newColor, setNewColor] = React.useState(DEFAULT_COLOR);
  const [newIsWon, setNewIsWon] = React.useState(false);

  const [editingId, setEditingId] = React.useState(null);
  const [editTitle, setEditTitle] = React.useState("");
  const [editColor, setEditColor] = React.useState(DEFAULT_COLOR);
  const [editIsWon, setEditIsWon] = React.useState(false);

  const [deleteTarget, setDeleteTarget] = React.useState(null);
  const [wonReplaceConfirm, setWonReplaceConfirm] = React.useState(null);

  const currentWonColumn = React.useMemo(
    () => columns.find((c) => c.isWonColumn),
    [columns]
  );

  const fetchColumns = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${BASE_URL}/CRMKanbanColumn/GetAll`, {
        method: "GET",
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      const list = Array.isArray(data?.result) ? data.result : [];
      list.sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
      setColumns(list);
    } catch (err) {
      setError(err.message || "Failed to load columns");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (open) {
      fetchColumns();
    }
  }, [open, fetchColumns]);

  const performAdd = async () => {
    const title = newTitle.trim();
    try {
      setSaving(true);
      const res = await fetch(`${BASE_URL}/CRMKanbanColumn/Create`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          Title: title,
          Color: newColor,
          IsWonColumn: newIsWon,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || data?.statusCode !== 200) {
        throw new Error(data?.message || "Failed to create column");
      }
      toast.success("Column created.");
      setNewTitle("");
      setNewColor(DEFAULT_COLOR);
      setNewIsWon(false);
      await fetchColumns();
      onChanged?.();
    } catch (err) {
      toast.error(err.message || "Unable to create column");
    } finally {
      setSaving(false);
    }
  };

  const handleAdd = async () => {
    const title = newTitle.trim();
    if (!title) {
      toast.error("Column name is required.");
      return;
    }
    if (newIsWon && currentWonColumn) {
      setWonReplaceConfirm({ mode: "add", existingTitle: currentWonColumn.title });
      return;
    }
    await performAdd();
  };

  const startEdit = (col) => {
    setEditingId(col.id);
    setEditTitle(col.title);
    setEditColor(col.color || DEFAULT_COLOR);
    setEditIsWon(!!col.isWonColumn);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
    setEditColor(DEFAULT_COLOR);
    setEditIsWon(false);
  };

  const performEdit = async () => {
    const title = editTitle.trim();
    try {
      setSaving(true);
      const res = await fetch(`${BASE_URL}/CRMKanbanColumn/Update`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          Id: editingId,
          Title: title,
          Color: editColor,
          IsWonColumn: editIsWon,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || data?.statusCode !== 200) {
        throw new Error(data?.message || "Failed to update column");
      }
      toast.success("Column updated.");
      cancelEdit();
      await fetchColumns();
      onChanged?.();
    } catch (err) {
      toast.error(err.message || "Unable to update column");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEdit = async () => {
    const title = editTitle.trim();
    if (!title) {
      toast.error("Column name is required.");
      return;
    }
    if (
      editIsWon &&
      currentWonColumn &&
      currentWonColumn.id !== editingId
    ) {
      setWonReplaceConfirm({ mode: "edit", existingTitle: currentWonColumn.title });
      return;
    }
    await performEdit();
  };

  const confirmWonReplace = async () => {
    const mode = wonReplaceConfirm?.mode;
    setWonReplaceConfirm(null);
    if (mode === "add") await performAdd();
    else if (mode === "edit") await performEdit();
  };

  const cancelWonReplace = () => setWonReplaceConfirm(null);

  const persistOrder = async (ordered) => {
    try {
      setSaving(true);
      const payload = {
        Columns: ordered.map((col, index) => ({
          Id: col.id,
          DisplayOrder: index + 1,
        })),
      };
      const res = await fetch(`${BASE_URL}/CRMKanbanColumn/Reorder`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || data?.statusCode !== 200) {
        throw new Error(data?.message || "Failed to reorder columns");
      }
      onChanged?.();
    } catch (err) {
      toast.error(err.message || "Unable to reorder columns");
      await fetchColumns();
    } finally {
      setSaving(false);
    }
  };

  const moveColumn = (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= columns.length) return;
    const next = [...columns];
    const [removed] = next.splice(index, 1);
    next.splice(target, 0, removed);
    setColumns(next);
    persistOrder(next);
  };

  const requestDelete = (col) => setDeleteTarget(col);
  const cancelDelete = () => setDeleteTarget(null);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setSaving(true);
      const res = await fetch(
        `${BASE_URL}/CRMKanbanColumn/Delete?id=${deleteTarget.id}`,
        { method: "POST", headers: authHeaders() }
      );
      const data = await res.json().catch(() => null);
      if (!res.ok || data?.statusCode !== 200) {
        throw new Error(data?.message || "Failed to delete column");
      }
      toast.success("Column deleted.");
      setDeleteTarget(null);
      await fetchColumns();
      onChanged?.();
    } catch (err) {
      toast.error(err.message || "Unable to delete column");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Drawer anchor="right" open={open} onClose={onClose}>
        <Box sx={{ width: { xs: 320, sm: 400 }, p: 3 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
            <Typography variant="h6" fontWeight={600}>
              Manage Columns
            </Typography>
            <IconButton onClick={onClose} size="small">
              <CloseIcon fontSize="small" />
            </IconButton>
          </Stack>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Create, rename, reorder or remove the stages of your Kanban Board.
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <Typography variant="subtitle2" fontWeight={600} mb={1}>
            Add new column
          </Typography>
          <Stack spacing={1} mb={3}>
            <Stack direction="row" spacing={1} alignItems="center">
              <TextField
                size="small"
                fullWidth
                placeholder="Column name"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
              <input
                type="color"
                value={newColor}
                onChange={(e) => setNewColor(e.target.value)}
                style={{
                  width: 40,
                  height: 40,
                  border: "1px solid #c4c4c4",
                  borderRadius: 4,
                  background: "transparent",
                  cursor: "pointer",
                }}
                aria-label="Column color"
              />
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleAdd}
                disabled={saving}
              >
                Add
              </Button>
            </Stack>
            <FormControlLabel
              control={
                <Checkbox
                  checked={newIsWon}
                  onChange={(e) => setNewIsWon(e.target.checked)}
                  size="small"
                />
              }
              label={
                <Typography variant="body2">
                  Mark as <strong>Won</strong> column (closing stage)
                </Typography>
              }
            />
          </Stack>

          <Typography variant="subtitle2" fontWeight={600} mb={1}>
            Existing columns
          </Typography>

          {loading ? (
            <Box display="flex" justifyContent="center" py={3}>
              <CircularProgress size={24} />
            </Box>
          ) : error ? (
            <Typography color="error">{error}</Typography>
          ) : columns.length === 0 ? (
            <Typography color="text.secondary">No columns yet.</Typography>
          ) : (
            <Stack spacing={1}>
              {columns.map((col, index) => {
                const isEditing = editingId === col.id;
                const hasLeads = (col.leadCount ?? 0) > 0;
                return (
                  <Box
                    key={col.id}
                    sx={{
                      p: 1.5,
                      border: "1px solid",
                      borderColor: "divider",
                      borderRadius: 2,
                      backgroundColor: "background.paper",
                    }}
                  >
                    {isEditing ? (
                      <Stack spacing={1}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <TextField
                            size="small"
                            fullWidth
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                          />
                          <input
                            type="color"
                            value={editColor}
                            onChange={(e) => setEditColor(e.target.value)}
                            style={{
                              width: 36,
                              height: 36,
                              border: "1px solid #c4c4c4",
                              borderRadius: 4,
                              cursor: "pointer",
                            }}
                            aria-label="Edit column color"
                          />
                          <Tooltip title="Save">
                            <span>
                              <IconButton color="primary" onClick={handleSaveEdit} disabled={saving}>
                                <CheckIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                          <Tooltip title="Cancel">
                            <IconButton onClick={cancelEdit}>
                              <CloseIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={editIsWon}
                              onChange={(e) => setEditIsWon(e.target.checked)}
                              size="small"
                            />
                          }
                          label={
                            <Typography variant="body2">
                              Mark as <strong>Won</strong> column
                            </Typography>
                          }
                        />
                      </Stack>
                    ) : (
                      <Stack direction="row" spacing={1} alignItems="flex-start">
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            borderRadius: "50%",
                            backgroundColor: col.color || "#9e9e9e",
                            flexShrink: 0,
                            mt: 0.75,
                          }}
                        />
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="body2" fontWeight={600}>
                            {col.title}
                          </Typography>
                          <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                            flexWrap="wrap"
                            useFlexGap
                            mt={0.5}
                          >
                            <Chip
                              size="small"
                              variant="outlined"
                              label={`${col.leadCount ?? 0} lead${(col.leadCount ?? 0) === 1 ? "" : "s"}`}
                            />
                            {col.legacyStatus != null && (
                              <Chip size="small" variant="outlined" color="info" label="System default" />
                            )}
                            {col.isWonColumn && (
                              <Chip
                                size="small"
                                color="success"
                                icon={<EmojiEventsIcon style={{ fontSize: 14 }} />}
                                label="Won"
                              />
                            )}
                          </Stack>
                        </Box>
                        <Stack
                          direction="row"
                          spacing={0}
                          flexShrink={0}
                          alignItems="center"
                          sx={{ ml: 0.5 }}
                        >
                          <Tooltip title="Move up">
                            <span>
                              <IconButton
                                size="small"
                                onClick={() => moveColumn(index, -1)}
                                disabled={index === 0 || saving}
                              >
                                <ArrowUpwardIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                          <Tooltip title="Move down">
                            <span>
                              <IconButton
                                size="small"
                                onClick={() => moveColumn(index, 1)}
                                disabled={index === columns.length - 1 || saving}
                              >
                                <ArrowDownwardIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                          <Tooltip title="Rename">
                            <span>
                              <IconButton size="small" onClick={() => startEdit(col)}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                          <Tooltip
                            title={hasLeads ? "Move all leads out before deleting" : "Delete"}
                          >
                            <span>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => requestDelete(col)}
                                disabled={hasLeads || saving}
                              >
                                <DeleteOutlineIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </Stack>
                      </Stack>
                    )}
                  </Box>
                );
              })}
            </Stack>
          )}
        </Box>
      </Drawer>

      <Dialog open={!!wonReplaceConfirm} onClose={cancelWonReplace} maxWidth="xs" fullWidth>
        <DialogTitle>Replace Won Column</DialogTitle>
        <DialogContent dividers>
          <DialogContentText>
            <strong>{wonReplaceConfirm?.existingTitle}</strong> is currently marked as the
            Won column. Only one Won column can exist on the board. Do you want to make
            this column the new Won column instead?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelWonReplace} color="inherit" disabled={saving}>
            Cancel
          </Button>
          <Button onClick={confirmWonReplace} color="primary" variant="contained" disabled={saving}>
            Yes, replace
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!deleteTarget} onClose={cancelDelete} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Column</DialogTitle>
        <DialogContent dividers>
          <DialogContentText>
            Are you sure you want to delete <strong>{deleteTarget?.title}</strong>?
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelDelete} color="inherit" disabled={saving}>
            Cancel
          </Button>
          <Button onClick={confirmDelete} color="error" variant="contained" disabled={saving}>
            {saving ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
