import React, { useCallback, useEffect, useMemo, useState } from "react";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import CircularProgress from "@mui/material/CircularProgress";
import BASE_URL from "Base/api";

const INITIAL_LIMIT = 5;
const SEARCH_LIMIT = 30;

function debounce(fn, ms) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

/**
 * Searchable parent picker: loads first {INITIAL_LIMIT} categories, then server search while typing.
 * @param {number|string} value - ParentCategoryId or "" for root
 * @param {function} onChange - (id: number|null|"" ) => void
 * @param {number} [excludeId] - category id that cannot be selected (edit: self)
 * @param {{ id: number, label: string } | null} [extraOption] - ensure selected parent shows label when not in first page (e.g. edit)
 * @param {boolean} modalOpen - load when modal opens
 */
export default function ParentCategoryAutocomplete({
  value,
  onChange,
  excludeId,
  extraOption = null,
  modalOpen,
  disabled = false,
  error = false,
  helperText = "",
}) {
  const valueNum =
    value === "" || value === null || value === undefined
      ? null
      : Number(value);
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState("");

  const fetchCategories = useCallback(
    async (searchTerm) => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const trimmed = (searchTerm || "").trim();
        const max = trimmed ? SEARCH_LIMIT : INITIAL_LIMIT;
        const searchParam = trimmed
          ? encodeURIComponent(trimmed)
          : "null";
        const url = `${BASE_URL}/asset-categories/GetAllPage?SkipCount=0&MaxResultCount=${max}&Search=${searchParam}&Filter=null`;
        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (!res.ok) {
          setOptions([]);
          return;
        }
        const json = await res.json();
        let items = [];
        if (json.result?.items) items = json.result.items;
        else if (json.result?.result?.items)
          items = json.result.result.items;

        let mapped = items
          .filter((x) => excludeId == null || x.id !== excludeId)
          .map((x) => ({
            id: x.id,
            label: x.categoryCode
              ? `${x.categoryCode} — ${x.categoryName || ""}`
              : x.categoryName || `#${x.id}`,
          }));

        if (
          extraOption &&
          !mapped.some((o) => o.id === extraOption.id) &&
          valueNum != null &&
          !Number.isNaN(valueNum) &&
          valueNum === extraOption.id
        ) {
          mapped = [extraOption, ...mapped];
        }
        setOptions(mapped);
      } finally {
        setLoading(false);
      }
    },
    [excludeId, extraOption, valueNum]
  );

  const debouncedSearch = useMemo(
    () =>
      debounce((term) => {
        fetchCategories(term);
      }, 350),
    [fetchCategories]
  );

  useEffect(() => {
    if (!modalOpen) return;
    setInputValue("");
    fetchCategories("");
  }, [modalOpen, fetchCategories]);

  const selected = useMemo(() => {
    if (value === "" || value === null || value === undefined) return null;
    const id = Number(value);
    if (Number.isNaN(id)) return null;
    const fromList = options.find((o) => o.id === id);
    if (fromList) return fromList;
    if (extraOption && extraOption.id === id) return extraOption;
    return { id, label: `Category #${id}` };
  }, [value, options, extraOption]);

  return (
    <Autocomplete
      fullWidth
      disabled={disabled}
      options={options}
      loading={loading}
      filterOptions={(opts) => opts}
      isOptionEqualToValue={(a, b) => a?.id === b?.id}
      getOptionLabel={(o) => (o == null ? "" : o.label)}
      value={selected}
      inputValue={inputValue}
      onInputChange={(_, newInput, reason) => {
        setInputValue(newInput);
        if (reason === "reset") return;
        if (reason === "clear") {
          debouncedSearch("");
          return;
        }
        if (reason === "input") {
          debouncedSearch(newInput);
        }
      }}
      onChange={(_, newValue) => {
        onChange(newValue == null ? "" : newValue.id);
      }}
      ListboxProps={{ style: { maxHeight: 280 } }}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Parent Category"
          placeholder="Type to search (first 5 load by default)"
          error={error}
          helperText={
            error && helperText
              ? helperText
              : "Leave empty or clear for root category"
          }
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading ? (
                  <CircularProgress color="inherit" size={20} />
                ) : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
      noOptionsText={
        loading ? "Loading…" : "No categories — type to search"
      }
    />
  );
}
