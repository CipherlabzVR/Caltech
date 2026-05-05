import React, { useCallback, useEffect, useMemo, useState } from "react";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import CircularProgress from "@mui/material/CircularProgress";
import BASE_URL from "Base/api";

const INITIAL_LIMIT = 20;

function debounce(fn, ms) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

export default function LocationAutocomplete({
  value,
  onChange,
  onSelect,
  modalOpen,
  disabled = false,
  error = false,
  helperText = "",
  label = "Location",
}) {
  const valueNum =
    value === "" || value === null || value === undefined
      ? null
      : Number(value);
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState("");

  const fetchLocations = useCallback(async (searchTerm) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const trimmed = (searchTerm || "").trim();
      const searchParam = trimmed ? encodeURIComponent(trimmed) : "null";
      const url = `${BASE_URL}/asset-locations/GetAllPage?SkipCount=0&MaxResultCount=${INITIAL_LIMIT}&Search=${searchParam}&Filter=null`;
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
      else if (json.result?.result?.items) items = json.result.result.items;

      setOptions(
        items.map((x) => ({
          id: x.id,
          label: x.locationCode
            ? `${x.locationCode} — ${x.locationName || ""}`
            : x.locationName || `#${x.id}`,
        }))
      );
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  const debouncedSearch = useMemo(
    () => debounce((term) => fetchLocations(term), 350),
    [fetchLocations]
  );

  useEffect(() => {
    if (!modalOpen) return;
    setInputValue("");
    fetchLocations("");
  }, [modalOpen, fetchLocations]);

  const selected = useMemo(() => {
    if (valueNum == null) return null;
    const fromList = options.find((o) => o.id === valueNum);
    if (fromList) return fromList;
    return { id: valueNum, label: `Location #${valueNum}` };
  }, [valueNum, options]);

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
        if (reason === "clear") debouncedSearch("");
        else if (reason === "input") debouncedSearch(newInput);
      }}
      onChange={(_, newValue) => {
        const id = newValue == null ? "" : newValue.id;
        onChange(id);
        if (typeof onSelect === "function") onSelect(newValue || null);
      }}
      ListboxProps={{ style: { maxHeight: 280 } }}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder="Search Location"
          error={error}
          helperText={helperText}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading ? <CircularProgress color="inherit" size={20} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
      noOptionsText={loading ? "Loading…" : "No locations found"}
    />
  );
}
