import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import styles from "@/styles/PageTitle.module.css";
import {
  Box,
  Grid,
  Paper,
  Tabs,
  Tab,
  Typography,
  Chip,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Divider,
  Stack,
  Autocomplete,
  CircularProgress,
  Alert,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { toast, ToastContainer } from "react-toastify";
import BASE_URL from "Base/api";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import ServiceDiagnosisImageUpload from "@/components/service/ServiceDiagnosisImageUpload";

const CATEGORY_ID = 208; // ServiceJobCard (ModuleCategoryType.ServiceJobCard)

const STATUS_NAMES = [
  "Received",
  "Diagnosed",
  "AwaitingApproval",
  "Approved",
  "InProgress",
  "OnHold",
  "Ready",
  "Delivered",
  "Cancelled",
  "AwaitingPartsApproval",
  "Unrepairable",
];

const STATUS_COLOR = {
  Received: "default",
  Diagnosed: "info",
  AwaitingApproval: "warning",
  AwaitingPartsApproval: "warning",
  Approved: "primary",
  InProgress: "secondary",
  OnHold: "warning",
  Ready: "success",
  Delivered: "success",
  Cancelled: "error",
  Unrepairable: "error",
};

const STATUS_LABEL_DISPLAY = {
  AwaitingApproval: "Awaiting Customer Approval",
  AwaitingPartsApproval: "Awaiting Parts Approval",
  Unrepairable: "Can't Repair",
};

const CAN_MARK_UNREPAIRABLE = new Set([
  "Received",
  "Diagnosed",
  "AwaitingApproval",
  "AwaitingPartsApproval",
  "Approved",
  "InProgress",
  "OnHold",
]);

const LINE_TYPES = [
  { value: 1, label: "Part" },
  { value: 2, label: "Labour" },
  { value: 3, label: "Diagnostic" },
];

const SERVICE_TYPE_LABEL = { 1: "Free Service", 2: "Paid Repair" };
const PRIORITY_LABEL = { 1: "Normal", 2: "Urgent", 3: "Critical" };
const PRIORITY_COLOR = { 1: "default", 2: "warning", 3: "error" };

function statusLabel(value) {
  if (typeof value === "string") return value;
  return STATUS_NAMES[(value || 1) - 1] ?? "Received";
}

const TECHNICIAN_WORK_COST_LABEL = "Technician Work Cost";

function getTechnicianWorkCost(jobCard, diag) {
  const fromDiag =
    jobCard?.diagnosis?.technicianWorkCost ??
    jobCard?.diagnosis?.TechnicianWorkCost ??
    jobCard?.diagnosis?.estimatedCost;
  const fromState = diag?.technicianWorkCost;
  return Number(fromState ?? fromDiag ?? 0) || 0;
}

function isTechnicianWorkCostLine(line) {
  if (!line || line.lineType !== 2) return false;
  const name = line.productName || line.description || "";
  return name === TECHNICIAN_WORK_COST_LABEL;
}

function sumPartsSellTotal(partLines) {
  return (partLines || []).reduce(
    (s, l) => s + (Number(l.qty) || 0) * (Number(l.unitPrice) || 0),
    0
  );
}

const authHeaders = () => ({
  Authorization: `Bearer ${
    typeof window !== "undefined" ? localStorage.getItem("token") : ""
  }`,
  "Content-Type": "application/json",
});

export default function JobCardDetail() {
  const router = useRouter();
  const { id } = router.query;
  const sessionCategory =
    typeof window !== "undefined" ? sessionStorage.getItem("category") : null;
  const cId = sessionCategory ? parseInt(sessionCategory, 10) : CATEGORY_ID;
  const {
    navigate,
    update,
    jcDiagnose,
    jcApprove,
    jcStartWork,
    jcHoldResume,
    jcMarkReady,
    jcDeliver,
    jcPartsSubmit,
    jcPartsApprove,
    jcLineEdit,
  } = IsPermissionEnabled(Number.isFinite(cId) ? cId : CATEGORY_ID);

  const [tab, setTab] = useState(0);
  const [jobCard, setJobCard] = useState(null);
  const [history, setHistory] = useState([]);
  const [diag, setDiag] = useState({
    technicianFindings: "",
    technicianWorkCost: 0,
    eta: "",
  });

  const [lineDialog, setLineDialog] = useState({ open: false, line: null });
  const [cancelDialog, setCancelDialog] = useState({ open: false, note: "" });
  const [unrepairableDialog, setUnrepairableDialog] = useState({ open: false, reason: "" });

  // ────── Warranty status + void/restore (customer damage) ──────
  const [warrantyInfo, setWarrantyInfo] = useState(null);
  const [warrantyBusy, setWarrantyBusy] = useState(false);
  const [voidDialog, setVoidDialog] = useState({ open: false, reason: "" });
  const [returnDialog, setReturnDialog] = useState({ open: false, note: "" });

  // ────── Parts Required (owner-approval) workflow ──────
  // Draft list edited by the technician before submitting for owner approval.
  // Each row carries productId / productName / qty + an isFreeTextPart flag.
  const [partsDraft, setPartsDraft] = useState([]);
  const [partsPickerOpen, setPartsPickerOpen] = useState(false);
  const [partsPickerMode, setPartsPickerMode] = useState("inventory");
  const [partsPickerSearch, setPartsPickerSearch] = useState("");
  const [partsPickerOptions, setPartsPickerOptions] = useState([]);
  const [partsPickerLoading, setPartsPickerLoading] = useState(false);
  const [partsPickerSelection, setPartsPickerSelection] = useState(null);
  const [partsPickerQty, setPartsPickerQty] = useState(1);
  const [partsPickerFreeText, setPartsPickerFreeText] = useState("");
  const [partsPickerCostPrice, setPartsPickerCostPrice] = useState("");
  const [partsPickerSellPrice, setPartsPickerSellPrice] = useState("");

  // Owner-side approval dialog state (per-line price + reject note).
  const [partsApproveDialog, setPartsApproveDialog] = useState({ open: false, mode: "approve", note: "", overrides: {} });

  // Product picker state for the Add Line dialog (Part lines only).
  const [productOptions, setProductOptions] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productQuery, setProductQuery] = useState("");
  const [batchOptions, setBatchOptions] = useState([]);
  const [batchLoading, setBatchLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!id) return;
    try {
      const [a, b] = await Promise.all([
        fetch(`${BASE_URL}/ServiceJobCard/GetById/${id}`, { headers: authHeaders() }).then((r) => r.json()),
        fetch(`${BASE_URL}/ServiceJobCard/GetStatusHistory/${id}`, { headers: authHeaders() }).then((r) => r.json()),
      ]);
      const jc = a?.result || null;
      setJobCard(jc);
      setHistory(b?.result || []);
      if (jc?.diagnosis) {
        setDiag({
          technicianFindings: jc.diagnosis.technicianFindings || "",
          technicianWorkCost: getTechnicianWorkCost(jc, null),
          eta: jc.diagnosis.eta ? jc.diagnosis.eta.substring(0, 10) : "",
        });
      }
    } catch (e) {
      toast.error("Failed to load job card.");
    }
  }, [id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Load the warranty status for the linked sold product so staff can see the
  // current state and (if damaged by the customer) void the whole warranty.
  const loadWarranty = useCallback(async (jc) => {
    if (!jc?.purchaseInvoiceHeaderId) {
      setWarrantyInfo(null);
      return;
    }
    try {
      const params = new URLSearchParams();
      if (jc.serialNumber) params.set("serial", jc.serialNumber);
      if (jc.purchaseInvoiceHeaderId)
        params.set("purchaseInvoiceHeaderId", jc.purchaseInvoiceHeaderId);
      if (jc.purchaseInvoiceLineId)
        params.set("purchaseInvoiceLineId", jc.purchaseInvoiceLineId);
      const r = await fetch(
        `${BASE_URL}/ServiceJobCard/CheckWarranty?${params.toString()}`,
        { headers: authHeaders() }
      );
      const j = await r.json();
      setWarrantyInfo(j?.result || null);
    } catch {
      setWarrantyInfo(null);
    }
  }, []);

  useEffect(() => {
    if (jobCard) loadWarranty(jobCard);
  }, [jobCard, loadWarranty]);

  // When opening Edit on an existing Part line, fetch its batches so the
  // dropdown is populated and the user can switch batches.
  useEffect(() => {
    if (!lineDialog.open) return;
    if (lineDialog.line?.lineType !== 1) return;
    if (!lineDialog.line?.productId) return;
    if (batchOptions.length > 0) return;
    loadBatchesForProduct(lineDialog.line.productId, lineDialog.line.stockBalanceId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lineDialog.open, lineDialog.line?.productId]);

  // Reset transient picker state when dialog closes so the next open starts clean.
  useEffect(() => {
    if (!lineDialog.open) {
      setBatchOptions([]);
      setProductOptions([]);
      setProductQuery("");
    }
  }, [lineDialog.open]);

  // Server-side search-as-you-type for the product picker.
  // The backend endpoint requires a `keyword` parameter, so we debounce input
  // and hit /Items/GetAllItemsWithoutZeroQty?keyword=... each time it changes.
  useEffect(() => {
    if (!lineDialog.open) return;
    if (lineDialog.line?.lineType !== 1) return;
    const handle = setTimeout(async () => {
      setProductsLoading(true);
      try {
        const kw = encodeURIComponent(productQuery || "");
        const r = await fetch(
          `${BASE_URL}/Items/GetAllItemsWithoutZeroQty?keyword=${kw}`,
          { headers: authHeaders() }
        );
        const j = await r.json();
        const items = j?.result?.items || j?.result || [];
        setProductOptions(Array.isArray(items) ? items : []);
      } catch {
        setProductOptions([]);
      } finally {
        setProductsLoading(false);
      }
    }, 250);
    return () => clearTimeout(handle);
  }, [lineDialog.open, lineDialog.line?.lineType, productQuery]);

  // For Part lines, given a selected productId, load its stock balances for the
  // job card's warehouse and auto-fill the first batch (most common case).
  const loadBatchesForProduct = useCallback(
    async (productId, preferredStockBalanceId) => {
      if (!productId || !jobCard?.warehouseId) {
        setBatchOptions([]);
        return;
      }
      setBatchLoading(true);
      try {
        const r = await fetch(
          `${BASE_URL}/StockBalance/GetAllProductStockBalanceLine?warehouseId=${jobCard.warehouseId}&productId=${productId}`,
          { headers: authHeaders() }
        );
        const j = await r.json();
        const items = Array.isArray(j?.result) ? j.result : [];
        setBatchOptions(items);
        if (items.length > 0) {
          const pick =
            (preferredStockBalanceId && items.find((b) => b.id === preferredStockBalanceId)) ||
            items[0];
          setLineDialog((d) => ({
            ...d,
            line: {
              ...d.line,
              stockBalanceId: pick.id,
              unitPrice: d.line?.unitPrice || pick.sellingPrice || 0,
              costPrice: d.line?.costPrice || pick.costPrice || 0,
            },
          }));
        }
      } catch {
        setBatchOptions([]);
      } finally {
        setBatchLoading(false);
      }
    },
    [jobCard?.warehouseId]
  );

  const onPickProduct = (item) => {
    if (!item) {
      setLineDialog((d) => ({
        ...d,
        line: {
          ...d.line,
          productId: null,
          productName: "",
          productCode: "",
          stockBalanceId: null,
        },
      }));
      setBatchOptions([]);
      return;
    }
    setLineDialog((d) => ({
      ...d,
      line: {
        ...d.line,
        productId: item.id,
        productName: item.name || item.productName || "",
        productCode: item.code || item.productCode || "",
        // For a non-inventory item, the API returns stockBalanceId === null.
        stockBalanceId: item.stockBalanceId ?? null,
        unitPrice: d.line?.unitPrice || item.sellingPrice || 0,
        costPrice: d.line?.costPrice || item.costPrice || 0,
      },
    }));
    if (item.id) loadBatchesForProduct(item.id);
  };

  // ────── Parts Required picker — search by name only (no prices shown) ──────
  useEffect(() => {
    if (!partsPickerOpen) return;
    if (partsPickerMode !== "inventory") return;
    const handle = setTimeout(async () => {
      setPartsPickerLoading(true);
      try {
        const kw = encodeURIComponent(partsPickerSearch || "");
        const r = await fetch(
          `${BASE_URL}/Items/GetAllItemsWithoutZeroQty?keyword=${kw}`,
          { headers: authHeaders() }
        );
        const j = await r.json();
        const items = j?.result?.items || j?.result || [];
        setPartsPickerOptions(Array.isArray(items) ? items : []);
      } catch {
        setPartsPickerOptions([]);
      } finally {
        setPartsPickerLoading(false);
      }
    }, 250);
    return () => clearTimeout(handle);
  }, [partsPickerOpen, partsPickerMode, partsPickerSearch]);

  const partNeedsManualPricing = (p) => !p?.inStock;

  const openPartsPicker = (mode) => {
    setPartsPickerMode(mode);
    setPartsPickerSelection(null);
    setPartsPickerFreeText("");
    setPartsPickerSearch("");
    setPartsPickerQty(1);
    setPartsPickerCostPrice("");
    setPartsPickerSellPrice("");
    setPartsPickerOpen(true);
  };

  const updateDraftPart = (key, patch) => {
    setPartsDraft((d) => d.map((p) => (p.key === key ? { ...p, ...patch } : p)));
  };

  const addPartToDraft = () => {
    if (partsPickerMode === "inventory") {
      if (!partsPickerSelection) {
        toast.error("Pick a part first.");
        return;
      }
      const qty = Number(partsPickerQty) || 0;
      if (qty <= 0) {
        toast.error("Quantity must be greater than zero.");
        return;
      }
      const inStock = !!partsPickerSelection.stockBalanceId;
      setPartsDraft((d) => [
        ...d,
        {
          key: `inv-${partsPickerSelection.id}-${Date.now()}`,
          productId: partsPickerSelection.id,
          productName: partsPickerSelection.name || partsPickerSelection.productName,
          productCode: partsPickerSelection.code || partsPickerSelection.productCode,
          stockBalanceId: partsPickerSelection.stockBalanceId ?? null,
          qty,
          isFreeTextPart: false,
          inStock,
          unitPrice: 0,
          costPrice: 0,
        },
      ]);
    } else {
      const name = (partsPickerFreeText || "").trim();
      const qty = Number(partsPickerQty) || 0;
      if (!name) {
        toast.error("Type a part name.");
        return;
      }
      if (qty <= 0) {
        toast.error("Quantity must be greater than zero.");
        return;
      }
      setPartsDraft((d) => [
        ...d,
        {
          key: `free-${Date.now()}`,
          productId: null,
          productName: name,
          productCode: "",
          stockBalanceId: null,
          qty,
          isFreeTextPart: true,
          inStock: false,
          unitPrice: 0,
          costPrice: 0,
        },
      ]);
    }
    setPartsPickerOpen(false);
  };

  const removeDraftPart = (key) => {
    setPartsDraft((d) => d.filter((p) => p.key !== key));
  };

  // Save Diagnosis + Submit Parts List in one go. Used by the combined
  // "Diagnosis & Parts Required" tab so the technician only has to click
  // a single button to push the job into the owner-approval queue.
  // Parts Required only captures what is needed — pricing is set on Parts & Labour.
  const mapDraftPartForSubmit = (p) => ({
    productId: p.productId,
    productName: p.productName,
    productCode: p.productCode,
    stockBalanceId: p.stockBalanceId,
    qty: Number(p.qty) || 0,
    isFreeTextPart: !!p.isFreeTextPart,
  });

  const submitDiagnosisAndParts = async () => {
    try {
      // 1) Save (or update) the diagnosis — this transitions Received → Diagnosed
      //    if the card is still in Received status.
      if (jcDiagnose) {
        const dr = await fetch(`${BASE_URL}/ServiceJobCard/AddDiagnosis/${id}`, {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({
            technicianFindings: diag.technicianFindings,
            technicianWorkCost: Number(diag.technicianWorkCost) || 0,
            estimatedCost: Number(diag.technicianWorkCost) || 0,
            eta: diag.eta || null,
          }),
        });
        const dj = await dr.json();
        if (!dr.ok || dj?.statusCode === 0 || dj?.statusCode === "FAILED") {
          toast.error(dj?.message || "Failed to save diagnosis.");
          return;
        }
      }

      // 2) Submit the parts list — transitions to Awaiting Parts Approval.
      const r = await fetch(
        `${BASE_URL}/ServiceJobCard/SubmitPartsForApproval/${id}`,
        {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({
            parts: partsDraft.map(mapDraftPartForSubmit),
          }),
        }
      );
      const j = await r.json();
      if (!r.ok || j?.statusCode === 0 || j?.statusCode === "FAILED") {
        toast.error(j?.message || "Submit failed.");
        return;
      }
      const msg =
        partsDraft.length > 0
          ? "Diagnosis saved and parts list submitted for approval."
          : "Diagnosis submitted for owner approval.";
      toast.success(msg);
      setPartsDraft([]);
      await refresh();
    } catch (e) {
      toast.error(e.message || "Submit failed.");
    }
  };

  const submitPartsForApproval = async () => {
    try {
      const r = await fetch(
        `${BASE_URL}/ServiceJobCard/SubmitPartsForApproval/${id}`,
        {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({
            parts: partsDraft.map(mapDraftPartForSubmit),
          }),
        }
      );
      const j = await r.json();
      if (!r.ok || j?.statusCode === 0 || j?.statusCode === "FAILED") {
        toast.error(j?.message || "Submit failed.");
        return;
      }
      toast.success(j?.message || "Submitted for approval.");
      setPartsDraft([]);
      await refresh();
    } catch (e) {
      toast.error(e.message || "Submit failed.");
    }
  };

  const submitPartsApproval = async (approved) => {
    if (!approved && !partsApproveDialog.note.trim()) {
      toast.error("A rejection note is required.");
      return;
    }
    if (approved) {
      const approvalLines = (jobCard?.lines || []).filter(
        (l) =>
          !l.isDeleted &&
          !l.isApproved &&
          ((l.lineType === 1 && l.isTechnicianRequested) || l.lineType !== 1)
      );
      const missingSell = approvalLines.filter((l) => {
        const ov = partsApproveDialog.overrides[l.id] || {};
        const sell = Number(ov.unitPrice ?? l.unitPrice ?? 0);
        if (l.lineType === 1 && !l.stockBalanceId) return sell <= 0;
        if (isTechnicianWorkCostLine(l)) return sell <= 0;
        return false;
      });
      if (missingSell.length > 0) {
        toast.error(
          `Enter a sell price before releasing: ${missingSell.map((l) => l.productName || l.description).join(", ")}`
        );
        return;
      }
    }
    try {
      const lineUpdates = Object.entries(partsApproveDialog.overrides || {}).map(
        ([lineId, v]) => ({
          lineId: Number(lineId),
          unitPrice: Number(v.unitPrice) || 0,
          costPrice: Number(v.costPrice) || 0,
          discountAmount: Number(v.discountAmount) || 0,
          stockBalanceId: v.stockBalanceId ?? null,
        })
      );
      const r = await fetch(`${BASE_URL}/ServiceJobCard/PartsApproval/${id}`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          approved,
          note: partsApproveDialog.note,
          lineUpdates,
        }),
      });
      const j = await r.json();
      if (!r.ok || j?.statusCode === 0 || j?.statusCode === "FAILED") {
        toast.error(j?.message || "Action failed.");
        return;
      }
      toast.success(j?.message || (approved ? "Approved." : "Rejected."));
      setPartsApproveDialog({ open: false, mode: "approve", note: "", overrides: {} });
      await refresh();
    } catch (e) {
      toast.error(e.message || "Action failed.");
    }
  };

  const callAction = async (path, body) => {
    try {
      const r = await fetch(`${BASE_URL}/ServiceJobCard/${path}`, {
        method: "POST",
        headers: authHeaders(),
        body: body ? JSON.stringify(body) : undefined,
      });
      const j = await r.json();
      if (!r.ok || j?.statusCode === 0 || j?.statusCode === "FAILED") {
        toast.error(j?.message || "Action failed.");
        return false;
      }
      toast.success(j?.message || "Done.");
      await refresh();
      return true;
    } catch (e) {
      toast.error(e.message || "Action failed.");
      return false;
    }
  };

  const submitVoidWarranty = async () => {
    if (!voidDialog.reason.trim()) {
      toast.error("A reason is required to void the warranty.");
      return;
    }
    setWarrantyBusy(true);
    const ok = await callAction(`VoidWarranty/${id}`, { reason: voidDialog.reason.trim() });
    setWarrantyBusy(false);
    if (ok) setVoidDialog({ open: false, reason: "" });
  };

  const restoreWarranty = async () => {
    if (!confirm("Restore this product's warranty?")) return;
    setWarrantyBusy(true);
    await callAction(`RestoreWarranty/${id}`);
    setWarrantyBusy(false);
  };

  const submitReturnToCustomer = async () => {
    setWarrantyBusy(true);
    const ok = await callAction(`ReturnToCustomer/${id}`, { note: returnDialog.note.trim() });
    setWarrantyBusy(false);
    if (ok) setReturnDialog({ open: false, note: "" });
  };

  if (!navigate) return <AccessDenied />;
  if (!jobCard) return <Typography sx={{ p: 4 }}>Loading...</Typography>;

  // Admin (update) or technician (diagnose) or owner (approve) can void a
  // warranty, but only when the device is linked to a sale we made.
  const canManageWarranty =
    (update || jcDiagnose || jcApprove) && !!jobCard.purchaseInvoiceHeaderId;

  const label = statusLabel(jobCard.status);
  const readOnly =
    label === "Delivered" || label === "Cancelled" || label === "Unrepairable";
  const canMarkUnrepairable =
    (jcDiagnose || jcPartsSubmit) && CAN_MARK_UNREPAIRABLE.has(label);

  const renderActions = () => {
    const btns = [];
    const add = (text, onClick, color = "primary", variant = "contained", disabled = false) =>
      btns.push(
        <Button
          key={text}
          color={color}
          variant={variant}
          size="small"
          onClick={onClick}
          disabled={disabled}
          sx={{ mr: 1 }}
        >
          {text}
        </Button>
      );

    // How many lines are currently waiting on the owner's release? Used to
    // keep the "Release Parts & Labour" header button disabled when there is
    // nothing pending.
    const releasableCount = (jobCard.lines || []).filter(
      (l) =>
        !l.isDeleted &&
        !l.isApproved &&
        ((l.lineType === 1 && l.isTechnicianRequested) || l.lineType !== 1)
    ).length;

    switch (label) {
      case "Received":
        if (jcPartsSubmit) add("Diagnosis & Parts", () => setTab(1), "secondary", "outlined");
        break;
      case "Diagnosed":
        if (jcDiagnose) add("Submit for Customer Approval", () => callAction(`SubmitForApproval/${id}`));
        if (jcPartsSubmit) add("Diagnosis & Parts", () => setTab(1), "secondary", "outlined");
        break;
      case "AwaitingPartsApproval":
        if (jcPartsApprove) {
          add(
            "Release Parts & Labour",
            () => setPartsApproveDialog({ open: true, mode: "approve", note: "", overrides: {} }),
            "primary",
            "contained",
            releasableCount === 0
          );
          add("Reject with Note", () => setPartsApproveDialog({ open: true, mode: "reject", note: "", overrides: {} }), "error", "outlined");
        }
        break;
      case "AwaitingApproval":
        if (jcApprove) {
          add("Mark Approved", () => callAction(`CustomerApproval/${id}`, { approved: true, note: "" }));
          add("Customer Rejected", () => setCancelDialog({ open: true, note: "Customer rejected" }), "error", "outlined");
        }
        break;
      case "Approved":
        // Two-step gate: the owner first gives the Final Approval, then
        // Start Work becomes available (which issues stock and moves the job
        // to In Progress).
        if (!jobCard.finalApproved) {
          if (jcPartsApprove)
            add("Final Approval", async () => {
              const ok = await callAction(`FinalApproval/${id}`);
              // On success, open the customer Work Authorization receipt to print.
              if (ok) {
                const q = new URLSearchParams({
                  id: String(jobCard.id ?? ""),
                  documentNumber: jobCard.documentNo ?? "",
                  type: "customer-bill",
                });
                window.open(
                  `/service/job-card/print?${q.toString()}`,
                  `job-card-print-${jobCard.id}`,
                  "popup=yes,width=1200,height=900,scrollbars=yes,resizable=yes"
                );
              }
            });
        } else {
          if (jcStartWork || jcPartsApprove) add("Start Work", () => callAction(`StartWork/${id}`));
        }
        break;
      case "InProgress":
        if (jcMarkReady) add("Mark Ready", () => callAction(`MarkReady/${id}`));
        if (jcHoldResume) add("Put On Hold", () => callAction(`PutOnHold/${id}`, { note: "Manual hold" }), "warning", "outlined");
        break;
      case "OnHold":
        if (jcHoldResume) add("Resume", () => callAction(`Resume/${id}`));
        break;
      case "Ready":
        if (jcDeliver) add("Deliver", () => callAction(`Deliver/${id}`));
        break;
      case "Unrepairable":
        if (jcDeliver) add("Deliver to Customer", () => callAction(`Deliver/${id}`));
        break;
      default:
        break;
    }

    if (canMarkUnrepairable) {
      add(
        "Can't Repair",
        () => setUnrepairableDialog({ open: true, reason: "" }),
        "error",
        "contained"
      );
    }

    if (!readOnly) {
      add("Cancel", () => setCancelDialog({ open: true, note: "" }), "error", "outlined");
    }

    return btns;
  };

  const saveLine = async () => {
    const l = lineDialog.line;
    const isUpdate = !!l?.id;
    const path = isUpdate
      ? `ServiceJobCard/UpdateLine/${l.id}`
      : `ServiceJobCard/AddLine/${id}`;
    try {
      const r = await fetch(`${BASE_URL}/${path}`, {
        method: isUpdate ? "PUT" : "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          lineType: Number(l.lineType) || 1,
          productId: l.productId ? Number(l.productId) : null,
          productName: l.productName || "",
          productCode: l.productCode || "",
          stockBalanceId: l.stockBalanceId ? Number(l.stockBalanceId) : null,
          description: l.description || "",
          qty: Number(l.qty) || 0,
          unitPrice: Number(l.unitPrice) || 0,
          discountAmount: Number(l.discountAmount) || 0,
          isWarrantyCovered: !!l.isWarrantyCovered,
          costPrice: Number(l.costPrice) || 0,
          sequenceNo: Number(l.sequenceNo) || 0,
        }),
      });
      const j = await r.json();
      if (!r.ok || j?.statusCode === 0 || j?.statusCode === "FAILED") {
        toast.error(j?.message || "Save failed.");
        return;
      }
      toast.success("Saved.");
      setLineDialog({ open: false, line: null });
      await refresh();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const deleteLine = async (lineId) => {
    if (!confirm("Delete this line?")) return;
    try {
      const r = await fetch(`${BASE_URL}/ServiceJobCard/DeleteLine/${lineId}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      const j = await r.json();
      if (!r.ok || j?.statusCode === 0) {
        toast.error(j?.message || "Delete failed.");
        return;
      }
      toast.success("Deleted.");
      await refresh();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const lines = (jobCard.lines || []).filter((l) => !l.isDeleted);

  const isAwaitingPartsApproval =
    statusLabel(jobCard?.status) === "AwaitingPartsApproval";

  // Pending technician parts (awaiting owner pricing) appear on Parts & Labour only.
  const pendingPricingLines = lines.filter(
    (l) => l.isTechnicianRequested && !l.isApproved
  );

  const billableLines = lines.filter(
    (l) => !l.isTechnicianRequested || l.isApproved
  );

  const partsLabourDisplayLines = isAwaitingPartsApproval && jcPartsApprove
    ? pendingPricingLines
    : billableLines;

  const totals = billableLines.reduce(
    (acc, l) => {
      acc.gross += Number(l.qty || 0) * Number(l.unitPrice || 0);
      acc.discount += Number(l.discountAmount || 0);
      acc.net += Number(l.lineTotal || 0);
      return acc;
    },
    { gross: 0, discount: 0, net: 0 }
  );

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle} style={{ alignItems: "center" }}>
        <h1>{jobCard.documentNo}</h1>
        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => router.push("/service/job-card/")}
          >
            Go Back
          </Button>
          <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
            <li style={{ display: "inline-block", color: "#A9A9C8", marginRight: 20, position: "relative", fontSize: 14 }}>
              <Link href="/service/job-card/" style={{ color: "#5B5B98", textDecoration: "none" }}>
                Job Cards
              </Link>
            </li>
            <li style={{ display: "inline-block", color: "#A9A9C8", fontSize: 14 }}>
              {jobCard.documentNo}
            </li>
          </ul>
        </div>
      </div>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container alignItems="center" spacing={2}>
          <Grid item xs={12} md={3}>
            <Typography variant="h6">{jobCard.customerName}</Typography>
            <Typography variant="body2" color="text.secondary">
              {jobCard.productName} {jobCard.serialNumber ? `· SN ${jobCard.serialNumber}` : ""}
            </Typography>
          </Grid>
          <Grid item xs={12} md={3}>
            <Chip label={STATUS_LABEL_DISPLAY[label] || label} color={STATUS_COLOR[label] || "default"} />
            {label === "Unrepairable" && jobCard.unrepairableReason && (
              <Chip
                sx={{ ml: 1 }}
                label={jobCard.unrepairableReason}
                color="error"
                variant="outlined"
                title={jobCard.unrepairableReason}
              />
            )}
            {jobCard.serviceType === 1 && (
              <Chip
                sx={{ ml: 1 }}
                label={jobCard.isWarrantyRepair ? "Warranty Repair" : "Free Service"}
                color="success"
              />
            )}
            {jobCard.isUnderWarranty && jobCard.serviceType !== 1 && (
              <Chip sx={{ ml: 1 }} label="Under Warranty" color="success" variant="outlined" />
            )}
            {warrantyInfo?.warrantyVoided && (
              <Chip
                sx={{ ml: 1 }}
                label="Warranty Voided"
                color="error"
                title={warrantyInfo.warrantyVoidReason || ""}
              />
            )}
            {jobCard.priority && jobCard.priority !== 1 && (
              <Chip
                sx={{ ml: 1 }}
                label={PRIORITY_LABEL[jobCard.priority] || ""}
                color={PRIORITY_COLOR[jobCard.priority] || "default"}
              />
            )}
          </Grid>
          <Grid item xs={12} md={6} textAlign="right">
            <Stack direction="row" justifyContent="flex-end" flexWrap="wrap" rowGap={1} spacing={1}>
              {label === "Approved" && (
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => {
                    const q = new URLSearchParams({
                      id: String(jobCard.id ?? ""),
                      documentNumber: jobCard.documentNo ?? "",
                      type: "customer-bill",
                    });
                    window.open(
                      `/service/job-card/print?${q.toString()}`,
                      `job-card-print-${jobCard.id}`,
                      "popup=yes,width=1200,height=900,scrollbars=yes,resizable=yes"
                    );
                  }}
                >
                  Print Customer Bill
                </Button>
              )}
              {update && (label === "Received" || label === "Diagnosed") && (
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => router.push(`/service/job-card/edit/${jobCard.id}`)}
                >
                  Edit
                </Button>
              )}
              {renderActions()}
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 0 }}>
        <Tabs value={tab} onChange={(_e, v) => setTab(v)}>
          <Tab label="Overview" />
          <Tab label="Diagnosis & Parts Required" />
          {/* Hidden when the user does not have the JobCardLineEdit permission. */}
          <Tab label="Parts & Labour" sx={{ display: jcLineEdit ? undefined : "none" }} />
          <Tab label="Status Log" />
        </Tabs>

        {tab === 0 && (
          <Box sx={{ p: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2">Customer</Typography>
                <Typography>{jobCard.customerName}</Typography>
                <Typography color="text.secondary">{jobCard.contactNo || "-"}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2">Device</Typography>
                <Typography>
                  {[jobCard.deviceType, jobCard.brand, jobCard.model].filter(Boolean).join(" · ") ||
                    jobCard.productName}
                </Typography>
                <Typography color="text.secondary">
                  {jobCard.productName}
                  {jobCard.serialNumber ? ` · Serial: ${jobCard.serialNumber}` : ""}
                </Typography>
                {jobCard.externalProductDescription && (
                  <Typography color="text.secondary">
                    {jobCard.externalProductDescription}
                  </Typography>
                )}
              </Grid>
              <Grid item xs={12}>
                <Divider />
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2">Fault reported</Typography>
                <Typography>{jobCard.faultReportedByCustomer || "-"}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2">Physical condition at intake</Typography>
                <Typography>{jobCard.physicalCondition || "-"}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2">Accessories received</Typography>
                <Typography>{jobCard.accessoriesReceived || "-"}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2">Service type</Typography>
                <Typography>
                  {jobCard.serviceType === 1
                    ? (jobCard.isWarrantyRepair ? "Warranty Repair (no quota used)" : "Free Service (entitlement)")
                    : SERVICE_TYPE_LABEL[jobCard.serviceType] || "—"}
                </Typography>
                {jobCard.expectedDeliveryDate && (
                  <Typography color="text.secondary">
                    Expected delivery: {new Date(jobCard.expectedDeliveryDate).toLocaleDateString()}
                  </Typography>
                )}
              </Grid>

              {jobCard.purchaseInvoiceHeaderId && (
                <>
                  <Grid item xs={12}>
                    <Divider />
                  </Grid>
                  <Grid item xs={12}>
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 1,
                        border: "1px solid",
                        borderColor: warrantyInfo?.warrantyVoided ? "error.light" : "divider",
                        bgcolor: warrantyInfo?.warrantyVoided ? "#FFF4F4" : "transparent",
                      }}
                    >
                      <Box
                        display="flex"
                        justifyContent="space-between"
                        alignItems="center"
                        flexWrap="wrap"
                        gap={1}
                        mb={1}
                      >
                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                          Warranty
                        </Typography>
                        {canManageWarranty && (
                          warrantyInfo?.warrantyVoided ? (
                            <Stack direction="row" spacing={1} flexWrap="wrap" rowGap={1}>
                              {!readOnly && (jcDeliver || update) && (
                                <Button
                                  size="small"
                                  variant="contained"
                                  color="primary"
                                  disabled={warrantyBusy}
                                  onClick={() => setReturnDialog({ open: true, note: "" })}
                                >
                                  Deliver to Customer
                                </Button>
                              )}
                              <Button
                                size="small"
                                variant="outlined"
                                color="success"
                                disabled={warrantyBusy}
                                onClick={restoreWarranty}
                              >
                                Restore Warranty
                              </Button>
                            </Stack>
                          ) : (
                            <Button
                              size="small"
                              variant="outlined"
                              color="error"
                              disabled={warrantyBusy}
                              onClick={() => setVoidDialog({ open: true, reason: "" })}
                            >
                              Void Warranty (Customer Damage)
                            </Button>
                          )
                        )}
                      </Box>

                      {warrantyInfo?.warrantyVoided && (
                        <Alert severity="error" sx={{ mb: 1 }}>
                          <strong>Warranty cancelled.</strong>{" "}
                          {warrantyInfo.warrantyVoidReason || "Customer-caused damage."}
                          <br />
                          This job is now a <strong>paid repair</strong>. If the customer
                          declines the repair, use <strong>Deliver to Customer</strong> to
                          hand back the device.
                        </Alert>
                      )}

                      <Grid container spacing={2}>
                        <Grid item xs={6} md={3}>
                          <Typography variant="caption" color="text.secondary">
                            Plan
                          </Typography>
                          <Typography>{warrantyInfo?.warrantyType || "—"}</Typography>
                        </Grid>
                        <Grid item xs={6} md={3}>
                          <Typography variant="caption" color="text.secondary">
                            Status
                          </Typography>
                          <Typography>
                            {warrantyInfo?.warrantyVoided
                              ? "Voided"
                              : warrantyInfo?.warrantyActive
                              ? "Active"
                              : "Inactive / Expired"}
                          </Typography>
                        </Grid>
                        <Grid item xs={6} md={3}>
                          <Typography variant="caption" color="text.secondary">
                            Expiry
                          </Typography>
                          <Typography>
                            {warrantyInfo?.warrantyExpiry
                              ? new Date(warrantyInfo.warrantyExpiry).toLocaleDateString()
                              : "—"}
                          </Typography>
                        </Grid>
                        <Grid item xs={6} md={3}>
                          <Typography variant="caption" color="text.secondary">
                            Free Services (used / allowed)
                          </Typography>
                          <Typography>
                            {(warrantyInfo?.freeServicesUsed ?? 0)} /{" "}
                            {(warrantyInfo?.freeServicesAllowed ?? 0)}
                          </Typography>
                        </Grid>
                      </Grid>

                      {warrantyInfo?.message && !warrantyInfo?.warrantyVoided && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          {warrantyInfo.message}
                        </Typography>
                      )}
                    </Box>
                  </Grid>
                </>
              )}
            </Grid>
          </Box>
        )}

        {tab === 1 && (() => {
          const requestedPartLines = lines.filter(
            (l) => !l.isDeleted && l.lineType === 1 && l.isTechnicianRequested
          );
          const hasSubmitted =
            label === "AwaitingPartsApproval" ||
            (jobCard.partsLocked && requestedPartLines.length > 0);
          const isAwaitingApproval = label === "AwaitingPartsApproval";
          const isLocked = jobCard.partsLocked;
          const canTechnicianEdit =
            !isLocked && !isAwaitingApproval && (label === "Received" || label === "Diagnosed");

          // Owner can only "Release Parts & Labour" when at least one
          // unapproved Part or Labour line is actually waiting for them.
          const releasableCount = lines.filter(
            (l) =>
              !l.isApproved &&
              ((l.lineType === 1 && l.isTechnicianRequested) || l.lineType !== 1)
          ).length;

          return (
            <Box sx={{ p: 3 }}>
              {/* ── Diagnosis section ───────────────────────────────────── */}
              <Typography variant="subtitle1" gutterBottom>
                Diagnosis
              </Typography>
              {label === "Unrepairable" && jobCard.unrepairableReason && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  <strong>Can't repair:</strong> {jobCard.unrepairableReason}
                  {jobCard.markedUnrepairableOn && (
                    <>
                      {" "}
                      · Marked{" "}
                      {new Date(jobCard.markedUnrepairableOn).toLocaleString()}
                    </>
                  )}
                </Alert>
              )}
              {canMarkUnrepairable && (
                <Box mb={2}>
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={() => setUnrepairableDialog({ open: true, reason: "" })}
                  >
                    Mark as Can't Repair
                  </Button>
                </Box>
              )}
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    minRows={4}
                    label="Technician findings"
                    value={diag.technicianFindings}
                    onChange={(e) =>
                      setDiag({ ...diag, technicianFindings: e.target.value })
                    }
                    disabled={readOnly || !canTechnicianEdit}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 600 }}>
                    Diagnosis photos
                  </Typography>
                  <ServiceDiagnosisImageUpload
                    jobCardId={jobCard?.id}
                    images={jobCard?.diagnosisImages || []}
                    readOnly={readOnly || !canTechnicianEdit}
                    onImagesChange={(diagnosisImages) =>
                      setJobCard((prev) => (prev ? { ...prev, diagnosisImages } : prev))
                    }
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    type="number"
                    fullWidth
                    label="Technician Work Cost"
                    value={diag.technicianWorkCost}
                    onChange={(e) =>
                      setDiag({ ...diag, technicianWorkCost: e.target.value })
                    }
                    disabled={readOnly || !canTechnicianEdit}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    type="date"
                    fullWidth
                    label="ETA"
                    InputLabelProps={{ shrink: true }}
                    value={diag.eta}
                    onChange={(e) => setDiag({ ...diag, eta: e.target.value })}
                    disabled={readOnly || !canTechnicianEdit}
                  />
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              {/* ── Parts Required section ──────────────────────────────── */}
              {jobCard.partsRejectionNote && !isLocked && (
                <Paper
                  sx={{ p: 2, mb: 2, bgcolor: "#FFF4F4", border: "1px solid #F5B7B1" }}
                >
                  <Typography variant="subtitle2" color="error">
                    Owner rejected the previous parts list
                  </Typography>
                  <Typography variant="body2">{jobCard.partsRejectionNote}</Typography>
                </Paper>
              )}

              {hasSubmitted && (
                <Box mb={3}>
                  <Typography variant="subtitle1" gutterBottom>
                    {isLocked ? "Approved Parts List (locked)" : "Submitted Parts (awaiting owner approval)"}
                  </Typography>
                  {isAwaitingApproval && jcPartsApprove && (
                    <Alert severity="info" sx={{ mb: 2 }}>
                      Open the <strong>Parts &amp; Labour</strong> tab to set cost and sell
                      prices, then release this list for the customer quote.
                    </Alert>
                  )}
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>#</TableCell>
                        <TableCell>Part</TableCell>
                        <TableCell>Compatible Device</TableCell>
                        <TableCell align="right">Qty</TableCell>
                        <TableCell>Stock</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {requestedPartLines.map((l, i) => (
                        <TableRow key={l.id}>
                          <TableCell>{i + 1}</TableCell>
                          <TableCell>
                            {l.productName}
                            {l.isFreeTextPart && (
                              <Chip size="small" label="New / Free-text" sx={{ ml: 1 }} />
                            )}
                          </TableCell>
                          <TableCell>{jobCard.deviceType || jobCard.productName || "-"}</TableCell>
                          <TableCell align="right">{l.qty}</TableCell>
                          <TableCell>
                            {l.stockBalanceId ? (
                              <Chip size="small" label="In Stock" color="success" />
                            ) : (
                              <Chip size="small" label="Out / N/A" color="warning" />
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>
              )}

              {canTechnicianEdit && (
                <>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="subtitle1">
                      {hasSubmitted ? "Revise Parts List" : "Parts Required"}
                    </Typography>
                    {jcPartsSubmit && (
                      <Stack direction="row" spacing={1}>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => openPartsPicker("inventory")}
                        >
                          + Add From Inventory
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => openPartsPicker("free")}
                        >
                          + Add Free-text Part
                        </Button>
                      </Stack>
                    )}
                  </Box>

                  {partsDraft.length === 0 ? (
                    <Typography color="text.secondary" sx={{ py: 2 }}>
                      No parts required for this service? Leave this list empty and use{" "}
                      <strong>Submit for Owner Approval</strong> below after completing diagnosis.
                    </Typography>
                  ) : (
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>#</TableCell>
                          <TableCell>Part</TableCell>
                          <TableCell>Compatible Device</TableCell>
                          <TableCell align="right">Qty</TableCell>
                          <TableCell>In Stock</TableCell>
                          <TableCell />
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {partsDraft.map((p, i) => (
                          <TableRow key={p.key}>
                            <TableCell>{i + 1}</TableCell>
                            <TableCell>
                              {p.productName}
                              {p.isFreeTextPart && (
                                <Chip size="small" label="New / Free-text" sx={{ ml: 1 }} />
                              )}
                            </TableCell>
                            <TableCell>{jobCard.deviceType || jobCard.productName || "-"}</TableCell>
                            <TableCell align="right">{p.qty}</TableCell>
                            <TableCell>
                              {p.inStock ? (
                                <Chip size="small" label="In Stock" color="success" />
                              ) : (
                                <Chip size="small" label="Out / N/A" color="warning" />
                              )}
                            </TableCell>
                            <TableCell align="right">
                              <IconButton size="small" onClick={() => removeDraftPart(p.key)}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                  {partsDraft.length > 0 && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                      Prices are not entered here. The owner sets cost and sell on the{" "}
                      <strong>Parts &amp; Labour</strong> tab after you submit.
                    </Typography>
                  )}

                </>
              )}

              {canTechnicianEdit && jcPartsSubmit && (
                <Box
                  textAlign="right"
                  mt={3}
                  pt={2}
                  borderTop={1}
                  borderColor="divider"
                >
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={submitDiagnosisAndParts}
                  >
                    {partsDraft.length > 0
                      ? "Submit Diagnosis & Parts for Owner Approval"
                      : "Submit Diagnosis for Owner Approval"}
                  </Button>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block", mt: 1 }}
                  >
                    Saves technician findings, work cost, and ETA. Parts are optional.
                  </Typography>
                </Box>
              )}

              {!canTechnicianEdit && !hasSubmitted && (
                <Typography color="text.secondary" sx={{ mt: 2 }}>
                  Parts Required workflow is not available for this status.
                </Typography>
              )}
            </Box>
          );
        })()}

        {tab === 2 && jcLineEdit && (() => {
          const plReleasableCount = pendingPricingLines.length;
          const canReleaseWithoutLines =
            isAwaitingPartsApproval && !!jobCard.partsApprovalRequestedOn;
          const plPartsSell = sumPartsSellTotal(
            pendingPricingLines.filter((l) => l.lineType === 1)
          );
          const plLabourLine = pendingPricingLines.find(isTechnicianWorkCostLine);
          const plWorkCost = plLabourLine
            ? (Number(plLabourLine.qty) || 1) * (Number(plLabourLine.unitPrice) || 0)
            : getTechnicianWorkCost(jobCard, diag);
          const plGrandTotal =
            (isAwaitingPartsApproval ? plPartsSell + plWorkCost : totals.net) || 0;
          const plEditable = isAwaitingPartsApproval && jcPartsApprove;

          return (
          <Box sx={{ p: 3 }}>
            {isAwaitingPartsApproval && jcPartsApprove && (
              <>
                <Alert severity="info" sx={{ mb: 2 }}>
                  {plReleasableCount > 0 ? (
                    <>
                      Set <strong>cost</strong> and <strong>sell (unit)</strong> for each line below
                      (click a row to edit). In-stock parts may already show inventory sell price.
                      Then release for customer approval.
                    </>
                  ) : (
                    <>
                      No parts were requested. Review the diagnosis on the previous tab, then
                      release to send the job to customer approval.
                    </>
                  )}
                </Alert>
                <Stack direction="row" spacing={1} justifyContent="flex-end" mb={2}>
                  <Button
                    variant="contained"
                    color="primary"
                    disabled={!canReleaseWithoutLines && plReleasableCount === 0}
                    onClick={() =>
                      setPartsApproveDialog({ open: true, mode: "approve", note: "", overrides: {} })
                    }
                  >
                    Release Parts &amp; Labour
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={() =>
                      setPartsApproveDialog({ open: true, mode: "reject", note: "", overrides: {} })
                    }
                  >
                    Reject with Note
                  </Button>
                </Stack>
              </>
            )}

            {!isAwaitingPartsApproval && (
              <Box display="flex" justifyContent="flex-end" gap={1} mb={2}>
                <Button
                  variant="outlined"
                  disabled={readOnly}
                  onClick={() =>
                    setLineDialog({
                      open: true,
                      line: { lineType: 1, qty: 1, unitPrice: 0, discountAmount: 0, sequenceNo: lines.length + 1 },
                    })
                  }
                >
                  + Add Part
                </Button>
                <Button
                  variant="outlined"
                  disabled={readOnly}
                  onClick={() =>
                    setLineDialog({
                      open: true,
                      line: { lineType: 2, qty: 1, unitPrice: 0, discountAmount: 0, sequenceNo: lines.length + 1 },
                    })
                  }
                >
                  + Add Labour
                </Button>
              </Box>
            )}

            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Item / Description</TableCell>
                  <TableCell align="right">Qty</TableCell>
                  <TableCell align="right">Cost</TableCell>
                  <TableCell align="right">Unit (sell)</TableCell>
                  <TableCell align="right">Discount</TableCell>
                  <TableCell align="right">Total</TableCell>
                  <TableCell>Warranty</TableCell>
                  <TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {partsLabourDisplayLines.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} align="center">
                      <Typography color="text.secondary">
                        {isAwaitingPartsApproval
                          ? plReleasableCount === 0
                            ? "No parts or labour lines — diagnosis-only service."
                            : "No submitted parts to price yet."
                          : "No lines yet. Approved parts appear here after the owner releases the Parts Required list."}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  partsLabourDisplayLines.map((l, i) => (
                    <TableRow
                      key={l.id}
                      hover
                      onClick={() =>
                        plEditable && setLineDialog({ open: true, line: { ...l } })
                      }
                      style={{ cursor: plEditable || (!readOnly && !isAwaitingPartsApproval) ? "pointer" : "default" }}
                    >
                      <TableCell>{i + 1}</TableCell>
                      <TableCell>{LINE_TYPES.find((t) => t.value === l.lineType)?.label}</TableCell>
                      <TableCell>
                        {l.productName || l.description}
                        {l.isFreeTextPart && (
                          <Chip size="small" label="Free-text" sx={{ ml: 0.5 }} />
                        )}
                        {l.lineType === 1 && !l.stockBalanceId && (
                          <Chip size="small" label="Out / N/A" color="warning" sx={{ ml: 0.5 }} />
                        )}
                      </TableCell>
                      <TableCell align="right">{l.qty}</TableCell>
                      <TableCell align="right">{Number(l.costPrice || 0).toFixed(2)}</TableCell>
                      <TableCell align="right">{Number(l.unitPrice || 0).toFixed(2)}</TableCell>
                      <TableCell align="right">{Number(l.discountAmount || 0).toFixed(2)}</TableCell>
                      <TableCell align="right">
                        {Number(l.lineTotal || (Number(l.qty) || 0) * (Number(l.unitPrice) || 0)).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {l.isWarrantyCovered ? <Chip size="small" label="Yes" color="success" /> : "-"}
                      </TableCell>
                      <TableCell align="right">
                        {!readOnly && !isAwaitingPartsApproval && (
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteLine(l.id);
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            <Box textAlign="right" mt={2}>
              {isAwaitingPartsApproval && jcPartsApprove && (
                <>
                  {plWorkCost > 0 && (
                    <Typography variant="body2" color="text.secondary">
                      Parts: {plPartsSell.toFixed(2)} + {TECHNICIAN_WORK_COST_LABEL}:{" "}
                      {plWorkCost.toFixed(2)}
                    </Typography>
                  )}
                  <Typography variant="h6">Grand Total: {plGrandTotal.toFixed(2)}</Typography>
                </>
              )}
              {!isAwaitingPartsApproval && (
                <>
                  <Typography>Gross: {totals.gross.toFixed(2)}</Typography>
                  <Typography>Discount: {totals.discount.toFixed(2)}</Typography>
                  <Typography variant="h6">Net: {totals.net.toFixed(2)}</Typography>
                </>
              )}
            </Box>
          </Box>
          );
        })()}

        {tab === 3 && (
          <Box sx={{ p: 3 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>When</TableCell>
                  <TableCell>From</TableCell>
                  <TableCell>To</TableCell>
                  <TableCell>By</TableCell>
                  <TableCell>Note</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {history.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Typography color="text.secondary">No history yet.</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  history.map((h) => (
                    <TableRow key={h.id}>
                      <TableCell>{new Date(h.changedOn).toLocaleString()}</TableCell>
                      <TableCell>{statusLabel(h.fromStatus)}</TableCell>
                      <TableCell>{statusLabel(h.toStatus)}</TableCell>
                      <TableCell>{h.changedBy}</TableCell>
                      <TableCell>{h.note}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Box>
        )}

      </Paper>

      {/* ────── Parts Required — picker dialog (technician) ────── */}
      <Dialog
        open={partsPickerOpen}
        onClose={() => setPartsPickerOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {partsPickerMode === "inventory" ? "Add Part From Inventory" : "Add Free-text Part"}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0 }}>
            {partsPickerMode === "inventory" ? (
              <Grid item xs={12}>
                <Autocomplete
                  size="small"
                  options={partsPickerOptions}
                  loading={partsPickerLoading}
                  filterOptions={(x) => x}
                  noOptionsText={
                    partsPickerSearch.length === 0
                      ? "Type to search parts"
                      : partsPickerLoading
                      ? "Searching…"
                      : "No matching parts"
                  }
                  // Show ONLY part name + (compatible device) — never cost or sell price.
                  getOptionLabel={(o) => (o?.name || o?.productName || "")}
                  isOptionEqualToValue={(o, v) => o?.id === v?.id}
                  value={partsPickerSelection}
                  onChange={(_, v) => setPartsPickerSelection(v)}
                  onInputChange={(_, v, reason) => {
                    if (reason === "input") setPartsPickerSearch(v);
                  }}
                  renderOption={(props, o) => (
                    <li {...props} key={o.id}>
                      <Box>
                        <Typography variant="body2">{o.name || o.productName}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {jobCard.deviceType || jobCard.productName || "Any device"}
                        </Typography>
                      </Box>
                    </li>
                  )}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Part name *"
                      placeholder="Search by part name"
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {partsPickerLoading ? <CircularProgress size={16} /> : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                />
              </Grid>
            ) : (
              <Grid item xs={12}>
                <TextField
                  size="small"
                  fullWidth
                  label="Part name *"
                  placeholder="Type the part name (not in inventory)"
                  value={partsPickerFreeText}
                  onChange={(e) => setPartsPickerFreeText(e.target.value)}
                />
              </Grid>
            )}
            <Grid item xs={12} md={6}>
              <TextField
                size="small"
                fullWidth
                type="number"
                label="Quantity *"
                value={partsPickerQty}
                onChange={(e) => setPartsPickerQty(e.target.value)}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPartsPickerOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={addPartToDraft}>
            Add To List
          </Button>
        </DialogActions>
      </Dialog>

      {/* ────── Parts Required — approval dialog (owner) ────── */}
      <Dialog
        open={partsApproveDialog.open}
        onClose={() => setPartsApproveDialog({ open: false, mode: "approve", note: "", overrides: {} })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {partsApproveDialog.mode === "approve"
            ? "Release Parts & Labour"
            : "Reject Parts List"}
        </DialogTitle>
        <DialogContent>
          {partsApproveDialog.mode === "approve" ? (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Confirm pricing from the Parts &amp; Labour table (or adjust here).
                Out-of-stock, free-text parts, and technician work must have a sell price.
                Releasing locks the list and moves the job to <b>Approved</b>.
              </Typography>
              {(() => {
                const approvalLines = lines.filter(
                  (l) =>
                    !l.isApproved &&
                    ((l.lineType === 1 && l.isTechnicianRequested) || l.lineType !== 1)
                );
                if (approvalLines.length === 0) {
                  return (
                    <Typography color="text.secondary" sx={{ my: 2 }}>
                      Nothing to release.
                    </Typography>
                  );
                }
                const grand = approvalLines.reduce((s, l) => {
                  const ov = partsApproveDialog.overrides[l.id] || {};
                  const price = ov.unitPrice ?? l.unitPrice ?? 0;
                  const disc = ov.discountAmount ?? l.discountAmount ?? 0;
                  return s + Math.max(0, (Number(l.qty) || 0) * Number(price) - Number(disc));
                }, 0);
                return (
                  <>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Type</TableCell>
                          <TableCell>Part / Description</TableCell>
                          <TableCell align="right">Qty</TableCell>
                          <TableCell align="right">Cost</TableCell>
                          <TableCell align="right">Sell</TableCell>
                          <TableCell align="right">Line Total</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {approvalLines.map((l) => {
                          const ov = partsApproveDialog.overrides[l.id] || {
                            unitPrice: l.unitPrice || 0,
                            costPrice: l.costPrice || 0,
                            discountAmount: l.discountAmount || 0,
                          };
                          const setOv = (patch) =>
                            setPartsApproveDialog((d) => ({
                              ...d,
                              overrides: { ...d.overrides, [l.id]: { ...ov, ...patch } },
                            }));
                          const lineTotal = Math.max(
                            0,
                            (Number(l.qty) || 0) * (Number(ov.unitPrice) || 0)
                          );
                          const typeLabel =
                            l.lineType === 1
                              ? "Part"
                              : l.lineType === 2
                              ? "Labour"
                              : "Diagnostic";
                          return (
                            <TableRow key={l.id}>
                              <TableCell>{typeLabel}</TableCell>
                              <TableCell>
                                {l.productName || l.description || "-"}
                                {l.isFreeTextPart && (
                                  <Chip size="small" label="Free-text" sx={{ ml: 1 }} />
                                )}
                                {!l.stockBalanceId && l.lineType === 1 && (
                                  <Chip size="small" label="Out / N/A" color="warning" sx={{ ml: 1 }} />
                                )}
                              </TableCell>
                              <TableCell align="right">{l.qty}</TableCell>
                              <TableCell align="right">
                                <TextField
                                  size="small"
                                  type="number"
                                  value={ov.costPrice}
                                  onChange={(e) => setOv({ costPrice: e.target.value })}
                                  sx={{ width: 90 }}
                                />
                              </TableCell>
                              <TableCell align="right">
                                <TextField
                                  size="small"
                                  type="number"
                                  value={ov.unitPrice}
                                  onChange={(e) => setOv({ unitPrice: e.target.value })}
                                  sx={{ width: 90 }}
                                />
                              </TableCell>
                              <TableCell align="right">{lineTotal.toFixed(2)}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                    <Box textAlign="right" mt={1}>
                      <Typography variant="subtitle1">
                        Grand Total: {grand.toFixed(2)}
                      </Typography>
                    </Box>
                  </>
                );
              })()}
              <TextField
                fullWidth
                multiline
                minRows={2}
                sx={{ mt: 2 }}
                label="Approval note (optional)"
                value={partsApproveDialog.note}
                onChange={(e) =>
                  setPartsApproveDialog({ ...partsApproveDialog, note: e.target.value })
                }
              />
            </>
          ) : (
            <TextField
              autoFocus
              fullWidth
              multiline
              minRows={3}
              label="Rejection note *"
              placeholder="e.g. Use second-hand screen instead, source from supplier X"
              value={partsApproveDialog.note}
              onChange={(e) =>
                setPartsApproveDialog({ ...partsApproveDialog, note: e.target.value })
              }
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() =>
              setPartsApproveDialog({ open: false, mode: "approve", note: "", overrides: {} })
            }
          >
            Cancel
          </Button>
          {partsApproveDialog.mode === "approve" ? (
            <Button variant="contained" color="primary" onClick={() => submitPartsApproval(true)}>
              Release Parts &amp; Labour
            </Button>
          ) : (
            <Button variant="contained" color="error" onClick={() => submitPartsApproval(false)}>
              Send Rejection
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <Dialog
        open={lineDialog.open}
        onClose={() => setLineDialog({ open: false, line: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{lineDialog.line?.id ? "Edit Line" : "Add Line"}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0 }}>
            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <InputLabel>Type</InputLabel>
                <Select
                  value={lineDialog.line?.lineType || 1}
                  label="Type"
                  onChange={(e) =>
                    setLineDialog({ ...lineDialog, line: { ...lineDialog.line, lineType: e.target.value } })
                  }
                >
                  {LINE_TYPES.map((t) => (
                    <MenuItem key={t.value} value={t.value}>
                      {t.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            {lineDialog.line?.lineType === 1 ? (
              <>
                <Grid item xs={12}>
                  <Autocomplete
                    size="small"
                    options={productOptions}
                    loading={productsLoading}
                    filterOptions={(x) => x}
                    noOptionsText={
                      productQuery.length === 0
                        ? "Type to search products"
                        : productsLoading
                        ? "Searching…"
                        : "No matching products"
                    }
                    getOptionLabel={(o) =>
                      o ? `${o.code ? o.code + " · " : ""}${o.name || o.productName || ""}` : ""
                    }
                    isOptionEqualToValue={(o, v) => o?.id === v?.id}
                    value={
                      lineDialog.line?.productId
                        ? productOptions.find((p) => p.id === lineDialog.line.productId) || {
                            id: lineDialog.line.productId,
                            name: lineDialog.line.productName,
                            code: lineDialog.line.productCode,
                          }
                        : null
                    }
                    onChange={(_, v) => onPickProduct(v)}
                    onInputChange={(_, v, reason) => {
                      if (reason === "input") setProductQuery(v);
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Product *"
                        placeholder="Search by code or name"
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {productsLoading ? <CircularProgress size={16} /> : null}
                              {params.InputProps.endAdornment}
                            </>
                          ),
                        }}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12}>
                  {batchLoading ? (
                    <Typography variant="caption" color="text.secondary">
                      Loading stock batches…
                    </Typography>
                  ) : batchOptions.length > 1 ? (
                    <FormControl size="small" fullWidth>
                      <InputLabel>Batch / Stock</InputLabel>
                      <Select
                        label="Batch / Stock"
                        value={lineDialog.line?.stockBalanceId || ""}
                        onChange={(e) => {
                          const picked = batchOptions.find((b) => b.id === Number(e.target.value));
                          setLineDialog((d) => ({
                            ...d,
                            line: {
                              ...d.line,
                              stockBalanceId: picked?.id || null,
                              unitPrice: picked?.sellingPrice ?? d.line?.unitPrice,
                              costPrice: picked?.costPrice ?? d.line?.costPrice,
                            },
                          }));
                        }}
                      >
                        {batchOptions.map((b) => (
                          <MenuItem key={b.id} value={b.id}>
                            {(b.batchNumber || "—")} · Available {b.bookBalanceQuantity} · @{" "}
                            {Number(b.sellingPrice || 0).toFixed(2)}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  ) : lineDialog.line?.productId ? (
                    <Typography variant="caption" color={lineDialog.line?.stockBalanceId ? "text.secondary" : "warning.main"}>
                      {lineDialog.line?.stockBalanceId
                        ? `Stock balance #${lineDialog.line.stockBalanceId} selected — required to deduct stock on Start Work.`
                        : "No stock found in this warehouse for the selected product. Save anyway to track without inventory."}
                    </Typography>
                  ) : null}
                </Grid>
              </>
            ) : (
              <Grid item xs={12}>
                <TextField
                  size="small"
                  fullWidth
                  label="Description"
                  value={lineDialog.line?.description || ""}
                  onChange={(e) =>
                    setLineDialog({
                      ...lineDialog,
                      line: { ...lineDialog.line, description: e.target.value },
                    })
                  }
                />
              </Grid>
            )}
            <Grid item xs={6} md={3}>
              <TextField
                size="small"
                fullWidth
                type="number"
                label="Qty"
                value={lineDialog.line?.qty || 0}
                onChange={(e) =>
                  setLineDialog({ ...lineDialog, line: { ...lineDialog.line, qty: e.target.value } })
                }
              />
            </Grid>
            <Grid item xs={6} md={3}>
              <TextField
                size="small"
                fullWidth
                type="number"
                label="Unit Price"
                value={lineDialog.line?.unitPrice || 0}
                onChange={(e) =>
                  setLineDialog({ ...lineDialog, line: { ...lineDialog.line, unitPrice: e.target.value } })
                }
              />
            </Grid>
            <Grid item xs={6} md={3}>
              <TextField
                size="small"
                fullWidth
                type="number"
                label="Discount"
                value={lineDialog.line?.discountAmount || 0}
                onChange={(e) =>
                  setLineDialog({ ...lineDialog, line: { ...lineDialog.line, discountAmount: e.target.value } })
                }
              />
            </Grid>
            <Grid item xs={6} md={3}>
              <TextField
                size="small"
                fullWidth
                type="number"
                label="Cost Price"
                value={lineDialog.line?.costPrice || 0}
                onChange={(e) =>
                  setLineDialog({ ...lineDialog, line: { ...lineDialog.line, costPrice: e.target.value } })
                }
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <InputLabel>Warranty Covered</InputLabel>
                <Select
                  value={lineDialog.line?.isWarrantyCovered ? 1 : 0}
                  label="Warranty Covered"
                  onChange={(e) =>
                    setLineDialog({
                      ...lineDialog,
                      line: { ...lineDialog.line, isWarrantyCovered: !!e.target.value },
                    })
                  }
                >
                  <MenuItem value={0}>No</MenuItem>
                  <MenuItem value={1}>Yes</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLineDialog({ open: false, line: null })}>Cancel</Button>
          <Button variant="contained" onClick={saveLine}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={unrepairableDialog.open}
        onClose={() => setUnrepairableDialog({ open: false, reason: "" })}
      >
        <DialogTitle>Mark as Can't Repair</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Use this when the device cannot be repaired. The job will stop and the
            customer can collect the unit. A reason is required.
          </Typography>
          <TextField
            fullWidth
            multiline
            minRows={3}
            label="Reason"
            required
            value={unrepairableDialog.reason}
            onChange={(e) =>
              setUnrepairableDialog({ ...unrepairableDialog, reason: e.target.value })
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUnrepairableDialog({ open: false, reason: "" })}>
            Back
          </Button>
          <Button
            color="error"
            variant="contained"
            disabled={!unrepairableDialog.reason.trim()}
            onClick={async () => {
              const ok = await callAction(`MarkUnrepairable/${id}`, {
                note: unrepairableDialog.reason.trim(),
              });
              if (ok) setUnrepairableDialog({ open: false, reason: "" });
            }}
          >
            Confirm Can't Repair
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={voidDialog.open}
        onClose={() => setVoidDialog({ open: false, reason: "" })}
      >
        <DialogTitle>Void Warranty (Customer Damage)</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Use this when the customer has damaged the product in a way that
            invalidates the whole warranty. Once voided, the warranty becomes
            inactive and no free services can be claimed. A reason is required.
          </Typography>
          <TextField
            autoFocus
            fullWidth
            multiline
            minRows={3}
            label="Reason"
            required
            placeholder="e.g. Liquid damage / physical impact caused by customer"
            value={voidDialog.reason}
            onChange={(e) => setVoidDialog({ ...voidDialog, reason: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVoidDialog({ open: false, reason: "" })}>Back</Button>
          <Button
            color="error"
            variant="contained"
            disabled={warrantyBusy || !voidDialog.reason.trim()}
            onClick={submitVoidWarranty}
          >
            Confirm Void Warranty
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={returnDialog.open}
        onClose={() => setReturnDialog({ open: false, note: "" })}
      >
        <DialogTitle>Deliver to Customer (No Repair)</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Hand the device back to the customer without completing a repair (for
            example, the customer declined the paid repair after the warranty was
            voided). Any issued parts will be returned to stock and the job will be
            marked as delivered.
          </Typography>
          <TextField
            fullWidth
            multiline
            minRows={2}
            label="Note (optional)"
            placeholder="e.g. Customer declined paid repair"
            value={returnDialog.note}
            onChange={(e) => setReturnDialog({ ...returnDialog, note: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReturnDialog({ open: false, note: "" })}>Back</Button>
          <Button
            variant="contained"
            color="primary"
            disabled={warrantyBusy}
            onClick={submitReturnToCustomer}
          >
            Confirm Deliver
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={cancelDialog.open} onClose={() => setCancelDialog({ open: false, note: "" })}>
        <DialogTitle>Cancel Job Card</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            multiline
            minRows={2}
            label="Reason / Note"
            value={cancelDialog.note}
            onChange={(e) => setCancelDialog({ ...cancelDialog, note: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialog({ open: false, note: "" })}>Back</Button>
          <Button
            variant="contained"
            color="error"
            onClick={async () => {
              const ok = await callAction(`Cancel/${id}`, { note: cancelDialog.note });
              if (ok) setCancelDialog({ open: false, note: "" });
            }}
          >
            Cancel Job Card
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
