import React from "react";
import { Avatar, Box, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { Line, LineChart, ResponsiveContainer } from "recharts";

/**
 * KPI card (light theme): title, main value, delta badge, comparison line, optional sparkline.
 *
 * @param {object} props
 * @param {string} props.title
 * @param {string} props.mainValue — pre-formatted display string
 * @param {number | null} props.changePercent — null hides badge
 * @param {boolean} [props.positiveIsGood=true] — false = down is green (e.g. refund rate)
 * @param {string} [props.comparisonText] — e.g. "vs $21,690 last month"
 * @param {{ value: number }[]} [props.sparklineData] — optional, last 7–30 points
 * @param {boolean} [props.sparklineHigherIsBetter=true] — tint sparkline green/red from first→last trend
 */
export default function EcommerceMetricCard({
  title,
  mainValue,
  changePercent,
  positiveIsGood = true,
  comparisonText,
  sparklineData,
  sparklineHigherIsBetter = true,
  accentColor,
  icon,
  helperText,
}) {
  const theme = useTheme();
  const accent = accentColor || theme.palette.primary.main;
  const hasDelta = changePercent != null && Number.isFinite(changePercent);
  const isUp = changePercent >= 0;
  const trendGood = hasDelta
    ? positiveIsGood
      ? isUp
      : !isUp
    : null;

  const sparkTrend =
    Array.isArray(sparklineData) && sparklineData.length >= 2
      ? sparklineData[sparklineData.length - 1].value - sparklineData[0].value
      : 0;
  const lineColor =
    sparklineData && sparklineData.length >= 2
      ? sparklineHigherIsBetter
        ? sparkTrend >= 0
          ? theme.palette.success.main
          : theme.palette.error.main
        : sparkTrend <= 0
          ? theme.palette.success.main
          : theme.palette.error.main
      : accent;

  return (
    <Box
      sx={{
        height: "100%",
        position: "relative",
        overflow: "hidden",
        borderRadius: 4,
        bgcolor: "background.paper",
        background: `linear-gradient(180deg, ${alpha(accent, 0.14)} 0%, ${theme.palette.background.paper} 42%)`,
        boxShadow: `0 18px 38px ${alpha(theme.palette.common.black, 0.08)}`,
        border: (t) => `1px solid ${t.palette.divider}`,
        p: 2.5,
        display: "flex",
        flexDirection: "column",
        minHeight: sparklineData?.length ? 220 : 170,
        "&::before": {
          content: '""',
          position: "absolute",
          top: -42,
          right: -18,
          width: 132,
          height: 132,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${alpha(accent, 0.22)} 0%, ${alpha(accent, 0)} 72%)`,
        },
      }}
    >
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1.5}>
        <Box sx={{ pr: 1 }}>
          <Typography
            color="text.secondary"
            sx={{
              fontSize: "0.875rem",
              fontWeight: 600,
              mb: 0.75,
            }}
          >
            {title}
          </Typography>
          {helperText && (
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", lineHeight: 1.5 }}>
              {helperText}
            </Typography>
          )}
        </Box>
        {icon && (
          <Avatar
            variant="rounded"
            sx={{
              width: 42,
              height: 42,
              borderRadius: 3,
              bgcolor: alpha(accent, 0.14),
              color: accent,
              border: `1px solid ${alpha(accent, 0.18)}`,
            }}
          >
            {icon}
          </Avatar>
        )}
      </Stack>

      <Typography
        color="text.primary"
        sx={{
          fontSize: "1.85rem",
          fontWeight: 800,
          lineHeight: 1.2,
          letterSpacing: "-0.02em",
          mt: helperText ? 2 : 1.25,
        }}
      >
        {mainValue}
      </Typography>

      {hasDelta && (
        <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mt: 1 }}>
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 0.35,
              px: 1,
              py: 0.35,
              borderRadius: 10,
              fontSize: "0.75rem",
              fontWeight: 600,
              ...(trendGood
                ? {
                    bgcolor: alpha(theme.palette.success.main, 0.14),
                    color: theme.palette.success.dark,
                  }
                : {
                    bgcolor: alpha(theme.palette.error.main, 0.14),
                    color: theme.palette.error.dark,
                  }),
            }}
          >
            <span aria-hidden>{isUp ? "▲" : "▼"}</span>
            <span>{Math.abs(changePercent).toFixed(1)}%</span>
          </Box>
        </Stack>
      )}

      {comparisonText && (
        <Typography
          color="text.secondary"
          sx={{
            fontSize: "0.75rem",
            mt: hasDelta ? 0.75 : 1,
            lineHeight: 1.4,
          }}
        >
          {comparisonText}
        </Typography>
      )}

      {sparklineData && sparklineData.length > 0 && (
        <Box
          sx={{
            mt: "auto",
            pt: 2,
            px: 1,
            height: 72,
            borderRadius: 3,
            bgcolor: alpha(accent, 0.06),
            border: `1px solid ${alpha(accent, 0.1)}`,
          }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparklineData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
              <Line
                type="monotone"
                dataKey="value"
                stroke={lineColor}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      )}
    </Box>
  );
}
