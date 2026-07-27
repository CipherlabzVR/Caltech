import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Checkbox,
  Divider,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import BASE_URL from "Base/api";

/**
 * Self-contained Item Type / Feature / Options selector.
 *
 * Reads + writes the following Formik fields on the parent form:
 *  - ItemTypeId (number | "" )
 *  - IsAllVariantsSamePrice (boolean)
 *  - FeatureSelections: Array<{ optionId: number, price: number | null, isOutOfStock?: boolean }>
 *
 * Pass `values` and `setFieldValue` from Formik. Optionally pass `averagePrice`
 * (the parent's AveragePrice form value) to display under the "Same price for all" hint.
 */
export default function ItemTypeSelector({ values, setFieldValue, averagePrice }) {
  const [itemTypes, setItemTypes] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let abort = false;
    setLoading(true);
    fetch(`${BASE_URL}/ItemType/GetAllItemType`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then((r) => r.json())
      .then((data) => {
        if (abort) return;
        const list = data?.result ?? data?.Result ?? [];
        setItemTypes(Array.isArray(list) ? list : []);
      })
      .catch(() => {
        if (!abort) setItemTypes([]);
      })
      .finally(() => !abort && setLoading(false));
    return () => {
      abort = true;
    };
  }, []);

  const selectedType = useMemo(() => {
    if (values?.ItemTypeId === "" || values?.ItemTypeId == null) return null;
    const idNum = Number(values.ItemTypeId);
    if (Number.isNaN(idNum)) return null;
    return itemTypes.find((t) => t.id === idNum) || null;
  }, [itemTypes, values?.ItemTypeId]);

  const features = selectedType?.features || [];
  const selections = values?.FeatureSelections || [];
  const isAllSame = !!values?.IsAllVariantsSamePrice;

  const isOptionSelected = (optionId) => selections.some((s) => s.optionId === optionId);

  const getOptionPrice = (optionId) => {
    const s = selections.find((x) => x.optionId === optionId);
    return s?.price ?? "";
  };

  const getOptionOutOfStock = (optionId) => {
    const s = selections.find((x) => x.optionId === optionId);
    return !!(s?.isOutOfStock ?? s?.IsOutOfStock);
  };

  const toggleOption = (optionId) => {
    if (isOptionSelected(optionId)) {
      setFieldValue(
        "FeatureSelections",
        selections.filter((s) => s.optionId !== optionId)
      );
    } else {
      setFieldValue("FeatureSelections", [
        ...selections,
        { optionId, price: null, isOutOfStock: false },
      ]);
    }
  };

  const setOptionPrice = (optionId, price) => {
    const next = selections.map((s) =>
      s.optionId === optionId ? { ...s, price: price === "" ? null : Number(price) } : s
    );
    setFieldValue("FeatureSelections", next);
  };

  const setOptionOutOfStock = (optionId, isOutOfStock) => {
    const next = selections.map((s) =>
      s.optionId === optionId ? { ...s, isOutOfStock: !!isOutOfStock } : s
    );
    setFieldValue("FeatureSelections", next);
  };

  const handleTypeChange = (e) => {
    const raw = e.target.value;
    setFieldValue("ItemTypeId", raw === "" ? "" : Number(raw));
    setFieldValue("FeatureSelections", []);
  };

  const handleSamePriceToggle = () => {
    const next = !isAllSame;
    setFieldValue("IsAllVariantsSamePrice", next);
    if (next) {
      setFieldValue(
        "FeatureSelections",
        selections.map((s) => ({ ...s, price: null }))
      );
    }
  };

  return (
    <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
      <Typography variant="h6" sx={{ mb: 2, fontSize: 16, fontWeight: 600 }}>
        Item Type & Variants
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth size="small">
            <InputLabel>Item Type</InputLabel>
            <Select
              value={
                values?.ItemTypeId !== "" && values?.ItemTypeId != null
                  ? String(values.ItemTypeId)
                  : ""
              }
              label="Item Type"
              onChange={handleTypeChange}
              disabled={loading}
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              {itemTypes.map((t) => (
                <MenuItem key={t.id} value={String(t.id)}>
                  {t.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={6} display="flex" alignItems="center">
          {features.length > 0 && (
            <FormControlLabel
              control={
                <Checkbox checked={isAllSame} onChange={handleSamePriceToggle} />
              }
              label={
                <Box>
                  <Typography variant="body2">Same price for all variants</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Uses the item Average Price ({averagePrice || "—"}) for every selected variant.
                  </Typography>
                </Box>
              }
            />
          )}
        </Grid>
      </Grid>

      {features.length > 0 && (
        <>
          <Divider sx={{ my: 2 }} />
          {features.map((f) => (
            <Box key={f.id} sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                {f.name}
              </Typography>
              <Grid container spacing={1}>
                {(f.options || []).map((o) => {
                  const checked = isOptionSelected(o.id);
                  return (
                    <Grid item xs={12} sm={6} md={4} key={o.id}>
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 0.5,
                          p: 1,
                          border: "1px solid",
                          borderColor: checked ? "primary.main" : "divider",
                          borderRadius: 1,
                          bgcolor: getOptionOutOfStock(o.id) ? "action.hover" : "transparent",
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={checked}
                                onChange={() => toggleOption(o.id)}
                              />
                            }
                            label={o.value}
                            sx={{ flex: "0 0 auto", minWidth: 80, m: 0 }}
                          />
                          <TextField
                            size="small"
                            type="number"
                            placeholder="Price"
                            disabled={!checked || isAllSame}
                            value={isAllSame ? "" : getOptionPrice(o.id)}
                            onChange={(e) => setOptionPrice(o.id, e.target.value)}
                            sx={{ flex: 1 }}
                            inputProps={{ min: 0, step: "0.01" }}
                          />
                        </Box>
                        <FormControlLabel
                          control={
                            <Checkbox
                              size="small"
                              checked={getOptionOutOfStock(o.id)}
                              disabled={!checked}
                              onChange={(e) => setOptionOutOfStock(o.id, e.target.checked)}
                            />
                          }
                          label={
                            <Typography variant="caption" color="text.secondary">
                              Out of stock
                            </Typography>
                          }
                          sx={{ m: 0, ml: 0.5 }}
                        />
                      </Box>
                    </Grid>
                  );
                })}
              </Grid>
            </Box>
          ))}
        </>
      )}

      {values?.ItemTypeId && features.length === 0 && (
        <Typography variant="caption" color="text.secondary">
          This item type has no features defined yet.
        </Typography>
      )}
    </Paper>
  );
}

/**
 * Maps the prefilled item (from GetItemById) onto Formik fields.
 * Returns { ItemTypeId, IsAllVariantsSamePrice, FeatureSelections }.
 */
export function mapItemToSelectorValues(item) {
  if (!item) {
    return { ItemTypeId: "", IsAllVariantsSamePrice: false, FeatureSelections: [] };
  }
  const sels = item.featureSelections || item.FeatureSelections || [];
  const rawTypeId = item.itemTypeId ?? item.ItemTypeId;
  const typeIdNum = rawTypeId === "" || rawTypeId == null ? NaN : Number(rawTypeId);
  return {
    ItemTypeId: Number.isFinite(typeIdNum) ? typeIdNum : "",
    IsAllVariantsSamePrice: !!(item.isAllVariantsSamePrice ?? item.IsAllVariantsSamePrice),
    FeatureSelections: sels
      .map((s) => ({
        optionId: s.itemTypeFeatureOptionId ?? s.ItemTypeFeatureOptionId,
        price: s.price ?? s.Price ?? null,
        isOutOfStock: !!(s.isOutOfStock ?? s.IsOutOfStock),
      }))
      .filter((x) => x.optionId != null && Number(x.optionId) > 0),
  };
}
