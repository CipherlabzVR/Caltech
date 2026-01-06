import React, { useState, useRef, useImperativeHandle, forwardRef, useEffect } from "react";
import { TextField, Paper, List, ListItem, ListItemText } from "@mui/material";
import BASE_URL from "Base/api";

const SearchUser = forwardRef(({
  label = "User",
  placeholder = "Search users by name",
  tokenKey = "token",
  main,
  mainItem,
  onSelect,
  onClear,
  displayValue,
  disabled = false,
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

  const getUserLabel = (user) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.firstName || user.lastName || user.userName || "-";
  };

  const handleSearch = async (value) => {
    try {
      // If value is empty or null, pass null as keyword
      const keyword = value && value.trim() ? value.trim() : null;
      const url = buildQuery(`${BASE_URL}/User/GetAllUsersWithoutSuperAdmin`, { keyword: keyword });
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

  const handleItemSelect = (user) => {
    const label = getUserLabel(user);
    isUserTyping.current = false;
    setSearchValue(label);
    setShowDropdown(false);
    onSelect(user);
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
        disabled={disabled}
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
            {results.map((user, index) => (
              <ListItem
                button
                key={user.id || index}
                onClick={() => handleItemSelect(user)}
                selected={highlightedIndex === index}
              >
                <ListItemText
                  primary={getUserLabel(user)}
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}
    </div>
  );
});

SearchUser.displayName = "SearchUser";

export default SearchUser;

