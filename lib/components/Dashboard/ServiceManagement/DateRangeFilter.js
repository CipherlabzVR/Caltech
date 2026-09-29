import React from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import TextField from "@mui/material/TextField";
import Outlet from "@/pages/dashboard/pos/Outlet";
import { HEADER_SECTION_SX } from "./constants";

const fieldSx = {
  minWidth: 160,
  "& .MuiInputBase-input": { color: "#3f51b5" },
  "& .MuiInputLabel-root": { color: "#3f51b5" },
};

export function DashboardHeaderSection({ titleRow, children }) {
  return (
    <Card sx={HEADER_SECTION_SX}>
      {titleRow && (
        <Box
          sx={{
            px: { xs: 2, sm: 2.5 },
            pt: { xs: 2, sm: 2.5 },
            pb: 2,
            borderBottom: "1px solid #F1F5F9",
          }}
        >
          {titleRow}
        </Box>
      )}
      {children && (
        <Box sx={{ px: { xs: 2, sm: 2.5 }, py: 2.5 }}>{children}</Box>
      )}
    </Card>
  );
}

export default function DateRangeFilter({
  startDate,
  endDate,
  onStartChange,
  onEndChange,
  onWarehouseChange,
}) {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 2,
      }}
    >
      <Box
        sx={{
          minWidth: { xs: "100%", sm: 200 },
          maxWidth: 280,
          "& .MuiSelect-select": { color: "#3f51b5" },
          "& .MuiInputLabel-root": { color: "#3f51b5" },
        }}
      >
        <Outlet onChangeWarehouse={onWarehouseChange} size="small" />
      </Box>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          flexWrap: "wrap",
          ml: { xs: 0, sm: "auto" },
        }}
      >
        <TextField
          label="From Date"
          value={startDate}
          size="small"
          type="date"
          onChange={(e) => onStartChange(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={fieldSx}
        />
        <TextField
          label="To Date"
          value={endDate}
          size="small"
          type="date"
          onChange={(e) => onEndChange(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={fieldSx}
        />
      </Box>
    </Box>
  );
}
