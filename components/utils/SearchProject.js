import React, { useState, useRef, useImperativeHandle, forwardRef, useEffect } from "react";
import { TextField, Paper, List, ListItem, ListItemText } from "@mui/material";
import BASE_URL from "Base/api";

const SearchProject = forwardRef(({
  label = "Project",
  placeholder = "Search projects by name",
  tokenKey = "token",
  main,
  mainItem,
  onSelect,
  onClear,
  displayValue,
  disabled = false,
  billType,
  customerId,
}, ref) => {
  const inputRef = useRef();
  const containerRef = useRef();
  const [searchValue, setSearchValue] = useState(() => {
    // Initialize with displayValue if provided and main is true
    return (main && displayValue) ? displayValue : "";
  });
  const [results, setResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const debounceTimeout = useRef(null);
  const isUserTyping = useRef(false);
  const prevDisplayValue = useRef(displayValue || "");

  useImperativeHandle(ref, () => ({
    focus: () => {
      inputRef.current?.focus();
    },
  }));

  // Update searchValue when displayValue prop changes (only if user is not typing)
  useEffect(() => {
    if (main) {
      // Initialize or update searchValue when displayValue changes
      if (displayValue !== undefined && displayValue !== prevDisplayValue.current) {
        if (!isUserTyping.current) {
          setSearchValue(displayValue || "");
          prevDisplayValue.current = displayValue || "";
        }
      }
    }
  }, [displayValue, main]);

  // Clear results and dropdown when customerId or billType changes
  useEffect(() => {
    if (!customerId || (billType === undefined || billType === null)) {
      setResults([]);
      setShowDropdown(false);
      if (onClear) {
        onClear();
      }
    }
  }, [customerId, billType, onClear]);

  const buildQuery = (base, params) => {
    // Handle null keyword properly
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== null && params[key] !== undefined && params[key] !== "") {
        queryParams.append(key, params[key]);
      } else {
        queryParams.append(key, 'null');
      }
    });
    return `${base}?${queryParams.toString()}`;
  };

  const getProjectLabel = (project) => {
    const projectCode = project.code || "";
    if (projectCode) {
      return `${projectCode}`;
    }
  };

  const handleSearch = async (value) => {
    // Don't search if customerId or billType is not provided (0 is a valid value)
    if (!customerId || (billType === undefined || billType === null)) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    try {
      // If value is empty or null, pass null as keyword
      const keyword = value && value.trim() ? value.trim() : null;
      const url = buildQuery(`${BASE_URL}/Project/GetProjectsByBillType`, { 
        billType: billType,
        customerId: customerId,
        keyword: keyword 
      });
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem(tokenKey)}`,
          "Content-Type": "application/json",
        },
      });
      if (response.ok) {
        const data = await response.json();
        let filteredResults = data.result || [];

        if (mainItem) {
          filteredResults = filteredResults.filter(item => item.id !== mainItem);
        }

        setResults(filteredResults);
        setShowDropdown(filteredResults.length > 0);
      }
    } catch (err) {
      console.error("Error:", err);
    }
  };

  const handleInputChange = (e) => {
    if (disabled) return;
    
    const value = e.target.value;
    const wasEmpty = searchValue.trim() === "";
    const isEmpty = value.trim() === "";
    
    isUserTyping.current = true;
    setSearchValue(value);
    clearTimeout(debounceTimeout.current);

    // If user is editing/deleting from a selected value (main item exists), clear selection immediately
    if (main && mainItem && searchValue === displayValue && searchValue !== value && onClear) {
      onClear();
    }

    // If user cleared the input and there was a value before, call onClear
    if (isEmpty && !wasEmpty && onClear) {
      onClear();
      setShowDropdown(false);
      setResults([]);
      setTimeout(() => {
        isUserTyping.current = false;
      }, 100);
      return;
    }

    // If value is empty, just clear dropdown
    if (isEmpty) {
      setShowDropdown(false);
      setResults([]);
      setTimeout(() => {
        isUserTyping.current = false;
      }, 100);
      return;
    }

    // Search when user types
    debounceTimeout.current = setTimeout(() => {
      handleSearch(value);
      isUserTyping.current = false;
    }, 300);
  };

  const handleItemSelect = (project) => {
    const label = getProjectLabel(project);
    isUserTyping.current = false;
    setSearchValue(label);
    setShowDropdown(false);
    onSelect(project);
    if (main) {
      setSearchValue(label);
    } else {
      setSearchValue("");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex(
        (prev) => (prev - 1 + results.length) % results.length
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightedIndex >= 0 && results[highlightedIndex]) {
        handleItemSelect(results[highlightedIndex]);
      }
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [showDropdown]);

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%" }}>
      <TextField
        label={label}
        size="small"
        value={searchValue}
        onChange={handleInputChange}
        placeholder={placeholder}
        fullWidth
        autoComplete="off"
        inputRef={inputRef}
        onKeyDown={handleKeyDown}
        disabled={disabled || !customerId || (billType === undefined || billType === null)}
      />
      {showDropdown && results.length > 0 && (
        <Paper
          elevation={8}
          style={{
            position: "absolute",
            zIndex: 1300,
            top: "100%",
            left: 0,
            right: 0,
            maxHeight: 200,
            overflowY: "auto",
            marginTop: "4px",
            backgroundColor: "#fff",
          }}
        >
          <List>
            {results.map((project, index) => (
              <ListItem
                button
                key={project.id || index}
                onClick={() => handleItemSelect(project)}
                selected={highlightedIndex === index}
              >
                <ListItemText
                  primary={getProjectLabel(project)}
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}
    </div>
  );
});

SearchProject.displayName = "SearchProject";

export default SearchProject;

