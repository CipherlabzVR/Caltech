import React, { useState, useEffect } from "react";
import { Box, Typography } from "@mui/material";
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
  const { data: supplierOutstandingList } = useApi(
    "/Supplier/GetAllOutstandingGroupedBySupplier"
  );

  useEffect(() => {
    if (supplierOutstandingList) {
      setSupplierOutstanding(supplierOutstandingList);
    }
  }, [supplierOutstandingList]);

  const totalOutstandingSum = supplierOutstanding.reduce(
    (sum, supplier) => sum + Number(supplier.outstandingAmount || 0),
    0
  );

  return (
    <Card
      sx={{
        boxShadow: "none",
        borderRadius: "10px",
        p: "25px 20px 15px",
        mb: "15px",
      }}
    >
      <Box sx={{ paddingBottom: "10px" }} display="flex" justifyContent="space-between">
        <Typography as="h3" sx={{ fontSize: 18, fontWeight: 500 }}>
          Suppliers Outstanding
        </Typography>
        <Typography as="h3" sx={{ fontSize: 18, fontWeight: 500 }}>
          Total :  Rs. {formatCurrency(totalOutstandingSum)}
        </Typography>
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
            {supplierOutstanding.length === 0 ? (
              <TableRow>
                <TableCell colSpan={2}>
                  <Typography variant="h6" color="error">
                    No outstanding supplier data available.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              supplierOutstanding.map((supplier, index) => (
                <TableRow key={index}>
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
            {supplierOutstanding.length > 0 && (
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
