import React from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import { CARD_SX } from "./constants";

export function DashboardPanelCard({
  title,
  subtitle,
  icon,
  accent = "#2563EB",
  gradient,
  badge,
  badgeBg,
  badgeColor,
  children,
  isEmpty,
  emptyMessage,
  emptyIcon,
  minBodyHeight = 280,
}) {
  return (
    <Card
      sx={{
        ...CARD_SX,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box
        sx={{
          px: 2.5,
          py: 2,
          borderBottom: "1px solid #F1F5F9",
          background:
            gradient ||
            `linear-gradient(135deg, ${accent}10 0%, rgba(255,255,255,0.95) 55%, #FFFFFF 100%)`,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
          {icon && (
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                color: "#fff",
                background: `linear-gradient(135deg, ${accent}, ${accent}CC)`,
                boxShadow: `0 4px 14px ${accent}35`,
              }}
            >
              {React.cloneElement(icon, { sx: { fontSize: 20 } })}
            </Box>
          )}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              sx={{
                fontWeight: 700,
                fontSize: "0.9375rem",
                color: "#0F172A",
                lineHeight: 1.3,
              }}
            >
              {title}
            </Typography>
            {subtitle && (
              <Typography sx={{ fontSize: "0.72rem", color: "#64748B", mt: 0.25 }}>
                {subtitle}
              </Typography>
            )}
          </Box>
          {badge != null && (
            <Box
              sx={{
                px: 1,
                py: 0.35,
                borderRadius: 1.5,
                fontSize: "0.68rem",
                fontWeight: 700,
                lineHeight: 1.2,
                bgcolor: badgeBg || `${accent}18`,
                color: badgeColor || accent,
                flexShrink: 0,
              }}
            >
              {badge}
            </Box>
          )}
        </Box>
      </Box>

      <CardContent
        sx={{
          p: 0,
          flex: 1,
          minHeight: minBodyHeight,
          display: "flex",
          flexDirection: "column",
          "&:last-child": { pb: 0 },
        }}
      >
        {isEmpty ? (
          <Box
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              px: 3,
              py: 4,
              textAlign: "center",
            }}
          >
            {emptyIcon && (
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: "#F8FAFC",
                  color: "#94A3B8",
                  mb: 1.5,
                }}
              >
                {React.cloneElement(emptyIcon, { sx: { fontSize: 24 } })}
              </Box>
            )}
            <Typography sx={{ fontSize: "0.8125rem", color: "#64748B" }}>
              {emptyMessage}
            </Typography>
          </Box>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}

export function PanelScrollList({ children, maxHeight = 280 }) {
  return (
    <Box
      sx={{
        flex: 1,
        overflowY: "auto",
        maxHeight,
        "&::-webkit-scrollbar": { width: 4 },
        "&::-webkit-scrollbar-thumb": { bgcolor: "#CBD5E1", borderRadius: 2 },
      }}
    >
      {children}
    </Box>
  );
}
