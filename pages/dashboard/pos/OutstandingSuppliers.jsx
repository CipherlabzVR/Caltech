import React, { useMemo, useState, useEffect } from "react";
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
import useApi from "@/components/utils/useApi";

const OutstandingSuppliers = () => {
  const [supplierOutstanding, setSupplierOutstanding] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: supplierOutstandingList } = useApi(
    "/Supplier/GetAllOutstandingGroupedBySupplier"
  );

  useEffect(() => {
    if (supplierOutstandingList) {
      setSupplierOutstanding(supplierOutstandingList);
    }
  }, [supplierOutstandingList]);

  const filteredSuppliers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      return supplierOutstanding;
    }

    return supplierOutstanding.filter((supplier) =>
      (supplier.supplierName ?? "").toLowerCase().includes(term)
    );
  }, [supplierOutstanding, searchTerm]);

  const totalOutstandingSum = filteredSuppliers.reduce(
    (sum, supplier) => sum + Number(supplier.outstandingAmount || 0),
    0
  );

  const displayCount = filteredSuppliers.length;
  const displayTotal = totalOutstandingSum;

  return (
    <Card
      sx={{
        boxShadow: "none",
        borderRadius: "10px",
        p: "25px 20px 15px",
        mb: "15px",
      }}
    >
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
          Suppliers Outstanding
        </Typography>

        <TextField
          size="small"
          placeholder="Search supplier..."
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
            Suppliers with outstanding
          </Typography>
          <Typography sx={{ fontSize: 22, fontWeight: 600, color: "#260944" }}>
            {displayCount}
          </Typography>
        </Box>
        <Box>
          <Typography sx={{ fontSize: 12, color: "#666" }}>
            Total due amount
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
          sx={{ minWidth: 500 }}
          aria-label="custom pagination table"
          className="dark-table"
        >
          <TableHead sx={{ background: "#F7FAFF" }}>
            <TableRow>
              <TableCell
                sx={{
                  borderBottom: "1px solid #F7FAFF",
                  fontSize: "13.5px",
                  padding: "15px 10px",
                }}
              >
                Supplier Name
              </TableCell>
              <TableCell
                sx={{
                  borderBottom: "1px solid #F7FAFF",
                  fontSize: "13.5px",
                  padding: "15px 10px",
                }}
              >
                Total Outstanding Amount
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {filteredSuppliers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={2} sx={{ textAlign: "center", py: 3, color: "#666" }}>
                  {searchTerm.trim()
                    ? "No suppliers match your search."
                    : "No outstanding supplier data available."}
                </TableCell>
              </TableRow>
            ) : (
              filteredSuppliers.map((supplier, index) => (
                <TableRow key={supplier.supplierId ?? index}>
                  <TableCell
                    sx={{
                      fontWeight: "500",
                      fontSize: "13px",
                      borderBottom: "1px solid #F7FAFF",
                      color: "#260944",
                      padding: "9px 10px",
                    }}
                  >
                    {supplier.supplierName || "N/A"}
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 500,
                      borderBottom: "1px solid #F7FAFF",
                      fontSize: "12px",
                      padding: "9px 10px",
                    }}
                  >
                    Rs. {formatCurrency(supplier.outstandingAmount || 0)}
                  </TableCell>
                </TableRow>
              ))
            )}
            {filteredSuppliers.length > 0 && (
              <TableRow>
                <TableCell sx={{ fontWeight: 600, padding: "10px" }}>
                  Total
                </TableCell>
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

export default OutstandingSuppliers;
