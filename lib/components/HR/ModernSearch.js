import React from "react";
import { TextField, InputAdornment, Box } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { styled, alpha } from "@mui/material/styles";

const StyledTextField = styled(TextField)(({ theme }) => ({
  "& .MuiOutlinedInput-root": {
    borderRadius: "12px",
    backgroundColor: alpha(theme.palette.background.paper, 0.8),
    transition: "all 0.3s ease",
    "& fieldset": {
      borderColor: alpha(theme.palette.divider, 0.2),
      borderWidth: "1px",
    },
    "&:hover fieldset": {
      borderColor: alpha(theme.palette.primary.main, 0.4),
    },
    "&.Mui-focused fieldset": {
      borderColor: theme.palette.primary.main,
      borderWidth: "2px",
    },
  },
  "& .MuiInputBase-input": {
    padding: "12px 16px",
    fontSize: "0.875rem",
  },
}));

const ModernSearch = ({ placeholder = "Search...", value, onChange, fullWidth = true, sx }) => {
  return (
    <Box sx={sx}>
      <StyledTextField
        fullWidth={fullWidth}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        variant="outlined"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon sx={{ color: "text.secondary", fontSize: "1.25rem" }} />
            </InputAdornment>
          ),
        }}
      />
    </Box>
  );
};

export default ModernSearch;

