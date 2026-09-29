/** Session category while dedicated dashboard permission (201) is not migrated yet. */
export const SESSION_CATEGORY_ID = 197;
/** Future dedicated permission category — migration: AddServiceManagementDashboardCategory */
export const CATEGORY_ID = 201;

export const STATUS_OPTIONS = [
  "Received",
  "Diagnosed",
  "AwaitingApproval",
  "Approved",
  "InProgress",
  "OnHold",
  "Ready",
  "Delivered",
  "Cancelled",
  "AwaitingPartsApproval",
  "Unrepairable",
];

export const STATUS_LABEL_DISPLAY = {
  AwaitingApproval: "Awaiting Customer Approval",
  AwaitingPartsApproval: "Awaiting Parts Approval",
  Unrepairable: "Can't Repair",
};

export const STATUS_COLOR = {
  Received: "default",
  Diagnosed: "info",
  AwaitingApproval: "warning",
  AwaitingPartsApproval: "warning",
  Approved: "primary",
  InProgress: "secondary",
  OnHold: "warning",
  Ready: "success",
  Delivered: "success",
  Cancelled: "error",
  Unrepairable: "error",
};

export const PIPELINE_GROUPS = {
  Pending: ["Received", "Diagnosed", "AwaitingApproval", "AwaitingPartsApproval"],
  Assigned: ["Approved"],
  InProgress: ["InProgress", "OnHold"],
  Completed: ["Ready", "Delivered"],
  Cancelled: ["Cancelled"],
  Unrepairable: ["Unrepairable"],
};

export function statusLabel(value) {
  if (typeof value === "string") return value;
  return STATUS_OPTIONS[(value || 1) - 1] ?? "Received";
}

export function statusDisplay(value) {
  const name = statusLabel(value);
  return STATUS_LABEL_DISPLAY[name] || name;
}

export function getPipelineGroup(status) {
  const name = statusLabel(status);
  return (
    Object.entries(PIPELINE_GROUPS).find(([, statuses]) => statuses.includes(name))?.[0] ||
    "Pending"
  );
}

export function isSameDay(dateStr, ref = new Date()) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const r = new Date(ref);
  d.setHours(0, 0, 0, 0);
  r.setHours(0, 0, 0, 0);
  return d.getTime() === r.getTime();
}

export function isInDateRange(dateStr, startDate, endDate) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (startDate) {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    if (d < start) return false;
  }
  if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    if (d > end) return false;
  }
  return true;
}

export const CARD_SX = {
  height: "100%",
  bgcolor: "white",
  border: "1px solid #E5E7EB",
  borderRadius: 2,
  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
  transition: "all 0.2s ease",
  "&:hover": {
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
  },
};

export const SECTION_TITLE_SX = {
  fontWeight: 600,
  color: "#111827",
  mb: 3,
  fontSize: { xs: "1.25rem", md: "1.5rem" },
};

/** Header + filter bar (title row and controls in one card). */
export const HEADER_SECTION_SX = {
  bgcolor: "white",
  border: "1px solid #E5E7EB",
  borderRadius: 2,
  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
  mb: 3,
  overflow: "visible",
};
