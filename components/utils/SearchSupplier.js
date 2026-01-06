import React, { useState, useRef, useImperativeHandle, forwardRef } from "react";
import { TextField, Paper, List, ListItem, ListItemText } from "@mui/material";

const SearchSupplier = forwardRef(({
  label = "Search",
  placeholder = "Type to search...",
  fetchUrl,
  tokenKey = "token",
  onSelect,
  getResultLabel = (item) => item.name,
}, ref) => {
  const inputRef = useRef();
  const [searchValue, setSearchValue] = useState("");
  const [results, setResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const debounceTimeout = useRef(null);

  useImperativeHandle(ref, () => ({
    reset: () => {
      setSearchValue("");
      setResults([]);
      setShowDropdown(false);
      setHighlightedIndex(-1);
    }
  }));


  const buildQuery = (base, params) => {
    const query = new URLSearchParams(params).toString();
    return `${base}?${query}`;
  };

  const handleSearch = async (value) => {

    try {
      const url = buildQuery(fetchUrl, { keyword: value });
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem(tokenKey)}`,
          "Content-Type": "application/json",
        },
      });
      if (response.ok) {
        const data = await response.json();
        setResults(data.result);
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
    <div style={{ position: "relative", width: "60%" }}>
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
                  primary={`${getResultLabel(item)}`}
                />

              </ListItem>
            ))}
          </List>
        </Paper>
      )}
    </div>
  );
});

export default SearchSupplier;
