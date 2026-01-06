import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Typography,
  TextField,
  IconButton,
  Checkbox,
  FormControlLabel,
  LinearProgress,
  Paper,
  Divider,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import BASE_URL from "Base/api";
import { toast } from "react-toastify";

export default function TicketChecklist({ ticketId, checklist = [], onChecklistChange, readOnly = false }) {
  const [localChecklist, setLocalChecklist] = useState(checklist || []);
  const [newItem, setNewItem] = useState("");

  useEffect(() => {
    setLocalChecklist(checklist || []);
  }, [checklist]);

  const completedCount = localChecklist.filter((item) => item.isCompleted).length;
  const totalCount = localChecklist.length;
  const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleAddItem = async () => {
    if (!newItem.trim()) return;
    if (!ticketId) {
      toast.error("Ticket ID is missing");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Authentication token is missing. Please log in again.");
        return;
      }

      const requestBody = {
        ticketId,
        item: newItem.trim(),
      };

      console.log("Adding checklist item:", requestBody);
      console.log("API URL:", `${BASE_URL}/HelpDesk/AddChecklistItem`);

      const response = await fetch(`${BASE_URL}/HelpDesk/AddChecklistItem`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      console.log("Response status:", response.status);
      console.log("Response headers:", response.headers);

      // Read response as text first to handle empty or malformed responses
      const responseText = await response.text();
      console.log("Response text:", responseText);
      
      let data;
      
      try {
        data = responseText ? JSON.parse(responseText) : {};
        console.log("Parsed response data:", data);
      } catch (parseError) {
        console.error("Failed to parse JSON response:", parseError);
        console.error("Response text:", responseText);
        toast.error("Invalid response from server. Please try again.");
        return;
      }

      if (response.ok) {
        // Check for success in various response formats
        // Backend uses StatusCode (ResponseStatus enum: SUCCESS=200, FAILED=-99)
        // When serialized, it might be an integer (200 or -99) or string ("SUCCESS" or "FAILED")
        const isSuccess = data.statusCode === 200 || // ResponseStatus.SUCCESS = 200
                         data.statusCode === "SUCCESS" ||
                         data.status === "SUCCESS" || 
                         data.status === 200 ||
                         response.status === 200 ||
                         (data.result !== undefined && data.result !== null);
        
        if (isSuccess) {
          const newItemData = {
            id: data.result?.id || data.result || Date.now(),
            item: newItem.trim(),
            isCompleted: false,
            order: localChecklist.length,
          };
          const updatedChecklist = [...localChecklist, newItemData];
          setLocalChecklist(updatedChecklist);
          onChecklistChange?.(updatedChecklist);
          setNewItem("");
          toast.success("Checklist item added");
        } else {
          // If response is OK but status indicates failure
          const errorMessage = data.message || data.error || "Failed to add checklist item";
          console.error("API returned error:", data);
          toast.error(errorMessage);
        }
      } else {
        // HTTP error response - check if data is an object with message property
        let errorMessage = `Server error (${response.status}). Please try again.`;
        if (data && typeof data === 'object') {
          errorMessage = data.message || data.error || errorMessage;
        } else if (typeof data === 'string') {
          errorMessage = data;
        }
        console.error("HTTP error:", response.status, data);
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error("Error adding checklist item:", error);
      const errorMessage = error.message || "An error occurred while adding checklist item. Please check your connection and try again.";
      toast.error(errorMessage);
    }
  };

  const handleToggleItem = async (itemId, currentStatus) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${BASE_URL}/HelpDesk/ToggleChecklistItem`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          itemId,
          isCompleted: !currentStatus,
        }),
      });

      const data = await response.json();

      if (response.ok && (data.status === "SUCCESS" || data.statusCode === 200)) {
        const updatedChecklist = localChecklist.map((item) =>
          item.id === itemId
            ? {
                ...item,
                isCompleted: !currentStatus,
                completedOn: !currentStatus ? new Date().toISOString() : null,
              }
            : item
        );
        setLocalChecklist(updatedChecklist);
        onChecklistChange?.(updatedChecklist);
      } else {
        toast.error(data.message || "Failed to update checklist item");
      }
    } catch (error) {
      console.error("Error toggling checklist item:", error);
      toast.error("An error occurred while updating checklist item");
    }
  };

  const handleDeleteItem = async (itemId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${BASE_URL}/HelpDesk/DeleteChecklistItem?itemId=${itemId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (response.ok && (data.status === "SUCCESS" || data.statusCode === 200)) {
        const updatedChecklist = localChecklist.filter((item) => item.id !== itemId);
        setLocalChecklist(updatedChecklist);
        onChecklistChange?.(updatedChecklist);
        toast.success("Checklist item deleted");
      } else {
        toast.error(data.message || "Failed to delete checklist item");
      }
    } catch (error) {
      console.error("Error deleting checklist item:", error);
      toast.error("An error occurred while deleting checklist item");
    }
  };

  return (
    <Box>
      {/* Progress Bar */}
      {totalCount > 0 && (
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Checklist Progress
            </Typography>
            <Typography variant="body2" fontWeight="bold" color="primary">
              {completedCount} / {totalCount} ({completionPercentage}%)
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={completionPercentage}
            sx={{
              height: 8,
              borderRadius: 4,
              bgcolor: "#e0e0e0",
              "& .MuiLinearProgress-bar": {
                borderRadius: 4,
                bgcolor: completionPercentage === 100 ? "#4caf50" : "#2196f3",
              },
            }}
          />
        </Box>
      )}

      {/* Add New Item */}
      {!readOnly && (
        <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Add checklist item..."
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                handleAddItem();
              }
            }}
          />
          <Button
            variant="contained"
            onClick={handleAddItem}
            disabled={!newItem.trim() || !ticketId}
            startIcon={<AddIcon />}
          >
            Add
          </Button>
        </Box>
      )}

      {/* Checklist Items */}
      {localChecklist.length > 0 ? (
        <Paper variant="outlined" sx={{ p: 2 }}>
          {localChecklist.map((item, index) => (
            <Box key={item.id}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 1,
                  py: 1,
                }}
              >
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={item.isCompleted || false}
                      onChange={() => handleToggleItem(item.id, item.isCompleted)}
                      disabled={readOnly || !ticketId}
                      icon={<RadioButtonUncheckedIcon />}
                      checkedIcon={<CheckCircleIcon color="primary" />}
                    />
                  }
                  label={
                    <Typography
                      sx={{
                        textDecoration: item.isCompleted ? "line-through" : "none",
                        color: item.isCompleted ? "text.secondary" : "text.primary",
                        flex: 1,
                      }}
                    >
                      {item.item}
                    </Typography>
                  }
                  sx={{ flex: 1, m: 0 }}
                />
                {!readOnly && (
                  <IconButton
                    size="small"
                    onClick={() => handleDeleteItem(item.id)}
                    disabled={!ticketId}
                    color="error"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                )}
              </Box>
              {index < localChecklist.length - 1 && <Divider sx={{ my: 0.5 }} />}
            </Box>
          ))}
        </Paper>
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
            No checklist items yet
          </Typography>
        </Box>
      )}
    </Box>
  );
}

