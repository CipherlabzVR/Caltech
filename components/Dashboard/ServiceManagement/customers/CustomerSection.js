import React from "react";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Button from "@mui/material/Button";
import { useRouter } from "next/router";
import { formatCurrency, formatDate } from "@/components/utils/formatHelper";
import { CARD_SX } from "../constants";
import { useServiceDashboard } from "../ServiceDashboardProvider";

export function CustomerSummaryCards() {
  const { totalCustomers, newCustomersInRange, newCustomersToday } = useServiceDashboard();

  const cards = [
    { label: "Total Customers", value: totalCustomers, color: "#2563EB" },
    { label: "New (Period)", value: newCustomersInRange, color: "#059669" },
    { label: "New Today", value: newCustomersToday, color: "#7C3AED" },
  ];

  return (
    <Grid container spacing={2}>
      {cards.map((card) => (
        <Grid item xs={12} sm={4} key={card.label}>
          <Card sx={{ ...CARD_SX, borderTop: `3px solid ${card.color}` }}>
            <CardContent sx={{ py: 2 }}>
              <Typography variant="h5" sx={{ fontWeight: 700, color: card.color }}>
                {card.value}
              </Typography>
              <Typography variant="body2" sx={{ color: "#6B7280" }}>
                {card.label}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}

export function PendingPaymentsTable() {
  const { pendingPayments } = useServiceDashboard();
  const router = useRouter();

  return (
    <Card sx={CARD_SX}>
      <CardContent sx={{ p: 3 }}>
        <BoxHeader
          title="Pending Payments"
          action={
            <Button size="small" onClick={() => router.push("/service/service-invoice/")}>
              View Invoices
            </Button>
          }
        />
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Invoice</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Date</TableCell>
                <TableCell align="right">Amount</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pendingPayments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    No pending payments
                  </TableCell>
                </TableRow>
              ) : (
                pendingPayments.map((inv) => (
                  <TableRow
                    key={inv.id}
                    hover
                    sx={{ cursor: "pointer" }}
                    onClick={() => router.push(`/service/service-invoice/${inv.id}`)}
                  >
                    <TableCell>{inv.documentNo}</TableCell>
                    <TableCell>{inv.customerName}</TableCell>
                    <TableCell>{formatDate(inv.documentDate || inv.createdOn)}</TableCell>
                    <TableCell align="right">{formatCurrency(inv.netTotal)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
}

function BoxHeader({ title, action }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
      <Typography variant="h6" sx={{ fontWeight: 600 }}>
        {title}
      </Typography>
      {action}
    </div>
  );
}
