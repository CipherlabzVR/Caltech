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
 * Searchable parent location: first INITIAL_LIMIT from API, then server search.
 * @param onSelect optional (option | null) — option includes locationLevel for auto child level
 */
export default function ParentLocationAutocomplete({
  value,
  onChange,
  onSelect,
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

  const fetchLocations = useCallback(
    async (searchTerm) => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const trimmed = (searchTerm || "").trim();
        const max = trimmed ? SEARCH_LIMIT : INITIAL_LIMIT;
        const searchParam = trimmed
          ? encodeURIComponent(trimmed)
          : "null";
        const url = `${BASE_URL}/asset-locations/GetAllPage?SkipCount=0&MaxResultCount=${max}&Search=${searchParam}&Filter=null`;
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
            locationLevel: x.locationLevel,
            label: x.locationCode
              ? `${x.locationCode} — ${x.locationName || ""}`
              : x.locationName || `#${x.id}`,
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
        fetchLocations(term);
      }, 350),
    [fetchLocations]
  );

  useEffect(() => {
    if (!modalOpen) return;
    setInputValue("");
    fetchLocations("");
  }, [modalOpen, fetchLocations]);

  const selected = useMemo(() => {
    if (value === "" || value === null || value === undefined) return null;
    const id = Number(value);
    if (Number.isNaN(id)) return null;
    const fromList = options.find((o) => o.id === id);
    if (fromList) return fromList;
    if (extraOption && extraOption.id === id) return extraOption;
    return { id, label: `Location #${id}` };
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
        const id = newValue == null ? "" : newValue.id;
        onChange(id);
        if (typeof onSelect === "function") {
          onSelect(newValue || null);
        }
      }}
      ListboxProps={{ style: { maxHeight: 280 } }}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Parent Location"
          placeholder="Type to search (first 5 load by default)"
          error={error}
          helperText={
            error && helperText
              ? helperText
              : "Leave empty or clear for top-level location"
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
        loading ? "Loading…" : "No locations — type to search"
      }
    />
  );
}
