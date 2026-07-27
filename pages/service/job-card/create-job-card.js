import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import styles from "@/styles/PageTitle.module.css";
import {
  Box,
  Grid,
  Paper,
  TextField,
  Button,
  Typography,
  Chip,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Stepper,
  Step,
  StepLabel,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Divider,
  Alert,
  Autocomplete,
  RadioGroup,
  Radio,
  FormControlLabel,
} from "@mui/material";
import { toast, ToastContainer } from "react-toastify";
import BASE_URL from "Base/api";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";

const CATEGORY_ID = 208; // ServiceJobCard
const STEPS = ["Find Purchase Invoice", "Intake Details"];

const PAYMENT_TYPES = [
  { value: 1, label: "Cash" },
  { value: 2, label: "Card" },
  { value: 7, label: "Credit" },
];

const DEVICE_TYPES_FALLBACK = ["Mobile", "A/C", "TV", "Laptop", "Desktop", "Other"];

// Mirrors ServiceType enum on the backend (FreeService=1, PaidRepair=2)
const SERVICE_TYPE = { FREE: 1, PAID: 2 };

// Mirrors ServicePriority enum (Normal=1, Urgent=2, Critical=3)
const PRIORITIES = [
  { value: 1, label: "Normal", color: "default" },
  { value: 2, label: "Urgent", color: "warning" },
  { value: 3, label: "Critical", color: "error" },
];

const authHeaders = () => ({
  Authorization: `Bearer ${
    typeof window !== "undefined" ? localStorage.getItem("token") : ""
  }`,
  "Content-Type": "application/json",
});

export default function CreateJobCard() {
  const router = useRouter();
  const sessionCategory =
    typeof window !== "undefined" ? sessionStorage.getItem("category") : null;
  const cId = sessionCategory ? parseInt(sessionCategory, 10) : CATEGORY_ID;
  const { navigate, create, permissionsLoading } = IsPermissionEnabled(
    Number.isFinite(cId) ? cId : CATEGORY_ID
  );

  const [activeStep, setActiveStep] = useState(0);

  // Step 1 — find prior sale
  const [searchCustomerId, setSearchCustomerId] = useState("");
  const [searchSerial, setSearchSerial] = useState("");
  const [searchDocNo, setSearchDocNo] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const [manualEntry, setManualEntry] = useState(false);

  // Step 1 — phone/name customer lookup (no invoice needed)
  const [phoneQuery, setPhoneQuery] = useState("");
  const [customerOptions, setCustomerOptions] = useState([]);
  const [phoneSearching, setPhoneSearching] = useState(false);

  // Step 2
  const [technicians, setTechnicians] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [warrantyCheck, setWarrantyCheck] = useState(null);
  const [checkingWarranty, setCheckingWarranty] = useState(false);
  const [deviceTypeList, setDeviceTypeList] = useState([]);

  const [form, setForm] = useState({
    customerId: 0,
    customerName: "",
    contactNo: "",
    productId: 0,
    productName: "",
    externalProductDescription: "",
    serialNumber: "",
    deviceType: "",
    brand: "",
    model: "",
    purchaseInvoiceHeaderId: null,
    purchaseInvoiceLineId: null,
    isUnderWarranty: false,
    serviceType: "",
    isWarrantyRepair: false,
    priority: 1,
    expectedDeliveryDate: "",
    faultReportedByCustomer: "",
    physicalCondition: "",
    accessoriesReceived: "",
    receivedDate: new Date().toISOString().slice(0, 16),
    assignedTechnicianId: "",
    warehouseId: "",
    estimatedLabourCost: 0,
    estimatedPartsCost: 0,
    paymentType: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const headers = authHeaders();

    fetch(`${BASE_URL}/ServiceJobCard/GetTechniciansWithLoad`, { headers })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        const items = j?.result || [];
        setTechnicians(Array.isArray(items) ? items : []);
      })
      .catch(() => setTechnicians([]));

    fetch(`${BASE_URL}/Warehouse/GetAllWarehouse`, { headers })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        const items = j?.result?.items || j?.result?.result?.items || j?.result || [];
        setWarehouses(Array.isArray(items) ? items : []);
      })
      .catch(() => setWarehouses([]));

    fetch(`${BASE_URL}/DeviceType/GetAllDeviceType`, { headers })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        const inner = j?.result?.result ?? j?.result ?? j;
        const items = Array.isArray(inner) ? inner : [];
        setDeviceTypeList(items.filter((d) => d.isActive !== false));
      })
      .catch(() => setDeviceTypeList([]));
  }, []);

  // Step 1 — Customer phone lookup (debounced)
  useEffect(() => {
    if (!phoneQuery || phoneQuery.length < 3) {
      setCustomerOptions([]);
      return;
    }
    const handle = setTimeout(async () => {
      setPhoneSearching(true);
      try {
        const params = new URLSearchParams();
        const isPhone = /^[0-9+\-\s]+$/.test(phoneQuery);
        params.append(isPhone ? "phone" : "name", phoneQuery.trim());
        const r = await fetch(
          `${BASE_URL}/ServiceJobCard/LookupCustomers?${params.toString()}`,
          { headers: authHeaders() }
        );
        const j = await r.json();
        setCustomerOptions(Array.isArray(j?.result) ? j.result : []);
      } catch {
        setCustomerOptions([]);
      } finally {
        setPhoneSearching(false);
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [phoneQuery]);

  const runInvoiceSearch = async (overrides = {}) => {
    const customerId =
      overrides.customerId ??
      (searchCustomerId.trim() ||
        (form.customerId ? String(form.customerId) : ""));
    const serial = overrides.serial ?? searchSerial.trim();
    const documentNo = overrides.documentNo ?? searchDocNo.trim();

    if (!customerId && !serial && !documentNo) {
      toast.warning(
        "Enter at least one detail: search by phone/name above, or customer id, document no, or serial/IMEI."
      );
      return;
    }

    setSearching(true);
    try {
      const params = new URLSearchParams();
      if (customerId) params.append("customerId", customerId);
      if (serial) params.append("serial", serial);
      if (documentNo) params.append("documentNo", documentNo);
      const url = `${BASE_URL}/PurchaseInvoice/SearchForServiceClaim?${params.toString()}`;
      const r = await fetch(url, { headers: authHeaders() });
      const j = await r.json();
      const items = j?.result || [];
      setResults(Array.isArray(items) ? items : []);
      if (!items.length) toast.info("No matching purchase invoices found.");
    } catch (e) {
      toast.error("Search failed.");
    } finally {
      setSearching(false);
    }
  };

  const pickCustomer = (c) => {
    if (!c) return;
    setForm((f) => ({
      ...f,
      customerId: c.customerId,
      customerName: c.customerName,
      contactNo: c.contactNo || f.contactNo,
    }));
    setSearchCustomerId(String(c.customerId));
    toast.success(`Customer auto-filled: ${c.customerName}`);
    runInvoiceSearch({ customerId: String(c.customerId) });
  };

  const handleSearch = () => runInvoiceSearch();

  const selectResult = (row) => {
    setSelected(row);
    setForm((f) => ({
      ...f,
      customerId: row.customerId,
      customerName: row.customerName,
      contactNo: row.contactNo || f.contactNo,
      productId: row.productId,
      productName: row.productName,
      serialNumber: row.serialNumber || f.serialNumber,
      deviceType: row.deviceType || f.deviceType,
      brand: row.brand || f.brand,
      model: row.model || f.model,
      purchaseInvoiceHeaderId: row.purchaseInvoiceId,
      purchaseInvoiceLineId: row.purchaseInvoiceLineId || null,
      isUnderWarranty: !!row.warranty?.isActive,
    }));
  };

  const goToIntake = () => {
    if (!selected && !manualEntry) {
      toast.warning("Pick an invoice or choose Manual Entry.");
      return;
    }
    setActiveStep(1);
  };

  const handleField = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  // Step 3 — Live warranty check whenever serial or picked invoice changes.
  useEffect(() => {
    if (activeStep !== 1) return;
    if (!form.serialNumber && !form.purchaseInvoiceHeaderId) {
      setWarrantyCheck(null);
      return;
    }
    const handle = setTimeout(async () => {
      setCheckingWarranty(true);
      try {
        const params = new URLSearchParams();
        if (form.serialNumber) params.append("serial", form.serialNumber);
        if (form.purchaseInvoiceHeaderId)
          params.append("purchaseInvoiceHeaderId", String(form.purchaseInvoiceHeaderId));
        if (form.purchaseInvoiceLineId)
          params.append("purchaseInvoiceLineId", String(form.purchaseInvoiceLineId));
        const r = await fetch(
          `${BASE_URL}/ServiceJobCard/CheckWarranty?${params.toString()}`,
          { headers: authHeaders() }
        );
        const j = await r.json();
        const wc = j?.result || null;
        setWarrantyCheck(wc);
        if (wc) {
          setForm((f) => ({ ...f, isUnderWarranty: !!wc.warrantyActive }));
        }
      } catch {
        setWarrantyCheck(null);
      } finally {
        setCheckingWarranty(false);
      }
    }, 400);
    return () => clearTimeout(handle);
  }, [form.serialNumber, form.purchaseInvoiceHeaderId, form.purchaseInvoiceLineId, activeStep]);

  // Whenever service type flips to Free, force warranty flag true (so downstream
  // pricing knows). When user flips back to Paid, leave isUnderWarranty as-is.
  // Free Service is allowed whenever the warranty is active. The "reason" can be
  // either a covered fault (warranty repair) OR a scheduled free-service entitlement.
  const freeServiceBlockedReason = () => {
    if (!warrantyCheck) {
      return "Enter a serial number (or pick the original sale) so we can check the warranty.";
    }
    if (!warrantyCheck.foundInSales) {
      return "Free service is only available for devices sold by us.";
    }
    if (!warrantyCheck.warrantyActive) {
      return warrantyCheck.warrantyExpiry
        ? `Warranty expired on ${new Date(warrantyCheck.warrantyExpiry).toLocaleDateString()}.`
        : "No active warranty on this device.";
    }
    return null;
  };

  const handleServiceTypeChange = (e) => {
    const val = Number(e.target.value);
    if (val === SERVICE_TYPE.FREE) {
      const reason = freeServiceBlockedReason();
      if (reason) {
        toast.error(reason);
        return;
      }
    }
    setForm((f) => ({
      ...f,
      serviceType: val,
      isUnderWarranty: val === SERVICE_TYPE.FREE ? true : f.isUnderWarranty,
      // Default the reason: if there's no remaining entitlement but warranty is active,
      // it must be a warranty repair (covered fault). Otherwise default off so the
      // entitlement slot is consumed by an explicit free service.
      isWarrantyRepair:
        val === SERVICE_TYPE.FREE && warrantyCheck?.warrantyActive
          ? !warrantyCheck.canUseFreeService
          : false,
      estimatedLabourCost: 0,
      estimatedPartsCost: 0,
    }));
  };

  const handleSubmit = async () => {
    if (!form.customerName || !form.productName) {
      toast.warning("Customer and product are required.");
      return;
    }
    if (form.serviceType !== SERVICE_TYPE.FREE && form.serviceType !== SERVICE_TYPE.PAID) {
      toast.warning("Please select a service type.");
      return;
    }
    if (form.serviceType === SERVICE_TYPE.FREE && !form.serialNumber) {
      toast.warning("Serial number is required for a free service.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        customerId: Number(form.customerId) || 0,
        productId: Number(form.productId) || 0,
        assignedTechnicianId: form.assignedTechnicianId
          ? Number(form.assignedTechnicianId)
          : null,
        warehouseId: form.warehouseId ? Number(form.warehouseId) : 0,
        estimatedLabourCost: 0,
        estimatedPartsCost: 0,
        estimatedCost: 0,
        paymentType: form.paymentType ? Number(form.paymentType) : null,
        serviceType: Number(form.serviceType),
        priority: Number(form.priority) || 1,
        expectedDeliveryDate: form.expectedDeliveryDate || null,
      };
      const r = await fetch(`${BASE_URL}/ServiceJobCard/CreateJobCard`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });
      const j = await r.json();
      if (!r.ok || j.statusCode === 0 || j.statusCode === "FAILED") {
        toast.error(j?.message || "Failed to create job card.");
        return;
      }
      toast.success("Job card created.");
      const id = j?.result?.id;
      if (id) router.push(`/service/job-card/${id}`);
      else router.push("/service/job-card");
    } catch (e) {
      toast.error(e.message || "Failed to create job card.");
    } finally {
      setSaving(false);
    }
  };

  // Wait for the permission fetch to resolve before deciding — otherwise the
  // default (create = false) briefly renders AccessDenied on every load.
  if (permissionsLoading) return null;
  if (!navigate) return <AccessDenied />;
  if (!create) return <AccessDenied />;

  const deviceTypeOptions =
    deviceTypeList.length > 0
      ? deviceTypeList.map((d) => d.name)
      : DEVICE_TYPES_FALLBACK;

  const warrantyBanner = (() => {
    if (checkingWarranty) {
      return <Alert severity="info">Checking warranty…</Alert>;
    }
    if (!warrantyCheck) return null;
    if (warrantyCheck.warrantyVoided) {
      return (
        <Alert severity="error">
          <strong>Warranty CANCELLED for this product.</strong>
          {warrantyCheck.warrantyVoidReason ? ` — ${warrantyCheck.warrantyVoidReason}` : ""}
          <br />
          No free service or warranty repair is available. Paid repair only.
        </Alert>
      );
    }
    if (!warrantyCheck.foundInSales) {
      return <Alert severity="warning">{warrantyCheck.message}</Alert>;
    }
    if (warrantyCheck.canUseFreeService) {
      return (
        <Alert severity="success">
          <strong>{warrantyCheck.message}</strong>
          {warrantyCheck.warrantyExpiry && (
            <> &middot; Expires {new Date(warrantyCheck.warrantyExpiry).toLocaleDateString()}</>
          )}
        </Alert>
      );
    }
    if (warrantyCheck.warrantyActive) {
      return <Alert severity="info">{warrantyCheck.message}</Alert>;
    }
    return <Alert severity="warning">{warrantyCheck.message}</Alert>;
  })();

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Create Job Card</h1>
        <ul>
          <li>
            <Link href="/service/job-card/">Job Cards</Link>
          </li>
          <li>Create</li>
        </ul>
      </div>

      <Paper sx={{ p: 3 }}>
        <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
          {STEPS.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {activeStep === 0 && (
          <>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              Step 1 — Customer
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }} color="text.secondary">
              Type phone number or name to auto-fill an existing customer, or skip this and
              enter manually in the next step.
            </Typography>

            <Autocomplete
              size="small"
              options={customerOptions}
              loading={phoneSearching}
              getOptionLabel={(o) =>
                o ? `${o.customerName}${o.contactNo ? " — " + o.contactNo : ""}` : ""
              }
              filterOptions={(x) => x}
              onInputChange={(_, v) => setPhoneQuery(v)}
              onChange={(_, v) => pickCustomer(v)}
              renderInput={(params) => (
                <TextField {...params} label="Search by phone or name" placeholder="07X / name" />
              )}
              sx={{ mb: 3, maxWidth: 480 }}
            />

            <Divider sx={{ my: 2 }}>or look up the original sale</Divider>

            <Grid container spacing={2}>
              <Grid item xs={6} md={3}>
                <TextField
                  size="small"
                  fullWidth
                  label="Customer Id"
                  value={searchCustomerId}
                  onChange={(e) => setSearchCustomerId(e.target.value)}
                />
              </Grid>
              <Grid item xs={6} md={3}>
                <TextField
                  size="small"
                  fullWidth
                  label="Document No"
                  value={searchDocNo}
                  onChange={(e) => setSearchDocNo(e.target.value)}
                />
              </Grid>
              <Grid item xs={6} md={3}>
                <TextField
                  size="small"
                  fullWidth
                  label="Serial / IMEI"
                  value={searchSerial}
                  onChange={(e) => setSearchSerial(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <Button fullWidth variant="contained" onClick={handleSearch} disabled={searching}>
                  {searching ? "Searching..." : "Search"}
                </Button>
              </Grid>
            </Grid>

            <Box sx={{ mt: 3 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Document No</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell>Product</TableCell>
                    <TableCell>Sold On</TableCell>
                    <TableCell>Warranty</TableCell>
                    <TableCell />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {results.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <Typography color="text.secondary">No results yet.</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    results.map((row, i) => (
                      <TableRow
                        key={`${row.purchaseInvoiceId}-${row.purchaseInvoiceLineId || i}`}
                        selected={
                          selected?.purchaseInvoiceId === row.purchaseInvoiceId &&
                          selected?.purchaseInvoiceLineId === row.purchaseInvoiceLineId
                        }
                      >
                        <TableCell>{row.documentNo}</TableCell>
                        <TableCell>{row.customerName}</TableCell>
                        <TableCell>{row.productName}</TableCell>
                        <TableCell>
                          {row.soldOn ? new Date(row.soldOn).toLocaleDateString() : "-"}
                        </TableCell>
                        <TableCell>
                          {row.warranty ? (
                            row.warranty.voided ? (
                              <Chip
                                size="small"
                                label="Warranty Cancelled"
                                color="error"
                                title={row.warranty.voidReason || ""}
                              />
                            ) : (
                              <Chip
                                size="small"
                                label={`${row.warranty.type || "N/A"} ${
                                  row.warranty.isActive ? "Active" : "Expired"
                                }${
                                  row.warranty.freeServicesAllowed > 0
                                    ? ` · ${row.warranty.freeServicesAllowed} free svc`
                                    : ""
                                }`}
                                color={row.warranty.isActive ? "success" : "error"}
                              />
                            )
                          ) : (
                            <Chip size="small" label="No warranty" />
                          )}
                        </TableCell>
                        <TableCell>
                          <Button size="small" onClick={() => selectResult(row)}>
                            {selected?.purchaseInvoiceId === row.purchaseInvoiceId &&
                            selected?.purchaseInvoiceLineId === row.purchaseInvoiceLineId
                              ? "Selected"
                              : "Pick"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Box>

            <Divider sx={{ my: 3 }} />

            <Box display="flex" justifyContent="space-between">
              <Button
                variant="text"
                onClick={() => {
                  setManualEntry(true);
                  setSelected(null);
                  setActiveStep(1);
                }}
              >
                Device not bought from us / Manual entry
              </Button>
              <Button variant="contained" onClick={goToIntake} disabled={!selected}>
                Continue to intake
              </Button>
            </Box>
          </>
        )}

        {activeStep === 1 && (
          <>
            {manualEntry && (
              <Typography variant="body2" sx={{ mb: 2 }} color="warning.main">
                Manual entry: no linked purchase invoice. Warranty defaults to out-of-warranty.
              </Typography>
            )}

            {warrantyBanner && <Box sx={{ mb: 2 }}>{warrantyBanner}</Box>}

            <Typography variant="subtitle2" sx={{ mt: 1, mb: 1 }}>
              Customer
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Customer Name *"
                  value={form.customerName}
                  onChange={handleField("customerName")}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Contact No"
                  value={form.contactNo}
                  onChange={handleField("contactNo")}
                />
              </Grid>
            </Grid>

            <Typography variant="subtitle2" sx={{ mt: 3, mb: 1 }}>
              Device
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Device Type</InputLabel>
                  <Select
                    value={form.deviceType}
                    label="Device Type"
                    onChange={handleField("deviceType")}
                  >
                    <MenuItem value="">—</MenuItem>
                    {deviceTypeOptions.map((d) => (
                      <MenuItem key={d} value={d}>{d}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Brand"
                  value={form.brand}
                  onChange={handleField("brand")}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Model"
                  value={form.model}
                  onChange={handleField("model")}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Serial / IMEI"
                  value={form.serialNumber}
                  onChange={handleField("serialNumber")}
                  helperText={checkingWarranty ? "Checking warranty…" : ""}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Product *"
                  value={form.productName}
                  onChange={handleField("productName")}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  type="datetime-local"
                  label="Received Date"
                  InputLabelProps={{ shrink: true }}
                  value={form.receivedDate}
                  onChange={handleField("receivedDate")}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="Expected Delivery"
                  InputLabelProps={{ shrink: true }}
                  value={form.expectedDeliveryDate}
                  onChange={handleField("expectedDeliveryDate")}
                />
              </Grid>

              {manualEntry && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    size="small"
                    label="External Product Description"
                    multiline
                    minRows={2}
                    value={form.externalProductDescription}
                    onChange={handleField("externalProductDescription")}
                  />
                </Grid>
              )}
            </Grid>

            <Typography variant="subtitle2" sx={{ mt: 3, mb: 1 }}>
              Intake
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Fault Reported by Customer"
                  multiline
                  minRows={3}
                  value={form.faultReportedByCustomer}
                  onChange={handleField("faultReportedByCustomer")}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Physical Condition at Intake"
                  placeholder="e.g. small scratch on back, screen intact, charger pin bent"
                  multiline
                  minRows={3}
                  value={form.physicalCondition}
                  onChange={handleField("physicalCondition")}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  size="small"
                  label="Accessories Received"
                  placeholder="charger, remote, case, …"
                  value={form.accessoriesReceived}
                  onChange={handleField("accessoriesReceived")}
                />
              </Grid>
            </Grid>

            <Typography variant="subtitle2" sx={{ mt: 3, mb: 1 }}>
              Service Type *
            </Typography>
            <RadioGroup
              row
              value={
                form.serviceType === SERVICE_TYPE.FREE || form.serviceType === SERVICE_TYPE.PAID
                  ? String(form.serviceType)
                  : ""
              }
              onChange={handleServiceTypeChange}
            >
              <FormControlLabel
                value={String(SERVICE_TYPE.FREE)}
                control={<Radio />}
                label="Free Service"
              />
              <FormControlLabel
                value={String(SERVICE_TYPE.PAID)}
                control={<Radio />}
                label="Paid Repair"
              />
            </RadioGroup>
            {(() => {
              const reason = freeServiceBlockedReason();
              if (reason) {
                return (
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: -0.5, mb: 1 }}>
                    Free Service unavailable — {reason}
                  </Typography>
                );
              }
              if (form.serviceType !== SERVICE_TYPE.FREE) return null;
              const canUseEntitlement = !!warrantyCheck?.canUseFreeService;
              const lockedToWarrantyRepair = !canUseEntitlement; // no quota → must be a warranty repair
              return (
                <Box sx={{ mt: 0.5, mb: 1, pl: 1, borderLeft: "3px solid", borderColor: "success.main" }}>
                  <Typography variant="caption" color="success.main" sx={{ display: "block", mb: 0.5 }}>
                    Free of charge — pick the reason:
                  </Typography>
                  <RadioGroup
                    row
                    value={form.isWarrantyRepair ? "warranty" : "entitlement"}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, isWarrantyRepair: e.target.value === "warranty" }))
                    }
                  >
                    <FormControlLabel
                      value="warranty"
                      control={<Radio size="small" />}
                      label="Fault is covered under warranty (no quota used)"
                    />
                    <FormControlLabel
                      value="entitlement"
                      control={<Radio size="small" />}
                      disabled={lockedToWarrantyRepair}
                      label={
                        canUseEntitlement
                          ? `Use free-service entitlement (#${(warrantyCheck.freeServicesUsed || 0) + 1} of ${warrantyCheck.freeServicesAllowed})`
                          : "Use free-service entitlement (none remaining)"
                      }
                    />
                  </RadioGroup>
                </Box>
              );
            })()}

            <Typography variant="subtitle2" sx={{ mt: 3, mb: 1 }}>
              Assignment
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Assign Technician</InputLabel>
                  <Select
                    value={form.assignedTechnicianId}
                    label="Assign Technician"
                    onChange={handleField("assignedTechnicianId")}
                  >
                    <MenuItem value="">Unassigned</MenuItem>
                    {technicians.map((t) => (
                      <MenuItem key={t.id} value={t.id}>
                        {(t.fullName || t.userName || t.email || `User #${t.id}`)}
                        {" — "}
                        {t.activeJobCount ?? 0} active
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={2}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Priority</InputLabel>
                  <Select
                    value={form.priority}
                    label="Priority"
                    onChange={handleField("priority")}
                  >
                    {PRIORITIES.map((p) => (
                      <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Warehouse</InputLabel>
                  <Select
                    value={form.warehouseId}
                    label="Warehouse"
                    onChange={handleField("warehouseId")}
                  >
                    <MenuItem value="">Default</MenuItem>
                    {warehouses.map((w) => (
                      <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Expected Payment</InputLabel>
                  <Select
                    value={form.paymentType}
                    label="Expected Payment"
                    onChange={handleField("paymentType")}
                    disabled={form.serviceType === SERVICE_TYPE.FREE}
                  >
                    <MenuItem value="">N/A</MenuItem>
                    {PAYMENT_TYPES.map((p) => (
                      <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />
            <Box display="flex" justifyContent="space-between">
              <Button onClick={() => setActiveStep(0)}>Back</Button>
              <Button variant="contained" onClick={handleSubmit} disabled={saving}>
                {saving ? "Saving..." : "Create Job Card"}
              </Button>
            </Box>
          </>
        )}
      </Paper>
    </>
  );
}
