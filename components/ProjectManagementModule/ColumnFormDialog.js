import { useEffect, useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@mui/material";

const ColumnFormDialog = ({
  open,
  mode = "create",
  initialValues,
  onClose,
  onSubmit,
}) => {
  const [name, setName] = useState(initialValues?.name ?? "");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setName(
        initialValues?.name ??
          initialValues?.title ??
          initialValues?.displayName ??
          ""
      );
      setError("");
      setSubmitting(false);
    }
  }, [open, initialValues]);

  const handleSubmit = async () => {
    const trimmed = name.trim();
    
    // Clear previous error
    setError("");
    
    // Validation
    if (!trimmed) {
      setError("Column name is required");
      return;
    }
    
    if (trimmed.length < 2) {
      setError("Column name must be at least 2 characters");
      return;
    }
    
    if (trimmed.length > 100) {
      setError("Column name cannot exceed 100 characters");
      return;
    }

    if (!onSubmit) return;

    try {
      setSubmitting(true);
      await onSubmit({ name: trimmed });
    } catch (err) {
      setError(err?.message ?? "Failed to save column. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 600 }}>
        {mode === "edit" ? "Rename Column" : "Add Column"}
      </DialogTitle>
      <DialogContent dividers>
        <TextField
          label="Column Name"
          fullWidth
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            if (error) setError("");
          }}
          error={Boolean(error)}
          helperText={error}
          autoFocus
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} color="inherit" disabled={submitting}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? "Saving..." : mode === "edit" ? "Save" : "Create"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ColumnFormDialog;


