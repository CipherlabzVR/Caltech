import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import styles from "@/styles/PageTitle.module.css";
import {
  Box,
  Grid,
  Paper,
  Button,
  Typography,
  TextField,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Divider,
} from "@mui/material";
import { toast, ToastContainer } from "react-toastify";
import BASE_URL from "Base/api";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";

const CATEGORY_ID = 198;

const PAYMENT_TYPES = [
  { value: 1, label: "Cash" },
  { value: 2, label: "Card" },
  { value: 7, label: "Credit" },
];

const STATUS_NAMES = [
  "Received", "Diagnosed", "AwaitingApproval", "Approved",
  "InProgress", "OnHold", "Ready", "Delivered", "Cancelled",
];
const statusLabel = (v) => (typeof v === "string" ? v : STATUS_NAMES[(v || 1) - 1] || "Received");

const authHeaders = () => ({
  Authorization: `Bearer ${
    typeof window !== "undefined" ? localStorage.getItem("token") : ""
  }`,
  "Content-Type": "application/json",
});

export default function CreateServiceInvoice() {
  const router = useRouter();
  const sessionCategory =
    typeof window !== "undefined" ? sessionStorage.getItem("category") : null;
  const cId = sessionCategory ? parseInt(sessionCategory, 10) : CATEGORY_ID;
  const { navigate, create, permissionsLoading } = IsPermissionEnabled(
    Number.isFinite(cId) ? cId : CATEGORY_ID
  );

  const [jobCards, setJobCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [paymentType, setPaymentType] = useState("");
  const [discount, setDiscount] = useState(0);
  const [remark, setRemark] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    fetch(`${BASE_URL}/ServiceInvoice/GetInvoiceableJobCards`, { headers: authHeaders() })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        const items = j?.result || [];
        setJobCards(Array.isArray(items) ? items : []);
      })
      .catch(() => setJobCards([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setSelectedDetail(null);
      return;
    }
    fetch(`${BASE_URL}/ServiceJobCard/GetById/${selectedId}`, { headers: authHeaders() })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        const jc = j?.result || null;
        setSelectedDetail(jc);
        setPaymentType(jc?.paymentType ?? "");
      })
      .catch(() => setSelectedDetail(null));
  }, [selectedId]);

  const lines = (selectedDetail?.lines || []).filter((l) => !l.isDeleted);

  // A whole-job Free Service / Warranty Repair (serviceType === 1) is free of
  // charge to the customer — every line is waived regardless of its own flag.
  const jobIsFreeOfCharge = selectedDetail?.serviceType === 1;

  // Mirror the backend warranty rule: a warranty-covered line is fully waived
  // (100% discount), so the customer pays 0 for that line.
  const computedLines = lines.map((l) => {
    const covered = l.isWarrantyCovered || jobIsFreeOfCharge;
    const base = Number(l.qty || 0) * Number(l.unitPrice || 0);
    const lineDiscount = covered ? base : Number(l.discountAmount || 0);
    const lineTotal = Math.max(0, base - lineDiscount);
    return { ...l, _covered: covered, _base: base, _discount: lineDiscount, _total: lineTotal };
  });

  const gross = computedLines.reduce((acc, l) => acc + l._base, 0);
  const lineDiscounts = computedLines.reduce((acc, l) => acc + l._discount, 0);
  const warrantyWaiver = computedLines
    .filter((l) => l._covered)
    .reduce((acc, l) => acc + l._base, 0);
  // When the job is free of charge there is no additional customer discount.
  const headerDiscount = jobIsFreeOfCharge ? 0 : Number(discount) || 0;
  const net = Math.max(0, gross - lineDiscounts - headerDiscount);

  // Same default print popup as /service/service-invoice/ list (Print Default).
  const openDefaultPrint = (inv) => {
    const query = new URLSearchParams({
      id: String(inv.id ?? ""),
      documentNumber: inv.documentNo ?? "",
    });
    window.open(
      `/service/service-invoice/print?${query.toString()}`,
      `service-invoice-print-${inv.id}`,
      "popup=yes,width=1200,height=900,scrollbars=yes,resizable=yes"
    );
  };

  const submit = async () => {
    if (!selectedId) {
      toast.warning("Pick a job card first.");
      return;
    }
    setSaving(true);
    try {
      const r = await fetch(`${BASE_URL}/ServiceInvoice/CreateFromJobCard`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          serviceJobCardId: selectedId,
          paymentType: paymentType ? Number(paymentType) : null,
          discountAmount: headerDiscount,
          remark,
        }),
      });
      const j = await r.json();
      if (!r.ok || j?.statusCode === 0 || j?.statusCode === "FAILED" || j?.statusCode === -99) {
        toast.error(j?.message || "Failed to create service invoice.");
        return;
      }
      toast.success("Service invoice created.");
      const created = j?.result;
      if (created?.id) {
        openDefaultPrint(created);
        setTimeout(() => router.push("/service/service-invoice/"), 1200);
      } else {
        router.push("/service/service-invoice/");
      }
    } catch (e) {
      toast.error(e.message || "Failed.");
    } finally {
      setSaving(false);
    }
  };

  // Wait until permissions are fetched — `create` defaults to false and would
  // briefly show Access Denied on every navigation here otherwise.
  if (permissionsLoading) return null;
  if (!navigate || !create) return <AccessDenied />;

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Create Service Invoice</h1>
        <ul>
          <li>
            <Link href="/service/service-invoice/">Service Invoice</Link>
          </li>
          <li>Create</li>
        </ul>
      </div>

      <Paper sx={{ p: 3 }}>
        <Typography variant="subtitle1" sx={{ mb: 2 }}>
          Pick a Ready or Delivered job card to invoice. Only job cards that don&apos;t
          already have an invoice are listed.
        </Typography>

        <Box sx={{ mb: 3 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell />
                <TableCell>Job Card</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Product</TableCell>
                <TableCell>Serial</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Estimated</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">Loading...</TableCell>
                </TableRow>
              ) : jobCards.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography color="text.secondary">
                      No job cards waiting to be invoiced. Mark a job card as Ready first.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                jobCards.map((jc) => (
                  <TableRow
                    key={jc.id}
                    hover
                    selected={selectedId === jc.id}
                    onClick={() => setSelectedId(jc.id)}
                    style={{ cursor: "pointer" }}
                  >
                    <TableCell>
                      <input
                        type="radio"
                        checked={selectedId === jc.id}
                        onChange={() => setSelectedId(jc.id)}
                      />
                    </TableCell>
                    <TableCell>{jc.documentNo}</TableCell>
                    <TableCell>{jc.customerName}</TableCell>
                    <TableCell>{jc.productName}</TableCell>
                    <TableCell>{jc.serialNumber || "-"}</TableCell>
                    <TableCell>
                      <Chip size="small" label={statusLabel(jc.status)} />
                    </TableCell>
                    <TableCell align="right">{Number(jc.estimatedCost || 0).toFixed(2)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Box>

        {selectedDetail && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" sx={{ mb: 1 }}>
              Lines from {selectedDetail.documentNo}
            </Typography>

            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Item / Description</TableCell>
                  <TableCell align="right">Qty</TableCell>
                  <TableCell align="right">Unit</TableCell>
                  <TableCell align="right">Discount</TableCell>
                  <TableCell align="right">Total</TableCell>
                  <TableCell>Warranty</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {computedLines.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography color="error">
                        This job card has no lines — add parts / labour on the job card before invoicing.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  computedLines.map((l, i) => (
                    <TableRow key={l.id}>
                      <TableCell>{i + 1}</TableCell>
                      <TableCell>{["", "Part", "Labour", "Diagnostic"][l.lineType] || "-"}</TableCell>
                      <TableCell>{l.productName || l.description}</TableCell>
                      <TableCell align="right">{l.qty}</TableCell>
                      <TableCell align="right">{Number(l.unitPrice).toFixed(2)}</TableCell>
                      <TableCell align="right">{l._discount.toFixed(2)}</TableCell>
                      <TableCell align="right">
                        <strong>{l._total.toFixed(2)}</strong>
                      </TableCell>
                      <TableCell>
                        {l._covered ? (
                          <Chip size="small" color="success" label="Free (Warranty)" />
                        ) : (
                          "-"
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            <Grid container spacing={2} sx={{ mt: 2 }}>
              <Grid item xs={12} md={4}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Payment Type</InputLabel>
                  <Select
                    value={paymentType}
                    label="Payment Type"
                    onChange={(e) => setPaymentType(e.target.value)}
                  >
                    <MenuItem value="">N/A</MenuItem>
                    {PAYMENT_TYPES.map((p) => (
                      <MenuItem key={p.value} value={p.value}>
                        {p.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  type="number"
                  size="small"
                  fullWidth
                  label="Additional Discount"
                  value={jobIsFreeOfCharge ? 0 : discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  disabled={jobIsFreeOfCharge}
                  helperText={jobIsFreeOfCharge ? "Free service — customer is not charged." : ""}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  size="small"
                  fullWidth
                  label="Remark"
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                />
              </Grid>
            </Grid>

            <Box textAlign="right" mt={2}>
              <Typography>Gross: {gross.toFixed(2)}</Typography>
              {warrantyWaiver > 0 && (
                <Typography color="success.main">
                  Warranty waiver: -{warrantyWaiver.toFixed(2)}
                </Typography>
              )}
              <Typography>
                Line discounts (other): {(lineDiscounts - warrantyWaiver).toFixed(2)}
              </Typography>
              <Typography>Header discount: {headerDiscount.toFixed(2)}</Typography>
              <Typography variant="h6">Customer pays: {net.toFixed(2)}</Typography>
            </Box>
          </>
        )}

        <Divider sx={{ my: 3 }} />
        <Box display="flex" justifyContent="space-between">
          <Button onClick={() => router.push("/service/service-invoice")}>Back</Button>
          <Button
            variant="contained"
            disabled={!selectedDetail || lines.length === 0 || saving}
            onClick={submit}
          >
            {saving ? "Saving..." : "Create Invoice"}
          </Button>
        </Box>
      </Paper>
    </>
  );
}
