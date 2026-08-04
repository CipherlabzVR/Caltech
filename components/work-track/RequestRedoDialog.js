import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
} from "@mui/material";

/**
 * Manager dialog to request a technician redo a checklist item.
 * Requires a non-empty reason.
 */
export default function RequestRedoDialog({
  open,
  onClose,
  onConfirm,
  itemTitle = "",
  submitting = false,
}) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setReason("");
      setError("");
    }
  }, [open]);

  const handleConfirm = () => {
    const trimmed = reason.trim();
    if (!trimmed) {
      setError("Please enter a reason for the redo request.");
      return;
    }
    onConfirm?.(trimmed);
  };

  return (
    <Dialog open={open} onClose={submitting ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Request Redo</DialogTitle>
      <DialogContent>
        {itemTitle ? (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Item: <strong>{itemTitle}</strong>
          </Typography>
        ) : null}
        <Typography variant="body2" sx={{ mb: 1.5 }}>
          The technician will be asked to re-submit this item. The previous answer and any photos
          will be kept in history so you can still review them.
        </Typography>
        <TextField
          autoFocus
          fullWidth
          multiline
          minRows={3}
          label="Reason for redo"
          placeholder="Explain what needs to be fixed or re-captured..."
          value={reason}
          onChange={(e) => {
            setReason(e.target.value);
            if (error) setError("");
          }}
          error={Boolean(error)}
          helperText={error || "Required — shown to the technician"}
          disabled={submitting}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button variant="contained" color="warning" onClick={handleConfirm} disabled={submitting}>
          {submitting ? "Sending..." : "Request Redo"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
