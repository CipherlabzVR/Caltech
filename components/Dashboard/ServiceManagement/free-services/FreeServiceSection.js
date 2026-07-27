import React, { useEffect, useMemo, useState } from "react";
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
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import CircularProgress from "@mui/material/CircularProgress";
import { Search, StyledInputBase } from "@/styles/main/search-styles";
import { formatDate } from "@/components/utils/formatHelper";
import { CARD_SX } from "../constants";
import { useServiceDashboard } from "../ServiceDashboardProvider";

function SummaryCard({ label, value, color }) {
  return (
    <Card sx={{ ...CARD_SX, borderTop: `3px solid ${color}` }}>
      <CardContent sx={{ py: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color }}>
          {value}
        </Typography>
        <Typography variant="body2" sx={{ color: "#6B7280" }}>
          {label}
        </Typography>
      </CardContent>
    </Card>
  );
}

function RemainingChip({ remaining, allowed }) {
  if (allowed <= 0) {
    return <Chip size="small" label="None" />;
  }
  if (remaining <= 0) {
    return <Chip size="small" color="error" label="Used up" />;
  }
  if (remaining === allowed) {
    return <Chip size="small" color="success" label={`${remaining} left`} />;
  }
  return <Chip size="small" color="warning" label={`${remaining} left`} />;
}

export function FreeServiceSummaryCards() {
  const { freeServiceEntitlements, freeServiceLoading } = useServiceDashboard();
  const data = freeServiceEntitlements;

  if (freeServiceLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  const cards = [
    { label: "Sold Units with Free Service", value: data?.totalUnits ?? 0, color: "#2563EB" },
    { label: "Total Free Services Allowed", value: data?.totalAllowed ?? 0, color: "#059669" },
    { label: "Free Services Used", value: data?.totalUsed ?? 0, color: "#D97706" },
    { label: "Free Services Remaining", value: data?.totalRemaining ?? 0, color: "#7C3AED" },
  ];

  return (
    <Grid container spacing={2}>
      {cards.map((card) => (
        <Grid item xs={12} sm={6} md={3} key={card.label}>
          <SummaryCard {...card} />
        </Grid>
      ))}
    </Grid>
  );
}

export default function FreeServiceSection() {
  const { freeServiceEntitlements, freeServiceLoading, refreshFreeServices, warehouseId } =
    useServiceDashboard();
  const [tab, setTab] = useState(0);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(handle);
  }, [search]);

  useEffect(() => {
    refreshFreeServices(debouncedSearch);
  }, [debouncedSearch, warehouseId, refreshFreeServices]);

  const productSummaries = freeServiceEntitlements?.productSummaries ?? [];
  const details = freeServiceEntitlements?.details ?? [];

  const emptyMessage = useMemo(() => {
    if (debouncedSearch) return "No products match your search.";
    return "No sold products with free-service entitlement yet.";
  }, [debouncedSearch]);

  return (
    <Box>
      <Box sx={{ mb: 2, maxWidth: 420 }}>
        <Search className="search-form">
          <StyledInputBase
            placeholder="Search product, customer, serial, invoice…"
            inputProps={{ "aria-label": "search free services" }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </Search>
      </Box>

      <FreeServiceSummaryCards />

      <Card sx={{ ...CARD_SX, mt: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Free Service Entitlements by Product
          </Typography>

          <Tabs
            value={tab}
            onChange={(_, value) => setTab(value)}
            sx={{ mb: 2, borderBottom: 1, borderColor: "divider" }}
          >
            <Tab label="By Product" />
            <Tab label="By Sold Unit" />
          </Tabs>

          {freeServiceLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress size={32} />
            </Box>
          ) : tab === 0 ? (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Product</TableCell>
                    <TableCell>Code</TableCell>
                    <TableCell align="right">Units Sold</TableCell>
                    <TableCell align="right">Allowed</TableCell>
                    <TableCell align="right">Used</TableCell>
                    <TableCell align="right">Remaining</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {productSummaries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        {emptyMessage}
                      </TableCell>
                    </TableRow>
                  ) : (
                    productSummaries.map((row) => (
                      <TableRow key={`${row.productId}-${row.productName}`} hover>
                        <TableCell>{row.productName || "—"}</TableCell>
                        <TableCell>{row.productCode || "—"}</TableCell>
                        <TableCell align="right">{row.unitsWithEntitlement}</TableCell>
                        <TableCell align="right">{row.freeServicesAllowed}</TableCell>
                        <TableCell align="right">{row.freeServicesUsed}</TableCell>
                        <TableCell align="right">
                          <RemainingChip
                            remaining={row.freeServicesRemaining}
                            allowed={row.freeServicesAllowed}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Product</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell>Serial</TableCell>
                    <TableCell>Invoice</TableCell>
                    <TableCell>Warranty</TableCell>
                    <TableCell align="right">Allowed</TableCell>
                    <TableCell align="right">Used</TableCell>
                    <TableCell align="right">Remaining</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {details.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        {emptyMessage}
                      </TableCell>
                    </TableRow>
                  ) : (
                    details.map((row) => (
                      <TableRow
                        key={`${row.purchaseInvoiceId}-${row.purchaseInvoiceLineId ?? "h"}`}
                        hover
                      >
                        <TableCell>{row.productName || "—"}</TableCell>
                        <TableCell>{row.customerName || "—"}</TableCell>
                        <TableCell>{row.serialNumber || "—"}</TableCell>
                        <TableCell>{row.documentNo}</TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2">{row.warrantyType || "—"}</Typography>
                            {row.warrantyExpiry && (
                              <Typography variant="caption" color="text.secondary">
                                {row.warrantyActive ? "Active until" : "Expired"}{" "}
                                {formatDate(row.warrantyExpiry)}
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell align="right">{row.freeServicesAllowed}</TableCell>
                        <TableCell align="right">{row.freeServicesUsed}</TableCell>
                        <TableCell align="right">
                          <RemainingChip
                            remaining={row.freeServicesRemaining}
                            allowed={row.freeServicesAllowed}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
