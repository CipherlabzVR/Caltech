import { useEffect, useState } from "react";
import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Stack,
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
  const [isStartColumn, setIsStartColumn] = useState(Boolean(initialValues?.isStartColumn ?? initialValues?.IsStartColumn));
  const [isEndColumn, setIsEndColumn] = useState(Boolean(initialValues?.isEndColumn ?? initialValues?.IsEndColumn));
  const [isHoldColumn, setIsHoldColumn] = useState(Boolean(initialValues?.isHoldColumn ?? initialValues?.IsHoldColumn));
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
      setIsStartColumn(Boolean(initialValues?.isStartColumn ?? initialValues?.IsStartColumn));
      setIsEndColumn(Boolean(initialValues?.isEndColumn ?? initialValues?.IsEndColumn));
      setIsHoldColumn(Boolean(initialValues?.isHoldColumn ?? initialValues?.IsHoldColumn));
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

    if (isStartColumn && isEndColumn) {
      setError("A column cannot be both Start and End");
      return;
    }

    if (isHoldColumn && (isStartColumn || isEndColumn)) {
      setError("A column cannot be Hold and Start/End at the same time");
      return;
    }

    if (!onSubmit) return;

    try {
      setSubmitting(true);
      await onSubmit({ name: trimmed, isStartColumn, isEndColumn, isHoldColumn });
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
        <Stack spacing={1.5}>
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

          <FormControlLabel
            control={
              <Checkbox
                checked={isStartColumn}
                onChange={(event) => {
                  const checked = event.target.checked;
                  setIsStartColumn(checked);
                  if (checked) {
                    setIsEndColumn(false);
                    setIsHoldColumn(false);
                  }
                  if (error) setError("");
                }}
              />
            }
            label="Start column (starts actual time tracking)"
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={isEndColumn}
                onChange={(event) => {
                  const checked = event.target.checked;
                  setIsEndColumn(checked);
                  if (checked) {
                    setIsStartColumn(false);
                    setIsHoldColumn(false);
                  }
                  if (error) setError("");
                }}
              />
            }
            label="End column (ends task + stops time tracking)"
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={isHoldColumn}
                onChange={(event) => {
                  const checked = event.target.checked;
                  setIsHoldColumn(checked);
                  if (checked) {
                    setIsStartColumn(false);
                    setIsEndColumn(false);
                  }
                  if (error) setError("");
                }}
              />
            }
            label="Hold column (pauses time tracking)"
          />
        </Stack>
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


