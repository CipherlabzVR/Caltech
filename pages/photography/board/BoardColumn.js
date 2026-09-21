import React from "react";
import { Box, Chip, Stack, Typography } from "@mui/material";
import InboxOutlinedIcon from "@mui/icons-material/InboxOutlined";
import BoardCard from "./BoardCard";
import { hexToRgba } from "../../../utils/photography/boardTheme";

export default function BoardColumn({
  status,
  accent: accentProp,
  cards,
  scale,
  canEdit,
  canChangeStatus,
  onRefresh,
  eventTypes,
  fillWidth,
  stepIndex = 0,
  totalSteps = 1,
}) {
  const accent = accentProp || status.colorCode || status.ColorCode || "#4F6D8C";
  const name = status.name || status.Name || "Status";

  return (
    <Box
      sx={{
        width: fillWidth ? "auto" : scale.colWidth,
        minWidth: scale.colWidth,
        flex: fillWidth ? "1 1 0" : "0 0 auto",
        display: "flex",
        flexDirection: "column",
        bgcolor: "#fff",
        borderRadius: 2.5,
        border: "1px solid #E2E8F0",
        boxShadow: "0 1px 2px rgba(15,23,42,0.04), 0 4px 14px rgba(15,23,42,0.04)",
        overflow: "hidden",
        height: "100%",
        maxHeight: "100%",
      }}
    >
      <Box
        sx={{
          px: { xs: 1.5, md: 2 },
          py: 1.5,
          bgcolor: "#fff",
          borderBottom: "1px solid #EEF2F7",
          borderTop: `3px solid ${accent}`,
          flexShrink: 0,
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                bgcolor: accent,
                flexShrink: 0,
              }}
            />
            <Typography
              sx={{
                fontWeight: 800,
                fontSize: scale.column,
                color: "#0F172A",
                lineHeight: 1.2,
                wordBreak: "break-word",
                letterSpacing: "-0.01em",
              }}
            >
              {name}
            </Typography>
          </Stack>
          <Chip
            label={cards.length}
            sx={{
              fontWeight: 800,
              fontSize: scale.meta,
              height: scale.chipH + 4,
              minWidth: 36,
              bgcolor: hexToRgba(accent, 0.12),
              color: accent,
              border: `1px solid ${hexToRgba(accent, 0.22)}`,
            }}
          />
        </Stack>
      </Box>

      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          p: { xs: 1.25, md: 1.5 },
          display: "flex",
          flexDirection: "column",
          gap: 1.35,
          minHeight: 0,
          bgcolor: hexToRgba(accent, 0.035),
          scrollbarWidth: "thin",
          scrollbarColor: "#CBD5E1 transparent",
          "&::-webkit-scrollbar": { width: 7 },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "#CBD5E1",
            borderRadius: 8,
          },
        }}
      >
        {cards.length === 0 ? (
          <Box
            sx={{
              flex: 1,
              minHeight: 150,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 0.75,
              borderRadius: 2,
              border: "1px dashed #D8DEE8",
              bgcolor: "#fff",
              px: 2,
              py: 4,
            }}
          >
            <InboxOutlinedIcon sx={{ fontSize: 32, color: "#CBD5E1" }} />
            <Typography sx={{ fontWeight: 700, fontSize: scale.meta, color: "#94A3B8" }}>
              No bookings
            </Typography>
          </Box>
        ) : (
          cards.map((card) => (
            <BoardCard
              key={card.id ?? card.Id}
              item={card}
              accent={accent}
              scale={scale}
              canEdit={canEdit}
              canChangeStatus={canChangeStatus}
              onRefresh={onRefresh}
              eventTypes={eventTypes}
              stepIndex={stepIndex}
              totalSteps={totalSteps}
            />
          ))
        )}
      </Box>
    </Box>
  );
}
