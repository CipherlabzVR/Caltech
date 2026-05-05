import React, { useState, useRef, useEffect } from "react";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import { fetchReportFilterOptions, DEBOUNCE_MS } from "./reportFilterOptionsApi";
import { withAllOption } from "./autocompleteTopMatches";

export default function ReportFilterSelect({
  filterType,
  extraParams = {},
  value,
  onChange,
  allowAll = true,
  label,
  placeholder = "Type to search...",
  gridSize = { xs: 12, lg: 12 },
  disabled,
  required,
  getOptionLabel = (opt) => (opt && opt.label) || "",
  isOptionEqualToValue = (opt, val) => opt && val && opt.id === val.id,
}) {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [open, setOpen] = useState(false);
  const debounceRef = useRef(null);

  const displayValue = value != null && value !== "" && value !== 0
    ? (options.find((o) => o.id === value) || { id: value, label: String(value) })
    : allowAll
      ? { id: 0, label: "All" }
      : null;

  const fetchOptions = (keyword) => {
    setLoading(true);
    fetchReportFilterOptions(filterType, keyword, extraParams).then((list) => {
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
  }, [open, value]);

  return (
    <Autocomplete
      fullWidth
      size="small"
      disabled={disabled}
      open={open}
      onOpen={() => {
        setOpen(true);
        if (options.length === 0) fetchOptions("");
      }}
      onClose={() => {
        setOpen(false);
      }}
      options={options}
      value={displayValue}
      inputValue={inputValue}
      onInputChange={(_, newInputValue) => setInputValue(newInputValue)}
      loading={loading}
      onChange={(_, opt) => {
        const id = opt?.id ?? (allowAll ? 0 : null);
        onChange(id);
        setInputValue(opt ? getOptionLabel(opt) : "");
      }}
      getOptionLabel={getOptionLabel}
      isOptionEqualToValue={isOptionEqualToValue}
      filterOptions={(opts) => opts}
      noOptionsText={loading ? "Loading..." : "Type to search"}
      renderInput={(params) => (
        <TextField {...params} label={label} placeholder={placeholder} required={required} />
      )}
    />
  );
}
