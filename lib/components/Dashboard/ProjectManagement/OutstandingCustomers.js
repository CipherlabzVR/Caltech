import React from "react";
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

const OutstandingCustomers = ({ outstandingCustomers }) => {
  const totalOutstandingSum = outstandingCustomers.reduce(
    (sum, row) => sum + Number(row.totalOutstanding || 0),
    0
  );

  return (
    <Card sx={{ boxShadow: "none", borderRadius: "10px", p: "25px 20px 15px", mb: "15px" }}>
      <Box sx={{ paddingBottom: "10px" }}>
        <Typography as="h3" sx={{ fontSize: 18, fontWeight: 500 }}>
          Customers Outstanding
        </Typography>
      </Box>

      <TableContainer
        component={Paper}
        sx={{
          boxShadow: "none",
          maxHeight: "50vh",
          overflowY: "auto",
          height: 'auto'
        }}
      >
        <Table
          sx={{ minWidth: 500 }}
          aria-label="custom pagination table"
          className="dark-table"
        >
          <TableHead sx={{ background: "#F7FAFF" }}>
            <TableRow>
              <TableCell sx={{ borderBottom: "1px solid #F7FAFF", fontSize: "13.5px", padding: "15px 10px" }}>
                Customer Name
              </TableCell>
              {/* <TableCell sx={{ borderBottom: "1px solid #F7FAFF", fontSize: "13.5px", padding: "15px 10px" }}>
                Total Invoice Amount
              </TableCell> */}
              <TableCell sx={{ borderBottom: "1px solid #F7FAFF", fontSize: "13.5px", padding: "15px 10px" }}>
                Total Outstanding Amount
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {outstandingCustomers.map((row,i) => (
              <TableRow key={i}>
                <TableCell sx={{ fontWeight: "500", fontSize: "13px", borderBottom: "1px solid #F7FAFF", color: "#260944", padding: "9px 10px" }}>
                  {row.customerName}
                </TableCell>
                {/* <TableCell sx={{ borderBottom: "1px solid #F7FAFF", padding: "9px 10px", fontSize: "13px" }}>
                  {formatCurrency(row.totalInvoice)}
                </TableCell> */}
                <TableCell sx={{ fontWeight: 500, borderBottom: "1px solid #F7FAFF", fontSize: "12px", padding: "9px 10px" }}>
                  Rs. {formatCurrency(row.totalOutstanding)}
                </TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell sx={{ fontWeight: 600, padding: "10px" }}>
                Total
              </TableCell>
              <TableCell sx={{ fontWeight: 600, padding: "10px" }}>
                Rs. {formatCurrency(totalOutstandingSum)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  );
};

export default OutstandingCustomers;
