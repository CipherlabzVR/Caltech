import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Checkbox,
  FormControlLabel,
  LinearProgress,
  IconButton,
  Button,
  TextField,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import BASE_URL from "Base/api";
import { toast } from "react-toastify";

export default function ProjectMasterScreens({ projectId, masterScreens = [], onMasterScreensChange, readOnly = false }) {
  const [localScreens, setLocalScreens] = useState(masterScreens || []);
  const [hideChecked, setHideChecked] = useState(false);
  const [newScreenName, setNewScreenName] = useState("");

  useEffect(() => {
    setLocalScreens(masterScreens || []);
  }, [masterScreens]);

  const completedCount = localScreens.filter((screen) => screen.isCompleted).length;
  const totalCount = localScreens.length;
  const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const visibleScreens = hideChecked ? localScreens.filter((s) => !s.isCompleted) : localScreens;

  const handleAddScreen = async () => {
    if (!newScreenName.trim()) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${BASE_URL}/Project/AddMasterScreen`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          projectId,
          screenName: newScreenName.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok && (data.status === "SUCCESS" || data.statusCode === 200)) {
        const newScreen = {
          id: data.result?.id || Date.now(),
          screenName: newScreenName.trim(),
          isCompleted: false,
          order: localScreens.length,
        };
        const updatedScreens = [...localScreens, newScreen];
        setLocalScreens(updatedScreens);
        onMasterScreensChange?.(updatedScreens);
        setNewScreenName("");
        toast.success("Master screen added");
      } else {
        toast.error(data.message || "Failed to add master screen");
      }
    } catch (error) {
      console.error("Error adding master screen:", error);
      toast.error("An error occurred while adding master screen");
    }
  };

  const handleToggleScreen = async (screenId, currentStatus) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${BASE_URL}/Project/ToggleMasterScreen`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          screenId,
          isCompleted: !currentStatus,
        }),
      });

      const data = await response.json();

      if (response.ok && (data.status === "SUCCESS" || data.statusCode === 200)) {
        const updatedScreens = localScreens.map((screen) =>
          screen.id === screenId
            ? {
                ...screen,
                isCompleted: !currentStatus,
                completedOn: !currentStatus ? new Date().toISOString() : null,
              }
            : screen
        );
        setLocalScreens(updatedScreens);
        onMasterScreensChange?.(updatedScreens);
      } else {
        toast.error(data.message || "Failed to update master screen");
      }
    } catch (error) {
      console.error("Error toggling master screen:", error);
      toast.error("An error occurred while updating master screen");
    }
  };

  const handleDeleteScreen = async (screenId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${BASE_URL}/Project/DeleteMasterScreen?screenId=${screenId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (response.ok && (data.status === "SUCCESS" || data.statusCode === 200)) {
        const updatedScreens = localScreens.filter((screen) => screen.id !== screenId);
        setLocalScreens(updatedScreens);
        onMasterScreensChange?.(updatedScreens);
        toast.success("Master screen deleted");
      } else {
        toast.error(data.message || "Failed to delete master screen");
      }
    } catch (error) {
      console.error("Error deleting master screen:", error);
      toast.error("An error occurred while deleting master screen");
    }
  };

  return (
    <Box>
      {/* Header with Progress */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, flex: 1 }}>
          <FormControlLabel
            control={<Checkbox checked={false} disabled />}
            label={
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Master Screens
              </Typography>
            }
          />
          <LinearProgress
            variant="determinate"
            value={completionPercentage}
            sx={{
              flex: 1,
              height: 8,
              borderRadius: 4,
              bgcolor: "#e0e0e0",
              "& .MuiLinearProgress-bar": {
                borderRadius: 4,
                bgcolor: completionPercentage === 100 ? "#4caf50" : "#2196f3",
              },
            }}
          />
          <Typography variant="body2" sx={{ minWidth: "50px", textAlign: "right", fontWeight: 600 }}>
            {completionPercentage}%
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            size="small"
            onClick={() => setHideChecked(!hideChecked)}
            sx={{ textTransform: "none" }}
          >
            {hideChecked ? "Show checked items" : "Hide checked items"}
          </Button>
          {!readOnly && (
            <IconButton
              size="small"
              onClick={() => {
                if (localScreens.length > 0) {
                  if (window.confirm("Delete all master screens?")) {
                    localScreens.forEach((screen) => handleDeleteScreen(screen.id));
                  }
                }
              }}
              disabled={localScreens.length === 0}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      </Box>

      {/* Add New Screen */}
      {!readOnly && (
        <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Add master screen..."
            value={newScreenName}
            onChange={(e) => setNewScreenName(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                handleAddScreen();
              }
            }}
          />
          <Button
            variant="contained"
            onClick={handleAddScreen}
            disabled={!newScreenName.trim() || !projectId}
            startIcon={<AddIcon />}
          >
            Add
          </Button>
        </Box>
      )}

      {/* Master Screens List */}
      {visibleScreens.length > 0 ? (
        <Box>
          {visibleScreens.map((screen) => (
            <Box
              key={screen.id}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                py: 1,
                borderBottom: "1px solid #e0e0e0",
              }}
            >
              <FormControlLabel
                control={
                  <Checkbox
                    checked={screen.isCompleted || false}
                    onChange={() => handleToggleScreen(screen.id, screen.isCompleted)}
                    disabled={readOnly || !projectId}
                    icon={<RadioButtonUncheckedIcon />}
                    checkedIcon={<CheckCircleIcon color="primary" />}
                  />
                }
                label={
                  <Typography
                    sx={{
                      textDecoration: screen.isCompleted ? "line-through" : "none",
                      color: screen.isCompleted ? "text.secondary" : "text.primary",
                      flex: 1,
                    }}
                  >
                    {screen.screenName}
                  </Typography>
                }
                sx={{ flex: 1, m: 0 }}
              />
              {!readOnly && (
                <IconButton
                  size="small"
                  onClick={() => handleDeleteScreen(screen.id)}
                  disabled={!projectId}
                  color="error"
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              )}
            </Box>
          ))}
        </Box>
      ) : (
        <Box
          sx={{
            textAlign: "center",
            py: 3,
            border: "2px dashed #ddd",
            borderRadius: 2,
            bgcolor: "#fafafa",
          }}
        >
          <Typography variant="body2" color="text.secondary">
            {hideChecked ? "All items are checked" : "No master screens yet"}
          </Typography>
        </Box>
      )}
    </Box>
  );
}

