// Promotion categories and types for ECommerce modal
export const PROMOTION_CATEGORIES = [
  { value: "DiscountBased", label: "Discount Based" },
  { value: "ProductBased", label: "Product Based" },
  { value: "ShippingBased", label: "Shipping Based" },
  { value: "CustomerBased", label: "Customer Based" },
  { value: "TimeBased", label: "Time Based" },
  { value: "CategoryBased", label: "Category Based" },
];

export const PROMOTION_TYPES = {
  DiscountBased: [
    { value: "PercentageOff", label: "Percentage Off (e.g. 20% off entire order)" },
    { value: "FixedAmountOff", label: "Fixed Amount Off (e.g. Rs. 500 off orders over Rs. 3000)" },
    { value: "TieredDiscount", label: "Tiered Discount (e.g. Spend Rs. 5000 -> 10%, Rs. 10000 -> 20%)" },
  ],
  ProductBased: [
    { value: "BuyXGetYFree", label: "Buy X Get Y Free (e.g. Buy 2 get 1 free)" },
    { value: "BundleDeal", label: "Bundle Deal (e.g. Buy phone + case = Rs. 1000 off)" },
    { value: "FreeGift", label: "Free Gift (e.g. Orders over Rs. 5000 get a free item)" },
  ],
  ShippingBased: [
    { value: "FreeShipping", label: "Free Shipping (Free delivery on all orders)" },
    { value: "FreeShippingOverAmount", label: "Free Shipping Over Amount (e.g. over Rs. 2000)" },
  ],
  CustomerBased: [
    { value: "NewUser", label: "New User (First order Rs. 500 off)" },
    { value: "LoyaltyVip", label: "Loyalty / VIP (e.g. Platinum members get 15% always)" },
    { value: "Referral", label: "Referral (Refer a friend -> both get Rs. 300)" },
    { value: "Birthday", label: "Birthday (10% off during birthday month)" },
  ],
  TimeBased: [
    { value: "FlashSale", label: "Flash Sale (e.g. 50% off for 24 hours only)" },
    { value: "WeekendDeal", label: "Weekend Deal (Saturday & Sunday only discount)" },
    { value: "Seasonal", label: "Seasonal (e.g. Avurudu Sale, Christmas Sale)" },
    { value: "DailyDeal", label: "Daily Deal (One product heavily discounted per day)" },
  ],
  CategoryBased: [
    { value: "CategoryDiscount", label: "Category Discount (e.g. 30% off all Electronics)" },
    { value: "BrandDiscount", label: "Brand Discount (e.g. 25% off Samsung products only)" },
    { value: "Clearance", label: "Clearance (Last stock items e.g. 70% off)" },
  ],
};

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
    case "BuyXGetYFree":
      return {
        buyQuantity: c.buyQuantity != null ? Number(c.buyQuantity) : null,
        getQuantity: c.getQuantity != null ? Number(c.getQuantity) : null,
      };
    case "BundleDeal":
      return {
        bundleDiscountAmount: c.bundleDiscountAmount != null ? Number(c.bundleDiscountAmount) : null,
        description: c.description || null,
      };
    case "FreeGift":
      return {
        minOrderAmount: c.minOrderAmount != null ? Number(c.minOrderAmount) : null,
        freeGiftDescription: c.freeGiftDescription || null,
      };
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
    case "CategoryDiscount":
      return {
        categoryId: c.categoryId != null ? Number(c.categoryId) : null,
        categoryName: c.categoryName || null,
        percentage: c.percentage != null ? Number(c.percentage) : null,
      };
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

// Parse ConfigJson into flat config values for the form
export function parseConfigJson(promotionType, configJson) {
  if (!configJson) return {};
  try {
    const c = typeof configJson === "string" ? JSON.parse(configJson) : configJson;
    if (!c || typeof c !== "object") return {};
    return { ...c };
  } catch {
    return {};
  }
}
