import * as Yup from "yup";

const CODE_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_\- .]*$/;
const NAME_PATTERN = /^[A-Za-z0-9][A-Za-z0-9 _\-./()&,]*$/;
const GL_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_\-.]*$/;

export const depreciationMethodValues = [1, 2, 3, 4];

export const assetCategoryValidationSchema = Yup.object().shape({
  CategoryCode: Yup.string()
    .trim()
    .required("Category code is required")
    .min(2, "Min 2 characters")
    .max(20, "Max 20 characters")
    .matches(
      CODE_PATTERN,
      "Use letters, numbers, dot, dash, underscore or space"
    ),

  CategoryName: Yup.string()
    .trim()
    .required("Category name is required")
    .min(2, "Min 2 characters")
    .max(100, "Max 100 characters")
    .matches(
      NAME_PATTERN,
      "Only letters, numbers and . _ - / ( ) & , are allowed"
    ),

  ParentCategoryId: Yup.mixed()
    .nullable()
    .test(
      "parent-id-int",
      "Invalid parent category",
      (v) => v == null || v === "" || Number.isInteger(Number(v))
    ),

  DepreciationMethod: Yup.number()
    .typeError("Depreciation method is required")
    .oneOf(depreciationMethodValues, "Select a valid method")
    .required("Depreciation method is required"),

  DefaultUsefulLifeMonths: Yup.number()
    .typeError("Useful life is required")
    .integer("Must be a whole number")
    .min(1, "Must be at least 1 month")
    .max(1200, "Cannot exceed 1200 months (100 years)")
    .required("Useful life is required"),

  DefaultSalvagePct: Yup.number()
    .typeError("Salvage % must be a number")
    .min(0, "Cannot be negative")
    .max(100, "Cannot exceed 100")
    .test(
      "two-decimals",
      "Up to 2 decimal places",
      (v) => v == null || /^\d+(\.\d{1,2})?$/.test(String(v))
    )
    .required("Salvage % is required"),

  GlAssetAccount: Yup.string()
    .trim()
    .required("GL Asset account is required")
    .max(50, "Max 50 characters")
    .matches(GL_PATTERN, "Use letters, numbers, dot, dash or underscore"),

  GlAccumDepreciationAccount: Yup.string()
    .trim()
    .required("GL Accum. Depreciation account is required")
    .max(50, "Max 50 characters")
    .matches(GL_PATTERN, "Use letters, numbers, dot, dash or underscore")
    .test(
      "different-from-asset",
      "Must be different from GL Asset account",
      function (value) {
        const asset = (this.parent.GlAssetAccount || "").trim();
        return !value || !asset || value.trim() !== asset;
      }
    ),

  GlDepreciationExpenseAccount: Yup.string()
    .trim()
    .required("GL Depreciation Expense account is required")
    .max(50, "Max 50 characters")
    .matches(GL_PATTERN, "Use letters, numbers, dot, dash or underscore")
    .test(
      "different-from-asset",
      "Must be different from GL Asset account",
      function (value) {
        const asset = (this.parent.GlAssetAccount || "").trim();
        return !value || !asset || value.trim() !== asset;
      }
    )
    .test(
      "different-from-accum",
      "Must be different from GL Accum. Depreciation account",
      function (value) {
        const accum = (this.parent.GlAccumDepreciationAccount || "").trim();
        return !value || !accum || value.trim() !== accum;
      }
    ),

  RequiresMaintenance: Yup.boolean(),

  MaintenanceIntervalDays: Yup.number()
    .nullable()
    .transform((v, original) =>
      original === "" || original == null ? null : v
    )
    .when("RequiresMaintenance", {
      is: true,
      then: (s) =>
        s
          .typeError("Maintenance interval is required")
          .integer("Must be a whole number")
          .min(1, "Must be at least 1 day")
          .max(3650, "Cannot exceed 3650 days (10 years)")
          .required("Maintenance interval is required"),
      otherwise: (s) => s.notRequired(),
    }),

  IsActive: Yup.boolean().required(),
});
