/**
 * Professional status accents — saturated enough to distinguish columns,
 * muted enough for office / TV wallboards.
 */
export const STATUS_PALETTE = [
  "#4F6D8C", // slate blue
  "#B45309", // warm amber
  "#0F766E", // deep teal
  "#9F1239", // rose
  "#1D4ED8", // navy blue
  "#6D28D9", // soft violet
  "#B91C1C", // deep red
  "#0E7490", // cyan slate
  "#C2410C", // burnt orange
  "#334155", // charcoal
];

export const STATUS_NAME_COLORS = {
  tentative: "#B45309",
  "pending payment": "#B91C1C",
  "payment complete": "#0F766E",
  "function day": "#1D4ED8",
  "function complete": "#475569",
};

export const hexToRgba = (hex, alpha) => {
  if (!hex || typeof hex !== "string") return `rgba(79,109,140,${alpha})`;
  let h = hex.replace("#", "").trim();
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  if (h.length !== 6) return `rgba(79,109,140,${alpha})`;
  const n = parseInt(h, 16);
  if (Number.isNaN(n)) return `rgba(79,109,140,${alpha})`;
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r},${g},${b},${alpha})`;
};

/** Prefer named professional colors even if older neon ColorCodes were seeded. */
const NEON_TO_PROFESSIONAL = {
  "#f59e0b": "#B45309",
  "#ef4444": "#B91C1C",
  "#10b981": "#0F766E",
  "#ec4899": "#1D4ED8",
  "#6366f1": "#475569",
  "#8b5cf6": "#6D28D9",
  "#3b82f6": "#1D4ED8",
  "#14b8a6": "#0F766E",
  "#f97316": "#C2410C",
  "#0ea5e9": "#0E7490",
};

export const resolveStatusColor = (status, index = 0) => {
  const name = String(status?.name || status?.Name || "")
    .trim()
    .toLowerCase();
  if (STATUS_NAME_COLORS[name]) return STATUS_NAME_COLORS[name];

  const fromDb = status?.colorCode || status?.ColorCode;
  if (fromDb && String(fromDb).trim()) {
    const key = String(fromDb).trim().toLowerCase();
    if (NEON_TO_PROFESSIONAL[key]) return NEON_TO_PROFESSIONAL[key];
    return String(fromDb).trim();
  }

  return STATUS_PALETTE[index % STATUS_PALETTE.length];
};
