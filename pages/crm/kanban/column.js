import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Collapse from "@mui/material/Collapse";
import Divider from "@mui/material/Divider";
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import KanbanCard from "./card";

export default function KanbanColumn({
  stageId,
  stageTitle,
  stageColor,
  isWonColumn,
  items = [],
  onDragStart,
  onDropCard,
  onDragEnd,
  onCardClick,
  onArchiveCard,
  onDeleteCard,
}) {
  const [isDragOver, setIsDragOver] = React.useState(false);
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  const toggleCollapse = () => setIsCollapsed((prev) => !prev);

  const handleDragOver = (event) => {
    event.preventDefault();
    if (isCollapsed) {
      setIsCollapsed(false);
    }
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
        height: isCollapsed ? "auto" : "calc(100vh - 280px)",
        minHeight: isCollapsed ? 0 : 360,
        alignSelf: isCollapsed ? "flex-start" : "stretch",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "background.paper",
        borderRadius: 3,
        p: 2,
        mr: 3,
        boxShadow: "0px 12px 34px rgba(15, 23, 42, 0.08)",
        border: "1px solid",
        borderColor: isDragOver
          ? "primary.main"
          : isWonColumn
          ? "success.main"
          : "transparent",
        transition: "border-color 0.2s ease, height 0.2s ease",
        overflow: "hidden",
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
        pb={isCollapsed ? 0 : 1.5}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
          {stageColor ? (
            <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                backgroundColor: stageColor,
                flexShrink: 0,
              }}
            />
          ) : null}
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, minWidth: 0 }}>
            <Typography variant="subtitle1" fontWeight={600} noWrap>
              {stageTitle}
            </Typography>
            {isWonColumn ? (
              <Tooltip title="Won column (closing stage)">
                <EmojiEventsIcon sx={{ fontSize: 18, color: "success.main" }} />
              </Tooltip>
            ) : null}
          </Box>
          <Typography variant="caption" color="text.secondary" noWrap>
            {items.length} item{items.length === 1 ? "" : "s"}
          </Typography>
        </Box>
        <Tooltip title={isCollapsed ? "Show leads" : "Hide leads"}>
          <IconButton
            size="small"
            onClick={toggleCollapse}
            sx={{
              transition: "transform 0.2s ease",
              transform: isCollapsed ? "rotate(0deg)" : "rotate(180deg)",
            }}
          >
            <KeyboardArrowDownIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>
      <Collapse in={!isCollapsed} timeout="auto" sx={{ flexGrow: 1, minHeight: 0, display: "flex", flexDirection: "column", "& .MuiCollapse-wrapper": { height: "100%" }, "& .MuiCollapse-wrapperInner": { height: "100%", display: "flex", flexDirection: "column" } }}>
        <Divider sx={{ mb: 2 }} />
        <Box
          sx={{
            flexGrow: 1,
            minHeight: 0,
            overflowY: "auto",
            overflowX: "hidden",
            pr: 1,
            display: "grid",
            gap: 2,
            alignContent: "start",
            scrollbarWidth: "thin",
            "&::-webkit-scrollbar": {
              width: 6,
            },
            "&::-webkit-scrollbar-thumb": {
              borderRadius: 10,
              backgroundColor: "rgba(148, 163, 184, 0.6)",
            },
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
                onCardClick={onCardClick}
                onArchive={onArchiveCard}
                onDelete={onDeleteCard}
              />
            ))
          )}
        </Box>
      </Collapse>
    </Box>
  );
}
