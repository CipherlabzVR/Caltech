import React from "react";
import { IconButton, Stack, Tooltip, Typography } from "@mui/material";
import DescriptionIcon from "@mui/icons-material/Description";
import LocalPrintshopIcon from "@mui/icons-material/LocalPrintshop";
import GridOnIcon from "@mui/icons-material/GridOn";

export const REPORT_MODE = {
  CUSTOM: "custom",
  DEFAULT: "default",
  EXCEL: "excel",
};

export const printActionSx = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 0.25,
  minWidth: 52,
  borderRadius: 1,
  px: 0.5,
  py: 0.25,
};

export function summaryModalTitle(baseTitle, mode) {
  if (mode === REPORT_MODE.CUSTOM) return `${baseTitle} (Custom)`;
  if (mode === REPORT_MODE.EXCEL) return `${baseTitle} (Excel)`;
  return `${baseTitle} (Default)`;
}

export function openSummaryHtmlReport(path, params, exportExcel = false) {
  const search =
    params instanceof URLSearchParams ? params : new URLSearchParams(params);
  if (exportExcel) search.set("exportExcel", "1");
  window.open(`${path}?${search.toString()}`, "_blank");
}

export default function SummaryReportModeButtons({ onOpen }) {
  return (
    <Stack direction="row" spacing={1} justifyContent="flex-end" alignItems="center">
      <Tooltip title="Print (Custom)" placement="top">
        <IconButton
          onClick={() => onOpen(REPORT_MODE.CUSTOM)}
          aria-label="Custom print"
          size="small"
          sx={printActionSx}
        >
          <DescriptionIcon color="action" fontSize="medium" />
          <Typography variant="caption" sx={{ lineHeight: 1.1, color: "text.secondary" }}>
            Custom
          </Typography>
        </IconButton>
      </Tooltip>
      <Tooltip title="Print (Default)" placement="top">
        <IconButton
          onClick={() => onOpen(REPORT_MODE.DEFAULT)}
          aria-label="Default print"
          size="small"
          sx={printActionSx}
        >
          <LocalPrintshopIcon color="primary" fontSize="medium" />
          <Typography variant="caption" sx={{ lineHeight: 1.1, color: "primary.main" }}>
            Default
          </Typography>
        </IconButton>
      </Tooltip>
      <Tooltip title="Convert to Excel" placement="top">
        <IconButton
          onClick={() => onOpen(REPORT_MODE.EXCEL)}
          aria-label="Convert to Excel"
          size="small"
          sx={printActionSx}
        >
          <GridOnIcon color="success" fontSize="medium" />
          <Typography variant="caption" sx={{ lineHeight: 1.1, color: "success.main" }}>
            Excel
          </Typography>
        </IconButton>
      </Tooltip>
    </Stack>
  );
}
