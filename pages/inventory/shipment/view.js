import React, { useEffect, useState } from "react";
import Grid from "@mui/material/Grid";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import BASE_URL from "Base/api";
import { useRouter } from "next/router";
import { formatCurrency, formatDate } from "@/components/utils/formatHelper";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const labelSx = {
  fontWeight: "500",
  p: 1,
  fontSize: "14px",
  display: "block",
  width: "35%",
  color: "text.secondary",
};

const ShipmentView = () => {
  const [shipmentLineDetails, setShipmentLineDetails] = useState([]);
  const [order, setOrder] = useState({});
  const [currencyId, setCurrencyId] = useState("");
  const [currencies, setCurrencies] = useState([]);
  const [overseasTransport, setOverseasTransport] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const { query } = useRouter();
  const { id } = query;

  const isOrderStatus = order.status === 1;

  const fetchCurrencies = async () => {
    
    try {
      const response = await fetch(
        `${BASE_URL}/Currency/GetAllCurrencyWithoutAuthorize`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch currencies");
      }

      const data = await response.json();
      const list = Array.isArray(data.result) ? data.result : [];
      setCurrencies(list);
    } catch (error) {
      console.error("Error fetching currencies:", error);
    }
  };

  const fetchShipmentNote = async () => {
    try {
      setLoading(true);
      setNotFound(false);
      const response = await fetch(
        `${BASE_URL}/ShipmentNote/GetShipmentDetailsByIdWithoutAuthorize?id=${id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok || !data.result) {
        setNotFound(true);
        setOrder({});
        setShipmentLineDetails([]);
        return;
      }

      const result = data.result;
      const lines = result.shipmentNoteLineDetails ?? [];

      const shipmentDetailsWithLineTotal = lines.map((row) => {
        const unitPrice =
          row.supplierUnitPrice === 0 || row.supplierUnitPrice === null
            ? null
            : row.supplierUnitPrice;
        const orderedQty = parseFloat(row.qty || 0);
        return {
          ...row,
          unitPrice,
          lineTotal: orderedQty * parseFloat(unitPrice || 0),
        };
      });

      setOrder(result);
      setCurrencyId(result.currencyId ?? "");
      setOverseasTransport(
        result.overseasTransport != null && result.overseasTransport !== ""
          ? String(result.overseasTransport)
          : ""
      );
      setShipmentLineDetails(shipmentDetailsWithLineTotal);
    } catch (error) {
      console.error("Error fetching shipment:", error);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchShipmentNote();
      fetchCurrencies();
    }
  }, [id]);

  const handleUnitPriceChange = (index, value) => {
    const updatedShipmentLineDetails = [...shipmentLineDetails];
    const parsedValue =
      value === "" || value === null || value === undefined
        ? null
        : parseFloat(value);
    const unitPrice = isNaN(parsedValue) ? null : parsedValue;

    updatedShipmentLineDetails[index].unitPrice = unitPrice;
    const orderedQty = parseFloat(updatedShipmentLineDetails[index].qty || 0);
    updatedShipmentLineDetails[index].lineTotal =
      orderedQty * parseFloat(unitPrice || 0);

    setShipmentLineDetails(updatedShipmentLineDetails);
  };

  const finalTotal = shipmentLineDetails.reduce(
    (total, row) => total + (row.lineTotal || 0),
    0
  );

  const handleSubmit = async () => {
    if (!currencyId) {
      toast.info("Please select a currency.");
      return;
    }

    const hasInvalidUnitPrice = shipmentLineDetails.some(
      (row) =>
        row.unitPrice === null ||
        row.unitPrice === undefined ||
        row.unitPrice < 0
    );

    if (hasInvalidUnitPrice) {
      toast.info("Please enter unit price for all shipment lines.");
      return;
    }

    const parsedOverseasTransport =
      overseasTransport === "" || overseasTransport == null
        ? null
        : parseFloat(overseasTransport);

    if (
      parsedOverseasTransport != null &&
      (isNaN(parsedOverseasTransport) || parsedOverseasTransport < 0)
    ) {
      toast.info("Overseas Transport must be 0 or greater.");
      return;
    }

    const data = {
      shipmentNoteId: Number(id),
      currencyId: Number(currencyId),
      overseasTransport: parsedOverseasTransport,
      shipmentNoteLineDetails: shipmentLineDetails.map((row) => ({
        id: row.id,
        supplierUnitPrice: row.unitPrice,
      })),
    };

    try {
      setIsSubmitting(true);
      const response = await fetch(
        `${BASE_URL}/ShipmentNote/UpdateShipmentSupplierPricingWithoutAuthorize`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        }
      );

      const jsonResponse = await response.json();

      if (response.ok && jsonResponse.statusCode === 200) {
        toast.success(jsonResponse.message || "Shipment updated successfully.");
        fetchShipmentNote();
      } else {
        toast.error(jsonResponse.message || "Failed to update shipment.");
      }
    } catch (error) {
      console.error("Error submitting shipment:", error);
      toast.error("An error occurred while submitting.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, minHeight: "100vh", bgcolor: "#f5f5f5" }}>
      <ToastContainer />
      <Box sx={{ maxWidth: 1200, mx: "auto" }}>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, md: 3 },
            mb: 2,
            borderRadius: 2,
            background: "linear-gradient(135deg, #757fef 0%, #5a63c7 100%)",
            color: "#fff",
          }}
        >
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", sm: "center" }}
            flexDirection={{ xs: "column", sm: "row" }}
            gap={2}
          >
            <Box>
              <Typography variant="body2" sx={{ opacity: 0.85, mb: 0.5 }}>
                Shipment Note
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, letterSpacing: 0.5 }}>
                {loading ? "..." : order.documentNo || "—"}
              </Typography>
            </Box>
            {!loading && order.documentNo ? (
              isOrderStatus ? (
                <Chip
                  label="Order"
                  sx={{
                    bgcolor: "rgba(255,255,255,0.2)",
                    color: "#fff",
                    fontWeight: 600,
                  }}
                />
              ) : (
                <Chip
                  label="Submission Closed"
                  sx={{
                    bgcolor: "rgba(255,255,255,0.15)",
                    color: "#fff",
                    fontWeight: 600,
                  }}
                />
              )
            ) : null}
          </Box>
        </Paper>

        {loading ? (
          <Box display="flex" justifyContent="center" py={6}>
            <CircularProgress />
          </Box>
        ) : notFound ? (
          <Paper elevation={0} sx={{ p: 4, borderRadius: 2, textAlign: "center" }}>
            <Typography color="error" variant="h6">
              Shipment not found.
            </Typography>
          </Paper>
        ) : (
          <Paper elevation={0} sx={{ borderRadius: 2, overflow: "hidden" }}>
            <Grid container p={{ xs: 2, md: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6} display="flex" justifyContent="space-between" alignItems="center">
                <Typography component="label" sx={labelSx}>
                  Supplier
                </Typography>
                <Typography sx={{ width: "60%", p: 1, fontSize: "14px", fontWeight: 500 }}>
                  {order.supplierName || "—"}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6} display="flex" justifyContent="space-between" alignItems="center">
                <Typography component="label" sx={labelSx}>
                  Shipment Date
                </Typography>
                <Typography sx={{ width: "60%", p: 1, fontSize: "14px" }}>
                  {formatDate(order.shipmentDate) || "—"}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6} display="flex" justifyContent="space-between" alignItems="center">
                <Typography component="label" sx={labelSx}>
                  Currency
                </Typography>
                <Select
                  value={currencyId}
                  onChange={(e) => setCurrencyId(e.target.value)}
                  sx={{ width: "60%" }}
                  size="small"
                  displayEmpty
                  disabled={!isOrderStatus}
                >
                  <MenuItem value="">
                    <em>Select Currency</em>
                  </MenuItem>
                  {currencies.map((currency) => (
                    <MenuItem key={currency.id} value={currency.id}>
                      {currency.currencyName} ({currency.code})
                    </MenuItem>
                  ))}
                </Select>
              </Grid>
              <Grid item xs={12} md={6} display="flex" justifyContent="space-between" alignItems="center">
                <Typography component="label" sx={labelSx}>
                  Overseas Transport
                </Typography>
                <TextField
                  type="number"
                  value={overseasTransport}
                  onChange={(e) => setOverseasTransport(e.target.value)}
                  sx={{ width: "60%" }}
                  size="small"
                  disabled={!isOrderStatus}
                  inputProps={{ min: 0, step: "0.01" }}
                  placeholder="0.00"
                />
              </Grid>
            </Grid>

              <Grid item xs={12} mt={3}>
                <Divider sx={{ mb: 2 }} />
                <Typography sx={{ fontWeight: 600, mb: 1 }}>
                  Line Items
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <TableContainer component={Paper} variant="outlined">
                  <Table
                    size="small"
                    aria-label="shipment lines table"
                    className="dark-table"
                  >
                    <TableHead>
                      <TableRow sx={{ background: "#757fef" }}>
                        <TableCell sx={{ color: "#fff" }}>#</TableCell>
                        <TableCell sx={{ color: "#fff" }}>
                          Product Name
                        </TableCell>
                        <TableCell sx={{ color: "#fff" }}>Ordered Qty</TableCell>
                        <TableCell sx={{ color: "#fff" }}>Unit Price</TableCell>
                        <TableCell sx={{ color: "#fff" }} align="right">
                          Line Total
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {shipmentLineDetails.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} align="center">
                            No line items available
                          </TableCell>
                        </TableRow>
                      ) : (
                        shipmentLineDetails.map((row, index) => (
                          <TableRow
                            key={row.id}
                            sx={{
                              "&:last-child td, &:last-child th": { border: 0 },
                            }}
                          >
                            <TableCell sx={{ p: 1 }}>{index + 1}</TableCell>
                            <TableCell sx={{ p: 1 }} component="th" scope="row">
                              {row.productName}
                            </TableCell>
                            <TableCell sx={{ p: 1 }} component="th" scope="row">
                              {row.qty}
                            </TableCell>
                            <TableCell sx={{ p: 1 }}>
                              <TextField
                                type="number"
                                value={
                                  row.unitPrice === null ||
                                  row.unitPrice === undefined
                                    ? ""
                                    : row.unitPrice
                                }
                                fullWidth
                                size="small"
                                disabled={!isOrderStatus}
                                inputProps={{ min: 0, step: "0.01" }}
                                onChange={(e) =>
                                  handleUnitPriceChange(index, e.target.value)
                                }
                              />
                            </TableCell>
                            <TableCell align="right" sx={{ p: 1 }}>
                              {formatCurrency(row.lineTotal)}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                      <TableRow>
                        <TableCell align="right" colSpan={4}>
                          <Typography sx={{ fontWeight: "bold" }}>Total</Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography sx={{ fontWeight: "bold" }}>
                            {formatCurrency(finalTotal || null)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>

              <Grid item xs={12} mt={3} display="flex" justifyContent="flex-end">
                <Button
                  variant="contained"
                  onClick={handleSubmit}
                  disabled={isSubmitting || !isOrderStatus}
                  sx={{ minWidth: 140 }}
                  startIcon={
                    isSubmitting ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : null
                  }
                >
                  {isSubmitting ? "Submitting..." : "Submit"}
                </Button>
              </Grid>
            </Grid>
          </Paper>
        )}
      </Box>
    </Box>
  );
};

export default ShipmentView;
