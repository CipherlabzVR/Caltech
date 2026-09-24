import React from "react";
import { IconButton, Tooltip, Box } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { styled, alpha } from "@mui/material/styles";

const StyledIconButton = styled(IconButton)(({ theme, color }) => ({
  padding: "8px",
  transition: "all 0.2s ease",
  "&:hover": {
    backgroundColor: alpha(theme.palette[color || "primary"].main, 0.1),
    transform: "scale(1.1)",
  },
}));

const ActionButtons = ({ 
  onEdit, 
  onDelete, 
  onView, 
  editTooltip = "Edit", 
  deleteTooltip = "Delete",
  viewTooltip = "View",
  showEdit = true,
  showDelete = true,
  showView = false,
}) => {
  return (
    <Box display="flex" gap={0.5} alignItems="center">
      {showView && onView && (
        <Tooltip title={viewTooltip}>
          <StyledIconButton 
            color="info" 
            size="small" 
            onClick={onView}
          >
            <VisibilityIcon fontSize="small" />
          </StyledIconButton>
        </Tooltip>
      )}
      {showEdit && onEdit && (
        <Tooltip title={editTooltip}>
          <StyledIconButton 
            color="primary" 
            size="small" 
            onClick={onEdit}
          >
            <EditIcon fontSize="small" />
          </StyledIconButton>
        </Tooltip>
      )}
      {showDelete && onDelete && (
        <Tooltip title={deleteTooltip}>
          <StyledIconButton 
            color="error" 
            size="small" 
            onClick={onDelete}
          >
            <DeleteIcon fontSize="small" />
          </StyledIconButton>
        </Tooltip>
      )}
    </Box>
  );
};

export default ActionButtons;

