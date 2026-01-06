import { Chip } from "@mui/material";

const STATUS_COLOR_MAP = {
  Planned: "default",
  "In Progress": "primary",
  "On Hold": "warning",
  Completed: "success",
};

const StatusPill = ({ label }) => {
  const color = STATUS_COLOR_MAP[label] || "default";
  return (
    <Chip
      label={label}
      color={color}
      variant={color === "default" ? "outlined" : "filled"}
      sx={{ fontWeight: 600 }}
    />
  );
};

export default StatusPill;

