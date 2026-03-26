import React from "react";
import { Grid, Typography, TextField, FormControlLabel, Checkbox, Autocomplete } from "@mui/material";
import { Field } from "formik";
import { PROMOTION_CATEGORIES, PROMOTION_TYPES } from "@/components/eCommerce/promotions/promotionConfig";

export default function PromotionFormFields({ values, setFieldValue, errors, touched, isEdit }) {
  const category = values.PromotionCategory;
  const type = values.PromotionType;
  const types = category ? PROMOTION_TYPES[category] || [] : [];

  // Resolve display value for Category (predefined option or custom string)
  const categoryOption = PROMOTION_CATEGORIES.find((c) => c.value === category) || (category ? { value: category, label: category } : null);
  const typeOption = types.find((t) => t.value === type) || (type ? { value: type, label: type } : null);

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
      case "BuyXGetYFree":
        return (
          <>
            <Grid item xs={12} sm={6}>
              <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 0.5 }}>Buy Quantity</Typography>
              <TextField
                fullWidth
                size="small"
                type="number"
                value={config.buyQuantity ?? ""}
                onChange={(e) => setConfig("buyQuantity", e.target.value)}
                placeholder="e.g. 2"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 0.5 }}>Get Free Quantity</Typography>
              <TextField
                fullWidth
                size="small"
                type="number"
                value={config.getQuantity ?? ""}
                onChange={(e) => setConfig("getQuantity", e.target.value)}
                placeholder="e.g. 1"
              />
            </Grid>
          </>
        );
      case "BundleDeal":
        return (
          <>
            <Grid item xs={12} sm={6}>
              <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 0.5 }}>Bundle Discount (Rs.)</Typography>
              <TextField
                fullWidth
                size="small"
                type="number"
                value={config.bundleDiscountAmount ?? ""}
                onChange={(e) => setConfig("bundleDiscountAmount", e.target.value)}
                placeholder="e.g. 1000"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 0.5 }}>Description</Typography>
              <TextField
                fullWidth
                size="small"
                value={config.description ?? ""}
                onChange={(e) => setConfig("description", e.target.value)}
                placeholder="e.g. phone + case"
              />
            </Grid>
          </>
        );
      case "FreeGift":
        return (
          <>
            <Grid item xs={12} sm={6}>
              <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 0.5 }}>Min Order Amount (Rs.)</Typography>
              <TextField
                fullWidth
                size="small"
                type="number"
                value={config.minOrderAmount ?? ""}
                onChange={(e) => setConfig("minOrderAmount", e.target.value)}
                placeholder="e.g. 5000"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 0.5 }}>Free Gift Description</Typography>
              <TextField
                fullWidth
                size="small"
                value={config.freeGiftDescription ?? ""}
                onChange={(e) => setConfig("freeGiftDescription", e.target.value)}
                placeholder="e.g. free item"
              />
            </Grid>
          </>
        );
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
      case "CategoryDiscount":
        return (
          <>
            <Grid item xs={12} sm={4}>
              <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 0.5 }}>Category ID</Typography>
              <TextField
                fullWidth
                size="small"
                type="number"
                value={config.categoryId ?? ""}
                onChange={(e) => setConfig("categoryId", e.target.value)}
                placeholder="optional"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 0.5 }}>Category Name</Typography>
              <TextField
                fullWidth
                size="small"
                value={config.categoryName ?? ""}
                onChange={(e) => setConfig("categoryName", e.target.value)}
                placeholder="e.g. Electronics"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 0.5 }}>Percentage (%)</Typography>
              <TextField
                fullWidth
                size="small"
                type="number"
                value={config.percentage ?? ""}
                onChange={(e) => setConfig("percentage", e.target.value)}
                placeholder="e.g. 30"
              />
            </Grid>
          </>
        );
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
      <Grid item xs={12} sm={6}>
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
            setFieldValue("PromotionType", "");
            setFieldValue("ConfigValues", {});
          }}
          onInputChange={(e, inputValue) => {
            if (e?.type === "change" && inputValue !== undefined) {
              const trimmed = (inputValue ?? "").trim();
              setFieldValue("PromotionCategory", trimmed);
              if (trimmed) {
                setFieldValue("PromotionType", "");
                setFieldValue("ConfigValues", {});
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
      <Grid item xs={12} sm={6}>
        <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 0.5 }}>Type *</Typography>
        <Autocomplete
          freeSolo
          size="small"
          options={types}
          getOptionLabel={(opt) => (opt && (opt.label ?? opt.value ?? opt)) || ""}
          value={typeOption}
          onChange={(e, newValue) => {
            const val = newValue && typeof newValue === "object" ? newValue.value : newValue || "";
            setFieldValue("PromotionType", val);
            setFieldValue("ConfigValues", {});
          }}
          onInputChange={(e, inputValue) => {
            if (e?.type === "change" && inputValue !== undefined) {
              const trimmed = (inputValue ?? "").trim();
              const match = types.find((t) => t.value === trimmed || t.label === trimmed);
              setFieldValue("PromotionType", match ? match.value : trimmed);
              if (trimmed && !match) setFieldValue("ConfigValues", {});
            }
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="Select or type manually"
              error={touched.PromotionType && Boolean(errors.PromotionType)}
              helperText={touched.PromotionType && errors.PromotionType}
            />
          )}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Typography sx={{ fontWeight: 500, fontSize: "14px", mb: 0.5 }}>Coupon Code</Typography>
        <Field as={TextField} fullWidth name="CouponCode" size="small" placeholder="Optional" />
      </Grid>
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
      {type ? (
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
