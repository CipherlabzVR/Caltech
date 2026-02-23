import { useState } from "react";
import {
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ChecklistOutlinedIcon from "@mui/icons-material/ChecklistOutlined";
import LabelIcon from "@mui/icons-material/Label";

const TaskChecklistDialog = ({
  open,
  onClose,
  task,
  onToggleItem,
  onAddItem,
  onDeleteItem,
  onRenameItem,
  projectLabels = [],
}) => {
  const [newItemTitle, setNewItemTitle] = useState("");
  const [newItemLabels, setNewItemLabels] = useState([]);
  const [itemError, setItemError] = useState("");

  const totalItems = task?.checklist?.length ?? 0;
  const completedItems =
    task?.checklist?.filter((item) => item.isCompleted).length ?? 0;
  const completionPercent =
    totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  const handleAddItem = async () => {
    const trimmed = newItemTitle.trim();
    setItemError("");
    
    if (!trimmed) {
      setItemError("Checklist item title is required");
      return;
    }
    
    if (trimmed.length < 2) {
      setItemError("Checklist item must be at least 2 characters");
      return;
    }
    
    if (trimmed.length > 500) {
      setItemError("Checklist item cannot exceed 500 characters");
      return;
    }
    
    try {
      await onAddItem?.(task.taskId, trimmed, newItemLabels);
      setNewItemTitle("");
      setNewItemLabels([]);
      setItemError("");
    } catch (err) {
      setItemError(err?.message ?? "Failed to add checklist item. Please try again.");
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 600 }}>
        Checklist • {task?.title ?? ""}
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={3}>
          <Box>
            <Stack direction="row" alignItems="center" spacing={1}>
              <ChecklistOutlinedIcon color="primary" fontSize="small" />
              <Typography variant="subtitle2">
                {completedItems}/{totalItems} items completed
              </Typography>
              <Chip
                size="small"
                label={`${completionPercent}%`}
                color={completionPercent === 100 ? "success" : "default"}
              />
            </Stack>
            {totalItems > 0 && (
              <LinearProgress
                variant="determinate"
                value={completionPercent}
                sx={{ mt: 1.5, height: 8, borderRadius: 999 }}
              />
            )}
          </Box>

          {task?.checklist?.length ? (
            <List dense sx={{ maxHeight: 320, overflowY: "auto" }}>
              {task.checklist.map((item) => (
                <ListItem
                  key={item.checklistItemId}
                  secondaryAction={
                    <IconButton
                      edge="end"
                      color="error"
                      onClick={() => onDeleteItem?.(item.checklistItemId)}
                    >
                      <DeleteOutlineIcon />
                    </IconButton>
                  }
                  sx={{ flexWrap: "wrap" }}
                >
                  <ListItemIcon>
                    <Checkbox
                      edge="start"
                      checked={item.isCompleted}
                      onChange={(event) =>
                        onToggleItem?.(item.checklistItemId, {
                          checklistItemId: parseInt(item.checklistItemId),
                          title: item.title,
                          isCompleted: event.target.checked,
                        })
                      }
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <TextField
                        variant="standard"
                        fullWidth
                        defaultValue={item.title}
                        onBlur={(event) => {
                          const value = event.target.value;
                          if (value !== item.title) {
                            onRenameItem?.(item.checklistItemId, {
                              title: value,
                              isCompleted: item.isCompleted,
                            });
                          }
                        }}
                      />
                    }
                  />
                  {Array.isArray(item.labels) && item.labels.length > 0 && (
                    <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ pl: 7, pt: 0.5, width: "100%" }}>
                      {item.labels.map((label) => (
                        <Chip
                          key={label.labelId ?? label.name}
                          icon={<LabelIcon sx={{ fontSize: 13 }} />}
                          label={label.name}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: "0.65rem",
                            fontWeight: 600,
                            bgcolor: label.color ?? "#6366F1",
                            color: "#fff",
                            "& .MuiChip-icon": { color: "rgba(255,255,255,0.8)" },
                          }}
                        />
                      ))}
                    </Stack>
                  )}
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Start building the checklist for this task to track progress.
            </Typography>
          )}

          <Stack spacing={1}>
            <Box
              sx={{
                display: "flex",
                gap: 1,
                alignItems: "center",
              }}
            >
              <TextField
                value={newItemTitle}
                onChange={(event) => {
                  setNewItemTitle(event.target.value);
                  if (itemError) setItemError("");
                }}
                placeholder="Add checklist item"
                fullWidth
                size="small"
                error={Boolean(itemError)}
                helperText={itemError}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    handleAddItem();
                  }
                }}
              />
              <Button variant="contained" onClick={handleAddItem} sx={{ whiteSpace: "nowrap" }}>
                Add
              </Button>
            </Box>
            <Autocomplete
              multiple
              freeSolo
              autoSelect
              clearOnBlur
              size="small"
              options={
                Array.isArray(projectLabels)
                  ? projectLabels
                      .map((l) => l.name)
                      .filter((n) => !newItemLabels.includes(n))
                  : []
              }
              value={newItemLabels}
              onChange={(_, newValue) => {
                const labelNames = newValue
                  .map((v) => (typeof v === "string" ? v.trim() : String(v).trim()))
                  .filter(Boolean);
                setNewItemLabels(labelNames);
              }}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    {...getTagProps({ index })}
                    key={index}
                    label={option}
                    size="small"
                    sx={{
                      height: 22,
                      bgcolor: "#6366F1",
                      color: "white",
                      "& .MuiChip-deleteIcon": { color: "rgba(255,255,255,0.7)" },
                    }}
                  />
                ))
              }
              renderInput={(params) => (
                <TextField {...params} label="Labels (optional)" placeholder="Type and press Enter" />
              )}
            />
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TaskChecklistDialog;

