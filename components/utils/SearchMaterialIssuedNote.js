import React, { useState, useRef, useImperativeHandle, forwardRef, useEffect } from "react";
import { TextField, Paper, List, ListItem, ListItemText } from "@mui/material";
import BASE_URL from "Base/api";
import { formatDate } from "@/components/utils/formatHelper";

const SearchMaterialIssuedNote = forwardRef(({
  label = "Material Issued Note",
  placeholder = "Search material issued notes by keyword",
  tokenKey = "token",
  projectId,
  onSelect,
  onClear,
  displayValue,
  disabled = false,
}, ref) => {
  const inputRef = useRef();
  const containerRef = useRef();
  const [searchValue, setSearchValue] = useState(() => {
    return displayValue || "";
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
    if (displayValue !== undefined && displayValue !== prevDisplayValue.current) {
      if (!isUserTyping.current) {
        setSearchValue(displayValue || "");
        prevDisplayValue.current = displayValue || "";
      }
    }
  }, [displayValue]);

  // Clear results when projectId changes
  useEffect(() => {
    if (!projectId) {
      setResults([]);
      setShowDropdown(false);
      if (onClear) {
        onClear();
      }
    }
  }, [projectId, onClear]);

  const buildQuery = (value) => {
    const params = new URLSearchParams();
    if (projectId) {
      params.append("projectId", projectId);
    }
    if (value && value.trim()) {
      params.append("keyword", value.trim());
    } else {
      params.append("keyword", "0");
    }
    return params.toString();
  };

  const handleSearch = async (value) => {
    if (!projectId) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    try {
      const query = buildQuery(value);
      const url = `${BASE_URL}/MaterialIssuedNote/GetApprovedMaterialIssuedNotesByProject?${query}`;

      const token = typeof window !== "undefined" ? localStorage.getItem(tokenKey) : null;
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (response.ok) {
        const data = await response.json();
        const items = Array.isArray(data?.result) ? data.result : Array.isArray(data) ? data : [];
        setResults(items);
        setShowDropdown(items.length > 0);
        setHighlightedIndex(-1);
      } else {
        setResults([]);
        setShowDropdown(false);
      }
    } catch (error) {
      console.error("Error searching material issued notes:", error);
      setResults([]);
      setShowDropdown(false);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchValue(value);
    isUserTyping.current = true;

    if (value.trim() === "") {
      setResults([]);
      setShowDropdown(false);
      if (onClear) {
        onClear();
      }
      return;
    }

    // Clear previous timeout
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    // Set new timeout for debouncing
    debounceTimeout.current = setTimeout(() => {
      isUserTyping.current = false;
      handleSearch(value);
    }, 300);
  };

  const handleItemSelect = (item) => {
    const noteLabel = getNoteLabel(item);
    setSearchValue("");
    setShowDropdown(false);
    setResults([]);
    isUserTyping.current = false;
    
    if (onSelect) {
      onSelect(item);
    }
  };

  const getNoteLabel = (note) => {
    if (note.documentNo && note.referenceNo) {
      return `${note.documentNo} - ${note.referenceNo}`;
    }
    return note.documentNo || note.referenceNo || "";
  };

  const handleKeyDown = (e) => {
    if (disabled) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < results.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightedIndex >= 0 && results[highlightedIndex]) {
        handleItemSelect(results[highlightedIndex]);
      }
    } else if (e.key === "Escape") {
      setShowDropdown(false);
      setResults([]);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%" }}>
      <TextField
        inputRef={inputRef}
        fullWidth
        size="small"
        label={label}
        placeholder={placeholder}
        value={searchValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (results.length > 0) {
            setShowDropdown(true);
          }
        }}
        disabled={disabled || !projectId}
      />
      {showDropdown && results.length > 0 && (
        <Paper
          elevation={8}
          sx={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            zIndex: 1300,
            maxHeight: 300,
            overflow: "auto",
            mt: 0.5,
            backgroundColor: "#fff",
          }}
        >
          <List dense>
            {results.map((item, index) => (
              <ListItem
                key={item.id}
                button
                onClick={() => handleItemSelect(item)}
                sx={{
                  backgroundColor:
                    index === highlightedIndex ? "action.selected" : "transparent",
                  "&:hover": {
                    backgroundColor: "action.hover",
                  },
                }}
              >
                <ListItemText 
                  primary={getNoteLabel(item)}
                  secondary={`${formatDate(item.date)} - ${item.customerName || ""}`}
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}
    </div>
  );
});

SearchMaterialIssuedNote.displayName = "SearchMaterialIssuedNote";

export default SearchMaterialIssuedNote;

