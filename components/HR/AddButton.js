import React from "react";
import { Button, Box } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { styled, alpha } from "@mui/material/styles";

const StyledButton = styled(Button)(({ theme }) => ({
  borderRadius: "12px",
  textTransform: "none",
  fontWeight: 600,
  padding: "10px 24px",
  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  "&:hover": {
    transform: "translateY(-2px)",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
  },
}));

const AddButton = ({ onClick, label = "Add New", variant = "contained", color = "primary", sx, startIcon }) => {
  return (
    <StyledButton
      variant={variant}
      color={color}
      onClick={onClick}
      startIcon={startIcon || <AddIcon />}
      sx={sx}
    >
      {label}
    </StyledButton>
  );
};

export default AddButton;

