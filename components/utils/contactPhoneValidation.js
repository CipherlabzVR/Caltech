/**
 * Normalize phone input for validation: trim and strip common formatting only.
 */
export function normalizeContactPhoneInput(value) {
  return String(value ?? "")
    .trim()
    .replace(/[\s\-.()]/g, "");
}

/**
 * After normalization: optional leading + (international), then digits.
 * Aligns with E.164 max length (15 digits); minimum length 7 for practical numbers.
 */
const NORMALIZED_CONTACT_PHONE =
  /^(\+[1-9]\d{6,14}|[0-9]{7,15})$/;

/**
 * @param {string} [value] — empty / whitespace-only counts as valid (optional fields)
 */
export function isValidContactPhone(value) {
  const n = normalizeContactPhoneInput(value);
  if (!n) return true;
  return NORMALIZED_CONTACT_PHONE.test(n);
}
