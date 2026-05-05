import * as Yup from "yup";

const CODE_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_\- .]*$/;
const NAME_PATTERN = /^[A-Za-z0-9][A-Za-z0-9 _\-./()&,]*$/;

export const assetValidationSchema = Yup.object().shape({
  AssetCode: Yup.string()
    .trim()
    .required("Asset code is required")
    .max(50, "Max 50 characters")
    .matches(CODE_PATTERN, "Invalid characters"),

  AssetName: Yup.string()
    .trim()
    .required("Asset name is required")
    .max(100, "Max 100 characters")
    .matches(NAME_PATTERN, "Invalid characters"),

  CategoryId: Yup.number()
    .typeError("Category is required")
    .required("Category is required")
    .min(1, "CategoryId must be greater than 0"),

  SerialNumber: Yup.string().nullable().max(100, "Max 100 characters"),
  ModelNumber: Yup.string().nullable().max(100, "Max 100 characters"),
  VendorId: Yup.number().nullable(),

  PurchaseDate: Yup.date().required("Purchase date is required").typeError("Invalid Date"),
  
  PurchaseCost: Yup.number()
    .typeError("PurchaseCost must be a number")
    .required("PurchaseCost is required")
    .min(0.01, "PurchaseCost must be greater than 0"),

  CurrencyCode: Yup.string()
    .required("Currency code is required")
    .length(3, "Must be exactly 3 characters"),

  LocationId: Yup.number().nullable(),
  CustodianId: Yup.number().nullable(),
  DepartmentId: Yup.number().nullable(),

  EntityId: Yup.number()
    .typeError("Entity is required")
    .required("Entity is required")
    .min(1, "EntityId must be greater than 0"),

  Barcode: Yup.string().nullable().max(100, "Max 100 characters"),
  
  WarrantyExpiry: Yup.date()
    .nullable()
    .typeError("Invalid Date")
    .min(
      Yup.ref("PurchaseDate"),
      "Warranty expiry cannot be before Purchase Date"
    ),

  UsefulLifeMonths: Yup.number()
    .typeError("UsefulLifeMonths is required")
    .required("UsefulLifeMonths is required")
    .min(1, "UsefulLifeMonths must be greater than 0")
    .integer("Must be a whole number"),

  SalvageValue: Yup.number()
    .nullable()
    .min(0, "SalvageValue cannot be negative")
    .typeError("Must be a number"),

  PoNumber: Yup.string().nullable().max(100, "Max 100 characters"),
  GrnNumber: Yup.string().nullable().max(100, "Max 100 characters"),

  ReducingBalanceRate: Yup.number()
    .nullable()
    .min(0, "ReducingBalanceRate must be between 0 and 100")
    .max(100, "ReducingBalanceRate must be between 0 and 100")
    .typeError("Must be a number"),

  TotalProductionUnits: Yup.number()
    .nullable()
    .min(0, "TotalProductionUnits cannot be negative")
    .integer("Must be whole number")
    .typeError("Must be a number"),

  UnitsUsedToDate: Yup.number()
    .nullable()
    .min(0, "UnitsUsedToDate cannot be negative")
    .integer("Must be whole number")
    .typeError("Must be a number"),

  Notes: Yup.string().nullable(),
});
