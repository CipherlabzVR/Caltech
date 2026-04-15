import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Grid,
  Typography,
  TextField,
  FormControlLabel,
  Checkbox,
  Autocomplete,
  Button,
  IconButton,
  Box,
  MenuItem,
  CircularProgress,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { Field } from "formik";
import BASE_URL from "Base/api";
import {
  PROMOTION_CATEGORIES,
  emptyCategoryDiscountRow,
  emptyProductItemDiscountConfig,
  emptyTotalAmountRow,
} from "@/components/eCommerce/promotions/promotionConfig";

export default function PromotionFormFields({ values, setFieldValue, errors, touched, isEdit }) {
  const [itemCategories, setItemCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [promoItemOptions, setPromoItemOptions] = useState([]);
  const [promoItemsLoading, setPromoItemsLoading] = useState(false);
  const [promoItemSearch, setPromoItemSearch] = useState("");
  const promoItemSearchTimer = useRef(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setCategoriesLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${BASE_URL}/Category/GetAllCategory`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (!res.ok) throw new Error("Failed to load categories");
        const data = await res.json();
        const raw = Array.isArray(data.result) ? data.result : [];
        if (cancelled) return;
        const normalized = raw
          .map((row) => ({
            id: row.id ?? row.Id,
            name: (row.name ?? row.Name ?? "").trim(),
          }))
          .filter((x) => x.id != null && x.name !== "");
        normalized.sort((a, b) => String(a.name).localeCompare(String(b.name)));
        setItemCategories(normalized);
      } catch {
        if (!cancelled) setItemCategories([]);
      } finally {
        if (!cancelled) setCategoriesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const loadPromoItems = useCallback(async (search) => {
    setPromoItemsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const searchParam =
        search && String(search).trim() !== ""
          ? encodeURIComponent(String(search).trim())
          : "null";
      const res = await fetch(
        `${BASE_URL}/Items/GetAllItemsSkipAndTake?SkipCount=0&MaxResultCount=50&Search=${searchParam}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );
      if (!res.ok) throw new Error("Failed to load items");
      const data = await res.json();
      const raw = data?.result?.items ?? data?.result?.Items ?? [];
      setPromoItemOptions(
        raw.map((it) => ({
          id: it.id ?? it.Id,
          name: String(it.name ?? it.Name ?? "").trim() || `Item #${it.id ?? it.Id}`,
          code: it.code ?? it.Code ?? "",
        })),
      );
    } catch {
      setPromoItemOptions([]);
    } finally {
      setPromoItemsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (values.PromotionCategory !== "ProductBased" || values.PromotionType !== "ProductItemDiscount") {
      return undefined;
    }
    if (promoItemSearchTimer.current) clearTimeout(promoItemSearchTimer.current);
    promoItemSearchTimer.current = setTimeout(() => {
      loadPromoItems(promoItemSearch);
    }, 300);
    return () => {
      if (promoItemSearchTimer.current) clearTimeout(promoItemSearchTimer.current);
    };
  }, [promoItemSearch, values.PromotionCategory, values.PromotionType, loadPromoItems]);

  const category = values.PromotionCategory;
  const type = values.PromotionType;

  // Resolve display value for Category (predefined option or custom string)
  const categoryOption = PROMOTION_CATEGORIES.find((c) => c.value === category) || (category ? { value: category, label: category } : null);

  const config = values.ConfigValues || {};
  const setConfig = (key, val) => {
    const next = { ...(values.ConfigValues || {}), [key]: val };
    setFieldValue("ConfigValues", next);
  };

  const renderConfigFields = () => {
    switch (type) {
      case "PercentageOff":
        return (
          <Grid item xs={12} sm={6}>
            <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 0.5 }}>Percentage (%)</Typography>
            <TextField
              fullWidth
              size="small"
              type="number"
              value={config.percentage ?? ""}
              onChange={(e) => setConfig("percentage", e.target.value)}
              placeholder="e.g. 20"
            />
          </Grid>
        );
      case "FixedAmountOff":
        return (
          <>
            <Grid item xs={12} sm={6}>
              <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 0.5 }}>Fixed Amount (Rs.)</Typography>
              <TextField
                fullWidth
                size="small"
                type="number"
                value={config.fixedAmount ?? ""}
                onChange={(e) => setConfig("fixedAmount", e.target.value)}
                placeholder="e.g. 500"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 0.5 }}>Min Order Amount (Rs.)</Typography>
              <TextField
                fullWidth
                size="small"
                type="number"
                value={config.minOrderAmount ?? ""}
                onChange={(e) => setConfig("minOrderAmount", e.target.value)}
                placeholder="e.g. 3000"
              />
            </Grid>
          </>
        );
      case "TieredDiscount":
        return (
          <Grid item xs={12}>
            <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 0.5 }}>
              Tiers (JSON array: [{`{ "spendAmount": 5000, "percentage": 10 }`}, ...])
            </Typography>
            <TextField
              fullWidth
              size="small"
              multiline
              rows={3}
              value={typeof config.tiers === "string" ? config.tiers : (config.tiers ? JSON.stringify(config.tiers, null, 2) : "[]")}
              onChange={(e) => {
                try {
                  const v = e.target.value;
                  const parsed = v ? JSON.parse(v) : [];
                  setConfig("tiers", Array.isArray(parsed) ? parsed : []);
                } catch {
                  setConfig("tiers", e.target.value);
                }
              }}
              placeholder='[{"spendAmount":5000,"percentage":10},{"spendAmount":10000,"percentage":20}]'
            />
          </Grid>
        );
      case "ProductItemDiscount": {
        const baseCfg = emptyProductItemDiscountConfig();
        const cfg = { ...baseCfg, ...(config || {}) };
        const amountMode = cfg.discountType === "Value" ? "Value" : "Percentage";
        const selectedItem =
          promoItemOptions.find((x) => String(x.id) === String(cfg.itemId)) ||
          (cfg.itemId
            ? {
                id: cfg.itemId,
                name: cfg.itemName || "Selected item",
                code: cfg.itemCode || "",
              }
            : null);

        const patchProductDiscount = (partial) => {
          setFieldValue("ConfigValues", {
            ...baseCfg,
            ...config,
            ...partial,
          });
        };

        return (
          <Grid item xs={12}>
            <Box
              sx={{
                display: "flex",
                gap: 1,
                alignItems: "flex-end",
                flexWrap: "wrap",
              }}
            >
              <Box sx={{ flex: "1 1 280px", minWidth: 220 }}>
                <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 0.5 }}>Select Item *</Typography>
                <Autocomplete
                  size="small"
                  options={promoItemOptions}
                  loading={promoItemsLoading}
                  filterOptions={(opts) => opts}
                  isOptionEqualToValue={(a, b) => a && b && String(a.id) === String(b.id)}
                  getOptionLabel={(opt) =>
                    opt && opt.name ? `${opt.name}${opt.code ? ` (${opt.code})` : ""}` : ""
                  }
                  value={selectedItem}
                  onOpen={() => loadPromoItems(promoItemSearch)}
                  onInputChange={(e, val, reason) => {
                    if (reason === "input") setPromoItemSearch(val ?? "");
                    if (reason === "clear") setPromoItemSearch("");
                  }}
                  onChange={(e, opt) => {
                    if (opt) {
                      patchProductDiscount({
                        itemId: opt.id,
                        itemName: opt.name,
                        itemCode: opt.code || "",
                      });
                    } else {
                      patchProductDiscount({ itemId: "", itemName: "", itemCode: "" });
                    }
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Search by name or code"
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {promoItemsLoading ? (
                              <CircularProgress color="inherit" size={18} sx={{ mr: 1 }} />
                            ) : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                />
              </Box>
              <Box sx={{ flex: "0 1 128px", minWidth: 108 }}>
                <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 0.5 }}>Type *</Typography>
                <TextField
                  select
                  fullWidth
                  size="small"
                  value={amountMode}
                  onChange={(e) => {
                    const nextMode = e.target.value;
                    patchProductDiscount({
                      discountType: nextMode,
                      ...(nextMode === "Percentage" ? { value: "" } : { percentage: "" }),
                    });
                  }}
                >
                  <MenuItem value="Percentage">Percentage</MenuItem>
                  <MenuItem value="Value">Value</MenuItem>
                </TextField>
              </Box>
              <Box sx={{ flex: "0 1 150px", minWidth: 120 }}>
                <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 0.5 }}>
                  {amountMode === "Value" ? "Value (Rs.) *" : "Percentage (%) *"}
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  value={amountMode === "Value" ? cfg.value ?? "" : cfg.percentage ?? ""}
                  onChange={(e) =>
                    patchProductDiscount(
                      amountMode === "Value" ? { value: e.target.value } : { percentage: e.target.value },
                    )
                  }
                  placeholder={amountMode === "Value" ? "e.g. 500" : "e.g. 15"}
                  inputProps={{
                    min: 0,
                    ...(amountMode === "Percentage" ? { max: 100 } : {}),
                  }}
                />
              </Box>
            </Box>
          </Grid>
        );
      }
      case "FreeShipping":
        return null;
      case "FreeShippingOverAmount":
        return (
          <Grid item xs={12} sm={6}>
            <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 0.5 }}>Min Order Amount (Rs.)</Typography>
            <TextField
              fullWidth
              size="small"
              type="number"
              value={config.minOrderAmount ?? ""}
              onChange={(e) => setConfig("minOrderAmount", e.target.value)}
              placeholder="e.g. 2000"
            />
          </Grid>
        );
      case "NewUser":
        return (
          <Grid item xs={12} sm={6}>
            <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 0.5 }}>Discount Amount (Rs.)</Typography>
            <TextField
              fullWidth
              size="small"
              type="number"
              value={config.discountAmount ?? ""}
              onChange={(e) => setConfig("discountAmount", e.target.value)}
              placeholder="e.g. 500"
            />
          </Grid>
        );
      case "LoyaltyVip":
        return (
          <>
            <Grid item xs={12} sm={6}>
              <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 0.5 }}>Tier Name</Typography>
              <TextField
                fullWidth
                size="small"
                value={config.tierName ?? ""}
                onChange={(e) => setConfig("tierName", e.target.value)}
                placeholder="e.g. Platinum"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 0.5 }}>Percentage (%)</Typography>
              <TextField
                fullWidth
                size="small"
                type="number"
                value={config.percentage ?? ""}
                onChange={(e) => setConfig("percentage", e.target.value)}
                placeholder="e.g. 15"
              />
            </Grid>
          </>
        );
      case "Referral":
        return (
          <Grid item xs={12} sm={6}>
            <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 0.5 }}>Amount for Both (Rs.)</Typography>
            <TextField
              fullWidth
              size="small"
              type="number"
              value={config.amountForBoth ?? ""}
              onChange={(e) => setConfig("amountForBoth", e.target.value)}
              placeholder="e.g. 300"
            />
          </Grid>
        );
      case "Birthday":
        return (
          <Grid item xs={12} sm={6}>
            <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 0.5 }}>Percentage (%)</Typography>
            <TextField
              fullWidth
              size="small"
              type="number"
              value={config.percentage ?? ""}
              onChange={(e) => setConfig("percentage", e.target.value)}
              placeholder="e.g. 10"
            />
          </Grid>
        );
      case "FlashSale":
        return (
          <>
            <Grid item xs={12} sm={6}>
              <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 0.5 }}>Percentage (%)</Typography>
              <TextField
                fullWidth
                size="small"
                type="number"
                value={config.percentage ?? ""}
                onChange={(e) => setConfig("percentage", e.target.value)}
                placeholder="e.g. 50"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 0.5 }}>Duration (hours)</Typography>
              <TextField
                fullWidth
                size="small"
                type="number"
                value={config.durationHours ?? ""}
                onChange={(e) => setConfig("durationHours", e.target.value)}
                placeholder="e.g. 24"
              />
            </Grid>
          </>
        );
      case "WeekendDeal":
        return (
          <Grid item xs={12} sm={6}>
            <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 0.5 }}>Percentage (%)</Typography>
            <TextField
              fullWidth
              size="small"
              type="number"
              value={config.percentage ?? ""}
              onChange={(e) => setConfig("percentage", e.target.value)}
              placeholder="e.g. 15"
            />
          </Grid>
        );
      case "Seasonal":
        return (
          <>
            <Grid item xs={12} sm={6}>
              <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 0.5 }}>Sale Name</Typography>
              <TextField
                fullWidth
                size="small"
                value={config.saleName ?? ""}
                onChange={(e) => setConfig("saleName", e.target.value)}
                placeholder="e.g. Avurudu Sale"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 0.5 }}>Percentage (%)</Typography>
              <TextField
                fullWidth
                size="small"
                type="number"
                value={config.percentage ?? ""}
                onChange={(e) => setConfig("percentage", e.target.value)}
                placeholder="e.g. 20"
              />
            </Grid>
          </>
        );
      case "DailyDeal":
        return (
          <>
            <Grid item xs={12} sm={6}>
              <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 0.5 }}>Percentage (%)</Typography>
              <TextField
                fullWidth
                size="small"
                type="number"
                value={config.percentage ?? ""}
                onChange={(e) => setConfig("percentage", e.target.value)}
                placeholder="e.g. 50"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 0.5 }}>Product ID (optional)</Typography>
              <TextField
                fullWidth
                size="small"
                value={config.productId ?? ""}
                onChange={(e) => setConfig("productId", e.target.value)}
                placeholder="optional"
              />
            </Grid>
          </>
        );
      case "CategoryDiscount": {
        const rows =
          Array.isArray(config.categoryDiscounts) && config.categoryDiscounts.length > 0
            ? config.categoryDiscounts
            : [emptyCategoryDiscountRow()];

        const updateCategoryDiscountRow = (index, patch) => {
          const next = rows.map((r, i) => (i === index ? { ...r, ...patch } : r));
          setFieldValue("ConfigValues", { ...(values.ConfigValues || {}), categoryDiscounts: next });
        };

        const addCategoryDiscountRow = () => {
          setFieldValue("ConfigValues", {
            ...(values.ConfigValues || {}),
            categoryDiscounts: [...rows, emptyCategoryDiscountRow()],
          });
        };

        const removeCategoryDiscountRow = (index) => {
          const next = rows.filter((_, i) => i !== index);
          setFieldValue("ConfigValues", {
            ...(values.ConfigValues || {}),
            categoryDiscounts: next.length ? next : [emptyCategoryDiscountRow()],
          });
        };

        return (
          <>
            {rows.map((row, index) => {
              const amountMode = row.discountType === "Value" ? "Value" : "Percentage";
              return (
              <Grid item xs={12} key={`cat-disc-${index}`}>
                <Box
                  sx={{
                    display: "flex",
                    gap: 1,
                    alignItems: "flex-end",
                    flexWrap: "wrap",
                  }}
                >
                  <Box sx={{ flex: "1 1 260px", minWidth: 200 }}>
                    <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 0.5 }}>Category</Typography>
                    <Autocomplete
                      size="small"
                      options={itemCategories}
                      loading={categoriesLoading}
                      getOptionLabel={(opt) => (opt && opt.name) || ""}
                      isOptionEqualToValue={(a, b) => a?.id === b?.id}
                      value={itemCategories.find((x) => String(x.id) === String(row.categoryId)) || null}
                      onChange={(e, opt) => {
                        if (opt) {
                          updateCategoryDiscountRow(index, { categoryId: opt.id, categoryName: opt.name });
                        } else {
                          updateCategoryDiscountRow(index, { categoryId: "", categoryName: "" });
                        }
                      }}
                      renderInput={(params) => <TextField {...params} placeholder="Select category" />}
                    />
                  </Box>
                  <Box sx={{ flex: "0 1 128px", minWidth: 108 }}>
                    <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 0.5 }}>Type</Typography>
                    <TextField
                      select
                      fullWidth
                      size="small"
                      value={amountMode}
                      onChange={(e) => {
                        const nextMode = e.target.value;
                        updateCategoryDiscountRow(index, {
                          discountType: nextMode,
                          ...(nextMode === "Percentage" ? { value: "" } : { percentage: "" }),
                        });
                      }}
                    >
                      <MenuItem value="Percentage">Percentage</MenuItem>
                      <MenuItem value="Value">Value</MenuItem>
                    </TextField>
                  </Box>
                  <Box sx={{ flex: "0 1 150px", minWidth: 120 }}>
                    <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 0.5 }}>
                      {amountMode === "Value" ? "Value (Rs.)" : "Percentage (%)"}
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      value={amountMode === "Value" ? row.value ?? "" : row.percentage ?? ""}
                      onChange={(e) =>
                        updateCategoryDiscountRow(
                          index,
                          amountMode === "Value" ? { value: e.target.value } : { percentage: e.target.value },
                        )
                      }
                      placeholder={amountMode === "Value" ? "e.g. 500" : "e.g. 30"}
                    />
                  </Box>
                  <IconButton
                    aria-label="Remove category"
                    onClick={() => removeCategoryDiscountRow(index)}
                    size="small"
                    disabled={rows.length <= 1}
                    sx={{ mb: 0.25 }}
                  >
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Grid>
              );
            })}
            <Grid item xs={12}>
              <Button startIcon={<AddIcon />} size="small" onClick={addCategoryDiscountRow} variant="outlined">
                Add category
              </Button>
            </Grid>
          </>
        );
      }
      case "BrandDiscount":
        return (
          <>
            <Grid item xs={12} sm={6}>
              <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 0.5 }}>Brand Name</Typography>
              <TextField
                fullWidth
                size="small"
                value={config.brandName ?? ""}
                onChange={(e) => setConfig("brandName", e.target.value)}
                placeholder="e.g. Samsung"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 0.5 }}>Percentage (%)</Typography>
              <TextField
                fullWidth
                size="small"
                type="number"
                value={config.percentage ?? ""}
                onChange={(e) => setConfig("percentage", e.target.value)}
                placeholder="e.g. 25"
              />
            </Grid>
          </>
        );
      case "Clearance":
        return (
          <>
            <Grid item xs={12} sm={6}>
              <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 0.5 }}>Percentage (%)</Typography>
              <TextField
                fullWidth
                size="small"
                type="number"
                value={config.percentage ?? ""}
                onChange={(e) => setConfig("percentage", e.target.value)}
                placeholder="e.g. 70"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 0.5 }}>Description</Typography>
              <TextField
                fullWidth
                size="small"
                value={config.description ?? ""}
                onChange={(e) => setConfig("description", e.target.value)}
                placeholder="e.g. Last stock"
              />
            </Grid>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Grid item xs={12}>
        <Typography variant="h6" sx={{ fontWeight: 500, mb: 1 }}>
          {isEdit ? "Edit Promotion" : "Add Promotion"}
        </Typography>
      </Grid>
      <Grid item xs={12}>
        <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 0.5 }}>Name *</Typography>
        <Field
          as={TextField}
          fullWidth
          name="Name"
          size="small"
          error={touched.Name && Boolean(errors.Name)}
          helperText={touched.Name && errors.Name}
        />
      </Grid>
      <Grid item xs={12}>
        <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 0.5 }}>Description</Typography>
        <Field as={TextField} fullWidth name="Description" size="small" multiline rows={2} />
      </Grid>
      <Grid item xs={12}>
        <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 0.5 }}>Category *</Typography>
        <Autocomplete
          freeSolo
          size="small"
          options={PROMOTION_CATEGORIES}
          getOptionLabel={(opt) => (opt && (opt.label ?? opt.value ?? opt)) || ""}
          value={categoryOption}
          onChange={(e, newValue) => {
            const val = newValue && typeof newValue === "object" ? newValue.value : newValue || "";
            setFieldValue("PromotionCategory", val);
            if (val === "CategoryBased") {
              setFieldValue("PromotionType", "CategoryDiscount");
              setFieldValue("ConfigValues", {});
              setFieldValue("CouponCode", "");
            } else if (val === "ProductBased") {
              setFieldValue("PromotionType", "ProductItemDiscount");
              setFieldValue("ConfigValues", emptyProductItemDiscountConfig());
              setPromoItemSearch("");
              loadPromoItems("");
              setFieldValue("CouponCode", "");
            } else if (val === "TotalAmountBased") {
              setFieldValue("PromotionType", "TotalAmountDiscount");
              setFieldValue("PromotionTotalAmountLines", [emptyTotalAmountRow()]);
              setFieldValue("ConfigValues", {});
              setFieldValue("IsCouponAvailable", false);
              setFieldValue("CouponDiscountType", 2);
              setFieldValue("CouponDiscountValue", "");
              setFieldValue("CouponCode", "");
              setFieldValue("MaxBillAmount", "");
              setFieldValue("IsOneTimeUse", false);
            } else {
              setFieldValue("PromotionType", "");
              setFieldValue("ConfigValues", {});
            }
          }}
          onInputChange={(e, inputValue) => {
            if (e?.type === "change" && inputValue !== undefined) {
              const trimmed = (inputValue ?? "").trim();
              const matched = PROMOTION_CATEGORIES.find((c) => c.value === trimmed || c.label === trimmed);
              const categoryVal = matched ? matched.value : trimmed;
              setFieldValue("PromotionCategory", categoryVal);
              if (trimmed) {
                if (categoryVal === "CategoryBased") {
                  setFieldValue("PromotionType", "CategoryDiscount");
                  setFieldValue("ConfigValues", {});
                  setFieldValue("CouponCode", "");
                } else if (categoryVal === "ProductBased") {
                  setFieldValue("PromotionType", "ProductItemDiscount");
                  setFieldValue("ConfigValues", emptyProductItemDiscountConfig());
                  setPromoItemSearch("");
                  loadPromoItems("");
                  setFieldValue("CouponCode", "");
                } else if (categoryVal === "TotalAmountBased") {
                  setFieldValue("PromotionType", "TotalAmountDiscount");
                  setFieldValue("PromotionTotalAmountLines", [emptyTotalAmountRow()]);
                  setFieldValue("ConfigValues", {});
                  setFieldValue("IsCouponAvailable", false);
                  setFieldValue("CouponDiscountType", 2);
                  setFieldValue("CouponDiscountValue", "");
                  setFieldValue("CouponCode", "");
                  setFieldValue("MaxBillAmount", "");
                  setFieldValue("IsOneTimeUse", false);
                } else {
                  setFieldValue("PromotionType", "");
                  setFieldValue("ConfigValues", {});
                }
              }
            }
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="Select or type category"
              error={touched.PromotionCategory && Boolean(errors.PromotionCategory)}
              helperText={touched.PromotionCategory && errors.PromotionCategory}
            />
          )}
        />
      </Grid>
      {String(category || "").trim() &&
        category !== "TotalAmountBased" &&
        category !== "ProductBased" &&
        category !== "CategoryBased" && (
        <Grid item xs={12} sm={6}>
          <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 0.5 }}>Coupon Code</Typography>
          <Field as={TextField} fullWidth name="CouponCode" size="small" placeholder="Optional" />
        </Grid>
      )}
      <Grid item xs={12} sm={6}>
        <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 0.5 }}>Start Date</Typography>
        <Field
          as={TextField}
          fullWidth
          type="datetime-local"
          name="StartDate"
          size="small"
          InputLabelProps={{ shrink: true }}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 0.5 }}>End Date</Typography>
        <Field
          as={TextField}
          fullWidth
          type="datetime-local"
          name="EndDate"
          size="small"
          InputLabelProps={{ shrink: true }}
        />
      </Grid>
      <Grid item xs={12}>
        <FormControlLabel
          control={
            <Field
              as={Checkbox}
              name="IsActive"
              checked={values.IsActive}
              onChange={() => setFieldValue("IsActive", !values.IsActive)}
            />
          }
          label="Active"
        />
      </Grid>
      {category === "TotalAmountBased" && values.PromotionType === "TotalAmountDiscount" ? (
        <>
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1, mb: 0.5 }}>
              Total amount discount
            </Typography>
            <FormControlLabel
              control={
                <Checkbox
                  size="small"
                  checked={!!values.IsCouponAvailable}
                  onChange={(e) => {
                    const on = e.target.checked;
                    setFieldValue("IsCouponAvailable", on);
                    if (on) {
                      setFieldValue("PromotionTotalAmountLines", []);
                    } else {
                      setFieldValue("PromotionTotalAmountLines", [emptyTotalAmountRow()]);
                      setFieldValue("CouponCode", "");
                      setFieldValue("CouponDiscountValue", "");
                      setFieldValue("CouponDiscountType", 2);
                      setFieldValue("MaxBillAmount", "");
                      setFieldValue("IsOneTimeUse", false);
                    }
                  }}
                />
              }
              label="Is coupon available"
            />
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: -0.5 }}>
              When enabled, the storefront uses the coupon only (no bill-amount tiers). When disabled, configure tiers
              below.
            </Typography>
          </Grid>
          {!values.IsCouponAvailable && (
            <>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1, mb: 0.5 }}>
                  Type-specific settings
                </Typography>
              </Grid>
              {(Array.isArray(values.PromotionTotalAmountLines) && values.PromotionTotalAmountLines.length > 0
                ? values.PromotionTotalAmountLines
                : [emptyTotalAmountRow()]
              ).map((row, index) => {
                const rows =
                  Array.isArray(values.PromotionTotalAmountLines) && values.PromotionTotalAmountLines.length > 0
                    ? values.PromotionTotalAmountLines
                    : [emptyTotalAmountRow()];
                const amountMode = row.discountType === "Value" ? "Value" : "Percentage";
                const patchRow = (patch) => {
                  const base = rows.map((r, i) => (i === index ? { ...r, ...patch } : r));
                  setFieldValue("PromotionTotalAmountLines", base);
                };
                return (
                  <Grid item xs={12} key={`total-amt-${index}`}>
                    <Box
                      sx={{
                        display: "flex",
                        gap: 1,
                        alignItems: "flex-end",
                        flexWrap: "wrap",
                      }}
                    >
                      <Box sx={{ flex: "1 1 160px", minWidth: 140 }}>
                        <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 0.5 }}>
                          Max bill amount (LKR) *
                        </Typography>
                        <TextField
                          fullWidth
                          size="small"
                          type="number"
                          value={row.billValue ?? ""}
                          onChange={(e) => patchRow({ billValue: e.target.value })}
                          placeholder="e.g. 25000"
                          inputProps={{ min: 0 }}
                        />
                      </Box>
                      <Box sx={{ flex: "0 1 140px", minWidth: 120 }}>
                        <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 0.5 }}>Type *</Typography>
                        <TextField
                          select
                          fullWidth
                          size="small"
                          value={amountMode}
                          onChange={(e) => {
                            const nextMode = e.target.value;
                            patchRow({
                              discountType: nextMode,
                              ...(nextMode === "Percentage" ? { value: "" } : { percentage: "" }),
                            });
                          }}
                        >
                          <MenuItem value="Percentage">Percentage</MenuItem>
                          <MenuItem value="Value">Value</MenuItem>
                        </TextField>
                      </Box>
                      <Box sx={{ flex: "0 1 140px", minWidth: 120 }}>
                        <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 0.5 }}>
                          {amountMode === "Value" ? "Value (Rs.) *" : "Percentage (%) *"}
                        </Typography>
                        <TextField
                          fullWidth
                          size="small"
                          type="number"
                          value={amountMode === "Value" ? row.value ?? "" : row.percentage ?? ""}
                          onChange={(e) =>
                            patchRow(
                              amountMode === "Value" ? { value: e.target.value } : { percentage: e.target.value },
                            )
                          }
                          placeholder={amountMode === "Value" ? "e.g. 500" : "e.g. 20"}
                          inputProps={{
                            min: 0,
                            ...(amountMode === "Percentage" ? { max: 100 } : {}),
                          }}
                        />
                      </Box>
                      <IconButton
                        aria-label="Remove tier"
                        onClick={() => {
                          const next = rows.filter((_, i) => i !== index);
                          setFieldValue(
                            "PromotionTotalAmountLines",
                            next.length ? next : [emptyTotalAmountRow()],
                          );
                        }}
                        size="small"
                        disabled={rows.length <= 1}
                        sx={{ mb: 0.25 }}
                      >
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Grid>
                );
              })}
              <Grid item xs={12}>
                <Button
                  startIcon={<AddIcon />}
                  size="small"
                  onClick={() => {
                    const rows = Array.isArray(values.PromotionTotalAmountLines)
                      ? [...values.PromotionTotalAmountLines]
                      : [];
                    rows.push(emptyTotalAmountRow());
                    setFieldValue("PromotionTotalAmountLines", rows);
                  }}
                  variant="outlined"
                >
                  Add tier
                </Button>
              </Grid>
            </>
          )}
          {values.IsCouponAvailable && (
            <>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1, mb: 0.5 }}>
                  Order coupon (storefront)
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 0.5 }}>Coupon code *</Typography>
                <Field
                  as={TextField}
                  fullWidth
                  name="CouponCode"
                  size="small"
                  placeholder="e.g. SAVE10"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      checked={!!values.IsOneTimeUse}
                      onChange={(e) => setFieldValue("IsOneTimeUse", e.target.checked)}
                    />
                  }
                  label={
                    <Typography variant="caption">
                      One time use {values.IsUsed ? "(already used)" : ""}
                    </Typography>
                  }
                  sx={{ mt: 0.5 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 0.5 }}>Type *</Typography>
                <TextField
                  select
                  fullWidth
                  size="small"
                  value={values.CouponDiscountType ?? 2}
                  onChange={(e) => setFieldValue("CouponDiscountType", Number(e.target.value))}
                >
                  <MenuItem value={2}>Percentage</MenuItem>
                  <MenuItem value={1}>Value (Rs.)</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 0.5 }}>
                  {Number(values.CouponDiscountType) === 1 ? "Value (Rs.) *" : "Percentage (%) *"}
                </Typography>
                <Field
                  as={TextField}
                  fullWidth
                  name="CouponDiscountValue"
                  size="small"
                  type="number"
                  placeholder={Number(values.CouponDiscountType) === 1 ? "e.g. 500" : "e.g. 10"}
                  inputProps={{ min: 0, ...(Number(values.CouponDiscountType) === 2 ? { max: 100 } : {}) }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 0.5 }}>
                  Max bill amount (LKR)
                </Typography>
                <Field
                  as={TextField}
                  fullWidth
                  name="MaxBillAmount"
                  size="small"
                  type="number"
                  placeholder="e.g. 50000 (optional)"
                  inputProps={{ min: 0 }}
                />
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                  Leave empty for no limit. When set, coupon is valid only when the order total reaches this amount.
                </Typography>
              </Grid>
            </>
          )}
        </>
      ) : type ? (
        <>
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1, mb: 0.5 }}>
              Type-specific settings
            </Typography>
          </Grid>
          {renderConfigFields()}
        </>
      ) : null}
    </>
  );
}
