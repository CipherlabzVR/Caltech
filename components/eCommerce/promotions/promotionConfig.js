/** ApiResponse.statusCode serializes as numeric 200 on success (ResponseStatusJsonConverter). */
export function isPromotionApiSuccess(data) {
  if (!data) return false;
  const sc = data.statusCode ?? data.StatusCode;
  if (sc == null) return false;
  return sc === 200;
}

// Admin picker: backend enum PromotionCategory; see PROMOTION_CATEGORY_ENUM_TO_VALUE.
export const PROMOTION_CATEGORIES = [
  { value: "ProductBased", label: "Product Based" },
  { value: "CategoryBased", label: "Category Based" },
  { value: "TotalAmountBased", label: "Total Amount Based" },
];

/** Product Based uses only ProductItemDiscount (item + %/value); type is set in code, not chosen here. */
export const PROMOTION_TYPES = {
  CategoryBased: [
    { value: "CategoryDiscount", label: "Category Discount (e.g. 30% off all Electronics)" },
    { value: "BrandDiscount", label: "Brand Discount (e.g. 25% off Samsung products only)" },
    { value: "Clearance", label: "Clearance (Last stock items e.g. 70% off)" },
  ],
};

/** Matches backend enum ApexflowERP.Domain.Enums.PromotionCategory */
export const PROMOTION_CATEGORY_ENUM_TO_VALUE = {
  1: "DiscountBased",
  2: "ProductBased",
  3: "ShippingBased",
  4: "CustomerBased",
  5: "TimeBased",
  6: "CategoryBased",
  7: "TotalAmountBased",
};

export function normalizePromotionCategoryKey(category) {
  if (category == null || category === "") return "";
  if (typeof category === "number") return PROMOTION_CATEGORY_ENUM_TO_VALUE[category] ?? "";
  const n = Number(category);
  if (Number.isFinite(n) && PROMOTION_CATEGORY_ENUM_TO_VALUE[n]) return PROMOTION_CATEGORY_ENUM_TO_VALUE[n];
  return String(category);
}

/** Readable label for any backend enum name (e.g. DiscountBased → Discount Based). */
export function humanizePromotionCategoryEnumKey(key) {
  if (!key) return "";
  return String(key).replace(/([a-z])([A-Z])/g, "$1 $2");
}

/** API body: ECommerce.PromotionCategory rows (DiscountType enum as string) */
export function buildPromotionCategoryLinesPayload(rows) {
  return rows.map((row) => {
    const isValue = row.discountType === "Value";
    const num = Number(isValue ? row.value : row.percentage);
    return {
      categoryId: Number(row.categoryId),
      discountType: isValue ? "Value" : "Percentage",
      value: Number.isFinite(num) ? num : 0,
    };
  });
}

export function emptyCategoryDiscountRow() {
  return {
    categoryId: "",
    categoryName: "",
    discountType: "Percentage",
    percentage: "",
    value: "",
  };
}

/** Product Based → ProductItemDiscount form defaults (lines saved to ECommerce.PromotionCategory with ItemId). */
export function emptyProductItemDiscountConfig() {
  return {
    itemId: "",
    itemName: "",
    itemCode: "",
    discountType: "Percentage",
    percentage: "",
    value: "",
  };
}

/** Rows for API `promotionCategoryLines` (ProductItemDiscount → ECommerce.PromotionCategory with ItemId). */
export function getValidProductItemDiscountRows(configValues) {
  const c = configValues || {};
  const id = c.itemId !== "" && c.itemId != null ? Number(c.itemId) : NaN;
  if (!Number.isFinite(id) || id < 1) return [];
  return [{ ...c, itemId: id }];
}

export function buildPromotionProductItemLinesPayload(rows) {
  return rows.map((row) => {
    const isValue = row.discountType === "Value";
    const num = Number(isValue ? row.value : row.percentage);
    return {
      itemId: Number(row.itemId),
      discountType: isValue ? "Value" : "Percentage",
      value: Number.isFinite(num) ? num : 0,
    };
  });
}

/** Total Amount Based → ECommerce.PromotionTotalAmount tiers (merchandise subtotal before delivery). */
export function emptyTotalAmountRow() {
  return {
    billValue: "",
    discountType: "Percentage",
    percentage: "",
    value: "",
  };
}

export function getValidTotalAmountRows(lines) {
  const arr = Array.isArray(lines) ? lines : [];
  return arr.filter((r) => {
    const bill = Number(r.billValue);
    const isValue = r.discountType === "Value";
    const amt = Number(isValue ? r.value : r.percentage);
    return Number.isFinite(bill) && bill > 0 && Number.isFinite(amt) && amt >= 0;
  });
}

export function buildPromotionTotalAmountLinesPayload(rows) {
  return rows.map((row) => {
    const isValue = row.discountType === "Value";
    const num = Number(isValue ? row.value : row.percentage);
    return {
      billValue: Number(row.billValue),
      discountType: isValue ? "Value" : "Percentage",
      value: Number.isFinite(num) ? num : 0,
    };
  });
}

export function normalizeTotalAmountLinesFromApi(lines) {
  if (!Array.isArray(lines) || lines.length === 0) {
    return [emptyTotalAmountRow()];
  }
  return lines.map((l) => {
    const dt = l.discountType ?? l.DiscountType;
    const mode = dt === 1 || dt === "Value" || dt === "value" ? "Value" : "Percentage";
    const v = l.value != null ? String(l.value) : "";
    return {
      billValue: l.billValue != null ? String(l.billValue) : "",
      discountType: mode,
      percentage: mode === "Percentage" ? v : "",
      value: mode === "Value" ? v : "",
    };
  });
}

/** Map GetPromotionById lines (item rows) to ProductItemDiscount form config. */
export function normalizeProductItemDiscountFromApiLines(lines) {
  if (!Array.isArray(lines) || lines.length === 0) {
    return emptyProductItemDiscountConfig();
  }
  const l = lines.find((x) => x.itemId != null && Number(x.itemId) > 0) ?? lines[0];
  const dt = l.discountType;
  const mode =
    dt === 1 || dt === "Value" || dt === "value" ? "Value" : "Percentage";
  const v = l.value != null ? String(l.value) : "";
  return {
    itemId: l.itemId ?? "",
    itemName: l.itemName ?? "",
    itemCode: l.itemCode ?? "",
    discountType: mode,
    percentage: mode === "Percentage" ? v : "",
    value: mode === "Value" ? v : "",
  };
}

export function validateProductItemDiscountForm(configValues) {
  const c = configValues || {};
  const id = c.itemId !== "" && c.itemId != null ? Number(c.itemId) : NaN;
  if (!Number.isFinite(id) || id < 1) {
    return { ok: false, message: "Select an item" };
  }
  const isValue = c.discountType === "Value";
  const raw = isValue ? c.value : c.percentage;
  const num = Number(raw);
  if (!Number.isFinite(num) || num <= 0) {
    return {
      ok: false,
      message: isValue ? "Enter a valid discount value (Rs.)" : "Enter a valid percentage",
    };
  }
  if (!isValue && num > 100) {
    return { ok: false, message: "Percentage cannot exceed 100" };
  }
  return { ok: true };
}

/** Map GetPromotionById promotionCategoryLines to form ConfigValues.categoryDiscounts */
export function normalizeCategoryDiscountsFromApiLines(lines) {
  if (!Array.isArray(lines) || lines.length === 0) {
    return { categoryDiscounts: [emptyCategoryDiscountRow()] };
  }
  return {
    categoryDiscounts: lines.map((l) => {
      const dt = l.discountType;
      const mode =
        dt === 1 || dt === "Value" || dt === "value" ? "Value" : "Percentage";
      const v = l.value != null ? String(l.value) : "";
      return {
        categoryId: l.categoryId ?? "",
        categoryName: l.categoryName ?? "",
        discountType: mode,
        percentage: mode === "Percentage" ? v : "",
        value: mode === "Value" ? v : "",
      };
    }),
  };
}

/** Rows that have a category selected (id or name) for CategoryDiscount create/update */
export function getValidCategoryDiscountRows(configValues) {
  const rows = Array.isArray(configValues?.categoryDiscounts) ? configValues.categoryDiscounts : [];
  return rows.filter(
    (row) =>
      row &&
      ((row.categoryId !== "" && row.categoryId != null) || (row.categoryName && String(row.categoryName).trim())),
  );
}

/** One DB row: flat JSON (no categories[] array) */
export function buildSingleCategoryDiscountConfigJson(row) {
  if (!row) return null;
  const base = {
    categoryId: row.categoryId !== "" && row.categoryId != null ? Number(row.categoryId) : null,
    categoryName: row.categoryName ? String(row.categoryName).trim() || null : null,
    discountType: row.discountType === "Value" ? "Value" : "Percentage",
  };
  if (base.discountType === "Value") {
    return {
      ...base,
      value: row.value !== "" && row.value != null ? Number(row.value) : null,
      percentage: null,
    };
  }
  return {
    ...base,
    percentage: row.percentage !== "" && row.percentage != null ? Number(row.percentage) : null,
    value: null,
  };
}

// Build ConfigJson from form values based on promotion type
export function buildConfigJson(promotionType, configValues) {
  if (!configValues || typeof configValues !== "object") return null;
  const c = configValues;
  switch (promotionType) {
    case "PercentageOff":
      return { percentage: c.percentage != null ? Number(c.percentage) : null };
    case "FixedAmountOff":
      return {
        fixedAmount: c.fixedAmount != null ? Number(c.fixedAmount) : null,
        minOrderAmount: c.minOrderAmount != null ? Number(c.minOrderAmount) : null,
      };
    case "TieredDiscount": {
      let tiers = c.tiers;
      if (typeof tiers === "string") {
        try {
          tiers = JSON.parse(tiers);
        } catch {
          tiers = [];
        }
      }
      return { tiers: Array.isArray(tiers) ? tiers : [] };
    }
    case "ProductItemDiscount": {
      const id = c.itemId !== "" && c.itemId != null ? Number(c.itemId) : null;
      if (!id || !Number.isFinite(id)) return null;
      const isValue = c.discountType === "Value";
      const num = Number(isValue ? c.value : c.percentage);
      if (!Number.isFinite(num) || num <= 0) return null;
      if (!isValue && num > 100) return null;
      return {
        itemId: id,
        itemName: c.itemName ? String(c.itemName).trim() || null : null,
        itemCode: c.itemCode ? String(c.itemCode).trim() || null : null,
        discountType: isValue ? "Value" : "Percentage",
        value: isValue ? num : null,
        percentage: isValue ? null : num,
      };
    }
    case "FreeShipping":
      return {};
    case "FreeShippingOverAmount":
      return { minOrderAmount: c.minOrderAmount != null ? Number(c.minOrderAmount) : null };
    case "NewUser":
      return { discountAmount: c.discountAmount != null ? Number(c.discountAmount) : null };
    case "LoyaltyVip":
      return {
        tierName: c.tierName || null,
        percentage: c.percentage != null ? Number(c.percentage) : null,
      };
    case "Referral":
      return { amountForBoth: c.amountForBoth != null ? Number(c.amountForBoth) : null };
    case "Birthday":
      return { percentage: c.percentage != null ? Number(c.percentage) : null };
    case "FlashSale":
      return {
        percentage: c.percentage != null ? Number(c.percentage) : null,
        durationHours: c.durationHours != null ? Number(c.durationHours) : null,
      };
    case "WeekendDeal":
      return { percentage: c.percentage != null ? Number(c.percentage) : null };
    case "Seasonal":
      return {
        saleName: c.saleName || null,
        percentage: c.percentage != null ? Number(c.percentage) : null,
      };
    case "DailyDeal":
      return {
        percentage: c.percentage != null ? Number(c.percentage) : null,
        productId: c.productId || null,
      };
    case "CategoryDiscount": {
      const rows = getValidCategoryDiscountRows(c);
      if (rows.length === 0) return null;
      return buildSingleCategoryDiscountConfigJson(rows[0]);
    }
    case "BrandDiscount":
      return {
        brandName: c.brandName || null,
        percentage: c.percentage != null ? Number(c.percentage) : null,
      };
    case "Clearance":
      return {
        percentage: c.percentage != null ? Number(c.percentage) : null,
        description: c.description || null,
      };
    default:
      return null;
  }
}

function mapStoredCategoryDiscountRow(x) {
  const isValue =
    x.discountType === "Value" ||
    (x.value !== undefined && x.value !== null && x.value !== "" && x.discountType !== "Percentage");
  return {
    categoryId: x.categoryId ?? "",
    categoryName: x.categoryName ?? "",
    discountType: isValue ? "Value" : "Percentage",
    percentage: isValue ? "" : x.percentage ?? "",
    value: isValue ? x.value ?? "" : "",
  };
}

/** Normalize stored CategoryDiscount JSON into form shape with categoryDiscounts rows */
export function normalizeCategoryDiscountConfigForForm(c) {
  if (!c || typeof c !== "object") {
    return { categoryDiscounts: [emptyCategoryDiscountRow()] };
  }
  if (Array.isArray(c.categories) && c.categories.length > 0) {
    return {
      categoryDiscounts: c.categories.map((x) => mapStoredCategoryDiscountRow(x)),
    };
  }
  if (c.categoryName != null || c.percentage != null || c.categoryId != null || c.value != null) {
    return {
      categoryDiscounts: [mapStoredCategoryDiscountRow(c)],
    };
  }
  return { categoryDiscounts: [emptyCategoryDiscountRow()] };
}


// Parse promotion type settings JSON into flat config values for the form (legacy: configJson)
export function parseConfigJson(promotionType, promotionTypeSettingsJson) {
  if (!promotionTypeSettingsJson) return {};
  try {
    const c =
      typeof promotionTypeSettingsJson === "string"
        ? JSON.parse(promotionTypeSettingsJson)
        : promotionTypeSettingsJson;
    if (!c || typeof c !== "object") return {};
    if (promotionType === "CategoryDiscount") {
      return normalizeCategoryDiscountConfigForForm(c);
    }
    if (promotionType === "ProductItemDiscount") {
      const itemId = c.itemId ?? c.ItemId;
      const itemName = c.itemName ?? c.ItemName ?? "";
      const itemCode = c.itemCode ?? c.ItemCode ?? "";
      const discountTypeRaw = c.discountType ?? c.DiscountType;
      const pct = c.percentage ?? c.Percentage;
      const val = c.value ?? c.Value;
      const isValue =
        discountTypeRaw === "Value" ||
        discountTypeRaw === 1 ||
        (val != null && val !== "" && (pct == null || pct === ""));
      return {
        ...emptyProductItemDiscountConfig(),
        itemId: itemId ?? "",
        itemName,
        itemCode,
        discountType: isValue ? "Value" : "Percentage",
        percentage: isValue ? "" : pct != null ? String(pct) : "",
        value: isValue ? (val != null ? String(val) : "") : "",
      };
    }
    return { ...c };
  } catch {
    return {};
  }
}
