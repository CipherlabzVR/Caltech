import React from "react";
import {
  Box,
  Checkbox,
  Chip,
  Collapse,
  Divider,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  LinearProgress,
  List,
  MenuItem,
  Paper,
  Radio,
  RadioGroup,
  Select,
  Typography,
} from "@mui/material";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import RadioButtonCheckedIcon from "@mui/icons-material/RadioButtonChecked";
import ArrowDropDownCircleIcon from "@mui/icons-material/ArrowDropDownCircle";
import ImageIcon from "@mui/icons-material/Image";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import { parseOptionsList, pick } from "@/components/work-track/sharedViewHelpers";

function checklistProgress(checklist) {
  const items = pick(checklist, "items", "Items") || [];
  const total = pick(checklist, "totalItems", "TotalItems") ?? items.length;
  const done = pick(checklist, "completedItems", "CompletedItems") ?? items.filter((i) => pick(i, "isCompleted", "IsCompleted")).length;
  return total > 0 ? Math.round((done / total) * 100) : 0;
}

function SharedChecklistItem({ item }) {
  const itemType = pick(item, "itemType", "ItemType") || "Checkbox";
  const title = pick(item, "title", "Title") || "";
  const description = pick(item, "description", "Description");
  const isCompleted = !!pick(item, "isCompleted", "IsCompleted");
  const isRequired = !!pick(item, "isRequired", "IsRequired");
  const selectedValue = pick(item, "selectedValue", "SelectedValue") || "";
  const imageUrl = pick(item, "imageUrl", "ImageUrl");
  const optionsList = parseOptionsList(item);

  return (
    <Box
      sx={{
        bgcolor: isCompleted ? "action.hover" : "transparent",
        borderBottom: "1px solid #eee",
        p: 2,
      }}
    >
      <Box display="flex" alignItems="flex-start" gap={1} mb={itemType !== "Checkbox" ? 1 : 0}>
        {itemType === "Checkbox" && (
          <Checkbox
            checked={isCompleted}
            disabled
            icon={<RadioButtonUncheckedIcon />}
            checkedIcon={<CheckCircleIcon color="success" />}
            sx={{ mt: -0.5 }}
          />
        )}
        {itemType === "Radio" && <RadioButtonCheckedIcon color={isCompleted ? "success" : "action"} sx={{ mt: 0.5 }} />}
        {itemType === "Dropdown" && <ArrowDropDownCircleIcon color={isCompleted ? "success" : "action"} sx={{ mt: 0.5 }} />}
        {itemType === "Image" && <ImageIcon color={isCompleted ? "success" : "action"} sx={{ mt: 0.5 }} />}

        <Box flex={1}>
          <Typography
            variant="body1"
            sx={{
              textDecoration: isCompleted ? "line-through" : "none",
              opacity: isCompleted ? 0.75 : 1,
            }}
          >
            {title}
            {isRequired && (
              <Chip label="Required" size="small" color="error" variant="outlined" sx={{ ml: 1, height: 20 }} />
            )}
          </Typography>
          {description && (
            <Typography variant="caption" color="text.secondary" display="block">
              {description}
            </Typography>
          )}
        </Box>
      </Box>

      {itemType === "Radio" && optionsList.length > 0 && (
        <Box sx={{ ml: 4, mt: 1 }}>
          <RadioGroup value={selectedValue}>
            {optionsList.map((option, idx) => (
              <FormControlLabel
                key={idx}
                value={option}
                control={<Radio size="small" />}
                label={option}
                disabled
              />
            ))}
          </RadioGroup>
        </Box>
      )}

      {itemType === "Dropdown" && optionsList.length > 0 && (
        <Box sx={{ ml: 4, mt: 1, maxWidth: 320 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Selected option</InputLabel>
            <Select value={selectedValue} label="Selected option" disabled>
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              {optionsList.map((option, idx) => (
                <MenuItem key={idx} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      )}

      {itemType === "Image" && (
        <Box sx={{ ml: 4, mt: 1 }}>
          {imageUrl ? (
            <Box
              component="img"
              src={imageUrl}
              alt={title}
              sx={{
                maxWidth: "100%",
                maxHeight: 280,
                borderRadius: 2,
                border: "1px solid #ddd",
                display: "block",
              }}
            />
          ) : (
            <Box
              sx={{
                border: "2px dashed #ccc",
                borderRadius: 2,
                p: 3,
                textAlign: "center",
                bgcolor: "#fafafa",
              }}
            >
              <CameraAltIcon sx={{ fontSize: 40, color: "#aaa", mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                No photo captured
              </Typography>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}

export default function SharedChecklistsReadOnly({ checklists }) {
  const [expanded, setExpanded] = React.useState({});

  React.useEffect(() => {
    const initial = {};
    (checklists || []).forEach((cl) => {
      const id = pick(cl, "id", "Id");
      if (id != null) initial[id] = true;
    });
    setExpanded(initial);
  }, [checklists]);

  if (!checklists || checklists.length === 0) {
    return <Typography color="text.secondary">No checklists for this form.</Typography>;
  }

  return (
    <Box>
      {checklists.map((checklist) => {
        const clId = pick(checklist, "id", "Id");
        const progress = checklistProgress(checklist);
        const items = pick(checklist, "items", "Items") || [];
        const appliesAll = !!pick(checklist, "appliesToEntireWorkTrack", "AppliesToEntireWorkTrack");

        return (
          <Paper key={clId} variant="outlined" sx={{ mb: 2, overflow: "hidden" }}>
            <Box
              sx={{
                p: 2,
                bgcolor: "#f5f5f5",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 1,
                flexWrap: "wrap",
              }}
            >
              <Box display="flex" alignItems="center" flex={1} minWidth={0}>
                <IconButton size="small" onClick={() => setExpanded((p) => ({ ...p, [clId]: !p[clId] }))}>
                  {expanded[clId] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
                <Box ml={1} flex={1} minWidth={0}>
                  <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                    <Typography variant="subtitle1" fontWeight="medium">
                      {pick(checklist, "title", "Title") || "Checklist"}
                    </Typography>
                    {appliesAll ? (
                      <Chip label="Entire work track" size="small" variant="outlined" />
                    ) : (
                      <Chip label="This row only" size="small" variant="outlined" color="secondary" />
                    )}
                  </Box>
                  {pick(checklist, "description", "Description") && (
                    <Typography variant="body2" color="text.secondary">
                      {pick(checklist, "description", "Description")}
                    </Typography>
                  )}
                </Box>
              </Box>
              <Box sx={{ width: 120 }}>
                <Typography variant="caption" color="text.secondary">
                  {progress}%
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={progress}
                  sx={{ height: 6, borderRadius: 3 }}
                  color={progress === 100 ? "success" : "primary"}
                />
              </Box>
            </Box>

            <Collapse in={!!expanded[clId]}>
              <Divider />
              <List disablePadding>
                {items.length === 0 ? (
                  <Box p={2}>
                    <Typography color="text.secondary" variant="body2">
                      No items in this checklist.
                    </Typography>
                  </Box>
                ) : (
                  items.map((item) => <SharedChecklistItem key={pick(item, "id", "Id")} item={item} />)
                )}
              </List>
            </Collapse>
          </Paper>
        );
      })}
    </Box>
  );
}
