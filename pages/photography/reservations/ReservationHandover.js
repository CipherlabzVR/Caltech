import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
} from "@mui/material";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import HistoryIcon from "@mui/icons-material/History";
import { toast } from "react-toastify";
import photographyReservationNoteService from "@/Services/photographyReservationNoteService";
import { getAgentTypes, isApiSuccess } from "@/Services/photographyAgentService";

const FALLBACK_TYPES = [
  { id: 1, name: "Customer Coordinator", sortOrder: 1, color: "info" },
  { id: 2, name: "Payment Handler", sortOrder: 2, color: "warning" },
  { id: 3, name: "After Wedding Manager", sortOrder: 3, color: "success" },
];

const colorForIndex = (i) => ["info", "warning", "success", "secondary", "primary"][i % 5];

export default function ReservationHandover({ reservation, onHandoverComplete, userAgentType }) {
  const [open, setOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [agentTypes, setAgentTypes] = useState(FALLBACK_TYPES);

  useEffect(() => {
    getAgentTypes()
      .then((data) => {
        if (!isApiSuccess(data)) return;
        const list = (data.result || data.Result || []).map((t, idx) => ({
          id: t.id ?? t.Id,
          name: t.name ?? t.Name,
          sortOrder: t.sortOrder ?? t.SortOrder ?? idx + 1,
          color: colorForIndex(idx),
        }));
        if (list.length) setAgentTypes(list);
      })
      .catch(() => {});
  }, []);

  const ordered = useMemo(
    () => [...agentTypes].sort((a, b) => (a.sortOrder - b.sortOrder) || (a.id - b.id)),
    [agentTypes]
  );

  const currentAgentType = reservation.currentAgentType || ordered[0]?.id || 1;
  const currentIdx = ordered.findIndex((t) => Number(t.id) === Number(currentAgentType));
  const nextType = currentIdx >= 0 && currentIdx < ordered.length - 1 ? ordered[currentIdx + 1] : null;
  const nextAgentType = nextType?.id ?? null;

  const getAgentTypeName = (type) =>
    ordered.find((t) => Number(t.id) === Number(type))?.name || "Unknown";
  const getAgentTypeColor = (type) =>
    ordered.find((t) => Number(t.id) === Number(type))?.color || "default";

  const canHandover = Number(userAgentType) === Number(currentAgentType) && nextAgentType !== null;

  const handleHandover = async () => {
    if (!nextAgentType) return;
    setLoading(true);
    try {
      const response = await photographyReservationNoteService.handoverReservation({
        reservationId: reservation.id,
        toAgentType: nextAgentType,
        notes: notes.trim() || null,
      });
      if (response?.statusCode === "SUCCESS" || response?.statusCode === 200) {
        toast.success(`Handed over to ${getAgentTypeName(nextAgentType)}`);
        setOpen(false);
        setNotes("");
        onHandoverComplete?.();
      } else {
        toast.error(response?.message || "Handover failed");
      }
    } catch (err) {
      toast.error("Handover failed");
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const response = await photographyReservationNoteService.getHandoverHistory(reservation.id);
      if (response?.result) {
        setHistory(response.result);
      }
    } catch {
      toast.error("Failed to load history");
    } finally {
      setHistoryLoading(false);
    }
  };

  return (
    <Box sx={{ mb: 1.5, p: 1.25, border: "1px solid", borderColor: "divider", borderRadius: 1 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
        <Typography variant="subtitle2" fontWeight={700}>
          Agent Handover
        </Typography>
        <Button
          size="small"
          startIcon={<HistoryIcon />}
          onClick={() => {
            setHistoryOpen(true);
            fetchHistory();
          }}
          sx={{ textTransform: "none" }}
        >
          History
        </Button>
      </Box>

      <Box display="flex" alignItems="center" gap={1} mb={1} flexWrap="wrap">
        <Typography variant="caption" color="text.secondary">
          Current:
        </Typography>
        <Chip
          size="small"
          label={getAgentTypeName(currentAgentType)}
          color={getAgentTypeColor(currentAgentType)}
        />
      </Box>

      {canHandover ? (
        <Button
          fullWidth
          variant="contained"
          size="small"
          startIcon={<SwapHorizIcon />}
          onClick={() => setOpen(true)}
          sx={{ textTransform: "none", bgcolor: "#7C3AED", "&:hover": { bgcolor: "#6D28D9" } }}
        >
          Handover to {getAgentTypeName(nextAgentType)}
        </Button>
      ) : nextAgentType == null ? (
        <Typography variant="caption" color="text.secondary">
          Final agent stage — no further handover
        </Typography>
      ) : (
        <Typography variant="caption" color="text.secondary">
          Only {getAgentTypeName(currentAgentType)} can handover
        </Typography>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Confirm Handover</DialogTitle>
        <DialogContent>
          <Box display="flex" alignItems="center" gap={1} my={1}>
            <Chip label={getAgentTypeName(currentAgentType)} color={getAgentTypeColor(currentAgentType)} />
            <SwapHorizIcon />
            <Chip label={getAgentTypeName(nextAgentType)} color={getAgentTypeColor(nextAgentType)} />
          </Box>
          <TextField
            fullWidth
            size="small"
            label="Notes (optional)"
            multiline
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleHandover} disabled={loading}>
            {loading ? <CircularProgress size={20} /> : "Confirm"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={historyOpen} onClose={() => setHistoryOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Handover History</DialogTitle>
        <DialogContent>
          {historyLoading ? (
            <Box display="flex" justifyContent="center" py={2}>
              <CircularProgress size={24} />
            </Box>
          ) : history.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No handover history
            </Typography>
          ) : (
            <List dense>
              {history.map((h, idx) => (
                <React.Fragment key={h.id || idx}>
                  {idx > 0 && <Divider />}
                  <ListItem alignItems="flex-start">
                    <ListItemText
                      primary={
                        <Box display="flex" gap={0.5} alignItems="center" flexWrap="wrap">
                          <Chip
                            size="small"
                            label={h.fromAgentTypeName || getAgentTypeName(h.fromAgentType)}
                            color={getAgentTypeColor(h.fromAgentType)}
                          />
                          <SwapHorizIcon fontSize="small" />
                          <Chip
                            size="small"
                            label={h.toAgentTypeName || getAgentTypeName(h.toAgentType)}
                            color={getAgentTypeColor(h.toAgentType)}
                          />
                        </Box>
                      }
                      secondary={
                        <>
                          {h.handoverByUserName || h.HandoverByUserName || ""}{" "}
                          {h.handoverDate || h.HandoverDate
                            ? `· ${new Date(h.handoverDate || h.HandoverDate).toLocaleString()}`
                            : ""}
                          {(h.notes || h.Notes) && (
                            <Typography variant="caption" display="block">
                              {h.notes || h.Notes}
                            </Typography>
                          )}
                        </>
                      }
                    />
                  </ListItem>
                </React.Fragment>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHistoryOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
