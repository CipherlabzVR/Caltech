import React, { useState, useRef, useEffect } from "react";
import { TextField, Paper, List, ListItem, ListItemText, Chip, Box } from "@mui/material";
import BASE_URL from "Base/api";
import CloseIcon from "@mui/icons-material/Close";

const SearchBOMANDBOQ = ({
  label = "Search BOM/BOQ",
  placeholder = "Search BOM and BOQ by keyword",
  tokenKey = "token",
  customerId,
  projectId,
  projectBillType,
  onSelect,
  onRemove,
  disabled = false,
}) => {
  const inputRef = useRef();
  const containerRef = useRef();
  const [searchValue, setSearchValue] = useState("");
  const [results, setResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [selectedItems, setSelectedItems] = useState([]);
  const debounceTimeout = useRef(null);

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
        
        // Filter out already selected items
        const filteredResults = allResults.filter(item => 
          !selectedItems.some(selected => selected.id === item.id)
        );
        
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
    setSearchValue(value);
    clearTimeout(debounceTimeout.current);

    if (value.trim() === "") {
      setShowDropdown(false);
      setResults([]);
      return;
    }

    debounceTimeout.current = setTimeout(() => {
      handleSearch(value);
    }, 300);
  };

  const handleItemSelect = (item) => {
    // Add to selected items
    const newSelectedItems = [...selectedItems, item];
    setSelectedItems(newSelectedItems);
    
    // Get line items based on project billType
    let lineItems = [];
    if (projectBillType === 1) {
      // Use billOfMaterialLineDetails for BOM
      lineItems = item.billOfMaterialLineDetails || [];
    } else if (projectBillType === 2) {
      // Use billOfQuantityLines for BOQ
      lineItems = item.billOfQuantityLines || [];
    }
    
    // Call onSelect with the item and its line items
    if (onSelect) {
      onSelect(item, lineItems);
    }
    
    // Clear search and close dropdown
    setSearchValue("");
    setShowDropdown(false);
    setResults([]);
  };

  const handleRemoveSelected = (itemToRemove) => {
    const updatedSelected = selectedItems.filter(item => item.id !== itemToRemove.id);
    setSelectedItems(updatedSelected);
    
    // Call onRemove callback to remove line items from table
    if (onRemove) {
      onRemove(itemToRemove);
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
      setSelectedItems([]);
    }
  }, [customerId, projectId]);

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%" }}>
      {/* Selected Items Display */}
      {selectedItems.length > 0 && (
        <Box sx={{ mb: 1, display: "flex", flexWrap: "wrap", gap: 1 }}>
          {selectedItems.map((item) => (
            <Chip
              key={item.id}
              label={getItemLabel(item)}
              onDelete={() => handleRemoveSelected(item)}
              deleteIcon={<CloseIcon />}
              color="primary"
              variant="outlined"
            />
          ))}
        </Box>
      )}
      
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

SearchBOMANDBOQ.displayName = "SearchBOMANDBOQ";

export default SearchBOMANDBOQ;

