import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import styles from "@/styles/PageTitle.module.css";
import {
  Box,
  Paper,
  Grid,
  TextField,
  MenuItem,
  Button,
  Typography,
  Stack,
  FormControl,
  InputLabel,
  Select,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Alert,
  Divider,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { toast, ToastContainer } from "react-toastify";
import BASE_URL from "Base/api";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";

const CATEGORY_ID = 208; // ServiceJobCard

const SERVICE_TYPE = { FREE: 1, PAID: 2 };
const PRIORITY = [
  { v: 1, l: "Normal" },
  { v: 2, l: "Urgent" },
  { v: 3, l: "Critical" },
];

const PAYMENT_OPTIONS = [
  { v: "", l: "—" },
  { v: 1, l: "Cash" },
  { v: 2, l: "Card" },
  { v: 3, l: "Cash + Card" },
  { v: 4, l: "Bank Transfer" },
  { v: 5, l: "Cheque" },
  { v: 6, l: "No Advance" },
  { v: 7, l: "Credit" },
];

const DEVICE_TYPES_FALLBACK = ["Mobile", "A/C", "TV", "Laptop", "Desktop", "Other"];

const STATUS_NAMES = [
  "Received", "Diagnosed", "AwaitingApproval", "Approved",
  "InProgress", "OnHold", "Ready", "Delivered", "Cancelled",
  "AwaitingPartsApproval", "Unrepairable",
];
const statusLabel = (v) => (typeof v === "string" ? v : STATUS_NAMES[(v || 1) - 1] ?? "Received");

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("token") : ""}`,
});

const toLocalInputDate = (v) => {
  if (!v) return "";
  try { return new Date(v).toISOString().slice(0, 10); } catch { return ""; }
};

const toLocalInputDateTime = (v) => {
  if (!v) return "";
  try {
    const d = new Date(v);
    const off = d.getTimezoneOffset();
    return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16);
  } catch {
    return "";
  }
};

export default function EditJobCard() {
  const router = useRouter();
  const { id } = router.query;
  const { navigate, update } = IsPermissionEnabled(CATEGORY_ID);

  const [jobCard, setJobCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [technicians, setTechnicians] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [deviceTypeList, setDeviceTypeList] = useState([]);
  const [form, setForm] = useState(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`${BASE_URL}/ServiceJobCard/GetById/${id}`, { headers: authHeaders() })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => setJobCard(j?.result || null))
      .catch(() => setJobCard(null))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    fetch(`${BASE_URL}/ServiceJobCard/GetTechniciansWithLoad`, { headers: authHeaders() })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => setTechnicians(Array.isArray(j?.result) ? j.result : []))
      .catch(() => setTechnicians([]));
    fetch(`${BASE_URL}/Warehouse/GetAllWarehouse`, { headers: authHeaders() })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        const items = j?.result?.items || j?.result?.result?.items || j?.result || [];
        setWarehouses(Array.isArray(items) ? items : []);
      })
      .catch(() => setWarehouses([]));
    fetch(`${BASE_URL}/DeviceType/GetAllDeviceType`, { headers: authHeaders() })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        const inner = j?.result?.result ?? j?.result ?? j;
        const items = Array.isArray(inner) ? inner : [];
        setDeviceTypeList(items.filter((d) => d.isActive !== false));
      })
      .catch(() => setDeviceTypeList([]));
  }, []);

  // Hydrate the form from the loaded job card.
  useEffect(() => {
    if (!jobCard) return;
    setForm({
      customerId: jobCard.customerId || 0,
      customerName: jobCard.customerName || "",
      contactNo: jobCard.contactNo || "",
      productId: jobCard.productId || 0,
      productName: jobCard.productName || "",
      externalProductDescription: jobCard.externalProductDescription || "",
      serialNumber: jobCard.serialNumber || "",
      deviceType: jobCard.deviceType || "",
      brand: jobCard.brand || "",
      model: jobCard.model || "",
      purchaseInvoiceHeaderId: jobCard.purchaseInvoiceHeaderId || null,
      purchaseInvoiceLineId: jobCard.purchaseInvoiceLineId || null,
      isUnderWarranty: !!jobCard.isUnderWarranty,
      serviceType: jobCard.serviceType || SERVICE_TYPE.PAID,
      isWarrantyRepair: !!jobCard.isWarrantyRepair,
      priority: jobCard.priority || 1,
      expectedDeliveryDate: toLocalInputDate(jobCard.expectedDeliveryDate),
      faultReportedByCustomer: jobCard.faultReportedByCustomer || "",
      physicalCondition: jobCard.physicalCondition || "",
      accessoriesReceived: jobCard.accessoriesReceived || "",
      receivedDate: toLocalInputDateTime(jobCard.receivedDate),
      receivedBy: jobCard.receivedBy || 0,
      assignedTechnicianId: jobCard.assignedTechnicianId ?? "",
      warehouseId: jobCard.warehouseId || "",
      estimatedLabourCost: Number(jobCard.estimatedLabourCost || 0),
      estimatedPartsCost: Number(jobCard.estimatedPartsCost || 0),
      paymentType: jobCard.paymentType ?? "",
    });
  }, [jobCard]);

  const editable = useMemo(() => {
    if (!jobCard) return false;
    const s = statusLabel(jobCard.status);
    return s === "Received" || s === "Diagnosed";
  }, [jobCard]);

  const setField = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const save = async () => {
    if (!form) return;
    if (!form.customerName?.trim()) { toast.error("Customer name is required."); return; }
    if (!form.productName?.trim() && !form.externalProductDescription?.trim()) {
      toast.error("Device / product is required.");
      return;
    }
    try {
      setSaving(true);
      const payload = {
        ...form,
        customerId: Number(form.customerId) || 0,
        productId: Number(form.productId) || 0,
        assignedTechnicianId: form.assignedTechnicianId ? Number(form.assignedTechnicianId) : null,
        warehouseId: form.warehouseId ? Number(form.warehouseId) : 0,
        estimatedLabourCost: 0,
        estimatedPartsCost: 0,
        estimatedCost: 0,
        paymentType: form.paymentType !== "" && form.paymentType != null ? Number(form.paymentType) : null,
        serviceType: Number(form.serviceType) || SERVICE_TYPE.PAID,
        priority: Number(form.priority) || 1,
        expectedDeliveryDate: form.expectedDeliveryDate || null,
        receivedDate: form.receivedDate || null,
      };
      const r = await fetch(`${BASE_URL}/ServiceJobCard/UpdateJobCard/${id}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });
      const j = await r.json().catch(() => null);
      if (!r.ok || j?.statusCode === 0 || j?.statusCode === "FAILED") {
        toast.error(j?.message || "Failed to update job card.");
        return;
      }
      toast.success("Job card updated.");
      router.push(`/service/job-card/${id}`);
    } catch (e) {
      toast.error(e.message || "Failed to update job card.");
    } finally {
      setSaving(false);
    }
  };

  if (!navigate) return <AccessDenied />;
  if (!update) return <AccessDenied />;

  const deviceTypeOptions =
    deviceTypeList.length > 0
      ? deviceTypeList.map((d) => d.name)
      : DEVICE_TYPES_FALLBACK;
  if (loading || !form) return <Typography sx={{ p: 4 }}>Loading...</Typography>;

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle} style={{ alignItems: "center" }}>
        <h1>Edit Job Card</h1>
        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => router.push(`/service/job-card/${id}`)}
          >
            Back to Job Card
          </Button>
          <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
            <li style={{ display: "inline-block", color: "#A9A9C8", marginRight: 20, fontSize: 14 }}>
              <Link href="/service/job-card/" style={{ color: "#5B5B98", textDecoration: "none" }}>
                Job Cards
              </Link>
            </li>
            <li style={{ display: "inline-block", color: "#A9A9C8", marginRight: 20, fontSize: 14 }}>
              <Link href={`/service/job-card/${id}`} style={{ color: "#5B5B98", textDecoration: "none" }}>
                {jobCard?.documentNo}
              </Link>
            </li>
            <li style={{ display: "inline-block", color: "#A9A9C8", fontSize: 14 }}>Edit</li>
          </ul>
        </div>
      </div>

      {!editable && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          This job card is in <strong>{statusLabel(jobCard.status)}</strong> status. Editing is only
          allowed while a card is in <em>Received</em> or <em>Diagnosed</em> status.
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        {/* CUSTOMER */}
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>Customer</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField fullWidth size="small" label="Customer Name" required
              value={form.customerName}
              onChange={(e) => setField("customerName", e.target.value)}
              disabled={!editable}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField fullWidth size="small" label="Contact Number"
              value={form.contactNo}
              onChange={(e) => setField("contactNo", e.target.value)}
              disabled={!editable}
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        {/* DEVICE */}
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>Device</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField fullWidth size="small" label="Product / Model Name"
              value={form.productName}
              onChange={(e) => setField("productName", e.target.value)}
              disabled={!editable}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small" disabled={!editable}>
              <InputLabel>Device Type</InputLabel>
              <Select
                value={form.deviceType}
                label="Device Type"
                onChange={(e) => setField("deviceType", e.target.value)}
              >
                <MenuItem value="">—</MenuItem>
                {deviceTypeOptions.map((d) => (
                  <MenuItem key={d} value={d}>{d}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField fullWidth size="small" label="Brand"
              value={form.brand}
              onChange={(e) => setField("brand", e.target.value)}
              disabled={!editable}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField fullWidth size="small" label="Model"
              value={form.model}
              onChange={(e) => setField("model", e.target.value)}
              disabled={!editable}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField fullWidth size="small" label="Serial / IMEI"
              value={form.serialNumber}
              onChange={(e) => setField("serialNumber", e.target.value)}
              disabled={!editable}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField fullWidth size="small" label="External Description (if not in catalog)"
              value={form.externalProductDescription}
              onChange={(e) => setField("externalProductDescription", e.target.value)}
              disabled={!editable}
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        {/* SERVICE TYPE */}
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>Service Type</Typography>
        <FormControl disabled={!editable}>
          <RadioGroup
            row
            value={String(form.serviceType)}
            onChange={(e) => setField("serviceType", Number(e.target.value))}
          >
            <FormControlLabel value={String(SERVICE_TYPE.PAID)} control={<Radio />} label="Paid Repair" />
            <FormControlLabel value={String(SERVICE_TYPE.FREE)} control={<Radio />} label="Free Service" />
          </RadioGroup>
        </FormControl>

        {Number(form.serviceType) === SERVICE_TYPE.FREE && (
          <FormControl disabled={!editable} sx={{ mt: 1 }}>
            <FormLabel sx={{ fontSize: 13 }}>Reason for free service</FormLabel>
            <RadioGroup
              row
              value={form.isWarrantyRepair ? "warranty" : "freebie"}
              onChange={(e) => setField("isWarrantyRepair", e.target.value === "warranty")}
            >
              <FormControlLabel value="warranty" control={<Radio />} label="Fault covered under warranty" />
              <FormControlLabel value="freebie" control={<Radio />} label="Use free-service entitlement" />
            </RadioGroup>
          </FormControl>
        )}

        <Divider sx={{ my: 3 }} />

        {/* INTAKE */}
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>Intake Details</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField fullWidth size="small" label="Reported Fault" multiline minRows={2} required
              value={form.faultReportedByCustomer}
              onChange={(e) => setField("faultReportedByCustomer", e.target.value)}
              disabled={!editable}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField fullWidth size="small" label="Physical Condition at Intake" multiline minRows={2}
              value={form.physicalCondition}
              onChange={(e) => setField("physicalCondition", e.target.value)}
              disabled={!editable}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField fullWidth size="small" label="Accessories Received (comma separated)"
              value={form.accessoriesReceived}
              onChange={(e) => setField("accessoriesReceived", e.target.value)}
              disabled={!editable}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField fullWidth size="small" type="date" label="Expected Delivery"
              InputLabelProps={{ shrink: true }}
              value={form.expectedDeliveryDate}
              onChange={(e) => setField("expectedDeliveryDate", e.target.value)}
              disabled={!editable}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField fullWidth size="small" select label="Priority"
              value={form.priority}
              onChange={(e) => setField("priority", e.target.value)}
              disabled={!editable}
            >
              {PRIORITY.map((p) => <MenuItem key={p.v} value={p.v}>{p.l}</MenuItem>)}
            </TextField>
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        {/* ASSIGNMENT */}
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>Assignment</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField fullWidth size="small" select label="Assigned Technician"
              value={form.assignedTechnicianId ?? ""}
              onChange={(e) => setField("assignedTechnicianId", e.target.value)}
              disabled={!editable}
            >
              <MenuItem value="">— Unassigned —</MenuItem>
              {technicians.map((t) => (
                <MenuItem key={t.id} value={t.id}>
                  {(t.fullName || t.userName || t.email || `User #${t.id}`)}
                  {typeof t.activeJobs === "number" ? `  ·  ${t.activeJobs} active` : ""}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField fullWidth size="small" select label="Warehouse"
              value={form.warehouseId || ""}
              onChange={(e) => setField("warehouseId", e.target.value)}
              disabled={!editable}
            >
              <MenuItem value="">—</MenuItem>
              {warehouses.map((w) => (
                <MenuItem key={w.id} value={w.id}>{w.name || w.warehouseName || `Warehouse #${w.id}`}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField fullWidth size="small" type="datetime-local" label="Received Date"
              InputLabelProps={{ shrink: true }}
              value={form.receivedDate}
              onChange={(e) => setField("receivedDate", e.target.value)}
              disabled={!editable}
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>Payment</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField fullWidth size="small" select label="Payment Type"
              value={form.paymentType ?? ""}
              onChange={(e) => setField("paymentType", e.target.value)}
              disabled={!editable}
            >
              {PAYMENT_OPTIONS.map((p) => <MenuItem key={String(p.v)} value={p.v}>{p.l}</MenuItem>)}
            </TextField>
          </Grid>
        </Grid>

        <Stack direction="row" justifyContent="flex-end" spacing={1} sx={{ mt: 4 }}>
          <Button variant="outlined" onClick={() => router.push(`/service/job-card/${id}`)}>
            Cancel
          </Button>
          <Button variant="contained" disabled={!editable || saving} onClick={save}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </Stack>
      </Paper>
    </>
  );
}
