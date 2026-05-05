import React, { useState, useRef, useEffect } from "react";
import { TextField, Paper, List, ListItem, ListItemText, Typography } from "@mui/material";
import { fetchReportFilterOptions } from "./reportFilterOptionsApi";
import { withAllOption } from "./autocompleteTopMatches";

const DEBOUNCE_MS = 500;

export default function ReportSearchField({
  filterType,
  extraParams = {},
  value,
  onChange,
  allowAll = true,
  label = "",
  placeholder = "Type to search...",
  required = false,
  disabled = false,
}) {
  const [searchValue, setSearchValue] = useState("");
  const [results, setResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (value == null || value === "" || (value === 0 && !allowAll)) {
      setSearchValue("");
    } else if (value === 0 && allowAll) {
      setSearchValue("All");
    }
  }, [value, allowAll]);

  const handleSearch = async (keyword) => {
    const list = await fetchReportFilterOptions(filterType, keyword, extraParams);
    const withAll = allowAll ? withAllOption(list, true) : list;
    setResults(withAll);
    setShowDropdown(true);
    setHighlightedIndex(-1);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchValue(value);
    clearTimeout(debounceRef.current);

    if (value.trim() === "") {
      setShowDropdown(false);
      setResults([]);
      if (allowAll) {
        onChange(0);
      }
      return;
    }

    debounceRef.current = setTimeout(() => {
      handleSearch(value);
    }, DEBOUNCE_MS);
  };

  const handleItemSelect = (option) => {
    const id = option?.id ?? (allowAll ? 0 : null);
    setSearchValue(option?.label ?? "");
    setShowDropdown(false);
    setResults([]);
    onChange(id);
  };

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev - 1 + results.length) % results.length);
    } else if (e.key === "Enter" && highlightedIndex >= 0 && results[highlightedIndex]) {
      e.preventDefault();
      handleItemSelect(results[highlightedIndex]);
    }
  };

  const handleFocus = () => {
    if (searchValue.trim() === "" && allowAll) {
      setResults([{ id: 0, label: "All" }]);
      setShowDropdown(true);
    }
  };

  const handleBlur = () => {
    setTimeout(() => setShowDropdown(false), 200);
  };

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <Typography sx={{ fontWeight: "500", fontSize: "14px", mb: "12px" }}>
        {label}
      </Typography>
      <TextField
        size="small"
        value={searchValue}
        onChange={handleInputChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        fullWidth
        autoComplete="off"
        disabled={disabled}
        required={required}
      />
      {showDropdown && results.length > 0 && (
        <Paper
          style={{
            position: "absolute",
            zIndex: 1300,
            top: "100%",
            left: 0,
            right: 0,
            maxHeight: 200,
            overflowY: "auto",
          }}
        >
          <List dense>
            {results.map((option, index) => (
              <ListItem
                button
                key={option.id ?? index}
                onClick={() => handleItemSelect(option)}
                selected={highlightedIndex === index}
              >
                <ListItemText primary={option.label} />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}
    </div>
  );
}
