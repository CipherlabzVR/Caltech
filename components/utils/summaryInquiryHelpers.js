export const NEGATIVE_PROFIT_ERROR = "Profit cannot be negative";
export const INVALID_DECIMAL_ERROR = "Enter a valid number (decimals allowed)";

export function isValidDecimalInput(raw) {
  if (raw === "" || raw === null || raw === undefined) return true;
  return /^\d*\.?\d*$/.test(String(raw).trim());
}

export function isValidSignedDecimalInput(raw) {
  if (raw === "" || raw === null || raw === undefined) return true;
  return /^-?\d*\.?\d*$/.test(String(raw).trim());
}

export function parseDecimalInput(raw) {
  if (raw === "" || raw === null || raw === undefined || raw === "." || raw === "-") {
    return { valid: true, value: 0 };
  }

  const str = String(raw).trim();
  if (!/^-?\d*\.?\d*$/.test(str)) {
    return { valid: false, value: null, message: INVALID_DECIMAL_ERROR };
  }

  const value = parseFloat(str);
  return { valid: true, value: Number.isNaN(value) ? 0 : value };
}

export function validateProfitValue(raw) {
  const parsed = parseDecimalInput(raw);
  if (!parsed.valid) return parsed;

  if (parsed.value < 0) {
    return { valid: false, value: parsed.value, message: NEGATIVE_PROFIT_ERROR };
  }

  return parsed;
}

export function toDecimalInputValue(value) {
  if (value === "" || value === null || value === undefined) return "0";
  return String(value);
}

export const ADVANCE_PAYMENT_RANGE_ERROR =
  "Advance payment must be between 0 and 100";

export function validateAdvancePaymentPercentage(raw) {
  const parsed = parseDecimalInput(raw);
  if (!parsed.valid) return parsed;

  if (parsed.value < 0 || parsed.value > 100) {
    return {
      valid: false,
      value: parsed.value,
      message: ADVANCE_PAYMENT_RANGE_ERROR,
    };
  }

  return parsed;
}
