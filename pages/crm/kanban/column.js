import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Divider from "@mui/material/Divider";
import KanbanCard from "./card";

export default function KanbanColumn({
  stageId,
  stageTitle,
  items = [],
  onDragStart,
  onDropCard,
  onDragEnd,
}) {
  const [isDragOver, setIsDragOver] = React.useState(false);

  const handleDragOver = (event) => {
    event.preventDefault();
    if (!isDragOver) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragOver(false);
    onDropCard?.(stageId);
  };

  return (
    <Box
      sx={{
        minWidth: { xs: 280, md: 320 },
        maxWidth: { xs: 280, md: 320 },
        display: "flex",
        flexDirection: "column",
        backgroundColor: "background.paper",
        borderRadius: 3,
        p: 2,
        mr: 3,
        boxShadow: "0px 12px 34px rgba(15, 23, 42, 0.08)",
        border: "1px solid",
        borderColor: isDragOver ? "primary.main" : "transparent",
        transition: "border-color 0.2s ease",
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        position="sticky"
        top={0}
        zIndex={1}
        bgcolor="background.paper"
        pb={1.5}
      >
        <Box>
          <Typography variant="subtitle1" fontWeight={600}>
            {stageTitle}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {items.length} item{items.length === 1 ? "" : "s"}
          </Typography>
        </Box>
      </Stack>
      <Divider sx={{ mb: 2 }} />
      <Box
        sx={{
          flexGrow: 1,
          overflowY: "auto",
          pr: 1,
          display: "grid",
          gap: 2,
        }}
      >
        {items.length === 0 ? (
          <Box
            sx={{
              borderRadius: 2,
              border: "1px dashed",
              borderColor: "divider",
              p: 3,
              textAlign: "center",
              color: "text.secondary",
              fontSize: "0.85rem",
              bgcolor: "background.default",
            }}
          >
            No items in this stage
          </Box>
        ) : (
          items.map((item) => (
            <KanbanCard
              key={item.id}
              item={item}
              stageId={stageId}
              onDragStart={onDragStart}
              onDragEnd={() => {
                handleDragLeave();
                onDragEnd?.();
              }}
            />
          ))
        )}
      </Box>
    </Box>
  );
}

