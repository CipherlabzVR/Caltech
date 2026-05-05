import React from "react";
import { Card, CardContent, Box, Typography, alpha } from "@mui/material";
import { styled } from "@mui/material/styles";

const StyledCard = styled(Card)(({ theme, color }) => {
  // Valid Material-UI palette colors
  const validColors = ["primary", "secondary", "error", "warning", "info", "success"];
  const safeColor = validColors.includes(color) ? color : "primary";
  const paletteColor = theme.palette[safeColor] || theme.palette.primary;
  
  return {
    borderRadius: "16px",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    border: "1px solid",
    borderColor: alpha(paletteColor.main, 0.12),
    background: "linear-gradient(135deg, #ffffff 0%, #fafafa 100%)",
    "&:hover": {
      transform: "translateY(-4px)",
      boxShadow: "0 8px 24px rgba(0, 0, 0, 0.12)",
      borderColor: alpha(paletteColor.main, 0.3),
    },
  };
});

const MetricCard = ({
  title,
  value,
  subtitle,
  icon,
  color = "primary",
  trend,
  trendValue,
  onClick,
  sx,
  valueSx,
}) => {
  return (
    <StyledCard 
      color={color}
      onClick={onClick}
      sx={[
        {
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignSelf: "stretch",
        },
        onClick ? { cursor: "pointer" } : {},
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    >
      <CardContent
        sx={{
          p: 3,
          flex: 1,
          display: "flex",
          flexDirection: "column",
          "&:last-child": { pb: 3 },
        }}
      >
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="flex-start"
          flex={1}
          gap={2}
        >
          <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
            <Typography
              variant="caption"
              sx={{
                color: "text.secondary",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                fontSize: "0.75rem",
              }}
            >
              {title}
            </Typography>
            <Typography
              component="div"
              variant="h3"
              sx={(theme) => {
                // Valid Material-UI palette colors
                const validColors = ["primary", "secondary", "error", "warning", "info", "success"];
                const safeColor = validColors.includes(color) ? color : "primary";
                
                return {
                  mt: 1,
                  mb: 0.5,
                  fontWeight: 700,
                  color: `${safeColor}.main`,
                  lineHeight: 1.2,
                  ...(typeof valueSx === "function" ? valueSx(theme) : valueSx || {}),
                };
              }}
            >
              {value}
            </Typography>
            {subtitle && (
              <Typography
                variant="body2"
                sx={{
                  color: "text.secondary",
                  fontSize: "0.875rem",
                  mt: 0.5,
                  lineHeight: 1.43,
                  minHeight: "4.35em",
                }}
              >
                {subtitle}
              </Typography>
            )}
            {trend && trendValue && (
              <Box display="flex" alignItems="center" mt={1}>
                <Typography
                  variant="caption"
                  sx={{
                    color: trend === "up" ? "success.main" : "error.main",
                    fontWeight: 600,
                    fontSize: "0.75rem",
                  }}
                >
                  {trend === "up" ? "↑" : "↓"} {trendValue}
                </Typography>
              </Box>
            )}
          </Box>
          {icon && (
            <Box
              flexShrink={0}
              sx={(theme) => {
                // Valid Material-UI palette colors
                const validColors = ["primary", "secondary", "error", "warning", "info", "success"];
                const safeColor = validColors.includes(color) ? color : "primary";
                const paletteColor = theme.palette[safeColor] || theme.palette.primary;
                
                return {
                  width: 56,
                  height: 56,
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: alpha(paletteColor.main, 0.1),
                  color: `${safeColor}.main`,
                };
              }}
            >
              {icon}
            </Box>
          )}
        </Box>
      </CardContent>
    </StyledCard>
  );
};

export default MetricCard;

