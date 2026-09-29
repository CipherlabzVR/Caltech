import React from "react";
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Chip,
  alpha,
} from "@mui/material";
import { styled } from "@mui/material/styles";

const StyledFormControl = styled(FormControl)(({ theme }) => ({
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
  "& .MuiInputLabel-root": {
    fontSize: "0.875rem",
  },
  "& .MuiSelect-select": {
    padding: "12px 16px",
    fontSize: "0.875rem",
  },
}));

const ModernFilter = ({
  label,
  value,
  onChange,
  options = [],
  fullWidth = true,
  sx,
  multiple = false,
}) => {
  return (
    <StyledFormControl fullWidth={fullWidth} sx={sx}>
      <InputLabel>{label}</InputLabel>
      <Select
        value={value}
        label={label}
        onChange={onChange}
        multiple={multiple}
        renderValue={multiple ? (selected) => (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
            {selected.map((value) => {
              const option = options.find((opt) => opt.value === value);
              return (
                <Chip
                  key={value}
                  label={option?.label || value}
                  size="small"
                  sx={{
                    height: "24px",
                    fontSize: "0.75rem",
                  }}
                />
              );
            })}
          </Box>
        ) : undefined}
      >
        {options.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </Select>
    </StyledFormControl>
  );
};

export default ModernFilter;

