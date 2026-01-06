import React, { useState, useRef, useEffect } from "react";
import { TextField, Paper, List, ListItem, ListItemText } from "@mui/material";
import { toast } from "react-toastify";
import GetAllItemDetails from "./GetAllItemDetails";

const SearchDropdown = ({
  label = "Search",
  placeholder = "Type to search...",
  fetchUrl,
  queryParams = {},
  tokenKey = "token",
  onSelect,
  getResultLabel = (item) => item.name,
}) => {
  const [searchValue, setSearchValue] = useState("");
  const [results, setResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const debounceTimeout = useRef(null);
  const { categories, subCategories, uoms } = GetAllItemDetails();
  const [catInfo, setCatInfo] = useState({});
  const [subCatInfo, setSubCatInfo] = useState({});
  const [uomInfo, setUOMInfo] = useState({});

  useEffect(() => {
    if (categories) {
      const catMap = categories.reduce((acc, cat) => {
        acc[cat.id] = cat;
        return acc;
      }, {});
      setCatInfo(catMap);
    }
    if (subCategories) {
      const subcatMap = subCategories.reduce((acc, subcat) => {
        acc[subcat.id] = subcat;
        return acc;
      }, {});
      setSubCatInfo(subcatMap);
    }
    if (uoms) {
      const uomMap = uoms.reduce((acc, uom) => {
        acc[uom.id] = uom;
        return acc;
      }, {});
      setUOMInfo(uomMap);
    }
  }, [categories, subCategories, uoms]);

  const buildQuery = (base, params) => {
    const query = new URLSearchParams(params).toString();
    return `${base}?${query}`;
  };

  const handleSearch = async (value) => {
    if (Object.values(queryParams).includes(null) || Object.values(queryParams).includes(undefined)) {
      toast.info("Please Select a Supplier");
      return;
    }

    try {
      const url = buildQuery(fetchUrl, { ...queryParams, keyword: value });
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
                key={item.id}
                onClick={() => handleItemSelect(item)}
                selected={highlightedIndex === index}
              >

                <ListItemText
                  primary={`${getResultLabel(item)} - ${uomInfo[item.uom]?.name || ""} - ${catInfo[item.categoryId]?.name || "-"} - ${subCatInfo[item.subCategoryId]?.name || "-"}`}
                />

              </ListItem>
            ))}
          </List>
        </Paper>
      )}
    </div>
  );
};

export default SearchDropdown;
