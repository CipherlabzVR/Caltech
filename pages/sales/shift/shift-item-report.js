import React from "react";
import { Tooltip, IconButton } from "@mui/material";
import DescriptionIcon from "@mui/icons-material/Description";

export default function ShiftItemReport({ shiftId }) {
  return (
    <Tooltip title="Item Report" placement="top">
      <a
        href={`/sales/shift/item-report?shiftId=${shiftId}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        <IconButton aria-label="item-report" size="small">
          <DescriptionIcon color="primary" fontSize="inherit" />
        </IconButton>
      </a>
    </Tooltip>
  );
}
