/** Half-hour slots from 6:00 AM to 11:30 PM, formatted for Google Calendar parsing. */
export function buildEventTimeOptions() {
  const options = [];
  for (let minutes = 6 * 60; minutes <= 23 * 60 + 30; minutes += 30) {
    const h24 = Math.floor(minutes / 60);
    const m = minutes % 60;
    const period = h24 >= 12 ? "PM" : "AM";
    const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
    const label = `${h12}:${m.toString().padStart(2, "0")} ${period}`;
    options.push(label);
  }
  return options;
}

export const EVENT_TIME_OPTIONS = buildEventTimeOptions();

/**
 * Normalize free-text times (e.g. "5.00pm", "17:00") into a dropdown option when possible.
 */
export function normalizeEventTime(value) {
  if (!value || typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (EVENT_TIME_OPTIONS.includes(trimmed)) return trimmed;

  const match = trimmed.match(/^(\d{1,2})[:.](\d{2})\s*(am|pm)?$/i);
  if (!match) return trimmed;

  let hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);
  let period = (match[3] || "").toUpperCase();

  if (!period) {
    if (hour >= 0 && hour <= 23) {
      period = hour >= 12 ? "PM" : "AM";
      hour = hour % 12 === 0 ? 12 : hour % 12;
    } else {
      return trimmed;
    }
  } else if (hour === 0) {
    hour = 12;
  }

  const rounded = minute < 15 ? 0 : minute < 45 ? 30 : 0;
  let adjHour = hour;
  let adjPeriod = period;
  if (minute >= 45) {
    if (hour === 11) {
      adjHour = 12;
      adjPeriod = period === "AM" ? "PM" : "AM";
    } else if (hour === 12) {
      adjHour = 1;
    } else {
      adjHour = hour + 1;
    }
  }

  const label = `${adjHour}:${rounded.toString().padStart(2, "0")} ${adjPeriod}`;
  return EVENT_TIME_OPTIONS.includes(label) ? label : trimmed;
}

export function getEventTimeSelectOptions(currentValue) {
  const normalized = normalizeEventTime(currentValue);
  if (normalized && !EVENT_TIME_OPTIONS.includes(normalized)) {
    return [normalized, ...EVENT_TIME_OPTIONS];
  }
  return EVENT_TIME_OPTIONS;
}
