import React from "react";
import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Pagination,
  Select,
} from "@mui/material";

const DEFAULT_PAGE_SIZES = [5, 10, 25, 50];

/**
 * Table footer: rounded page control (left) + Page Size select (right).
 * @param {number} totalCount
 * @param {number} page — 0-based page index
 * @param {(page: number) => void} onPageChange
 * @param {number} pageSize
 * @param {(size: number) => void} onPageSizeChange
 * @param {number[]} [pageSizeOptions]
 * @param {string} [idSuffix] — unique label id when multiple bars exist on one screen
 */
export default function RecruitmentPaginationBar({
  totalCount,
  page,
  onPageChange,
  pageSize,
  onPageSizeChange,
  pageSizeOptions = DEFAULT_PAGE_SIZES,
  idSuffix = "default",
}) {
  const size = pageSize > 0 ? pageSize : 10;
  const total = totalCount || 0;
  const pageCount = Math.max(1, Math.ceil(total / size));
  const labelId = `hr-recruitment-page-size-${idSuffix}`;

  return (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 2,
        mt: 2,
      }}
    >
      <Pagination
        color="primary"
        shape="rounded"
        page={page + 1}
        count={pageCount}
        onChange={(_, p) => onPageChange(p - 1)}
        siblingCount={1}
        boundaryCount={1}
      />
      <FormControl size="small" sx={{ minWidth: 120 }}>
        <InputLabel id={labelId}>Page Size</InputLabel>
        <Select
          labelId={labelId}
          label="Page Size"
          value={size}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
        >
          {pageSizeOptions.map((n) => (
            <MenuItem key={n} value={n}>
              {n}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
}
