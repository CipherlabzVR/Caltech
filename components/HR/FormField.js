import React from "react";
import {
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Grid,
  Box,
  Typography,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";

const FormField = ({
  name,
  label,
  value,
  onChange,
  type = "text",
  required = false,
  error = false,
  helperText = "",
  options = [],
  multiline = false,
  rows = 4,
  disabled = false,
  fullWidth = true,
  xs = 12,
  sm = 6,
  md = 6,
  dateFormat = "yyyy-MM-dd",
  ...otherProps
}) => {
  const handleChange = (event) => {
    if (onChange) {
      onChange({
        target: {
          name,
          value: event.target?.value ?? event,
        },
      });
    }
  };

  const renderField = () => {
    switch (type) {
      case "select":
        return (
          <FormControl fullWidth error={error} required={required}>
            <InputLabel>{label}</InputLabel>
            <Select
              name={name}
              value={value || ""}
              onChange={handleChange}
              label={label}
              disabled={disabled}
              {...otherProps}
            >
              {options.map((option) => (
                <MenuItem
                  key={option.value ?? option}
                  value={option.value ?? option}
                >
                  {option.label ?? option}
                </MenuItem>
              ))}
            </Select>
            {helperText && <FormHelperText>{helperText}</FormHelperText>}
          </FormControl>
        );

      case "date":
        return (
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label={label}
              value={value ? dayjs(value) : null}
              onChange={(newValue) => {
                if (onChange) {
                  const dateValue = newValue 
                    ? newValue.format('YYYY-MM-DD')
                    : "";
                  onChange({
                    target: {
                      name,
                      value: dateValue,
                    },
                  });
                }
              }}
              disabled={disabled}
              renderInput={(params) => (
                <TextField
                  {...params}
                  fullWidth
                  required={required}
                  error={error}
                  helperText={helperText}
                  {...otherProps}
                />
              )}
            />
          </LocalizationProvider>
        );

      case "datetime-local":
        return (
          <TextField
            name={name}
            label={label}
            type="datetime-local"
            value={value ?? ""}
            onChange={handleChange}
            required={required}
            error={error}
            helperText={helperText}
            disabled={disabled}
            fullWidth
            InputLabelProps={{
              shrink: true,
            }}
            {...otherProps}
          />
        );

      case "number":
        return (
          <TextField
            name={name}
            label={label}
            type="number"
            value={value ?? ""}
            onChange={handleChange}
            required={required}
            error={error}
            helperText={helperText}
            disabled={disabled}
            fullWidth
            {...otherProps}
          />
        );

      case "textarea":
        return (
          <TextField
            name={name}
            label={label}
            value={value ?? ""}
            onChange={handleChange}
            required={required}
            error={error}
            helperText={helperText}
            disabled={disabled}
            fullWidth
            multiline
            rows={rows}
            {...otherProps}
          />
        );

      default:
        return (
          <TextField
            name={name}
            label={label}
            type={type}
            value={value ?? ""}
            onChange={handleChange}
            required={required}
            error={error}
            helperText={helperText}
            disabled={disabled}
            fullWidth
            {...otherProps}
          />
        );
    }
  };

  return (
    <Grid item xs={xs} sm={sm} md={md}>
      {renderField()}
    </Grid>
  );
};

export default FormField;

