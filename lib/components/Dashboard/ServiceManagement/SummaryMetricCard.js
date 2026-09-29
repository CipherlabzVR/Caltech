import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Grid from "@mui/material/Grid";

export default function SummaryMetricCard({ card }) {
  const isAlert = card.alert && Number(card.rawValue) > 0;

  return (
    <Box
      sx={{
        position: "relative",
        height: "100%",
        minHeight: 112,
        borderRadius: 2.5,
        overflow: "hidden",
        background: card.gradient,
        border: `1px solid ${card.borderColor}`,
        boxShadow: "0 2px 10px rgba(15, 23, 42, 0.05)",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
        "&:hover": {
          transform: "translateY(-3px)",
          boxShadow: `0 10px 22px ${card.glowColor}`,
        },
      }}
    >
      <Box
        sx={{
          position: "absolute",
          top: -20,
          right: -20,
          width: 72,
          height: 72,
          borderRadius: "50%",
          bgcolor: card.accent,
          opacity: 0.1,
        }}
      />

      <Box sx={{ p: 1.75, position: "relative", zIndex: 1 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.25 }}>
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: card.iconGradient,
              color: "#fff",
              boxShadow: `0 4px 12px ${card.glowColor}`,
            }}
          >
            {React.cloneElement(card.icon, { sx: { fontSize: 20 } })}
          </Box>
          {isAlert && (
            <Chip
              label="Alert"
              size="small"
              sx={{
                height: 20,
                fontSize: "0.62rem",
                fontWeight: 700,
                bgcolor: "rgba(239, 68, 68, 0.12)",
                color: "#DC2626",
              }}
            />
          )}
          {card.badge && !isAlert && (
            <Chip
              label={card.badge}
              size="small"
              sx={{
                height: 20,
                fontSize: "0.62rem",
                fontWeight: 700,
                bgcolor: "rgba(255,255,255,0.75)",
                color: card.accent,
              }}
            />
          )}
        </Box>

        <Typography
          sx={{
            fontWeight: 800,
            fontSize: card.valueSize || { xs: "1.25rem", md: "1.4rem" },
            lineHeight: 1.15,
            color: card.valueColor || "#0F172A",
            letterSpacing: "-0.02em",
            mb: 0.25,
          }}
        >
          {card.value}
        </Typography>
        <Typography sx={{ fontWeight: 600, fontSize: "0.78rem", color: "#334155" }}>
          {card.label}
        </Typography>
        {card.hint && (
          <Typography sx={{ fontSize: "0.68rem", color: "#64748B", mt: 0.25, lineHeight: 1.35 }}>
            {card.hint}
          </Typography>
        )}
      </Box>
    </Box>
  );
}

export function SummaryMetricGrid({ cards }) {
  return (
    <Grid container spacing={2}>
      {cards.map((card) => (
        <Grid item xs={6} md={3} key={card.label}>
          <SummaryMetricCard card={card} />
        </Grid>
      ))}
    </Grid>
  );
}
