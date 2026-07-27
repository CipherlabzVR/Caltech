import * as Yup from "yup";

export const WHOLE_NUMBER_ERROR = "Enter a whole number (0 or greater)";

export function isWholeNumberInput(raw) {
  if (raw === "" || raw === null || raw === undefined) return true;
  return /^\d+$/.test(String(raw).trim());
}

export function isDecimalInput(raw) {
  if (raw === "" || raw === null || raw === undefined) return true;
  const str = String(raw).trim();
  if (str === ".") return true;
  return /^\d*\.?\d*$/.test(str);
}

export function parseDecimalInput(raw) {
  if (raw === "" || raw === null || raw === undefined) {
    return { valid: true, value: 0 };
  }
  const str = String(raw).trim();
  if (!/^\d*\.?\d+$/.test(str) || str === ".") {
    return { valid: false, value: null, message: "Enter a valid number (0 or greater)" };
  }
  return { valid: true, value: parseFloat(str) };
}

export function parseWholeNumberInput(raw) {
  if (raw === "" || raw === null || raw === undefined) {
    return { valid: true, value: 0 };
  }
  const str = String(raw).trim();
  if (!/^\d+$/.test(str)) {
    return { valid: false, value: null, message: WHOLE_NUMBER_ERROR };
  }
  return { valid: true, value: parseInt(str, 10) };
}

export function buildWholeNumberYup(label) {
  return Yup.number()
    .transform((value, originalValue) =>
      originalValue === "" || originalValue === null ? 0 : value
    )
    .typeError(`${label} must be a whole number`)
    .integer(`${label} must be a whole number`)
    .min(0, `${label} cannot be negative`);
}

export function buildDecimalYup(label) {
  return Yup.number()
    .transform((value, originalValue) =>
      originalValue === "" || originalValue === null ? 0 : value
    )
    .typeError(`${label} must be a valid number`)
    .min(0, `${label} cannot be negative`);
}

/**
 * Normal size total:
 * - Apparel types (1, 2, 7, 8): sum of all standard size quantities (2XS through 5XL).
 * - Bag type (6): sum of Side Width (5XL field) + Width + Height (length field).
 */
export function calculateNormalSizeTotal({
  inqType,
  twoXS = 0,
  xs = 0,
  s = 0,
  m = 0,
  l = 0,
  xl = 0,
  twoXL = 0,
  threeXL = 0,
  fourXL = 0,
  fiveXL = 0,
  width = 0,
  length = 0,
}) {
  const n = (v) => parseInt(v, 10) || 0;

  if (inqType === 6) {
    return n(fiveXL) + n(width) + n(length);
  }

  return (
    n(twoXS) +
    n(xs) +
    n(s) +
    n(m) +
    n(l) +
    n(xl) +
    n(twoXL) +
    n(threeXL) +
    n(fourXL) +
    n(fiveXL)
  );
}

export function buildNormalSizeValidationSchema() {
  const field = (label) => buildWholeNumberYup(label);

  return Yup.object().shape({
    TwoXS: field("2XS"),
    XS: field("XS"),
    S: field("S"),
    M: field("M"),
    L: field("L"),
    XL: field("XL"),
    TwoXL: field("2XL"),
    ThreeXL: field("3XL"),
    FourXL: field("4XL"),
    FiveXL: field("5XL"),
    Width: field("Width"),
    Length: field("Length"),
    TotalQty: field("Total").min(
      1,
      "Total quantity must be at least 1"
    ),
    SizeName: Yup.string().required("Size Name is required"),
    Sleavetype: Yup.string(),
  });
}

/** Special size quantity is entered manually (not derived from width/length). */
export function getSpecialSizeQuantity(values = {}) {
  return parseInt(values.totalQty ?? values.TotalQty ?? 0, 10) || 0;
}

export function buildSpecialSizeValidationSchema() {
  return Yup.object().shape({
    SizeName: Yup.string().required("Size Name is required"),
    Width: buildDecimalYup("Width"),
    Length: buildDecimalYup("Length"),
    TotalQty: buildWholeNumberYup("Quantity").min(
      1,
      "Quantity must be at least 1"
    ),
    Sleavetype: Yup.string(),
  });
}
