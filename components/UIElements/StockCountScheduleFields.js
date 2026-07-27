import React from "react";
import { Grid, MenuItem, TextField, Typography } from "@mui/material";

export const STOCK_COUNT_FREQUENCY = {
  DAILY: 1,
  MONTHLY: 2,
  YEARLY: 3,
};

export const STOCK_COUNT_FREQUENCY_OPTIONS = [
  { value: STOCK_COUNT_FREQUENCY.DAILY, label: "Daily" },
  { value: STOCK_COUNT_FREQUENCY.MONTHLY, label: "Monthly" },
  { value: STOCK_COUNT_FREQUENCY.YEARLY, label: "Yearly" },
];

export const MONTH_OPTIONS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

// Reference year 2000 is a leap year, so February offers 29 days.
const daysInMonth = (month) => (month ? new Date(2000, month, 0).getDate() : 31);

export const getDefaultStockCountSchedule = () => ({
  frequency: STOCK_COUNT_FREQUENCY.DAILY,
  dayOfMonth: "",
  month: "",
  day: "",
});

/** Returns an error message when the schedule is incomplete, otherwise null. */
export const validateStockCountSchedule = (schedule) => {
  if (!schedule || !schedule.frequency) {
    return "Please select a stock count frequency.";
  }
  if (schedule.frequency === STOCK_COUNT_FREQUENCY.MONTHLY && !schedule.dayOfMonth) {
    return "Please select the day of the month for the stock count.";
  }
  if (schedule.frequency === STOCK_COUNT_FREQUENCY.YEARLY && (!schedule.month || !schedule.day)) {
    return "Please select the month and day of the year for the stock count.";
  }
  return null;
};

export const getStockCountFrequencyLabel = (frequency) => {
  const match = STOCK_COUNT_FREQUENCY_OPTIONS.find((o) => o.value === frequency);
  return match ? match.label : "Daily";
};

/** Human readable schedule, e.g. "Every day", "Day 15 of every month", "Every year on March 15". */
export const getStockCountScheduleLabel = (frequency, dayOfMonth, month, day) => {
  if (frequency === STOCK_COUNT_FREQUENCY.MONTHLY) {
    return dayOfMonth ? `Day ${dayOfMonth} of every month` : "Monthly";
  }
  if (frequency === STOCK_COUNT_FREQUENCY.YEARLY) {
    const monthLabel = MONTH_OPTIONS.find((m) => m.value === month)?.label;
    return monthLabel && day ? `Every year on ${monthLabel} ${day}` : "Yearly";
  }
  return "Every day";
};

/**
 * Controlled fields for the stock count schedule.
 * schedule: { frequency, dayOfMonth, month, day }
 */
export default function StockCountScheduleFields({ schedule, onChange }) {
  const value = schedule || getDefaultStockCountSchedule();

  const update = (patch) => {
    onChange({ ...value, ...patch });
  };

  const handleFrequencyChange = (e) => {
    update({
      frequency: e.target.value,
      dayOfMonth: "",
      month: "",
      day: "",
    });
  };

  return (
    <Grid container spacing={1}>
      <Grid item xs={12} lg={6}>
        <Typography sx={{ fontWeight: "500", fontSize: "14px", mb: "5px" }}>
          Stock Count Frequency
        </Typography>
        <TextField
          select
          fullWidth
          size="small"
          value={value.frequency || ""}
          onChange={handleFrequencyChange}
        >
          {STOCK_COUNT_FREQUENCY_OPTIONS.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
      </Grid>

      {value.frequency === STOCK_COUNT_FREQUENCY.MONTHLY && (
        <Grid item xs={12} lg={6}>
          <Typography sx={{ fontWeight: "500", fontSize: "14px", mb: "5px" }}>
            Day of Month
          </Typography>
          <TextField
            select
            fullWidth
            size="small"
            value={value.dayOfMonth || ""}
            onChange={(e) => update({ dayOfMonth: e.target.value })}
          >
            {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
              <MenuItem key={d} value={d}>
                {d}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
      )}

      {value.frequency === STOCK_COUNT_FREQUENCY.YEARLY && (
        <>
          <Grid item xs={6} lg={3}>
            <Typography sx={{ fontWeight: "500", fontSize: "14px", mb: "5px" }}>
              Month
            </Typography>
            <TextField
              select
              fullWidth
              size="small"
              value={value.month || ""}
              onChange={(e) => {
                const month = e.target.value;
                const maxDay = daysInMonth(month);
                update({
                  month,
                  day: value.day && value.day > maxDay ? "" : value.day,
                });
              }}
            >
              {MONTH_OPTIONS.map((m) => (
                <MenuItem key={m.value} value={m.value}>
                  {m.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={6} lg={3}>
            <Typography sx={{ fontWeight: "500", fontSize: "14px", mb: "5px" }}>
              Day
            </Typography>
            <TextField
              select
              fullWidth
              size="small"
              value={value.day || ""}
              onChange={(e) => update({ day: e.target.value })}
            >
              {Array.from({ length: daysInMonth(value.month) }, (_, i) => i + 1).map((d) => (
                <MenuItem key={d} value={d}>
                  {d}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
        </>
      )}
    </Grid>
  );
}
