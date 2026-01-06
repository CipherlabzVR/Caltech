import { Box, Typography } from "@mui/material";

const MetricCard = ({ label, value, accent = "primary.main", secondary }) => (
  <Box
    sx={{
      p: 3,
      borderRadius: 3,
      bgcolor: "background.paper",
      border: (theme) => `1px solid ${theme.palette.divider}`,
      boxShadow: (theme) =>
        theme.palette.mode === "dark"
          ? "0 10px 30px rgba(15, 23, 42, 0.35)"
          : "0 12px 24px rgba(15, 23, 42, 0.06)",
      display: "flex",
      flexDirection: "column",
      gap: 1,
      minHeight: 130,
    }}
  >
    <Typography variant="subtitle2" color="text.secondary">
      {label}
    </Typography>
    <Typography
      variant="h4"
      sx={{
        fontWeight: 700,
        color: accent,
      }}
    >
      {value}
    </Typography>
    {secondary ? (
      <Typography variant="body2" color="text.secondary">
        {secondary}
      </Typography>
    ) : null}
  </Box>
);

export default MetricCard;

