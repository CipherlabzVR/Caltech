import React, { useState, useRef, useEffect } from "react";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { fetchReportFilterOptions, DEBOUNCE_MS } from "./reportFilterOptionsApi";
import { withAllOption } from "./autocompleteTopMatches";

const normalizeKeyword = (value) => {
  const text = (value || "").trim();
  if (!text || text.toLowerCase() === "all") return "";
  return text;
};

export default function ReportFilterSelect({
  filterType,
  extraParams = {},
  value,
  selectedLabel = "",
  onChange,
  allowAll = true,
  label,
  placeholder = "Type to search...",
  disabled,
  required,
  getOptionLabel = (opt) => (opt && opt.label) || "",
  isOptionEqualToValue = (opt, val) => opt && val && opt.id === val.id,
}) {
  const [options, setOptions] = useState(allowAll ? [{ id: 0, label: "All" }] : []);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState(allowAll ? "All" : "");
  const [open, setOpen] = useState(false);
  const debounceRef = useRef(null);
  const requestIdRef = useRef(0);

  const allOption = { id: 0, label: "All" };

  const displayValue =
    value != null && value !== "" && value !== 0
      ? options.find((o) => o.id === value) || {
          id: value,
          label: selectedLabel || String(value),
        }
      : allowAll
        ? allOption
        : null;

  const fetchOptions = (keyword) => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    fetchReportFilterOptions(filterType, normalizeKeyword(keyword), extraParams).then((list) => {
      if (requestId !== requestIdRef.current) return;
      const withAll = allowAll ? withAllOption(list, true) : list;
      setOptions(withAll);
      setLoading(false);
    });
  };

  useEffect(() => {
    if (!open) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchOptions(inputValue), DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [inputValue, open, filterType, JSON.stringify(extraParams)]);

  useEffect(() => {
    if (!open) {
      const nextLabel = displayValue ? getOptionLabel(displayValue) : "";
      setInputValue(nextLabel);
    }
  }, [open, value, selectedLabel]);

  return (
    <div style={{ width: "100%" }}>
      {label ? (
        <Typography sx={{ fontWeight: "500", fontSize: "14px", mb: "12px" }}>
          {label}
        </Typography>
      ) : null}
      <Autocomplete
        fullWidth
        size="small"
        disabled={disabled}
        open={open}
        onOpen={() => {
          setOpen(true);
          fetchOptions(inputValue);
        }}
        onClose={() => {
          setOpen(false);
        }}
        options={options}
        value={displayValue}
        inputValue={inputValue}
        onInputChange={(_, newInputValue, reason) => {
          if (reason === "reset") return;
          setInputValue(newInputValue);
        }}
        loading={loading}
        onChange={(_, opt) => {
          const id = opt?.id ?? (allowAll ? 0 : null);
          const nextLabel = opt ? getOptionLabel(opt) : allowAll ? "All" : "";
          onChange(id, nextLabel);
          setInputValue(nextLabel);
        }}
        getOptionLabel={getOptionLabel}
        isOptionEqualToValue={isOptionEqualToValue}
        filterOptions={(opts) => opts}
        noOptionsText={loading ? "Loading..." : "No options found"}
        renderInput={(params) => (
          <TextField {...params} placeholder={placeholder} required={required} />
        )}
      />
    </div>
  );
}
