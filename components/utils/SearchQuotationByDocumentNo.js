import React, { useState, useRef, useImperativeHandle, forwardRef } from "react";
import { TextField, Paper, List, ListItem, ListItemText } from "@mui/material";

const SearchQuotationByDocumentNo = forwardRef(({
  label = "Search",
  placeholder = "Type to search...",
  fetchUrl,
  tokenKey = "token",
  onSelect,
  getResultLabel = (item) => item.documentNo || item.inquiryCode,
  buildParams = (value) => ({ keyword: value }),
}, ref) => {
  const inputRef = useRef();
  const [searchValue, setSearchValue] = useState("");
  const [results, setResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const debounceTimeout = useRef(null);

  useImperativeHandle(ref, () => ({
    focus: () => {
      inputRef.current?.focus();
    },
  }));

  const handleSearch = async (value) => {

    try {
      const queryParams = buildParams(value);
      const query = new URLSearchParams(queryParams).toString();
      const url = `${fetchUrl}?${query}`;
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem(tokenKey)}`,
          "Content-Type": "application/json",
        },
      });
      if (response.ok) {
        const data = await response.json();
        const items = Array.isArray(data?.result?.items) ? data.result.items : data.result;
        setResults(items || []);
        setShowDropdown(true);
      }
    } catch (err) {
      console.error("Error:", err);
    }
  };

  const handleInputChange = (e) => {
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
    }, 500);
  };

  const handleItemSelect = (item) => {
    setSearchValue(getResultLabel(item));
    setShowDropdown(false);
    onSelect(item);
    setSearchValue("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      setHighlightedIndex((prev) => (prev + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      setHighlightedIndex(
        (prev) => (prev - 1 + results.length) % results.length
      );
    } else if (e.key === "Enter" && highlightedIndex >= 0) {
      handleItemSelect(results[highlightedIndex]);
    }
  };


  return (
    <div style={{ position: "relative", width: "100%" }}>
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
      />
      {showDropdown && results.length > 0 && (
        <Paper
          style={{
            position: "absolute",
            zIndex: 1,
            top: "100%",
            left: 0,
            right: 0,
            maxHeight: 200,
            overflowY: "auto",
          }}
        >
          <List>
            {results.map((item, index) => (
              <ListItem
                button
                key={index}
                onClick={() => handleItemSelect(item)}
                selected={highlightedIndex === index}
              >
                <ListItemText
                  primary={`${getResultLabel(item)}${item.inquiryCode ? ` - ${item.inquiryCode}` : ""}${item.customerName ? ` - ${item.customerName}` : ""}${item.styleName ? ` - ${item.styleName}` : ""}`}
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}
    </div>
  );
});

export default SearchQuotationByDocumentNo;
