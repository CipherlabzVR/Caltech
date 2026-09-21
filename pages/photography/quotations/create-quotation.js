import React, { useEffect, useMemo, useRef, useState } from "react";
import styles from "@/styles/PageTitle.module.css";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  Grid,
  Typography,
  MenuItem,
  TextField,
  Button,
  Box,
  Paper,
  Divider,
  FormControlLabel,
  Checkbox,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Autocomplete,
  Collapse,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
} from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import DescriptionIcon from "@mui/icons-material/Description";
import PreviewIcon from "@mui/icons-material/Preview";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import CircularProgress from "@mui/material/CircularProgress";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import BASE_URL from "Base/api";
import { getEventTimeSelectOptions, normalizeEventTime } from "@/components/Photography/eventTimeOptions";
import { formatCurrency } from "@/components/utils/formatHelper";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import useApi from "@/components/utils/useApi";

const CATEGORY_ID = 341;

const CEREMONY_TYPES = [
  { value: "", label: "N/A" },
  { value: 1, label: "Poruwa" },
  { value: 2, label: "Church" },
  { value: 3, label: "Other" },
];

const DEFAULT_FIXED_MESSAGE =
  "Please note: Transportation charges apply for events held outside Colombo. Any discount shown has been specially applied for you as discussed. This quotation is valid for 14 days. To confirm your booking, an advance payment is required.";

const isPendingApprovalStatus = (status) =>
  Number(status) === 6 ||
  String(status || "").replace(/[\s_-]/g, "").toLowerCase() === "pendingapproval";

const isFinalQuotationStatus = (status) =>
  ["approved", "sent", "converted"].includes(
    String(status || "").replace(/[\s_-]/g, "").toLowerCase()
  );

export default function CreateQuotation() {
  const router = useRouter();
  const editId = router.query.id ? Number(router.query.id) : null;

  const { navigate, create, update, approve1, remove } = IsPermissionEnabled(CATEGORY_ID);

  const { data: eventTypesRaw } = useApi("/PhotographyEventType/GetActiveEventTypes");
  const eventTypes = Array.isArray(eventTypesRaw) ? eventTypesRaw : [];

  const [packages, setPackages] = useState([]);
  const [categories, setCategories] = useState([]);
  const [addOnsMaster, setAddOnsMaster] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [reservationId, setReservationId] = useState(null);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [savedId, setSavedId] = useState(editId);
  const originalQuotationRef = useRef(null);

  const [form, setForm] = useState({
    eventType: 1,
    customerName: "",
    customerMobileNo: "",
    eventDate: "",
    eventTime: "",
    venue: "",
    noOfGuests: "",
    makeupArtist: "",
    ceremonyType: "",
    ceremonyTypeOther: "",
    isOutOfColombo: false,
    transportationCost: "",
    discountAmount: "",
    fixedMessage: DEFAULT_FIXED_MESSAGE,
    remark: "",
  });
  const [lines, setLines] = useState([]);
  const [addOns, setAddOns] = useState([]);
  const [expandedLines, setExpandedLines] = useState({});
  const [quotationStatus, setQuotationStatus] = useState("");
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectRemark, setRejectRemark] = useState("");
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch(`${BASE_URL}/PhotographyPackage/GetActivePackages`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setPackages(data?.result || []))
      .catch(() => setPackages([]));

    fetch(`${BASE_URL}/PhotographyPackageCategory/GetActiveCategories`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setCategories(data?.result || []))
      .catch(() => setCategories([]));

    fetch(`${BASE_URL}/PhotographyAddOn/GetActiveAddOns`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setAddOnsMaster(data?.result || []))
      .catch(() => setAddOnsMaster([]));

    fetch(`${BASE_URL}/PhotographyReservation/GetAllReservationPaged?SkipCount=0&MaxResultCount=200&Search=null&Filter=${encodeURIComponent("WithoutQuotation:true")}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setReservations(data?.result?.items || []))
      .catch(() => setReservations([]));
  }, []);

  const applyReservationEvent = (r, eventType) => {
    if (!r) return;
    const type = Number(eventType || r.eventType);
    setReservationId(r.id || null);
    setSelectedReservation(r);

    // Find the event in the new events array
    const events = r.events || r.Events || [];
    const selectedEvent = events.find((e) => Number(e.eventType) === type);

    if (selectedEvent) {
      setForm((prev) => ({
        ...prev,
        customerName: r.coupleNames || "",
        customerMobileNo: r.customerMobileNo || "",
        eventType: type || prev.eventType,
        eventDate: selectedEvent.eventDate ? String(selectedEvent.eventDate).split("T")[0] : prev.eventDate,
        eventTime: selectedEvent.eventTime || "",
        venue: selectedEvent.location || r.receptionLocation || "",
        noOfGuests: r.noOfGuests ?? "",
        makeupArtist: r.makeupArtist || "",
        ceremonyType: r.ceremonyType ?? "",
        ceremonyTypeOther: r.ceremonyTypeOther || "",
      }));
    } else {
      // Fallback to legacy fields
      setForm((prev) => ({
        ...prev,
        customerName: r.coupleNames || "",
        customerMobileNo: r.customerMobileNo || "",
        eventType: type || prev.eventType,
        eventDate: r.eventDate ? String(r.eventDate).split("T")[0] : prev.eventDate,
        eventTime: r.eventTime || "",
        venue: r.receptionLocation || "",
        noOfGuests: r.noOfGuests ?? "",
        makeupArtist: r.makeupArtist || "",
        ceremonyType: r.ceremonyType ?? "",
        ceremonyTypeOther: r.ceremonyTypeOther || "",
      }));
    }
  };

  const reservationEvents = (r) => {
    if (!r) return [];
    const quoted = r.quotedEventTypes || r.QuotedEventTypes || [];
    const events = r.events || r.Events || [];

    if (events.length > 0) {
      return events.map((e) => ({
        eventType: e.eventType ?? e.EventType,
        name: e.eventTypeName || e.EventTypeName || "Event",
        quoted: e.hasQuotation || e.HasQuotation || quoted.includes(Number(e.eventType ?? e.EventType)),
        isMain: e.isMainEvent || e.IsMainEvent,
        eventDate: e.eventDate || e.EventDate || "",
        eventTime: e.eventTime || e.EventTime || "",
        eventSession: e.eventSession || e.EventSession || "",
        location: e.location || e.Location || r.receptionLocation || "",
      }));
    }

    return [
      {
        eventType: r.eventType,
        name: r.eventTypeName || "Main event",
        quoted: quoted.includes(Number(r.eventType)),
        isMain: true,
        eventDate: r.eventDate || "",
        eventTime: r.eventTime || "",
        eventSession: "",
        location: r.receptionLocation || "",
      },
    ];
  };

  const applyReservation = (r) => {
    if (!r) return;
    const all = reservationEvents(r);
    if (all.some((e) => e.quoted)) {
      toast.error("This reservation already has a quotation. One quotation covers all events.");
      return;
    }
    const pick = all.find((e) => e.isMain) || all[0];
    applyReservationEvent(r, pick?.eventType);
  };

  const selectReservation = async (r) => {
    if (!r?.id) {
      applyReservation(r);
      return;
    }
    applyReservation(r);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${BASE_URL}/PhotographyReservation/GetReservationById?id=${r.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const full = data?.result ?? data?.Result;
      if (full) applyReservation(full);
    } catch {
      /* keep list payload */
    }
  };

  useEffect(() => {
    if (!editId) return;
    const token = localStorage.getItem("token");
    fetch(`${BASE_URL}/PhotographyQuotation/GetQuotationById?id=${editId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        const q = data?.result;
        if (!q) return;
        const loadedStatus =
          q.statusName ?? q.StatusName ?? q.status ?? q.Status ?? q.quotationStatus ?? "";
        setQuotationStatus(isPendingApprovalStatus(loadedStatus) ? "PendingApproval" : loadedStatus);
        if (["Approved", "Sent", "Converted"].includes(q.statusName) && !approve1) {
          toast.error("This quotation has already been approved and can no longer be edited.");
          setTimeout(() => router.push("/photography/quotations/"), 1200);
          return;
        }
        originalQuotationRef.current = q;
        setSavedId(q.id);
        setReservationId(q.reservationId || null);
        if (q.reservationId) {
          const token2 = localStorage.getItem("token");
          fetch(`${BASE_URL}/PhotographyReservation/GetReservationById?id=${q.reservationId}`, {
            headers: { Authorization: `Bearer ${token2}` },
          })
            .then((res) => res.json())
            .then((resData) => {
              const full = resData?.result ?? resData?.Result;
              if (full) setSelectedReservation(full);
            })
            .catch(() => {});
        }
        setForm({
          eventType: q.eventType || 1,
          customerName: q.customerName || "",
          customerMobileNo: q.customerMobileNo || "",
          eventDate: q.eventDate ? q.eventDate.split("T")[0] : "",
          eventTime: q.eventTime || "",
          venue: q.venue || "",
          noOfGuests: q.noOfGuests ?? "",
          makeupArtist: q.makeupArtist || "",
          ceremonyType: q.ceremonyType ?? "",
          ceremonyTypeOther: q.ceremonyTypeOther || "",
          isOutOfColombo: q.isOutOfColombo || false,
          transportationCost: q.transportationCost ?? "",
          discountAmount: q.discountAmount ?? "",
          fixedMessage: q.fixedMessage || DEFAULT_FIXED_MESSAGE,
          remark: q.remark || "",
        });
        setLines(
          (q.lines || []).map((l) => ({
            categoryId: "",
            packageId: l.packageId,
            packageVariantId: l.packageVariantId || "",
            packageName: l.packageName,
            unitPrice: l.unitPrice,
            qty: l.qty,
            items: (l.items || []).map((item) => ({
              packageItemId: item.packageItemId,
              lineText: item.lineText,
              displayOrder: item.displayOrder,
              isIncluded: item.isIncluded,
            })),
          }))
        );
        setAddOns(
          (q.addOns || []).map((a) => ({
            addOnId: a.addOnId,
            name: a.name,
            price: a.price,
            qty: a.qty,
          }))
        );
      })
      .catch(() => {});
  }, [editId, approve1]);

  const addLine = () =>
    setLines((prev) => [
      ...prev,
      { categoryId: "", packageId: "", packageVariantId: "", packageName: "", unitPrice: 0, qty: 1, items: [] },
    ]);
  const removeLine = (idx) => {
    setLines((prev) => prev.filter((_, i) => i !== idx));
    setExpandedLines((prev) => {
      const newExpanded = { ...prev };
      delete newExpanded[idx];
      return newExpanded;
    });
  };
  const toggleLineExpanded = (idx) =>
    setExpandedLines((prev) => ({ ...prev, [idx]: !prev[idx] }));

  const categoryOptions = useMemo(() => {
    if (categories.length > 0) return categories;
    const map = new Map();
    packages.forEach((p) => {
      const id = p.categoryId ?? p.CategoryId;
      if (!id || map.has(Number(id))) return;
      map.set(Number(id), {
        id: Number(id),
        name: p.categoryName || p.CategoryName || `Category ${id}`,
      });
    });
    return Array.from(map.values());
  }, [categories, packages]);

  const getPackagesForCategory = (categoryId) => {
    if (!categoryId) return [];
    return packages.filter((p) => Number(p.categoryId ?? p.CategoryId) === Number(categoryId));
  };

  const getPackageOptionsForLine = (line) => {
    const list = getPackagesForCategory(line.categoryId);
    if (!line.packageId) return list;
    if (list.some((p) => p.id === Number(line.packageId))) return list;
    const selected = packages.find((p) => p.id === Number(line.packageId));
    return selected ? [selected, ...list] : list;
  };

  // When editing, hydrate categoryId from the selected package once packages are loaded.
  useEffect(() => {
    if (!packages.length) return;
    setLines((prev) => {
      let changed = false;
      const next = prev.map((l) => {
        if (l.categoryId || !l.packageId) return l;
        const pkg = packages.find((p) => p.id === Number(l.packageId));
        const catId = pkg?.categoryId ?? pkg?.CategoryId;
        if (!catId) return l;
        changed = true;
        return { ...l, categoryId: Number(catId) };
      });
      return changed ? next : prev;
    });
  }, [packages, lines.length, editId]);

  const handleCategoryChange = (idx, categoryId) => {
    setLines((prev) =>
      prev.map((l, i) =>
        i === idx
          ? {
              ...l,
              categoryId: categoryId ? Number(categoryId) : "",
              packageId: "",
              packageVariantId: "",
              packageName: "",
              unitPrice: 0,
              items: [],
            }
          : l
      )
    );
    setExpandedLines((prev) => {
      const next = { ...prev };
      delete next[idx];
      return next;
    });
  };

  const handlePackageChange = (idx, packageId) => {
    if (!packageId) {
      setLines((prev) =>
        prev.map((l, i) =>
          i === idx
            ? {
                ...l,
                packageId: "",
                packageVariantId: "",
                packageName: "",
                unitPrice: 0,
                items: [],
              }
            : l
        )
      );
      setExpandedLines((prev) => {
        const next = { ...prev };
        delete next[idx];
        return next;
      });
      return;
    }

    const pkg = packages.find((p) => p.id === Number(packageId));
    const packageItems = pkg?.items?.map((item, i) => ({
      packageItemId: item.id,
      lineText: item.lineText,
      displayOrder: item.displayOrder || i + 1,
      isIncluded: true,
    })) || [];
    const catId = pkg?.categoryId ?? pkg?.CategoryId;
    setLines((prev) =>
      prev.map((l, i) =>
        i === idx
          ? {
              ...l,
              categoryId: catId ? Number(catId) : l.categoryId,
              packageId: Number(packageId),
              packageName: pkg ? pkg.name : "",
              packageVariantId: "",
              unitPrice: pkg ? pkg.basePrice : 0,
              items: packageItems,
            }
          : l
      )
    );
    if (packageItems.length > 0) {
      setExpandedLines((prev) => ({ ...prev, [idx]: true }));
    }
  };

  const handleVariantChange = (idx, variantId) => {
    setLines((prev) =>
      prev.map((l, i) => {
        if (i !== idx) return l;
        const pkg = packages.find((p) => p.id === l.packageId);
        const variant = pkg?.variants?.find((v) => v.id === Number(variantId));
        return {
          ...l,
          packageVariantId: variantId ? Number(variantId) : "",
          unitPrice: variant ? variant.price : pkg ? pkg.basePrice : l.unitPrice,
        };
      })
    );
  };

  const updateLineQty = (idx, qty) =>
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, qty: Math.max(1, Number(qty) || 1) } : l)));
  const updateLinePrice = (idx, price) =>
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, unitPrice: Number(price) || 0 } : l)));

  const toggleItemIncluded = (lineIdx, itemIdx) =>
    setLines((prev) =>
      prev.map((l, i) =>
        i === lineIdx
          ? {
              ...l,
              items: l.items.map((item, j) =>
                j === itemIdx ? { ...item, isIncluded: !item.isIncluded } : item
              ),
            }
          : l
      )
    );

  const addPackageItem = (lineIdx) => {
    const newItem = { packageItemId: null, lineText: "", displayOrder: 999, isIncluded: true, isNew: true };
    setLines((prev) =>
      prev.map((l, i) =>
        i === lineIdx ? { ...l, items: [...l.items, newItem] } : l
      )
    );
  };

  const updatePackageItemText = (lineIdx, itemIdx, text) =>
    setLines((prev) =>
      prev.map((l, i) =>
        i === lineIdx
          ? {
              ...l,
              items: l.items.map((item, j) =>
                j === itemIdx ? { ...item, lineText: text } : item
              ),
            }
          : l
      )
    );

  const removePackageItem = (lineIdx, itemIdx) =>
    setLines((prev) =>
      prev.map((l, i) =>
        i === lineIdx
          ? { ...l, items: l.items.filter((_, j) => j !== itemIdx) }
          : l
      )
    );

  const addAddOn = () => setAddOns((prev) => [...prev, { addOnId: "", name: "", price: 0, qty: 1 }]);
  const removeAddOn = (idx) => setAddOns((prev) => prev.filter((_, i) => i !== idx));
  const handleAddOnChange = (idx, addOnId) => {
    const a = addOnsMaster.find((x) => x.id === Number(addOnId));
    setAddOns((prev) =>
      prev.map((it, i) =>
        i === idx
          ? { ...it, addOnId: Number(addOnId), name: a ? a.name : "", price: a && a.price != null ? a.price : 0 }
          : it
      )
    );
  };
  const updateAddOnQty = (idx, qty) =>
    setAddOns((prev) => prev.map((it, i) => (i === idx ? { ...it, qty: Math.max(1, Number(qty) || 1) } : it)));
  const updateAddOnPrice = (idx, price) =>
    setAddOns((prev) => prev.map((it, i) => (i === idx ? { ...it, price: Number(price) || 0 } : it)));

  const subTotal = useMemo(() => {
    const lineTotal = lines.reduce((sum, l) => sum + (Number(l.unitPrice) || 0) * (Number(l.qty) || 0), 0);
    const addOnTotal = addOns.reduce((sum, a) => sum + (Number(a.price) || 0) * (Number(a.qty) || 0), 0);
    return lineTotal + addOnTotal;
  }, [lines, addOns]);

  const netTotal = useMemo(() => {
    return subTotal - (Number(form.discountAmount) || 0) + (Number(form.transportationCost) || 0);
  }, [subTotal, form.discountAmount, form.transportationCost]);

  const buildPayload = () => ({
    ReservationId: reservationId || null,
    EventType: Number(form.eventType),
    CustomerName: form.customerName.trim(),
    CustomerMobileNo: form.customerMobileNo,
    EventDate: form.eventDate,
    EventTime: form.eventTime,
    Venue: form.venue,
    NoOfGuests: form.noOfGuests === "" ? null : Number(form.noOfGuests),
    MakeupArtist: form.makeupArtist,
    CeremonyType: form.ceremonyType === "" ? null : Number(form.ceremonyType),
    CeremonyTypeOther: form.ceremonyTypeOther,
    IsOutOfColombo: form.isOutOfColombo,
    TransportationCost: Number(form.transportationCost) || 0,
    DiscountAmount: Number(form.discountAmount) || 0,
    FixedMessage: form.fixedMessage,
    Remark: form.remark,
    Lines: lines
      .filter((l) => l.packageId)
      .map((l) => ({
        PackageId: l.packageId,
        PackageVariantId: l.packageVariantId || null,
        PackageName: l.packageName,
        UnitPrice: Number(l.unitPrice) || 0,
        Qty: Number(l.qty) || 1,
        Items: (l.items || []).map((item, idx) => ({
          PackageItemId: item.packageItemId || null,
          LineText: item.lineText,
          DisplayOrder: item.displayOrder || idx + 1,
          IsIncluded: item.isIncluded,
        })),
      })),
    AddOns: addOns
      .filter((a) => a.addOnId)
      .map((a) => ({
        AddOnId: a.addOnId,
        Name: a.name,
        Price: Number(a.price) || 0,
        Qty: Number(a.qty) || 1,
      })),
  });

  const validate = () => {
    if (!form.customerName.trim()) {
      toast.error("Customer name is required");
      return false;
    }
    if (!form.eventDate) {
      toast.error("Event date is required");
      return false;
    }
    if (lines.filter((l) => l.packageId).length === 0) {
      toast.error("Add at least one package");
      return false;
    }
    return true;
  };

  const save = async (thenSubmit = false) => {
    if (!validate()) return;
    const token = localStorage.getItem("token");
    const isEdit = Boolean(savedId);
    const payload = buildPayload();
    if (isEdit) payload.Id = savedId;

    if (isEdit && typeof window !== "undefined") {
      const key = `quotation_versions_${savedId}`;
      try {
        const existing = JSON.parse(localStorage.getItem(key) || "[]");
        const versions = Array.isArray(existing) ? existing : [];
        const previous = originalQuotationRef.current || {
          ...payload,
          id: savedId,
          statusName: quotationStatus || "Draft",
        };
        const nextVersionNo = versions.reduce(
          (max, version) => Math.max(max, Number(version.versionNo) || 0),
          0
        ) + 1;
        const savedAt = new Date().toISOString();
        localStorage.setItem(
          key,
          JSON.stringify([
            ...versions,
            {
              id: `local-${savedId}-${savedAt}`,
              versionNo: nextVersionNo,
              savedAt,
              createdOn: savedAt,
              statusName: previous.statusName || quotationStatus || "Draft",
              note: "Saved before quotation update",
              createdByName: localStorage.getItem("name") || "Local user",
              netTotal: previous.netTotal ?? previous.NetTotal ?? 0,
              source: "local",
              snapshot: previous,
            },
          ])
        );
      } catch (storageError) {
        console.warn("Unable to save local quotation version", storageError);
      }
    }

    const url = isEdit
      ? `${BASE_URL}/PhotographyQuotation/UpdateQuotation`
      : `${BASE_URL}/PhotographyQuotation/CreateQuotation`;

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      const sc = data.statusCode ?? data.StatusCode;
      if (sc === 200 || sc === "SUCCESS") {
        const newId = data?.result?.id ?? savedId;
        setSavedId(newId);
        toast.success(data.message || (isEdit ? "Quotation updated" : "Quotation created"));
        if (thenSubmit && newId) {
          await submitForApproval(newId);
        } else {
          setTimeout(() => router.push("/photography/quotations/"), 800);
        }
      } else {
        toast.error(data.message || "Failed to save quotation");
      }
    } catch (e) {
      toast.error(e.message || "Failed to save quotation");
    }
  };

  const submitForApproval = async (id) => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${BASE_URL}/PhotographyQuotation/SubmitForApproval?id=${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const sc = data.statusCode ?? data.StatusCode;
      if (sc === 200 || sc === "SUCCESS") {
        toast.success(data.message || "Quotation submitted for approval");
        setTimeout(() => router.push("/photography/quotations/"), 800);
      } else {
        toast.error(data.message || "Failed to submit for approval");
      }
    } catch (e) {
      toast.error(e.message || "Failed to submit for approval");
    }
  };

  const handleApprove = async () => {
    if (!savedId) return;
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${BASE_URL}/PhotographyQuotation/ApproveQuotation?id=${savedId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const sc = data.statusCode ?? data.StatusCode;
      if (sc === 200 || sc === "SUCCESS") {
        toast.success(data.message || "Quotation approved successfully");
        setTimeout(() => router.push("/photography/quotations/"), 800);
      } else {
        toast.error(data.message || "Failed to approve quotation");
      }
    } catch (e) {
      toast.error(e.message || "Failed to approve quotation");
    }
  };

  const handleReject = async () => {
    if (!savedId) return;
    if (!rejectRemark.trim()) {
      toast.error("Please enter a rejection reason");
      return;
    }
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${BASE_URL}/PhotographyQuotation/RejectQuotation?id=${savedId}&rejectRemark=${encodeURIComponent(rejectRemark)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const sc = data.statusCode ?? data.StatusCode;
      if (sc === 200 || sc === "SUCCESS") {
        toast.success(data.message || "Quotation rejected");
        setRejectDialogOpen(false);
        setRejectRemark("");
        setTimeout(() => router.push("/photography/quotations/"), 800);
      } else {
        toast.error(data.message || "Failed to reject quotation");
      }
    } catch (e) {
      toast.error(e.message || "Failed to reject quotation");
    }
  };

  const handlePreview = async () => {
    if (!savedId) {
      toast.error("Please save the quotation first before previewing");
      return;
    }
    setLoadingPreview(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${BASE_URL}/PhotographyQuotation/GetQuotationPreview?id=${savedId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const sc = data.statusCode ?? data.StatusCode;
      if (sc === 200 || sc === "SUCCESS") {
        setPreviewData(data.result);
        setPreviewDialogOpen(true);
      } else {
        toast.error(data.message || "Failed to load preview");
      }
    } catch (e) {
      toast.error(e.message || "Failed to load preview");
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleSendFromPreview = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${BASE_URL}/PhotographyQuotation/SendQuotation?id=${savedId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const sc = data.statusCode ?? data.StatusCode;
      if (sc === 200 || sc === "SUCCESS") {
        toast.success(data.message || "Quotation sent via WhatsApp");
        setPreviewDialogOpen(false);
        setTimeout(() => router.push("/photography/quotations/"), 800);
      } else {
        toast.error(data.message || "Failed to send quotation");
      }
    } catch (e) {
      toast.error(e.message || "Failed to send quotation");
    }
  };

  if (!navigate) return <AccessDenied />;
  if ((editId && !update) || (!editId && !create)) return <AccessDenied />;

  const detailsLocked = Boolean(selectedReservation);
  const linkedEvents = detailsLocked ? reservationEvents(selectedReservation) : [];

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>{savedId ? "Edit Quotation" : "Create Quotation"}</h1>
        <ul>
          <li>
            <Link href="/photography/quotations/">Quotations</Link>
          </li>
          <li>{savedId ? "Edit" : "Create"}</li>
        </ul>
      </div>

      <Grid container spacing={2}>
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 2 }} className="bg-black">
            <Typography variant="h6" mb={1}>
              Customer & Event Details
            </Typography>
            <Grid container spacing={1.5}>
              <Grid item xs={12} md={6}>
                <Typography sx={labelSx}>Customer Name</Typography>
                <Autocomplete
                  freeSolo
                  size="small"
                  options={reservations}
                  value={form.customerName}
                  filterOptions={(opts, state) => {
                    const q = (state.inputValue || "").toLowerCase();
                    if (!q) return opts;
                    return opts.filter(
                      (o) =>
                        (o.coupleNames || "").toLowerCase().includes(q) ||
                        (o.customerMobileNo || "").toLowerCase().includes(q) ||
                        (o.cardNo || "").toLowerCase().includes(q)
                    );
                  }}
                  getOptionLabel={(option) =>
                    typeof option === "string" ? option : option.coupleNames || ""
                  }
                  isOptionEqualToValue={(option, value) =>
                    (typeof option === "string" ? option : option.coupleNames) === value
                  }
                  onChange={(event, newValue) => {
                    if (newValue && typeof newValue === "object") {
                      selectReservation(newValue);
                    } else {
                      setReservationId(null);
                      setSelectedReservation(null);
                      setField("customerName", newValue || "");
                    }
                  }}
                  onInputChange={(event, newInputValue, reason) => {
                    if (reason === "input") {
                      setReservationId(null);
                      setSelectedReservation(null);
                      setField("customerName", newInputValue);
                    }
                  }}
                  renderOption={(props, option) => {
                    const events = option.events || option.Events || [];
                    const eventNames = events.length > 0
                      ? events.map((e) => `${e.eventTypeName || "Event"}${e.isMainEvent ? " ★" : ""}`).join(", ")
                      : option.eventTypeName || "";
                    return (
                      <li {...props} key={option.id}>
                        <Box>
                          <Typography variant="body2">{option.coupleNames}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {option.cardNo}
                            {eventNames ? ` · ${eventNames}` : ""}
                            {option.customerMobileNo ? ` · ${option.customerMobileNo}` : ""}
                          </Typography>
                        </Box>
                      </li>
                    );
                  }}
                  renderInput={(params) => (
                    <TextField {...params} fullWidth placeholder="Type or select from reservations" />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography sx={labelSx}>Mobile / WhatsApp No</Typography>
                <TextField fullWidth size="small" value={form.customerMobileNo} onChange={(e) => setField("customerMobileNo", e.target.value)} placeholder="07XXXXXXXX" disabled={detailsLocked} />
              </Grid>
              {detailsLocked && (
                <Grid item xs={12}>
                  <Alert severity="info" sx={{ py: 0.5 }}>
                    Reservation {selectedReservation.cardNo || selectedReservation.CardNo || ""} is linked.
                    This quotation covers all {linkedEvents.length} event{linkedEvents.length === 1 ? "" : "s"}. Customer and event details are locked.
                  </Alert>
                  <Typography sx={{ ...labelSx, mt: 1.25 }}>
                    Events included ({linkedEvents.length})
                  </Typography>
                  <Box sx={{ display: "grid", gap: 1, gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" } }}>
                    {linkedEvents.map((ev) => {
                      const dateLabel = ev.eventDate ? String(ev.eventDate).split("T")[0] : "";
                      return (
                        <Paper
                          key={ev.eventType}
                          variant="outlined"
                          sx={{ p: 1.25, borderColor: ev.isMain ? "primary.main" : "divider" }}
                        >
                          <Box display="flex" alignItems="center" gap={0.75} flexWrap="wrap">
                            <Typography variant="body2" fontWeight={700}>
                              {ev.name}{ev.isMain ? " ★" : ""}
                            </Typography>
                            {ev.isMain && <Chip size="small" color="primary" label="Main" />}
                          </Box>
                          <Typography variant="caption" color="text.secondary" display="block">
                            {[dateLabel, ev.eventTime, ev.eventSession].filter(Boolean).join(" · ")}
                          </Typography>
                          {ev.location && (
                            <Typography variant="caption" color="text.secondary" display="block">
                              {ev.location}
                            </Typography>
                          )}
                        </Paper>
                      );
                    })}
                  </Box>
                </Grid>
              )}
              {!detailsLocked && (
              <Grid item xs={12} md={4}>
                <Typography sx={labelSx}>Event Type</Typography>
                <TextField
                  select
                  fullWidth
                  size="small"
                  value={form.eventType}
                  onChange={(e) => setField("eventType", e.target.value)}
                >
                  {eventTypes.map((t) => (
                    <MenuItem key={t.id} value={t.id}>
                      {t.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              )}
              {!detailsLocked && (
              <Grid item xs={12} md={4}>
                <Typography sx={labelSx}>Event Date</Typography>
                <TextField type="date" fullWidth size="small" InputLabelProps={{ shrink: true }} value={form.eventDate} onChange={(e) => setField("eventDate", e.target.value)} />
              </Grid>
              )}
              {!detailsLocked && (
              <Grid item xs={12} md={4}>
                <Typography sx={labelSx}>Event Time</Typography>
                <TextField
                  select
                  fullWidth
                  size="small"
                  value={normalizeEventTime(form.eventTime) || ""}
                  onChange={(e) => setField("eventTime", e.target.value)}
                  SelectProps={{ displayEmpty: true }}
                >
                  <MenuItem value="">
                    <em>Select time</em>
                  </MenuItem>
                  {getEventTimeSelectOptions(form.eventTime).map((t) => (
                    <MenuItem key={t} value={t}>
                      {t}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              )}
              {!detailsLocked && (
              <Grid item xs={12} md={6}>
                <Typography sx={labelSx}>Venue</Typography>
                <TextField fullWidth size="small" value={form.venue} onChange={(e) => setField("venue", e.target.value)} />
              </Grid>
              )}
              <Grid item xs={6} md={3}>
                <Typography sx={labelSx}>No. of Guests</Typography>
                <TextField type="number" fullWidth size="small" value={form.noOfGuests} onChange={(e) => setField("noOfGuests", e.target.value)} disabled={detailsLocked} />
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography sx={labelSx}>Makeup Artist</Typography>
                <TextField fullWidth size="small" value={form.makeupArtist} onChange={(e) => setField("makeupArtist", e.target.value)} disabled={detailsLocked} />
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography sx={labelSx}>Ceremony Type</Typography>
                <TextField select fullWidth size="small" value={form.ceremonyType} onChange={(e) => setField("ceremonyType", e.target.value)} disabled={detailsLocked}>
                  {CEREMONY_TYPES.map((t) => (
                    <MenuItem key={String(t.value)} value={t.value}>{t.label}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              {String(form.ceremonyType) === "3" && (
                <Grid item xs={12} md={6}>
                  <Typography sx={labelSx}>Ceremony (Other)</Typography>
                  <TextField fullWidth size="small" value={form.ceremonyTypeOther} onChange={(e) => setField("ceremonyTypeOther", e.target.value)} disabled={detailsLocked} />
                </Grid>
              )}
            </Grid>

            <Divider sx={{ my: 2 }} />

            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h6">Packages</Typography>
              <Button size="small" startIcon={<AddCircleOutlineIcon />} onClick={addLine}>Add Package</Button>
            </Box>

            {lines.length === 0 ? (
              <Typography color="error" sx={{ mt: 1 }}>No packages added</Typography>
            ) : (
              <>
                {/* MOBILE: card layout (xs–sm). Each package line is a stacked card instead of a table row. */}
                <Box sx={{ display: { xs: "block", md: "none" }, mt: 1 }}>
                  {lines.map((l, idx) => {
                    const pkg = packages.find((p) => p.id === l.packageId);
                    const variants = pkg?.variants || [];
                    const categoryPackages = getPackageOptionsForLine(l);
                    const hasItems = l.items && l.items.length > 0;
                    const includedCount = hasItems ? l.items.filter((i) => i.isIncluded).length : 0;
                    return (
                      <Paper key={idx} variant="outlined" sx={{ p: 1.5, mb: 1.5 }}>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                          <Typography variant="subtitle2" color="text.secondary">Package {idx + 1}</Typography>
                          <IconButton color="error" size="small" onClick={() => removeLine(idx)}>
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </Box>

                        <TextField
                          select
                          fullWidth
                          size="small"
                          label="Package Category"
                          value={l.categoryId || ""}
                          onChange={(e) => handleCategoryChange(idx, e.target.value)}
                          SelectProps={{ MenuProps: { PaperProps: { style: { maxHeight: 320 } } } }}
                        >
                          <MenuItem value="">Select category</MenuItem>
                          {categoryOptions.map((c) => (
                            <MenuItem key={c.id} value={c.id} sx={{ whiteSpace: "normal" }}>
                              {c.name}
                            </MenuItem>
                          ))}
                        </TextField>

                        <TextField
                          select
                          fullWidth
                          size="small"
                          label="Package"
                          sx={{ mt: 1.5 }}
                          value={l.packageId || ""}
                          disabled={!l.categoryId}
                          onChange={(e) => handlePackageChange(idx, e.target.value)}
                          SelectProps={{ MenuProps: { PaperProps: { style: { maxHeight: 320 } } } }}
                        >
                          <MenuItem value="">{l.categoryId ? "Select package" : "Select category first"}</MenuItem>
                          {categoryPackages.map((p) => (
                            <MenuItem key={p.id} value={p.id} sx={{ whiteSpace: "normal" }}>
                              {p.name}
                            </MenuItem>
                          ))}
                        </TextField>

                        {hasItems && (
                          <Box
                            display="flex"
                            justifyContent="space-between"
                            alignItems="center"
                            sx={{ mt: 1, cursor: "pointer" }}
                            onClick={() => toggleLineExpanded(idx)}
                          >
                            <Chip
                              size="small"
                              label={`${includedCount}/${l.items.length} items`}
                              color={includedCount === l.items.length ? "success" : "warning"}
                              variant="outlined"
                            />
                            <IconButton size="small">
                              {expandedLines[idx] ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                            </IconButton>
                          </Box>
                        )}

                        {variants.length > 0 && (
                          <TextField
                            select
                            fullWidth
                            size="small"
                            label="Variant"
                            sx={{ mt: 1.5 }}
                            value={l.packageVariantId || ""}
                            onChange={(e) => handleVariantChange(idx, e.target.value)}
                          >
                            <MenuItem value="">Base</MenuItem>
                            {variants.map((v) => (
                              <MenuItem key={v.id} value={v.id}>{v.variantName}</MenuItem>
                            ))}
                          </TextField>
                        )}

                        <Grid container spacing={1} sx={{ mt: 0.5 }}>
                          <Grid item xs={6}>
                            <Typography sx={{ ...labelSx, mb: "2px" }}>Unit Price</Typography>
                            <TextField size="small" fullWidth value={l.unitPrice} onChange={(e) => updateLinePrice(idx, e.target.value)} />
                          </Grid>
                          <Grid item xs={6}>
                            <Typography sx={{ ...labelSx, mb: "2px" }}>Qty</Typography>
                            <TextField type="number" size="small" fullWidth value={l.qty} onChange={(e) => updateLineQty(idx, e.target.value)} inputProps={{ min: 1 }} />
                          </Grid>
                        </Grid>

                        <Box
                          display="flex"
                          justifyContent="space-between"
                          sx={{ mt: 1.5, pt: 1, borderTop: "1px solid", borderColor: "divider" }}
                        >
                          <Typography variant="body2" fontWeight={600}>Total</Typography>
                          <Typography variant="body2" fontWeight={600}>
                            {formatCurrency((Number(l.unitPrice) || 0) * (Number(l.qty) || 0))}
                          </Typography>
                        </Box>

                        {l.packageId && (
                          <Collapse in={expandedLines[idx]} timeout="auto" unmountOnExit>
                            <Box sx={{ mt: 1.5, pt: 1.5, borderTop: "1px solid", borderColor: "divider" }}>
                              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                                <Typography variant="subtitle2">Package Items</Typography>
                                <Button size="small" startIcon={<AddCircleOutlineIcon />} onClick={() => addPackageItem(idx)}>
                                  Add Item
                                </Button>
                              </Box>
                              {l.items && l.items.length > 0 ? (
                                <List dense disablePadding>
                                  {l.items.map((item, itemIdx) => (
                                    <ListItem
                                      key={itemIdx}
                                      dense
                                      sx={{
                                        bgcolor: "action.hover",
                                        mb: 0.5,
                                        borderRadius: 1,
                                        opacity: item.isIncluded ? 1 : 0.5,
                                        flexWrap: "wrap",
                                      }}
                                      secondaryAction={
                                        <IconButton edge="end" size="small" color="error" onClick={() => removePackageItem(idx, itemIdx)}>
                                          <DeleteOutlineIcon fontSize="small" />
                                        </IconButton>
                                      }
                                    >
                                      <ListItemIcon sx={{ minWidth: 36 }}>
                                        <IconButton size="small" onClick={() => toggleItemIncluded(idx, itemIdx)}>
                                          {item.isIncluded ? (
                                            <CheckBoxIcon fontSize="small" color="success" />
                                          ) : (
                                            <CheckBoxOutlineBlankIcon fontSize="small" />
                                          )}
                                        </IconButton>
                                      </ListItemIcon>
                                      {item.isNew ? (
                                        <TextField
                                          size="small"
                                          fullWidth
                                          placeholder="Enter item description"
                                          value={item.lineText}
                                          onChange={(e) => updatePackageItemText(idx, itemIdx, e.target.value)}
                                          sx={{ mr: 1 }}
                                        />
                                      ) : (
                                        <ListItemText
                                          primary={item.lineText}
                                          sx={{ textDecoration: item.isIncluded ? "none" : "line-through", wordBreak: "break-word" }}
                                        />
                                      )}
                                    </ListItem>
                                  ))}
                                </List>
                              ) : (
                                <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
                                  No items in this package. Click "Add Item" to add custom items.
                                </Typography>
                              )}
                            </Box>
                          </Collapse>
                        )}
                      </Paper>
                    );
                  })}
                </Box>

                {/* DESKTOP: fixed-layout table (md+) */}
                <Box sx={{ display: { xs: "none", md: "block" } }}>
                  <Table size="small" sx={{ mt: 1, tableLayout: "fixed", width: "100%" }}>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ width: "18%" }}>Category</TableCell>
                        <TableCell sx={{ width: "22%" }}>Package</TableCell>
                        <TableCell sx={{ width: "14%" }}>Variant</TableCell>
                        <TableCell sx={{ width: "14%" }}>Unit Price</TableCell>
                        <TableCell sx={{ width: "10%" }}>Qty</TableCell>
                        <TableCell sx={{ width: "14%" }}>Total</TableCell>
                        <TableCell sx={{ width: "8%" }} />
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {lines.map((l, idx) => {
                        const pkg = packages.find((p) => p.id === l.packageId);
                        const variants = pkg?.variants || [];
                        const categoryPackages = getPackageOptionsForLine(l);
                        const hasItems = l.items && l.items.length > 0;
                        const includedCount = hasItems ? l.items.filter((i) => i.isIncluded).length : 0;
                        return (
                          <React.Fragment key={idx}>
                            <TableRow>
                              <TableCell sx={{ overflow: "hidden" }}>
                                <TextField
                                  select
                                  fullWidth
                                  size="small"
                                  value={l.categoryId || ""}
                                  onChange={(e) => handleCategoryChange(idx, e.target.value)}
                                  sx={{
                                    minWidth: 0,
                                    "& .MuiSelect-select": {
                                      whiteSpace: "nowrap",
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      display: "block",
                                    },
                                  }}
                                  SelectProps={{
                                    MenuProps: { PaperProps: { style: { maxHeight: 320 } } },
                                  }}
                                >
                                  <MenuItem value="">Select</MenuItem>
                                  {categoryOptions.map((c) => (
                                    <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                                  ))}
                                </TextField>
                              </TableCell>
                              <TableCell sx={{ overflow: "hidden" }}>
                                <Box display="flex" alignItems="center" gap={0.5}>
                                  {l.packageId && (
                                    <IconButton size="small" onClick={() => toggleLineExpanded(idx)}>
                                      {expandedLines[idx] ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                                    </IconButton>
                                  )}
                                  <TextField
                                    select
                                    fullWidth
                                    size="small"
                                    value={l.packageId || ""}
                                    disabled={!l.categoryId}
                                    onChange={(e) => handlePackageChange(idx, e.target.value)}
                                    sx={{
                                      minWidth: 0,
                                      "& .MuiSelect-select": {
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        display: "block",
                                      },
                                    }}
                                    SelectProps={{
                                      MenuProps: { PaperProps: { style: { maxHeight: 320 } } },
                                    }}
                                  >
                                    <MenuItem value="">{l.categoryId ? "Select" : "Select category first"}</MenuItem>
                                    {categoryPackages.map((p) => (
                                      <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                                    ))}
                                  </TextField>
                                </Box>
                                {hasItems && (
                                  <Chip
                                    size="small"
                                    label={`${includedCount}/${l.items.length} items`}
                                    sx={{ mt: 0.5, ml: 4, maxWidth: "calc(100% - 32px)" }}
                                    color={includedCount === l.items.length ? "success" : "warning"}
                                    variant="outlined"
                                  />
                                )}
                              </TableCell>
                              <TableCell sx={{ overflow: "hidden" }}>
                                {variants.length > 0 ? (
                                  <TextField
                                    select
                                    fullWidth
                                    size="small"
                                    value={l.packageVariantId || ""}
                                    onChange={(e) => handleVariantChange(idx, e.target.value)}
                                    sx={{
                                      minWidth: 0,
                                      "& .MuiSelect-select": {
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        display: "block",
                                      },
                                    }}
                                  >
                                    <MenuItem value="">Base</MenuItem>
                                    {variants.map((v) => (
                                      <MenuItem key={v.id} value={v.id}>{v.variantName}</MenuItem>
                                    ))}
                                  </TextField>
                                ) : (
                                  <Typography variant="body2" color="text.secondary">-</Typography>
                                )}
                              </TableCell>
                              <TableCell>
                                <TextField size="small" fullWidth value={l.unitPrice} onChange={(e) => updateLinePrice(idx, e.target.value)} />
                              </TableCell>
                              <TableCell>
                                <TextField type="number" size="small" fullWidth value={l.qty} onChange={(e) => updateLineQty(idx, e.target.value)} inputProps={{ min: 1 }} />
                              </TableCell>
                              <TableCell sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {formatCurrency((Number(l.unitPrice) || 0) * (Number(l.qty) || 0))}
                              </TableCell>
                              <TableCell>
                                <IconButton color="error" size="small" onClick={() => removeLine(idx)}>
                                  <DeleteOutlineIcon fontSize="inherit" />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                            {l.packageId && (
                              <TableRow>
                                <TableCell colSpan={7} sx={{ p: 0, border: expandedLines[idx] ? undefined : "none" }}>
                                  <Collapse in={expandedLines[idx]} timeout="auto" unmountOnExit>
                                    <Box sx={{ py: 1, px: 2, bgcolor: "action.hover" }}>
                                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                                        <Typography variant="subtitle2">Package Items</Typography>
                                        <Button size="small" startIcon={<AddCircleOutlineIcon />} onClick={() => addPackageItem(idx)}>
                                          Add Item
                                        </Button>
                                      </Box>
                                      {l.items && l.items.length > 0 ? (
                                        <List dense disablePadding>
                                          {l.items.map((item, itemIdx) => (
                                            <ListItem
                                              key={itemIdx}
                                              dense
                                              sx={{
                                                bgcolor: "background.paper",
                                                mb: 0.5,
                                                borderRadius: 1,
                                                opacity: item.isIncluded ? 1 : 0.5,
                                              }}
                                              secondaryAction={
                                                <IconButton edge="end" size="small" color="error" onClick={() => removePackageItem(idx, itemIdx)}>
                                                  <DeleteOutlineIcon fontSize="small" />
                                                </IconButton>
                                              }
                                            >
                                              <ListItemIcon sx={{ minWidth: 36 }}>
                                                <IconButton size="small" onClick={() => toggleItemIncluded(idx, itemIdx)}>
                                                  {item.isIncluded ? (
                                                    <CheckBoxIcon fontSize="small" color="success" />
                                                  ) : (
                                                    <CheckBoxOutlineBlankIcon fontSize="small" />
                                                  )}
                                                </IconButton>
                                              </ListItemIcon>
                                              {item.isNew ? (
                                                <TextField
                                                  size="small"
                                                  fullWidth
                                                  placeholder="Enter item description"
                                                  value={item.lineText}
                                                  onChange={(e) => updatePackageItemText(idx, itemIdx, e.target.value)}
                                                  sx={{ mr: 1 }}
                                                />
                                              ) : (
                                                <ListItemText
                                                  primary={item.lineText}
                                                  sx={{ textDecoration: item.isIncluded ? "none" : "line-through" }}
                                                />
                                              )}
                                            </ListItem>
                                          ))}
                                        </List>
                                      ) : (
                                        <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
                                          No items in this package. Click "Add Item" to add custom items.
                                        </Typography>
                                      )}
                                    </Box>
                                  </Collapse>
                                </TableCell>
                              </TableRow>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </TableBody>
                  </Table>
                </Box>
              </>
            )}

            <Divider sx={{ my: 2 }} />

            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h6">Add-ons</Typography>
              <Button size="small" startIcon={<AddCircleOutlineIcon />} onClick={addAddOn}>Add Add-on</Button>
            </Box>

            {addOns.length === 0 ? (
              <Typography color="text.secondary" sx={{ mt: 1 }}>No add-ons</Typography>
            ) : (
              <>
                {/* MOBILE: card layout (xs–sm) */}
                <Box sx={{ display: { xs: "block", md: "none" }, mt: 1 }}>
                  {addOns.map((a, idx) => (
                    <Paper key={idx} variant="outlined" sx={{ p: 1.5, mb: 1.5 }}>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                        <Typography variant="subtitle2" color="text.secondary">Add-on {idx + 1}</Typography>
                        <IconButton color="error" size="small" onClick={() => removeAddOn(idx)}>
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </Box>
                      <TextField
                        select
                        fullWidth
                        size="small"
                        label="Add-on"
                        value={a.addOnId || ""}
                        onChange={(e) => handleAddOnChange(idx, e.target.value)}
                      >
                        <MenuItem value="">Select</MenuItem>
                        {addOnsMaster.map((x) => (
                          <MenuItem key={x.id} value={x.id} sx={{ whiteSpace: "normal" }}>{x.name}</MenuItem>
                        ))}
                      </TextField>
                      <Grid container spacing={1} sx={{ mt: 0.5 }}>
                        <Grid item xs={6}>
                          <Typography sx={{ ...labelSx, mb: "2px" }}>Price</Typography>
                          <TextField size="small" fullWidth value={a.price} onChange={(e) => updateAddOnPrice(idx, e.target.value)} />
                        </Grid>
                        <Grid item xs={6}>
                          <Typography sx={{ ...labelSx, mb: "2px" }}>Qty</Typography>
                          <TextField type="number" size="small" fullWidth value={a.qty} onChange={(e) => updateAddOnQty(idx, e.target.value)} inputProps={{ min: 1 }} />
                        </Grid>
                      </Grid>
                      <Box
                        display="flex"
                        justifyContent="space-between"
                        sx={{ mt: 1.5, pt: 1, borderTop: "1px solid", borderColor: "divider" }}
                      >
                        <Typography variant="body2" fontWeight={600}>Total</Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {formatCurrency((Number(a.price) || 0) * (Number(a.qty) || 0))}
                        </Typography>
                      </Box>
                    </Paper>
                  ))}
                </Box>

                {/* DESKTOP: fixed-layout table (md+) */}
                <Box sx={{ display: { xs: "none", md: "block" } }}>
                  <Table size="small" sx={{ mt: 1, tableLayout: "fixed", width: "100%" }}>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ width: "40%" }}>Add-on</TableCell>
                        <TableCell sx={{ width: "18%" }}>Price</TableCell>
                        <TableCell sx={{ width: "14%" }}>Qty</TableCell>
                        <TableCell sx={{ width: "18%" }}>Total</TableCell>
                        <TableCell sx={{ width: "10%" }} />
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {addOns.map((a, idx) => (
                        <TableRow key={idx}>
                          <TableCell sx={{ overflow: "hidden" }}>
                            <TextField
                              select
                              fullWidth
                              size="small"
                              value={a.addOnId || ""}
                              onChange={(e) => handleAddOnChange(idx, e.target.value)}
                              sx={{
                                minWidth: 0,
                                "& .MuiSelect-select": {
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  display: "block",
                                },
                              }}
                            >
                              <MenuItem value="">Select</MenuItem>
                              {addOnsMaster.map((x) => (
                                <MenuItem key={x.id} value={x.id}>{x.name}</MenuItem>
                              ))}
                            </TextField>
                          </TableCell>
                          <TableCell>
                            <TextField size="small" fullWidth value={a.price} onChange={(e) => updateAddOnPrice(idx, e.target.value)} />
                          </TableCell>
                          <TableCell>
                            <TextField type="number" size="small" fullWidth value={a.qty} onChange={(e) => updateAddOnQty(idx, e.target.value)} inputProps={{ min: 1 }} />
                          </TableCell>
                          <TableCell sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {formatCurrency((Number(a.price) || 0) * (Number(a.qty) || 0))}
                          </TableCell>
                          <TableCell>
                            <IconButton color="error" size="small" onClick={() => removeAddOn(idx)}>
                              <DeleteOutlineIcon fontSize="inherit" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>
              </>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 2 }} className="bg-black">
            <Typography variant="h6" mb={1}>Pricing</Typography>
            <FormControlLabel
              control={<Checkbox checked={form.isOutOfColombo} onChange={() => setField("isOutOfColombo", !form.isOutOfColombo)} />}
              label="Out of Colombo"
            />
            <Typography sx={labelSx}>Transportation Cost</Typography>
            <TextField fullWidth size="small" value={form.transportationCost} onChange={(e) => setField("transportationCost", e.target.value)} disabled={!form.isOutOfColombo} />
            <Typography sx={{ ...labelSx, mt: 1.5 }}>Discount Amount</Typography>
            <TextField fullWidth size="small" value={form.discountAmount} onChange={(e) => setField("discountAmount", e.target.value)} />

            <Divider sx={{ my: 2 }} />
            <Box display="flex" justifyContent="space-between" mb={0.5}>
              <Typography>Sub Total</Typography>
              <Typography>{formatCurrency(subTotal)}</Typography>
            </Box>
            <Box display="flex" justifyContent="space-between" mb={0.5}>
              <Typography>Discount</Typography>
              <Typography>- {formatCurrency(Number(form.discountAmount) || 0)}</Typography>
            </Box>
            <Box display="flex" justifyContent="space-between" mb={0.5}>
              <Typography>Transportation</Typography>
              <Typography>{formatCurrency(Number(form.transportationCost) || 0)}</Typography>
            </Box>
            <Divider sx={{ my: 1 }} />
            <Box display="flex" justifyContent="space-between">
              <Typography variant="h6">Net Total</Typography>
              <Typography variant="h6">{formatCurrency(netTotal)}</Typography>
            </Box>

            <Divider sx={{ my: 2 }} />
            <Typography sx={labelSx}>Fixed Message</Typography>
            <TextField fullWidth size="small" multiline minRows={4} value={form.fixedMessage} onChange={(e) => setField("fixedMessage", e.target.value)} />
            <Typography sx={{ ...labelSx, mt: 1.5 }}>Internal Remark</Typography>
            <TextField fullWidth size="small" multiline minRows={2} value={form.remark} onChange={(e) => setField("remark", e.target.value)} />

            <Box display="flex" flexDirection="column" gap={1} mt={2}>
              <Button variant="contained" onClick={() => save(false)}>
                {savedId ? "Update Quotation" : "Save as Draft"}
              </Button>
              {!isFinalQuotationStatus(quotationStatus) && (
                <Button variant="contained" color="success" onClick={() => save(true)}>
                  Save & Submit for Approval
                </Button>
              )}
              {savedId && (quotationStatus === "Approved" || quotationStatus === "Sent") && (
                <Button
                  variant="contained"
                  color="info"
                  startIcon={loadingPreview ? <CircularProgress size={18} color="inherit" /> : <PreviewIcon />}
                  onClick={handlePreview}
                  disabled={loadingPreview}
                >
                  Preview & Send WhatsApp
                </Button>
              )}
              <Button variant="outlined" color="error" onClick={() => router.push("/photography/quotations/")}>
                Cancel
              </Button>
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
              A quotation must be approved before it can be sent to the customer.
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Reject Quotation</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Please provide a reason for rejecting this quotation. The creator will be notified.
          </Typography>
          <TextField
            autoFocus
            fullWidth
            multiline
            minRows={3}
            label="Rejection Reason"
            value={rejectRemark}
            onChange={(e) => setRejectRemark(e.target.value)}
            placeholder="Enter the reason for rejection..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleReject}>
            Reject Quotation
          </Button>
        </DialogActions>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewDialogOpen} onClose={() => setPreviewDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <PreviewIcon color="primary" />
            Preview Quotation Before Sending
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {previewData && (
            <>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Customer Details
              </Typography>
              <Box sx={{ mb: 2, p: 1.5, bgcolor: "action.hover", borderRadius: 1 }}>
                <Typography variant="body2"><strong>Name:</strong> {previewData.quotation?.customerName}</Typography>
                <Typography variant="body2"><strong>Mobile:</strong> {previewData.quotation?.customerMobileNo}</Typography>
                <Typography variant="body2">
                  <strong>Events:</strong>{" "}
                  {linkedEvents.length > 0
                    ? linkedEvents.map((ev) => ev.name).join(", ")
                    : `${previewData.quotation?.eventTypeName || ""} on ${previewData.quotation?.eventDate?.split("T")[0] || ""}`}
                </Typography>
              </Box>

              <Typography variant="subtitle2" color="primary" gutterBottom>
                WhatsApp Message Preview
              </Typography>
              <Box sx={{ mb: 2, p: 1.5, bgcolor: "#dcf8c6", borderRadius: 1, fontFamily: "monospace", fontSize: "13px", whiteSpace: "pre-wrap" }}>
                {previewData.whatsAppMessage}
              </Box>

              {previewData.hasAgreementDocument && (
                <>
                  <Typography variant="subtitle2" color="primary" gutterBottom>
                    Agreement Document
                  </Typography>
                  <Box sx={{ mb: 2, p: 1.5, bgcolor: "action.hover", borderRadius: 1 }}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <DescriptionIcon color="success" />
                      <Typography variant="body2" sx={{ flex: 1 }}>
                        <strong>{previewData.agreementTemplateName || "Agreement"}</strong> will be sent along with the message
                      </Typography>
                      <Button size="small" onClick={() => window.open(previewData.agreementDocumentUrl, "_blank")}>
                        View Document
                      </Button>
                    </Box>
                  </Box>
                </>
              )}

              {!previewData.hasAgreementDocument && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  No active agreement template configured. <Link href="/photography/document-templates/" style={{ color: "inherit" }}>Configure templates</Link>
                </Alert>
              )}

              <Alert severity="info">
                The message will be sent to <strong>{previewData.quotation?.customerMobileNo}</strong> via WhatsApp.
              </Alert>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="success"
            startIcon={<WhatsAppIcon />}
            onClick={handleSendFromPreview}
          >
            Send via WhatsApp
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

const labelSx = { fontWeight: "500", fontSize: "13px", mb: "4px" };