import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Grid from "@mui/material/Grid";
import {
  Autocomplete,
  Box,
  Button,
  IconButton,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { v4 as uuidv4 } from "uuid";
import { useRouter } from "next/router";
import styles from "@/styles/PageTitle.module.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import BASE_URL from "Base/api";
import useApi from "@/components/utils/useApi";
import { formatCurrency, formatDate } from "@/components/utils/formatHelper";
import LoadingButton from "@/components/UIElements/Buttons/LoadingButton";

const COST_TYPES = ["Duty", "Transport", "Shipment", "Other", "Additional Cost"];

const labelSx = {
  fontWeight: "500",
  p: 1,
  fontSize: "14px",
  display: "block",
  width: "35%",
};

const emptyLineRow = () => ({
  rowKey: uuidv4(),
  itemName: "",
  description: "",
  quantity: "",
  unitPrice: "",
});

const emptyCostRow = () => ({
  rowKey: uuidv4(),
  costType: "Duty",
  description: "",
  amount: "",
});

/** Map ShipmentNote line details to invoice line rows (uses received qty × cost price). */
const buildLineRowsFromShipmentNote = (note) => {
  const raw = note?.shipmentNoteLineDetails ?? note?.ShipmentNoteLineDetails ?? [];
  if (!Array.isArray(raw) || raw.length === 0) return [emptyLineRow()];
  return raw.map((line) => {
    const receivedQty = parseFloat(line.receivedQty ?? line.ReceivedQty ?? 0) || 0;
    const unitCost =
      parseFloat(
        line.costPrice ?? line.CostPrice ?? line.unitPrice ?? line.UnitPrice ?? 0
      ) || 0;
    return {
      rowKey: uuidv4(),
      itemName: String(line.productName ?? line.ProductName ?? "").trim(),
      description: "",
      quantity: receivedQty === 0 ? "" : String(receivedQty),
      unitPrice: unitCost === 0 ? "" : String(unitCost),
    };
  });
};

/** Aggregate additional / freight from all shipment lines into cost rows. */
const buildCostRowsFromShipmentNote = (note) => {
  const raw = note?.shipmentNoteLineDetails ?? note?.ShipmentNoteLineDetails ?? [];
  if (!Array.isArray(raw) || raw.length === 0) return [];
  let sumAdditional = 0;
  let sumFreight = 0;
  for (const line of raw) {
    sumAdditional += parseFloat(line.additionalCost ?? line.AdditionalCost ?? 0) || 0;
    sumFreight += parseFloat(line.freightDutyCost ?? line.FreightDutyCost ?? 0) || 0;
  }
  const rows = [];
  if (sumAdditional > 0) {
    rows.push({
      rowKey: uuidv4(),
      costType: "Additional Cost",
      description: "",
      amount: String(sumAdditional),
    });
  }
  if (sumFreight > 0) {
    rows.push({
      rowKey: uuidv4(),
      costType: "Duty",
      description: "",
      amount: String(sumFreight),
    });
  }
  return rows;
};

export default function CreateShipmentInvoice() {
  const router = useRouter();
  const today = new Date();
  const [invoiceDate, setInvoiceDate] = useState(formatDate(today));
  const [documentNo, setDocumentNo] = useState("");
  const [selectedShipmentNote, setSelectedShipmentNote] = useState(null);
  const [referenceNo, setReferenceNo] = useState("");
  const [remark, setRemark] = useState("");
  const [lineRows, setLineRows] = useState([emptyLineRow()]);
  const [costRows, setCostRows] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: shipmentNotesRaw, loading: shipmentLoading } = useApi("/ShipmentNote/GetCompletedShipmentNotes");
  const shipmentNotes = useMemo(
    () => (Array.isArray(shipmentNotesRaw) ? shipmentNotesRaw : []),
    [shipmentNotesRaw]
  );

  const fetchNextDocumentNumber = async () => {
    try {
      const response = await fetch(
        `${BASE_URL}/DocumentSequence/GetNextDocumentNumber?documentType=63`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok) throw new Error("Failed to fetch document number");
      const result = await response.json();
      const next =
        result?.result ??
        result?.Result ??
        (typeof result === "string" ? result : "");
      if (next) setDocumentNo(String(next));
    } catch (e) {
      toast.error("Could not load next document number.");
    }
  };

  useEffect(() => {
    fetchNextDocumentNumber();
  }, []);

  const lineRowsWithTotals = useMemo(() => {
    return lineRows.map((row) => {
      const qty = parseFloat(row.quantity) || 0;
      const price = parseFloat(row.unitPrice) || 0;
      return { ...row, lineTotal: qty * price };
    });
  }, [lineRows]);

  const lineSubtotal = useMemo(
    () => lineRowsWithTotals.reduce((sum, r) => sum + (r.lineTotal || 0), 0),
    [lineRowsWithTotals]
  );

  const additionalCostSubtotal = useMemo(
    () =>
      costRows.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0),
    [costRows]
  );

  const grandTotal = useMemo(
    () => lineSubtotal + additionalCostSubtotal,
    [lineSubtotal, additionalCostSubtotal]
  );

  const updateLineRow = (rowKey, field, value) => {
    setLineRows((prev) =>
      prev.map((row) => (row.rowKey === rowKey ? { ...row, [field]: value } : row))
    );
  };

  const addLineRow = () => {
    setLineRows((prev) => [...prev, emptyLineRow()]);
  };

  const removeLineRow = (rowKey) => {
    setLineRows((prev) => {
      const next = prev.filter((r) => r.rowKey !== rowKey);
      return next.length ? next : [emptyLineRow()];
    });
  };

  const updateCostRow = (rowKey, field, value) => {
    setCostRows((prev) =>
      prev.map((row) => (row.rowKey === rowKey ? { ...row, [field]: value } : row))
    );
  };

  const addCostRow = () => {
    setCostRows((prev) => [...prev, emptyCostRow()]);
  };

  const removeCostRow = (rowKey) => {
    setCostRows((prev) => prev.filter((r) => r.rowKey !== rowKey));
  };

  const handleShipmentNoteChange = (_, v) => {
    setSelectedShipmentNote(v);
    if (!v) {
      setLineRows([emptyLineRow()]);
      setCostRows([]);
      return;
    }
    setLineRows(buildLineRowsFromShipmentNote(v));
    setCostRows(buildCostRowsFromShipmentNote(v));
  };

  const navigateToBack = () => {
    router.push({ pathname: "/sales/shipment-invoice/" });
  };

  const handleSubmit = async () => {
    if (!selectedShipmentNote) {
      toast.error("Please select a shipment note.");
      return;
    }
    const validLines = lineRowsWithTotals.filter(
      (r) => (r.itemName || "").trim() !== "" && (parseFloat(r.quantity) || 0) > 0
    );
    if (validLines.length === 0) {
      toast.error("Add at least one line item with item name and quantity.");
      return;
    }

    const shipmentInvoiceLineDetails = validLines.map((r) => ({
      itemId: 0,
      itemName: r.itemName || "",
      description: r.description || null,
      quantity: parseFloat(r.quantity) || 0,
      unitPrice: parseFloat(r.unitPrice) || 0,
      lineTotal: r.lineTotal || 0,
    }));

    const shipmentInvoiceAdditionalCosts = costRows
      .filter((r) => (parseFloat(r.amount) || 0) !== 0 || (r.description || "").trim() !== "")
      .map((r) => ({
        costType: r.costType || "Other",
        description: r.description || null,
        amount: parseFloat(r.amount) || 0,
      }));

    const payload = {
      shipmentNoteId: selectedShipmentNote.id ?? selectedShipmentNote.Id,
      documentNo: documentNo || "",
      invoiceDate: invoiceDate ? new Date(invoiceDate).toISOString() : new Date().toISOString(),
      supplierId: selectedShipmentNote.supplierId ?? selectedShipmentNote.SupplierId,
      referenceNo: referenceNo || null,
      remark: remark || null,
      totalLineAmount: lineSubtotal,
      totalAdditionalCost: additionalCostSubtotal,
      grandTotal,
      shipmentInvoiceLineDetails,
      shipmentInvoiceAdditionalCosts,
    };

    try {
      setIsSubmitting(true);
      const res = await fetch(`${BASE_URL}/ShipmentInvoice/CreateShipmentInvoice`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      const inner = json.result ?? json;
      const success =
        res.ok &&
        inner &&
        inner.statusCode === 200 &&
        inner.result != null;

      if (success) {
        toast.success(inner.message || "Shipment invoice created successfully.");
        router.push({ pathname: "/sales/shipment-invoice/" });
      } else {
        toast.error(inner?.message || json?.message || "Failed to create shipment invoice.");
      }
    } catch (err) {
      toast.error("Failed to create shipment invoice.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Shipment Invoice Create</h1>
        <ul>
          <li>
            <Link href="/sales/shipment-invoice/">Shipment Invoice</Link>
          </li>
          <li>Create</li>
        </ul>
      </div>

      <Grid
        container
        rowSpacing={1}
        columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}
      >
        <Grid item xs={12} sx={{ background: "#fff" }}>
          <Grid container p={1}>
            <Grid item xs={12} display="flex" justifyContent="space-between" alignItems="center">
              <Box display="flex" gap={2}>
                <Button variant="outlined" disabled>
                  <Typography sx={{ fontWeight: "bold" }}>
                    Document No: {documentNo || "—"}
                  </Typography>
                </Button>
              </Box>
              <Button variant="outlined" onClick={navigateToBack}>
                <Typography sx={{ fontWeight: "bold" }}>Go Back</Typography>
              </Button>
            </Grid>

            <Grid item xs={12} lg={6} display="flex" flexDirection="column">
              <Grid
                item
                xs={12}
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mt={1}
              >
                <Typography component="label" sx={labelSx}>
                  Shipment Note
                </Typography>
                <Autocomplete
                  sx={{ width: "60%" }}
                  options={shipmentNotes}
                  loading={shipmentLoading}
                  getOptionLabel={(o) => {
                    const doc = o?.documentNo ?? o?.DocumentNo ?? "";
                    const sup = o?.supplierName ?? o?.SupplierName ?? "";
                    return doc ? `${doc} — ${sup}` : "";
                  }}
                  isOptionEqualToValue={(a, b) =>
                    a && b ? (a.id ?? a.Id) === (b.id ?? b.Id) : a === b
                  }
                  value={selectedShipmentNote}
                  onChange={handleShipmentNoteChange}
                  renderInput={(params) => (
                    <TextField {...params} size="small" fullWidth placeholder="Select shipment note" required />
                  )}
                />
              </Grid>
              <Grid item xs={12} display="flex" justifyContent="space-between" mt={1}>
                <Typography component="label" sx={labelSx}>
                  Invoice Date
                </Typography>
                <TextField
                  sx={{ width: "60%" }}
                  size="small"
                  type="date"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} display="flex" justifyContent="space-between" mt={1}>
                <Typography component="label" sx={labelSx}>
                  Reference No
                </Typography>
                <TextField
                  sx={{ width: "60%" }}
                  size="small"
                  fullWidth
                  placeholder="Reference No"
                  value={referenceNo}
                  onChange={(e) => setReferenceNo(e.target.value)}
                />
              </Grid>
            </Grid>

            <Grid item xs={12} lg={6} display="flex" flexDirection="column">
              <Grid item xs={12} display="flex" justifyContent="space-between" mt={1}>
                <Typography component="label" sx={labelSx}>
                  Supplier
                </Typography>
                <TextField
                  sx={{ width: "60%" }}
                  size="small"
                  fullWidth
                  placeholder="Supplier"
                  value={selectedShipmentNote?.supplierName ?? selectedShipmentNote?.SupplierName ?? ""}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={12} display="flex" justifyContent="space-between" mt={1}>
                <Typography component="label" sx={labelSx}>
                  Remark
                </Typography>
                <TextField
                  sx={{ width: "60%" }}
                  size="small"
                  fullWidth
                  placeholder="Remark"
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                />
              </Grid>
            </Grid>

            <Grid
              item
              xs={12}
              sx={{
                mt: 2,
                mb: 1.5,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography sx={{ fontWeight: "bold", pl: 1 }}>Line Items</Typography>
              <Button variant="outlined" size="small" onClick={addLineRow}>
                + Add Row
              </Button>
            </Grid>

            <Grid item xs={12}>
              <TableContainer component={Paper}>
                <Table size="small" aria-label="line items" className="dark-table">
                  <TableHead>
                    <TableRow sx={{ background: "#757fef" }}>
                      <TableCell sx={{ color: "#fff", width: 48 }} align="center" />
                      <TableCell sx={{ color: "#fff" }}>#</TableCell>
                      <TableCell sx={{ color: "#fff" }}>Item Name</TableCell>
                      <TableCell sx={{ color: "#fff" }}>Description</TableCell>
                      <TableCell sx={{ color: "#fff" }}>Qty</TableCell>
                      <TableCell sx={{ color: "#fff" }}>Unit Price</TableCell>
                      <TableCell align="right" sx={{ color: "#fff" }}>
                        Line Total
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {lineRowsWithTotals.map((row, index) => (
                      <TableRow
                        key={row.rowKey}
                        sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                      >
                        <TableCell sx={{ p: 1 }}>
                          <Tooltip title="Delete" placement="top">
                            <IconButton
                              onClick={() => removeLineRow(row.rowKey)}
                              aria-label="delete row"
                              size="small"
                            >
                              <DeleteIcon color="error" fontSize="inherit" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                        <TableCell sx={{ p: 1 }}>{index + 1}</TableCell>
                        <TableCell sx={{ p: 1 }}>
                          <TextField
                            size="small"
                            fullWidth
                            value={row.itemName}
                            onChange={(e) => updateLineRow(row.rowKey, "itemName", e.target.value)}
                          />
                        </TableCell>
                        <TableCell sx={{ p: 1 }}>
                          <TextField
                            size="small"
                            fullWidth
                            value={row.description}
                            onChange={(e) => updateLineRow(row.rowKey, "description", e.target.value)}
                          />
                        </TableCell>
                        <TableCell sx={{ p: 1 }}>
                          <TextField
                            size="small"
                            sx={{ width: "100px" }}
                            type="number"
                            inputProps={{ min: 0, step: "any" }}
                            value={row.quantity}
                            onChange={(e) => updateLineRow(row.rowKey, "quantity", e.target.value)}
                          />
                        </TableCell>
                        <TableCell sx={{ p: 1 }}>
                          <TextField
                            size="small"
                            sx={{ width: "100px" }}
                            type="number"
                            inputProps={{ min: 0, step: "any" }}
                            value={row.unitPrice}
                            onChange={(e) => updateLineRow(row.rowKey, "unitPrice", e.target.value)}
                          />
                        </TableCell>
                        <TableCell align="right" sx={{ p: 1 }}>
                          {formatCurrency(row.lineTotal)}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell align="right" colSpan={6}>
                        <Typography fontWeight="bold">Line Subtotal</Typography>
                      </TableCell>
                      <TableCell align="right" sx={{ p: 1 }}>
                        <Typography fontWeight="bold">{formatCurrency(lineSubtotal)}</Typography>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>

            <Grid
              item
              xs={12}
              sx={{
                mt: 2,
                mb: 1.5,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography sx={{ fontWeight: "bold", pl: 1 }}>Additional Costs</Typography>
              <Button variant="outlined" size="small" onClick={addCostRow}>
                + Add Row
              </Button>
            </Grid>

            <Grid item xs={12}>
              <TableContainer component={Paper}>
                <Table size="small" aria-label="additional costs" className="dark-table">
                  <TableHead>
                    <TableRow sx={{ background: "#757fef" }}>
                      <TableCell sx={{ color: "#fff", width: 48 }} align="center" />
                      <TableCell sx={{ color: "#fff" }}>#</TableCell>
                      <TableCell sx={{ color: "#fff" }}>Cost Type</TableCell>
                      <TableCell sx={{ color: "#fff" }}>Description</TableCell>
                      <TableCell align="right" sx={{ color: "#fff" }}>
                        Amount
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {costRows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 2 }}>
                          <Typography color="text.secondary" variant="body2">
                            No additional cost rows. Click &quot;+ Add Row&quot; to add.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      costRows.map((row, index) => (
                        <TableRow
                          key={row.rowKey}
                          sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                        >
                          <TableCell sx={{ p: 1 }}>
                            <Tooltip title="Delete" placement="top">
                              <IconButton
                                onClick={() => removeCostRow(row.rowKey)}
                                aria-label="delete row"
                                size="small"
                              >
                                <DeleteIcon color="error" fontSize="inherit" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                          <TableCell sx={{ p: 1 }}>{index + 1}</TableCell>
                          <TableCell sx={{ p: 1 }}>
                            <TextField
                              select
                              size="small"
                              fullWidth
                              value={row.costType}
                              onChange={(e) => updateCostRow(row.rowKey, "costType", e.target.value)}
                            >
                              {COST_TYPES.map((c) => (
                                <MenuItem key={c} value={c}>
                                  {c}
                                </MenuItem>
                              ))}
                            </TextField>
                          </TableCell>
                          <TableCell sx={{ p: 1 }}>
                            <TextField
                              size="small"
                              fullWidth
                              value={row.description}
                              onChange={(e) => updateCostRow(row.rowKey, "description", e.target.value)}
                            />
                          </TableCell>
                          <TableCell align="right" sx={{ p: 1 }}>
                            <TextField
                              size="small"
                              sx={{ width: "120px" }}
                              type="number"
                              inputProps={{ min: 0, step: "any" }}
                              value={row.amount}
                              onChange={(e) => updateCostRow(row.rowKey, "amount", e.target.value)}
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                    <TableRow>
                      <TableCell align="right" colSpan={4}>
                        <Typography fontWeight="bold">Additional Costs Subtotal</Typography>
                      </TableCell>
                      <TableCell align="right" sx={{ p: 1 }}>
                        <Typography fontWeight="bold">{formatCurrency(additionalCostSubtotal)}</Typography>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>

            <Grid item xs={12} display="flex" justifyContent="flex-end" alignItems="baseline" gap={2} mt={2}>
              <Typography fontWeight="bold" variant="h6">
                Grand Total: {formatCurrency(grandTotal)}
              </Typography>
            </Grid>

            <Grid item xs={12} my={3}>
              <LoadingButton loading={isSubmitting} handleSubmit={handleSubmit} disabled={isSubmitting} />
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </>
  );
}
