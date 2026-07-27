/**
 * Normalize NIC input: new format up to 12 digits, old format up to 9 digits + optional trailing V or X.
 * Uppercase; strips invalid characters.
 */
export function normalizeNicInput(raw) {
  const u = String(raw ?? "").toUpperCase().replace(/[^0-9VX]/g, "");
  if (!u) return "";
  const last = u[u.length - 1];
  const digits = u.replace(/\D/g, "");
  if (last === "V" || last === "X") {
    if (digits.length <= 9) {
      return digits.slice(0, 9) + last;
    }
    // New NIC is 12 digits only; ignore a stray trailing letter.
    return digits.slice(0, 12);
  }
  return digits.slice(0, 12);
}

/**
 * Decode the calendar year encoded in a Sri Lankan NIC prefix (old 9-digit YY… or new 12-digit YYYY…).
 * Returns null if the value is not a complete 9- or 12-digit NIC.
 */
export function getNicBirthYearFromNic(value) {
  if (value === undefined || value === null) return null;
  const v = String(value).replace(/\D/g, "");
  if (!/^\d{9}(\d{3})?$/.test(v)) return null;

  if (v.length === 9) {
    const yy = parseInt(v.slice(0, 2), 10);
    if (Number.isNaN(yy)) return null;
    const currentYear = new Date().getFullYear();
    const prefix = Math.floor(currentYear / 100) * 100;
    const threshold = 50;
    return yy <= threshold ? prefix + yy : prefix - 100 + yy;
  }

  const yyyy = parseInt(v.slice(0, 4), 10);
  return Number.isNaN(yyyy) ? null : yyyy;
}

const MIN_BIRTH_YEAR = 1900;

export function isPlausibleCustomerNicBirthYear(year) {
  const maxYear = new Date().getFullYear();
  return Number.isFinite(year) && year >= MIN_BIRTH_YEAR && year <= maxYear;
}

export function getNicBirthYearErrorMessage(nic) {
  const year = getNicBirthYearFromNic(nic);
  if (year === null) return null;
  if (isPlausibleCustomerNicBirthYear(year)) return null;
  return "Invalid NIC";
}

export function parseIsoDateYear(isoDateString) {
  if (!isoDateString || typeof isoDateString !== "string") return null;
  const m = String(isoDateString).trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  const y = parseInt(m[1], 10);
  return Number.isNaN(y) ? null : y;
}

export function getDateOfBirthYearErrorMessage(isoDateString) {
  const y = parseIsoDateYear(isoDateString);
  if (y === null) return null;
  const maxYear = new Date().getFullYear();
  if (y >= MIN_BIRTH_YEAR && y <= maxYear) return null;
  if (y < MIN_BIRTH_YEAR) {
    return `Date of birth is not valid: the year ${y} is not a valid year of birth.`;
  }
  return `Date of birth cannot be after ${maxYear}.`;
}
