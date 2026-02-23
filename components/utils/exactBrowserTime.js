import dayjs from "dayjs";

/**
 * Convert a date to ISO string preserving the exact browser time
 * This sends the date with timezone offset so backend receives exact time
 */
export const toExactBrowserTimeISOString = (date) => {
  if (!date) return null;
  
  // If it's already a dayjs object, use it; otherwise create one
  const dayjsDate = dayjs.isDayjs(date) ? date : dayjs(date);
  
  // Convert to native Date to get timezone offset
  const nativeDate = dayjsDate.toDate();
  
  // Get the timezone offset in minutes (negative for ahead of UTC, positive for behind)
  // JavaScript's getTimezoneOffset() returns offset in minutes, but inverted (UTC+5:30 = -330)
  const offsetMinutes = -nativeDate.getTimezoneOffset();
  
  // Format as ISO string with timezone offset (e.g., "2025-01-15T10:00:00+05:30")
  // This preserves the exact time the user selected
  const year = dayjsDate.year();
  const month = String(dayjsDate.month() + 1).padStart(2, '0');
  const day = String(dayjsDate.date()).padStart(2, '0');
  const hour = String(dayjsDate.hour()).padStart(2, '0');
  const minute = String(dayjsDate.minute()).padStart(2, '0');
  const second = String(dayjsDate.second()).padStart(2, '0');
  
  // Calculate offset string (+HH:MM or -HH:MM)
  const offsetHours = Math.floor(Math.abs(offsetMinutes) / 60);
  const offsetMins = Math.abs(offsetMinutes) % 60;
  const offsetSign = offsetMinutes >= 0 ? '+' : '-';
  const offsetString = `${offsetSign}${String(offsetHours).padStart(2, '0')}:${String(offsetMins).padStart(2, '0')}`;
  
  return `${year}-${month}-${day}T${hour}:${minute}:${second}${offsetString}`;
};

/**
 * Parse a date string from backend and return dayjs object
 * Preserves the exact time without timezone conversion
 */
export const fromExactBrowserTime = (dateString) => {
  if (!dateString) return null;
  
  // Parse the date string - it should already be in the correct timezone
  // dayjs will parse it and preserve the time
  return dayjs(dateString);
};

/**
 * Get current date/time in browser's local timezone
 */
export const getBrowserNow = () => {
  return dayjs();
};

