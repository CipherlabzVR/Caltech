import React, { useMemo, useState } from "react";
import { Box, Typography, TextField, InputAdornment } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import Card from "@mui/material/Card";
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import { formatCurrency } from "@/components/utils/formatHelper";

const headerCellSx = {
  borderBottom: "1px solid #F7FAFF",
  fontSize: "13.5px",
  padding: "15px 10px",
  fontWeight: 600,
  backgroundColor: (theme) =>
    theme.palette.mode === "dark" ? theme.palette.background.paper : "#F7FAFF",
  zIndex: 3,
};

const getCompanyName = (row) => {
  const name =
    row?.companyName ??
    row?.CompanyName ??
    row?.company ??
    row?.Company ??
    row?.organization ??
    row?.Organization ??
    "";

  return name.trim() || "-";
};

const OutstandingCustomers = ({ outstandingCustomers }) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredCustomers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      return outstandingCustomers;
    }

    return outstandingCustomers.filter((row) => {
      const customerName = (row.customerName ?? "").toLowerCase();
      const companyName = getCompanyName(row).toLowerCase();

      return (
        customerName.includes(term) ||
        (companyName !== "-" && companyName.includes(term))
      );
    });
  }, [outstandingCustomers, searchTerm]);

  const totalOutstandingSum = filteredCustomers.reduce(
    (sum, row) => sum + Number(row.totalOutstanding || row.outstandingAmount || 0),
    0
  );

  const displayCount = filteredCustomers.length;
  const displayTotal = totalOutstandingSum;

  return (
    <Card sx={{ boxShadow: "none", borderRadius: "10px", p: "25px 20px 15px", mb: "15px" }}>
      <Box
        sx={{
          paddingBottom: "10px",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        <Typography as="h3" sx={{ fontSize: 18, fontWeight: 500 }}>
          Customers Outstanding
        </Typography>

        <TextField
          size="small"
          placeholder="Search customer or company..."
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ fontSize: 20, color: "#999" }} />
              </InputAdornment>
            ),
          }}
          sx={{ flex: 1, minWidth: 200, maxWidth: 320 }}
        />
      </Box>

      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 3,
          mb: 2,
          p: 1.5,
          borderRadius: "8px",
          backgroundColor: "#F7FAFF",
        }}
      >
        <Box>
          <Typography sx={{ fontSize: 12, color: "#666" }}>
            Customers with outstanding
          </Typography>
          <Typography sx={{ fontSize: 22, fontWeight: 600, color: "#260944" }}>
            {displayCount}
          </Typography>
        </Box>
        <Box>
          <Typography sx={{ fontSize: 12, color: "#666" }}>
            Total outstanding amount
          </Typography>
          <Typography sx={{ fontSize: 22, fontWeight: 600, color: "#260944" }}>
            Rs. {formatCurrency(displayTotal)}
          </Typography>
        </Box>
      </Box>

      <TableContainer
        component={Paper}
        sx={{
          boxShadow: "none",
          maxHeight: "50vh",
          overflowY: "auto",
          height: "auto",
        }}
      >
        <Table
          stickyHeader
          sx={{ minWidth: 500 }}
          aria-label="custom pagination table"
          className="dark-table"
        >
          <TableHead>
            <TableRow>
              <TableCell sx={headerCellSx}>Customer Name</TableCell>
              <TableCell sx={headerCellSx}>Company Name</TableCell>
              <TableCell sx={headerCellSx}>Total Outstanding Amount</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {filteredCustomers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} sx={{ textAlign: "center", py: 3, color: "#666" }}>
                  {searchTerm.trim() ? "No customers match your search." : "No outstanding customers."}
                </TableCell>
              </TableRow>
            ) : (
              filteredCustomers.map((row, i) => (
              <TableRow key={row.customerId ?? i}>
                <TableCell
                  sx={{
                    fontWeight: "500",
                    fontSize: "13px",
                    borderBottom: "1px solid #F7FAFF",
                    color: "#260944",
                    padding: "9px 10px",
                  }}
                >
                  {row.customerName}
                </TableCell>
                <TableCell
                  sx={{
                    fontSize: "13px",
                    borderBottom: "1px solid #F7FAFF",
                    color: "#260944",
                    padding: "9px 10px",
                  }}
                >
                  {getCompanyName(row)}
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 500,
                    borderBottom: "1px solid #F7FAFF",
                    fontSize: "12px",
                    padding: "9px 10px",
                  }}
                >
                  Rs.{" "}
                  {formatCurrency(row.totalOutstanding ?? row.outstandingAmount ?? 0)}
                </TableCell>
              </TableRow>
              ))
            )}
            {filteredCustomers.length > 0 && (
            <TableRow>
              <TableCell sx={{ fontWeight: 600, padding: "10px" }}>Total</TableCell>
              <TableCell sx={{ padding: "10px" }} />
              <TableCell sx={{ fontWeight: 600, padding: "10px" }}>
                Rs. {formatCurrency(totalOutstandingSum)}
              </TableCell>
            </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  );
};

export default OutstandingCustomers;
