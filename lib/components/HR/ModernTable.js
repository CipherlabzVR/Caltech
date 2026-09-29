import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Typography,
  alpha,
} from "@mui/material";
import { styled } from "@mui/material/styles";

const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
  borderRadius: "16px",
  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
  border: "1px solid",
  borderColor: alpha(theme.palette.divider, 0.1),
  overflow: "hidden",
}));

const StyledTable = styled(Table)(({ theme }) => ({
  "& .MuiTableCell-head": {
    backgroundColor: alpha(theme.palette.primary.main, 0.06),
    color: theme.palette.text.primary,
    fontWeight: 700,
    fontSize: "0.875rem",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    borderBottom: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
    padding: "16px",
  },
  "& .MuiTableCell-body": {
    padding: "16px",
    borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
    fontSize: "0.875rem",
  },
  "& .MuiTableRow-root": {
    transition: "background-color 0.2s ease",
    "&:hover": {
      backgroundColor: alpha(theme.palette.primary.main, 0.04),
    },
    "&:last-child .MuiTableCell-body": {
      borderBottom: "none",
    },
  },
}));

const ModernTable = ({ columns, rows, emptyMessage = "No data available" }) => {
  return (
    <StyledTableContainer component={Paper}>
      <StyledTable>
        <TableHead>
          <TableRow>
            {columns.map((column) => (
              <TableCell key={column.id} align={column.align || "left"}>
                {column.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} align="center">
                <Box py={4}>
                  <Typography variant="body2" color="text.secondary">
                    {emptyMessage}
                  </Typography>
                </Box>
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row, index) => (
              <TableRow key={row.id || index}>
                {columns.map((column) => (
                  <TableCell key={column.id} align={column.align || "left"}>
                    {column.render ? column.render(row[column.id], row) : row[column.id]}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </StyledTable>
    </StyledTableContainer>
  );
};

export default ModernTable;

