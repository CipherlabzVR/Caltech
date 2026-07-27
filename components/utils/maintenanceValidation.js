import * as Yup from "yup";

export const scheduleValidationSchema = Yup.object().shape({
  AssetId: Yup.number()
    .typeError("Asset is required")
    .required("Asset is required")
    .min(1, "Asset is required"),
  
  MaintenanceType: Yup.number()
    .required("Maintenance type is required")
    .min(1, "Invalid maintenance type"),

  Description: Yup.string()
    .trim()
    .required("Description is required")
    .max(500, "Max 500 characters"),

  IntervalDays: Yup.number()
    .typeError("Interval days must be a number")
    .required("Interval days is required")
    .min(1, "Interval must be at least 1 day")
    .integer("Must be a whole number"),

  LastMaintenanceDate: Yup.date()
    .nullable()
    .typeError("Invalid Date"),

  NextMaintenanceDate: Yup.date()
    .required("Next maintenance date is required")
    .typeError("Invalid Date"),

  EstimatedCost: Yup.number()
    .nullable()
    .min(0, "Estimated cost cannot be negative")
    .typeError("Must be a number"),

  IsActive: Yup.boolean().required(),
});

export const workOrderValidationSchema = Yup.object().shape({
  WorkOrderNumber: Yup.string()
    .trim()
    .required("Work order number is required")
    .max(50, "Max 50 characters"),

  AssetId: Yup.number()
    .typeError("Asset is required")
    .required("Asset is required")
    .min(1, "Asset is required"),

  MaintenanceScheduleId: Yup.number().nullable(),

  WorkOrderType: Yup.number()
    .required("Work order type is required")
    .min(1, "Invalid work order type"),

  Status: Yup.number()
    .required("Status is required")
    .min(1, "Invalid status"),

  Priority: Yup.number()
    .required("Priority is required")
    .min(1, "Invalid priority"),

  Description: Yup.string()
    .trim()
    .required("Description is required")
    .max(500, "Max 500 characters"),

  ScheduledDate: Yup.date()
    .required("Scheduled date is required")
    .typeError("Invalid Date"),

  EstimatedCost: Yup.number()
    .nullable()
    .min(0, "Estimated cost cannot be negative")
    .typeError("Must be a number"),
});

/** Edit work order: scheduled date may be null (matches API DateTime?). */
export const workOrderEditValidationSchema = Yup.object().shape({
  WorkOrderNumber: Yup.string()
    .trim()
    .required("Work order number is required")
    .max(50, "Max 50 characters"),

  AssetId: Yup.number()
    .typeError("Asset is required")
    .required("Asset is required")
    .min(1, "Asset is required"),

  MaintenanceScheduleId: Yup.number().nullable(),

  WorkOrderType: Yup.number()
    .required("Work order type is required")
    .min(1, "Invalid work order type"),

  Status: Yup.number()
    .required("Status is required")
    .min(1, "Invalid status"),

  Priority: Yup.number()
    .required("Priority is required")
    .min(1, "Invalid priority"),

  Description: Yup.string()
    .trim()
    .required("Description is required")
    .max(500, "Max 500 characters"),

  ScheduledDate: Yup.string()
    .nullable()
    .test("valid-date", "Invalid date", (v) => !v || String(v).trim() === "" || !Number.isNaN(Date.parse(v))),

  EstimatedCost: Yup.number()
    .nullable()
    .min(0, "Estimated cost cannot be negative")
    .typeError("Must be a number"),

  ActualCost: Yup.number()
    .nullable()
    .min(0, "Actual cost cannot be negative")
    .typeError("Must be a number"),
});
