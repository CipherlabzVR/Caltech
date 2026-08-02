import React from "react";
import { Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, Button } from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";

const toCsv = (data) => {
  const escape = (value) => {
    const text = value === null || value === undefined ? "" : String(value);
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  return [data.columns.map(escape).join(","), ...data.rows.map((row) => row.map(escape).join(","))].join("\n");
};

const DataTableBlock = ({ data }) => {
  if (!data || !data.columns?.length || !data.rows?.length) return null;

  const download = () => {
    const blob = new Blob([toCsv(data)], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${(data.caption || "apexflow-assistant").replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Box className="ai-assistant-table">
      {data.caption && (
        <Typography variant="caption" sx={{ display: "block", mb: 0.5, fontWeight: 600, opacity: 0.75 }}>
          {data.caption}
        </Typography>
      )}

      <TableContainer sx={{ maxHeight: 260 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              {data.columns.map((column) => (
                <TableCell key={column} sx={{ fontWeight: 700, fontSize: 12, whiteSpace: "nowrap" }}>
                  {column}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {data.rows.map((row, rowIndex) => (
              <TableRow key={rowIndex} hover>
                {row.map((cell, cellIndex) => (
                  <TableCell key={cellIndex} sx={{ fontSize: 12 }}>
                    {cell === null || cell === undefined ? "" : String(cell)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Button size="small" startIcon={<DownloadIcon />} onClick={download} sx={{ mt: 0.5, fontSize: 11 }}>
        Export CSV
      </Button>
    </Box>
  );
};

export default DataTableBlock;
