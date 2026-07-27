import React from "react";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Popover from "@mui/material/Popover";
import Divider from "@mui/material/Divider";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import CampaignIcon from "@mui/icons-material/Campaign";

const stagePalette = {
  New: "default",
  Contacted: "info",
  Qualified: "primary",
  Proposal: "warning",
  Negotiation: "secondary",
  Won: "success",
  Lost: "error",
};

const formatDate = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "-" : d.toLocaleDateString();
};

export default function KanbanCard({ item, stageId, onDragStart, onDragEnd, onCardClick, onArchive, onDelete }) {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);
  const [campaignAnchor, setCampaignAnchor] = React.useState(null);
  const campaignOpen = Boolean(campaignAnchor);

  const handleCampaignOpen = (event) => {
    event.stopPropagation();
    setCampaignAnchor(event.currentTarget);
  };
  const handleCampaignClose = () => setCampaignAnchor(null);

  const handleMenuOpen = (event) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleCardClick = (event) => {
    // Prevent click when dragging
    if (event.defaultPrevented) return;
    onCardClick?.(item);
  };

  return (
    <Paper
      variant="outlined"
      draggable
      onClick={handleCardClick}
      onDragStart={(event) => {
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("application/json", JSON.stringify({ stageId, itemId: item.id }));
        onDragStart?.(stageId, item.id);
      }}
      onDragEnd={() => onDragEnd?.()}
      sx={{
        p: 2,
        borderRadius: 2,
        boxShadow: "0px 6px 18px rgba(15, 23, 42, 0.08)",
        cursor: "pointer",
        transition: "transform 0.15s ease, box-shadow 0.15s ease",
        "&:hover": {
          transform: "translateY(-3px)",
          boxShadow: "0px 12px 30px rgba(15, 23, 42, 0.12)",
        },
        "&:active": {
          cursor: "grabbing",
        },
      }}
    >
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
        <Box>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            {item.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {item.company}
          </Typography>
          {item.campaign ? (
            <Chip
              size="small"
              icon={<CampaignIcon style={{ fontSize: 14 }} />}
              label={`Campaign: ${item.campaign.name}`}
              onClick={handleCampaignOpen}
              sx={{ mt: 0.5, maxWidth: "100%", cursor: "pointer" }}
              variant="outlined"
              color="primary"
            />
          ) : (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
              Direct / No Campaign
            </Typography>
          )}
        </Box>
        <IconButton size="small" onClick={handleMenuOpen}>
          <MoreVertIcon fontSize="small" />
        </IconButton>
      </Stack>

      {item.value ? (
        <Typography variant="subtitle2" fontWeight={600} mt={1}>
          {item.value}
        </Typography>
      ) : null}

      <Stack direction="row" spacing={1} alignItems="center" mt={1}>
        <Chip
          size="small"
          label={item.status}
          color={stagePalette[item.status] || "default"}
          variant={stagePalette[item.status] ? "filled" : "outlined"}
          sx={{ fontWeight: 600 }}
        />
        <Typography variant="caption" color="text.secondary">
          Owner: {item.owner}
        </Typography>
      </Stack>

      <Stack direction="row" justifyContent="space-between" mt={1.5}>
        <Typography variant="caption" color="text.secondary">
          Created: {item.createdDate}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Due: {item.dueDate}
        </Typography>
      </Stack>

      <Menu anchorEl={anchorEl} open={open} onClose={handleMenuClose} elevation={2}>
        <MenuItem onClick={handleMenuClose}>View Details</MenuItem>
        <MenuItem onClick={handleMenuClose}>Edit</MenuItem>
        <MenuItem
          onClick={(e) => {
            e.stopPropagation();
            handleMenuClose();
            onArchive?.(item);
          }}
        >
          Archive
        </MenuItem>
        <MenuItem
          onClick={(e) => {
            e.stopPropagation();
            handleMenuClose();
            onDelete?.(item);
          }}
        >
          Delete
        </MenuItem>
      </Menu>

      {item.campaign ? (
        <Popover
          open={campaignOpen}
          anchorEl={campaignAnchor}
          onClose={handleCampaignClose}
          anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
          onClick={(e) => e.stopPropagation()}
        >
          <Box sx={{ p: 2, maxWidth: 280 }}>
            <Stack direction="row" spacing={1} alignItems="center" mb={1}>
              <CampaignIcon color="primary" fontSize="small" />
              <Typography variant="subtitle2" fontWeight={700}>
                {item.campaign.name}
              </Typography>
            </Stack>
            <Divider sx={{ mb: 1 }} />
            <Stack spacing={0.5}>
              <Typography variant="caption" color="text.secondary">
                Type: <strong>{item.campaign.type || "-"}</strong>
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Start: <strong>{formatDate(item.campaign.startDate)}</strong>
              </Typography>
              <Typography variant="caption" color="text.secondary">
                End: <strong>{formatDate(item.campaign.endDate)}</strong>
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Owner: <strong>{item.campaign.owner || "-"}</strong>
              </Typography>
            </Stack>
          </Box>
        </Popover>
      ) : null}
    </Paper>
  );
}

