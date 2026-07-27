import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import { Box, Button, CircularProgress, Typography } from "@mui/material";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import BASE_URL from "Base/api";
import styles from "@/styles/PageTitle.module.css";
import { formatCurrency, formatDate } from "@/components/utils/formatHelper";

const labelSx = {
  fontWeight: "500",
  p: 1,
  fontSize: "14px",
  display: "block",
  width: "35%",
};

export default function ShipmentInvoiceView() {
  const router = useRouter();
  const { id } = router.query;
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!router.isReady || !id) return;

    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${BASE_URL}/ShipmentInvoice/GetById/${id}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        });
        const json = await res.json();
        const header = json?.result?.result ?? json?.result ?? json?.data ?? json;
        if (!res.ok || header == null) {
          toast.error(json?.message || "Failed to load shipment invoice.");
          setInvoice(null);
        } else {
          setInvoice(header);
        }
      } catch (e) {
        toast.error("Failed to load shipment invoice.");
        setInvoice(null);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [router.isReady, id]);

  const lines = invoice?.shipmentInvoiceLineDetails ?? invoice?.ShipmentInvoiceLineDetails ?? [];
  const costs =
    invoice?.shipmentInvoiceAdditionalCosts ?? invoice?.ShipmentInvoiceAdditionalCosts ?? [];

  const lineSubtotal = Array.isArray(lines)
    ? lines.reduce((s, l) => s + (parseFloat(l.lineTotal) || 0), 0)
    : 0;
  const additionalTotal = Array.isArray(costs)
    ? costs.reduce((s, c) => s + (parseFloat(c.amount) || 0), 0)
    : 0;
  const grandTotal =
    invoice?.grandTotal != null ? parseFloat(invoice.grandTotal) : lineSubtotal + additionalTotal;

  const supplierName =
    invoice?.supplierName ?? invoice?.SupplierName ?? null;

  const goBack = () => {
    router.push({ pathname: "/sales/shipment-invoice/" });
  };

  const handlePrint = () => {
    if (!id) return;
    window.open(
      `/sales/shipment-invoice/print?id=${id}`,
      "_blank",
      "width=900,height=700"
    );
  };

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Shipment Invoice</h1>
        <ul>
          <li>
            <Link href="/sales/shipment-invoice/">Shipment Invoice</Link>
          </li>
          <li>View</li>
        </ul>
      </div>

      {loading ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      ) : !invoice ? (
        <Typography color="error">Invoice not found.</Typography>
      ) : (
        <Grid
          container
          rowSpacing={1}
          columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}
        >
          <Grid item xs={12} sx={{ background: "#fff" }}>
            <Grid container p={1}>
              <Grid item xs={12} className="no-print" display="flex" justifyContent="space-between" alignItems="center">
                <Button variant="outlined" disabled>
                  <Typography sx={{ fontWeight: "bold" }}>
                    Document No: {invoice.documentNo || "—"}
                  </Typography>
                </Button>
                <Box display="flex" gap={2}>
                  <Button variant="outlined" onClick={goBack}>
                    <Typography sx={{ fontWeight: "bold" }}>Go Back</Typography>
                  </Button>
                  <Button variant="outlined" onClick={handlePrint}>
                    <Typography sx={{ fontWeight: "bold" }}>Print</Typography>
                  </Button>
                </Box>
              </Grid>

              <Grid item xs={12} lg={6} display="flex" flexDirection="column">
                <Grid item xs={12} display="flex" justifyContent="space-between" mt={1}>
                  <Typography component="label" sx={labelSx}>
                    Invoice Date
                  </Typography>
                  <Typography sx={{ width: "60%", p: 1, fontSize: "14px" }}>
                    {formatDate(invoice.invoiceDate)}
                  </Typography>
                </Grid>
                <Grid item xs={12} display="flex" justifyContent="space-between" mt={1}>
                  <Typography component="label" sx={labelSx}>
                    Supplier
                  </Typography>
                  <Typography sx={{ width: "60%", p: 1, fontSize: "14px" }}>
                    {supplierName != null && supplierName !== ""
                      ? supplierName
                      : invoice.supplierId != null
                        ? String(invoice.supplierId)
                        : "—"}
                  </Typography>
                </Grid>
              </Grid>

              <Grid item xs={12} lg={6} display="flex" flexDirection="column">
                <Grid item xs={12} display="flex" justifyContent="space-between" mt={1}>
                  <Typography component="label" sx={labelSx}>
                    Reference No
                  </Typography>
                  <Typography sx={{ width: "60%", p: 1, fontSize: "14px" }}>
                    {invoice.referenceNo || "—"}
                  </Typography>
                </Grid>
                <Grid item xs={12} display="flex" justifyContent="space-between" mt={1}>
                  <Typography component="label" sx={labelSx}>
                    Remark
                  </Typography>
                  <Typography sx={{ width: "60%", p: 1, fontSize: "14px" }}>
                    {invoice.remark || "—"}
                  </Typography>
                </Grid>
              </Grid>

              <Grid item xs={12} mt={2}>
                <Typography sx={{ fontWeight: "bold", pl: 1 }}>Line Items</Typography>
              </Grid>
              <Grid item xs={12}>
                <TableContainer component={Paper}>
                  <Table size="small" className="dark-table">
                    <TableHead>
                      <TableRow sx={{ background: "#757fef" }}>
                        <TableCell sx={{ color: "#fff" }}>#</TableCell>
                        <TableCell sx={{ color: "#fff" }}>Item Name</TableCell>
                        <TableCell sx={{ color: "#fff" }}>Description</TableCell>
                        <TableCell sx={{ color: "#fff" }}>Qty</TableCell>
                        <TableCell align="right" sx={{ color: "#fff" }}>
                          Unit Price
                        </TableCell>
                        <TableCell align="right" sx={{ color: "#fff" }}>
                          Line Total
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {lines.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} align="center">
                            No line items
                          </TableCell>
                        </TableRow>
                      ) : (
                        lines.map((row, idx) => (
                          <TableRow key={row.id ?? row.internalId ?? idx}>
                            <TableCell sx={{ p: 1 }}>{idx + 1}</TableCell>
                            <TableCell sx={{ p: 1 }}>{row.itemName}</TableCell>
                            <TableCell sx={{ p: 1 }}>{row.description || "—"}</TableCell>
                            <TableCell sx={{ p: 1 }}>{row.quantity}</TableCell>
                            <TableCell align="right" sx={{ p: 1 }}>
                              {formatCurrency(row.unitPrice)}
                            </TableCell>
                            <TableCell align="right" sx={{ p: 1 }}>
                              {formatCurrency(row.lineTotal)}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                      <TableRow>
                        <TableCell align="right" colSpan={5}>
                          <Typography fontWeight="bold">Line Subtotal</Typography>
                        </TableCell>
                        <TableCell align="right" sx={{ p: 1 }}>
                          <Typography fontWeight="bold">
                            {formatCurrency(invoice.totalLineAmount ?? lineSubtotal)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>

              <Grid item xs={12} mt={2}>
                <Typography sx={{ fontWeight: "bold", pl: 1 }}>Additional Costs</Typography>
              </Grid>
              <Grid item xs={12}>
                <TableContainer component={Paper}>
                  <Table size="small" className="dark-table">
                    <TableHead>
                      <TableRow sx={{ background: "#757fef" }}>
                        <TableCell sx={{ color: "#fff" }}>#</TableCell>
                        <TableCell sx={{ color: "#fff" }}>Cost Type</TableCell>
                        <TableCell sx={{ color: "#fff" }}>Description</TableCell>
                        <TableCell align="right" sx={{ color: "#fff" }}>
                          Amount
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {costs.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} align="center">
                            No additional costs
                          </TableCell>
                        </TableRow>
                      ) : (
                        costs.map((row, idx) => (
                          <TableRow key={row.id ?? row.internalId ?? idx}>
                            <TableCell sx={{ p: 1 }}>{idx + 1}</TableCell>
                            <TableCell sx={{ p: 1 }}>{row.costType}</TableCell>
                            <TableCell sx={{ p: 1 }}>{row.description || "—"}</TableCell>
                            <TableCell align="right" sx={{ p: 1 }}>
                              {formatCurrency(row.amount)}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                      <TableRow>
                        <TableCell align="right" colSpan={3}>
                          <Typography fontWeight="bold">Additional Costs Subtotal</Typography>
                        </TableCell>
                        <TableCell align="right" sx={{ p: 1 }}>
                          <Typography fontWeight="bold">
                            {formatCurrency(invoice.totalAdditionalCost ?? additionalTotal)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>

              <Grid item xs={12} display="flex" justifyContent="flex-end" mt={2}>
                <Typography fontWeight="bold" variant="h6">
                  Grand Total: {formatCurrency(grandTotal)}
                </Typography>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      )}
    </>
  );
}
