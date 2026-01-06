import React, { useState, useRef, useEffect } from "react";
import { TextField, Paper, List, ListItem, ListItemText } from "@mui/material";
import BASE_URL from "Base/api";

const SearchBOMANDBOQSingle = ({
  label = "Search BOM/BOQ",
  placeholder = "Search BOM and BOQ by keyword",
  tokenKey = "token",
  customerId,
  projectId,
  projectBillType,
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

  useEffect(() => {
    if (displayValue !== undefined && displayValue !== prevDisplayValue.current) {
      if (!isUserTyping.current) {
        setSearchValue(displayValue || "");
        prevDisplayValue.current = displayValue || "";
      }
    }
  }, [displayValue]);

  const buildQuery = (base, params) => {
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

  const getItemLabel = (item) => {
    if (item.documentNo) {
      return `${item.documentNo} - ${item.productName || ""}`;
    }
    return item.productName || "-";
  };

  const handleSearch = async (value) => {
    if (!customerId || !projectId) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    try {
      const keyword = value && value.trim() ? value.trim() : null;
      const url = buildQuery(`${BASE_URL}/MaterialRequestNote/GetAllBOQAndBOM`, {
        customerId: customerId,
        projectId: projectId,
        keyword: keyword || "0"
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
        const result = data.result || {};
        
        // Combine BOQ and BOM results
        const allResults = [
          ...(result.billOfQuantities || []),
          ...(result.billOfMaterials || [])
        ];
        
        setResults(allResults);
        setShowDropdown(allResults.length > 0);
      }
    } catch (err) {
      console.error("Error:", err);
    }
  };

  const handleInputChange = (e) => {
    if (disabled) return;
    
    const value = e.target.value;
    setSearchValue(value);
    clearTimeout(debounceTimeout.current);

    if (value.trim() === "") {
      setShowDropdown(false);
      setResults([]);
      if (onClear) {
        onClear();
      }
      return;
    }

    debounceTimeout.current = setTimeout(() => {
      handleSearch(value);
    }, 300);
  };

  const handleItemSelect = (item) => {
    const label = getItemLabel(item);
    isUserTyping.current = false;
    setSearchValue(label);
    setShowDropdown(false);
    
    // Get line items based on project billType
    let lineItems = [];
    if (projectBillType === 1) {
      // Use billOfMaterialLineDetails for BOM
      lineItems = item.billOfMaterialLineDetails || [];
    } else if (projectBillType === 2) {
      // Use billOfQuantityLines for BOQ
      lineItems = item.billOfQuantityLines || [];
    }
    
    if (onSelect) {
      onSelect(item, lineItems);
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

  // Clear results when customer or project changes
  useEffect(() => {
    if (!customerId || !projectId) {
      setResults([]);
      setShowDropdown(false);
      if (onClear) {
        onClear();
      }
    }
  }, [customerId, projectId, onClear]);

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
        disabled={disabled || !customerId || !projectId}
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
            {results.map((item, index) => (
              <ListItem
                button
                key={item.id || index}
                onClick={() => handleItemSelect(item)}
                selected={highlightedIndex === index}
              >
                <ListItemText
                  primary={getItemLabel(item)}
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}
    </div>
  );
};

SearchBOMANDBOQSingle.displayName = "SearchBOMANDBOQSingle";

export default SearchBOMANDBOQSingle;

