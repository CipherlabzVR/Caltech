import React, { useEffect, useMemo, useState } from "react";
import Grid from "@mui/material/Grid";
import Link from "next/link";
import styles from "@/styles/PageTitle.module.css";
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Tabs,
  Tab,
  Stack,
  Divider,
  Avatar,
} from "@mui/material";
import { Search, StyledInputBase } from "@/styles/main/search-styles";
import { masterCategoryContainedButtonSx } from "@/styles/masterCategoryButtons";
import BASE_URL from "Base/api";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from "@mui/icons-material/Refresh";
import VisibilityIcon from "@mui/icons-material/Visibility";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";

/* ------------------------------------------------------------------ */
/*  Predefined Packages — Admin CRUD                                  */
/*                                                                    */
/*  Backend (expected, .NET):                                         */
/*    GET    /TravelPredefinedPackages/GetAll                         */
/*    POST   /TravelPredefinedPackages/Create   (multipart or JSON)   */
/*    POST   /TravelPredefinedPackages/Update                         */
/*    POST   /TravelPredefinedPackages/Delete?id=                     */
/*    POST   /TravelPredefinedPackages/UploadCover (multipart, id)    */
/*    GET    /TravelPredefinedPackages/GetPublic   (used by Luxora)   */
/* ------------------------------------------------------------------ */

const isOk = (r) => r?.statusCode === 200 || r?.statusCode === 1;
const authJsonHeaders = () => ({
  Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("token") : ""}`,
  "Content-Type": "application/json",
});
const authMultipartHeaders = () => ({
  Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("token") : ""}`,
});

/** Parse URL returned by /AWS/DocumentUploadCommon (plain text or JSON string/object). */
const parseUploadUrl = (text) => {
  const raw = String(text || "").trim();
  if (!raw) throw new Error("Upload failed");
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed === "string" && parsed.startsWith("http")) return parsed;
    if (parsed && typeof parsed === "object") {
      const candidate = parsed.result ?? parsed.url ?? parsed.message;
      if (typeof candidate === "string" && candidate.startsWith("http")) return candidate;
    }
  } catch {
    // not JSON — fall through
  }
  if (raw.startsWith("http")) return raw;
  throw new Error("Upload did not return a URL");
};

const slugify = (s = "") =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

const MAX_DAY_IMAGES = 2;
const emptyDay = () => ({ dayNumber: 1, title: "", description: "", images: [] });

const emptyHotelRoomRow = () => ({
  roomTypeLabel: "",
  maxOccupancy: 1,
  pricePerNight: 0,
  isActive: true,
});

const emptyCustomHotelRow = () => ({
  location: "",
  hotel: "",
  categoryLabel: "",
  mealPlan: "HB",
  imageUrl: "",
  rooms: [],
});

const emptyStarOption = () => ({
  starCategory: 3,
  perPersonDouble: 0,
  singleSupplement: 0,
  tripleReduction: 0,
  peraheraSupplement: 0,
  roomTypes: [],
  hotels: [],
});

const normalizeStarOption = (opt) => ({
  ...opt,
  starCategory: opt.starCategory || 3,
  roomTypes: [],
  peraheraSupplement: 0,
  perPersonDouble: Number(opt.perPersonDouble) || 0,
  singleSupplement: 0,
  tripleReduction: 0,
});

const mapHotelRoomForSave = (r, idx) => ({
  travelRoomTypeId: Number(r.travelRoomTypeId) || idx + 1,
  roomTypeLabel: String(r.roomTypeLabel || "").trim(),
  maxOccupancy: Math.max(1, Number(r.maxOccupancy) || 1),
  pricePerNight: Number(r.pricePerNight) || 0,
  isActive: r.isActive !== false,
});

const normalizeHotelForSave = (h) => {
  const image = String(h.imageUrl || h.ImageUrl || "").trim() || null;
  return {
    travelHotelId: null,
    source: "custom",
    location: String(h.location || "").trim(),
    hotel: String(h.hotel || "").trim(),
    travelDestinationId: null,
    travelHotelCategoryId: null,
    categoryLabel: String(h.categoryLabel || "").trim(),
    mealPlan: h.mealPlan || "HB",
    imageUrl: image,
    ImageUrl: image,
    rooms: (h.rooms || [])
      .filter((r) => String(r.roomTypeLabel || "").trim())
      .map((r, idx) => mapHotelRoomForSave(r, idx)),
  };
};

const isHotelRowEmpty = (h) =>
  !String(h?.hotel || "").trim() &&
  !String(h?.location || "").trim() &&
  !String(h?.imageUrl || h?.ImageUrl || "").trim() &&
  !String(h?.categoryLabel || "").trim() &&
  !(h?.rooms || []).some((r) => String(r?.roomTypeLabel || "").trim());

const hydrateHotelRow = (h) => ({
  ...emptyCustomHotelRow(),
  location: h?.location || "",
  hotel: h?.hotel || "",
  categoryLabel: h?.categoryLabel || "",
  mealPlan: h?.mealPlan || "HB",
  imageUrl: h?.imageUrl || h?.ImageUrl || "",
  rooms:
    Array.isArray(h?.rooms) && h.rooms.length
      ? h.rooms.map((r, idx) => ({
          travelRoomTypeId: r.travelRoomTypeId || idx + 1,
          roomTypeLabel: r.roomTypeLabel || "",
          maxOccupancy: Math.max(1, Number(r.maxOccupancy) || 1),
          pricePerNight: Number(r.pricePerNight) || 0,
          isActive: r.isActive !== false,
        }))
      : [],
});

const emptyEntryFee = () => ({ site: "", perPersonUsd: 0 });

const emptyForm = {
  title: "",
  slug: "",
  summary: "",
  coverImageUrl: "",
  durationDays: 5,
  durationNights: 4,
  validityPeriod: "",
  nationality: "",
  currency: "USD",
  priceFrom: 0,
  tagline: "",
  accentColor: "#C5A059",
  days: [emptyDay()],
  starOptions: [emptyStarOption()],
  inclusions: [],
  exclusions: [],
  entryFees: [],
  displayOrder: 0,
  isPublished: true,
};

const URLS = {
  list: `${BASE_URL}/TravelPredefinedPackages/GetAll`,
  create: `${BASE_URL}/TravelPredefinedPackages/Create`,
  update: `${BASE_URL}/TravelPredefinedPackages/Update`,
  remove: (id) => `${BASE_URL}/TravelPredefinedPackages/Delete?id=${id}`,
  uploadCover: `${BASE_URL}/TravelPredefinedPackages/UploadCover`,
};

export default function PredefinedPackagesAdmin() {
  const cId = typeof window !== "undefined" ? sessionStorage.getItem("category") : null;
  const { navigate, create, update, remove } = IsPermissionEnabled(cId);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [tab, setTab] = useState(0);
  const [saving, setSaving] = useState(false);
  const [coverFile, setCoverFile] = useState(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [viewOpen, setViewOpen] = useState(false);
  const [viewing, setViewing] = useState(null);

  /* ───── Fetch ───── */
  const fetchAll = async () => {
    setLoading(true);
    try {
      const r = await fetch(URLS.list, { headers: authJsonHeaders() });
      const data = await r.json();
      const list = Array.isArray(data?.result) ? data.result : Array.isArray(data) ? data : [];
      setRows(list);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load packages");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!navigate) return;
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  useEffect(() => {
    if (!dialogOpen) return;
    setForm((f) => ({
      ...f,
      starOptions: (f.starOptions?.length ? f.starOptions : [emptyStarOption()]).slice(0, 1),
    }));
  }, [dialogOpen]);

  /* ───── Helpers ───── */
  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setCoverFile(null);
    setTab(0);
    setDialogOpen(true);
  };

  const openEdit = (row) => {
    setEditingId(row.id);
    setForm({
      ...emptyForm,
      ...row,
      validityPeriod: row.validityPeriod || "",
      days:
        Array.isArray(row.days) && row.days.length
          ? row.days.map((d) => ({
              ...emptyDay(),
              ...d,
              images: Array.isArray(d.images) ? d.images.slice(0, MAX_DAY_IMAGES) : [],
            }))
          : [emptyDay()],
      starOptions: (() => {
        const list = Array.isArray(row.starOptions) && row.starOptions.length ? row.starOptions : [emptyStarOption()];
        const primary = {
          ...emptyStarOption(),
          ...list[0],
          hotels: list.flatMap((o) =>
            (Array.isArray(o.hotels) && o.hotels.length ? o.hotels : []).map((h) => hydrateHotelRow(h))
          ),
        };
        return [primary];
      })(),
      inclusions: Array.isArray(row.inclusions) ? row.inclusions : [],
      exclusions: Array.isArray(row.exclusions) ? row.exclusions : [],
      entryFees: Array.isArray(row.entryFees) ? row.entryFees : [],
    });
    setCoverFile(null);
    setTab(0);
    setDialogOpen(true);
  };

  const openView = (row) => {
    setViewing(row);
    setViewOpen(true);
  };

  const openDelete = (row) => {
    setToDelete(row);
    setDeleteOpen(true);
  };

  /* ───── Save ───── */
  const handleSave = async () => {
    if (!form.title?.trim()) return toast.error("Title is required.");
    setSaving(true);
    try {
      const payload = {
        ...form,
        slug: form.slug?.trim() || slugify(form.title),
        priceFrom: Number(form.priceFrom) || 0,
        durationDays: Number(form.durationDays) || 0,
        durationNights: Number(form.durationNights) || 0,
        displayOrder: Number(form.displayOrder) || 0,
        validityPeriod: form.validityPeriod?.trim() || null,
        validityFrom: null,
        validityTo: null,
        mealPlan: null,
        starOptions: (() => {
          const primary = form.starOptions?.[0] || emptyStarOption();
          const normalized = normalizeStarOption(primary);
          return [{
            ...normalized,
            hotels: (normalized.hotels || [])
              .filter((h) => !isHotelRowEmpty(h))
              .map((h) => normalizeHotelForSave(h)),
          }];
        })(),
      };
      if (editingId) payload.id = editingId;

      const url = editingId ? URLS.update : URLS.create;
      const r = await fetch(url, {
        method: "POST",
        headers: authJsonHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await r.json();
      if (!isOk(data)) throw new Error(data?.message || "Save failed");

      const savedId = editingId || data?.result?.id || data?.id;

      // Optional cover upload
      if (coverFile && savedId) {
        const fd = new FormData();
        fd.append("id", savedId);
        fd.append("file", coverFile);
        const ur = await fetch(URLS.uploadCover, {
          method: "POST",
          headers: authMultipartHeaders(),
          body: fd,
        });
        const ud = await ur.json().catch(() => ({}));
        if (!isOk(ud)) toast.warn("Saved, but cover upload failed.");
      }

      toast.success(editingId ? "Package updated" : "Package created");
      setDialogOpen(false);
      fetchAll();
    } catch (err) {
      toast.error(err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      const r = await fetch(URLS.remove(toDelete.id), { method: "POST", headers: authJsonHeaders() });
      const data = await r.json();
      if (!isOk(data)) throw new Error(data?.message || "Delete failed");
      toast.success("Deleted");
      setDeleteOpen(false);
      setToDelete(null);
      fetchAll();
    } catch (err) {
      toast.error(err.message || "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  /* ───── List filter ───── */
  const visible = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      `${r.title} ${r.summary || ""} ${r.nationality || ""}`.toLowerCase().includes(q)
    );
  }, [rows, searchTerm]);

  /* ───── Day / Star helpers ───── */
  const updateDay = (idx, patch) => {
    setForm((f) => {
      const days = [...f.days];
      days[idx] = { ...days[idx], ...patch };
      return { ...f, days };
    });
  };
  const addDay = () =>
    setForm((f) => ({
      ...f,
      days: [...f.days, { ...emptyDay(), dayNumber: f.days.length + 1 }],
    }));
  const removeDay = (idx) =>
    setForm((f) => ({ ...f, days: f.days.filter((_, i) => i !== idx) }));

  const setDayImages = (idx, images) => {
    setForm((f) => {
      const days = [...f.days];
      days[idx] = { ...days[idx], images: (images || []).slice(0, MAX_DAY_IMAGES) };
      return { ...f, days };
    });
  };

  const uploadDayImage = async (dayIdx, file) => {
    if (!file) return;
    try {
      const fd = new FormData();
      const ext = (file.name?.split(".").pop() || "jpg").toLowerCase();
      fd.append("File", file);
      fd.append("FileName", `predefined-package-day-${Date.now()}.${ext}`);
      fd.append("storePath", "Travel/PredefinedPackages/Days");
      const r = await fetch(`${BASE_URL}/AWS/DocumentUploadCommon`, {
        method: "POST",
        headers: authMultipartHeaders(),
        body: fd,
      });
      const text = await r.text();
      if (!r.ok) throw new Error(text || "Upload failed");
      const url = parseUploadUrl(text);
      setForm((f) => {
        const days = [...f.days];
        const current = Array.isArray(days[dayIdx].images) ? days[dayIdx].images : [];
        const next = [...current, url].slice(0, MAX_DAY_IMAGES);
        days[dayIdx] = { ...days[dayIdx], images: next };
        return { ...f, days };
      });
      toast.success("Image uploaded");
    } catch (err) {
      toast.error(err.message || "Image upload failed");
    }
  };

  const uploadHotelImage = async (starIdx, hotelIdx, file) => {
    if (!file) return;
    try {
      const fd = new FormData();
      const ext = (file.name?.split(".").pop() || "jpg").toLowerCase();
      fd.append("File", file);
      fd.append("FileName", `predefined-package-hotel-${Date.now()}.${ext}`);
      fd.append("storePath", "Travel/PredefinedPackages/Hotels");
      const r = await fetch(`${BASE_URL}/AWS/DocumentUploadCommon`, {
        method: "POST",
        headers: authMultipartHeaders(),
        body: fd,
      });
      const text = await r.text();
      if (!r.ok) throw new Error(text || "Upload failed");
      const url = parseUploadUrl(text);
      updateStarHotel(starIdx, hotelIdx, { imageUrl: url });
      toast.success("Hotel image uploaded");
    } catch (err) {
      toast.error(err.message || "Hotel image upload failed");
    }
  };

  const updateStar = (idx, patch) =>
    setForm((f) => {
      const arr = [...f.starOptions];
      arr[idx] = { ...arr[idx], ...patch };
      return { ...f, starOptions: arr };
    });
  const addStar = () =>
    setForm((f) => ({
      ...f,
      starOptions: [...f.starOptions, normalizeStarOption(emptyStarOption())],
    }));
  const removeStar = (idx) =>
    setForm((f) => ({ ...f, starOptions: f.starOptions.filter((_, i) => i !== idx) }));

  const updateStarHotel = (sIdx, hIdx, patch) =>
    setForm((f) => {
      const arr = [...f.starOptions];
      const hotels = [...(arr[sIdx].hotels || [])];
      hotels[hIdx] = { ...hotels[hIdx], ...patch };
      arr[sIdx] = { ...arr[sIdx], hotels };
      return { ...f, starOptions: arr };
    });
  const addStarHotel = (sIdx) =>
    setForm((f) => {
      const arr = [...f.starOptions];
      arr[sIdx] = { ...arr[sIdx], hotels: [...(arr[sIdx].hotels || []), emptyCustomHotelRow()] };
      return { ...f, starOptions: arr };
    });
  const addCustomHotelRoom = (sIdx, hIdx) =>
    setForm((f) => {
      const arr = [...f.starOptions];
      const hotels = [...(arr[sIdx].hotels || [])];
      hotels[hIdx] = {
        ...hotels[hIdx],
        rooms: [...(hotels[hIdx].rooms || []), emptyHotelRoomRow()],
      };
      arr[sIdx] = { ...arr[sIdx], hotels };
      return { ...f, starOptions: arr };
    });
  const updateCustomHotelRoom = (sIdx, hIdx, rIdx, patch) =>
    setForm((f) => {
      const arr = [...f.starOptions];
      const hotels = [...(arr[sIdx].hotels || [])];
      const rooms = [...(hotels[hIdx].rooms || [])];
      rooms[rIdx] = { ...rooms[rIdx], ...patch };
      hotels[hIdx] = { ...hotels[hIdx], rooms };
      arr[sIdx] = { ...arr[sIdx], hotels };
      return { ...f, starOptions: arr };
    });
  const removeCustomHotelRoom = (sIdx, hIdx, rIdx) =>
    setForm((f) => {
      const arr = [...f.starOptions];
      const hotels = [...(arr[sIdx].hotels || [])];
      hotels[hIdx] = {
        ...hotels[hIdx],
        rooms: (hotels[hIdx].rooms || []).filter((_, i) => i !== rIdx),
      };
      arr[sIdx] = { ...arr[sIdx], hotels };
      return { ...f, starOptions: arr };
    });
  const removeStarHotel = (sIdx, hIdx) =>
    setForm((f) => {
      const arr = [...f.starOptions];
      arr[sIdx] = { ...arr[sIdx], hotels: arr[sIdx].hotels.filter((_, i) => i !== hIdx) };
      return { ...f, starOptions: arr };
    });

  if (!navigate) return <AccessDenied />;

  return (
    <>
      <div className={styles.pageTitle}>
        <h1>Predefined Packages</h1>
        <ul>
          <li><Link href="/">Dashboard</Link></li>
          <li>Travel</li>
          <li><Link href="/travel/predefined-packages/">Predefined Packages</Link></li>
        </ul>
      </div>

      <Paper sx={{ p: { xs: 1.5, md: 2 }, mb: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Curated tour packages displayed on the public website
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" startIcon={<RefreshIcon />} onClick={fetchAll} disabled={loading}>
              Refresh
            </Button>
            {create && (
              <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate} sx={masterCategoryContainedButtonSx}>
                New Package
              </Button>
            )}
          </Stack>
        </Box>
      </Paper>

      <Grid container rowSpacing={1} columnSpacing={1}>
        <Grid item xs={12} lg={4}>
          <Search className="search-form">
            <StyledInputBase
              placeholder="Search.."
              inputProps={{ "aria-label": "search" }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </Search>
        </Grid>

        <Grid item xs={12}>
          <TableContainer component={Paper}>
            <Table className="dark-table">
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Cover</TableCell>
                  <TableCell>Title</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell>Price From</TableCell>
                  <TableCell>Validity</TableCell>
                  <TableCell>Order</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={9} align="center"><Typography>Loading…</Typography></TableCell></TableRow>
                ) : visible.length === 0 ? (
                  <TableRow><TableCell colSpan={9} align="center"><Typography color="textSecondary">No packages yet.</Typography></TableCell></TableRow>
                ) : (
                  visible.map((row, idx) => (
                    <TableRow key={row.id} hover>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell>
                        <Avatar variant="rounded" src={row.coverImageUrl} sx={{ width: 56, height: 40 }} />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{row.title}</Typography>
                        <Typography variant="caption" color="text.secondary">{row.tagline || row.summary?.slice(0, 60)}</Typography>
                      </TableCell>
                      <TableCell>
                        {row.durationDays || 0}D / {row.durationNights || Math.max(0, (row.durationDays || 1) - 1)}N
                      </TableCell>
                      <TableCell>{row.currency || "USD"} {row.priceFrom || 0}</TableCell>
                      <TableCell>{row.validityPeriod || "—"}</TableCell>
                      <TableCell>{row.displayOrder ?? 0}</TableCell>
                      <TableCell>
                        <Chip
                          label={row.isPublished ? "Published" : "Draft"}
                          size="small"
                          color={row.isPublished ? "success" : "default"}
                          variant={row.isPublished ? "filled" : "outlined"}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="View">
                          <IconButton size="small" onClick={() => openView(row)}><VisibilityIcon fontSize="small" /></IconButton>
                        </Tooltip>
                        {update && (
                          <Tooltip title="Edit">
                            <IconButton size="small" onClick={() => openEdit(row)}><EditIcon fontSize="small" /></IconButton>
                          </Tooltip>
                        )}
                        {remove && (
                          <Tooltip title="Delete">
                            <IconButton size="small" color="error" onClick={() => openDelete(row)}><DeleteIcon fontSize="small" /></IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>

      {/* ───── Create / Edit dialog ───── */}
      <Dialog open={dialogOpen} onClose={() => !saving && setDialogOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>{editingId ? "Edit Package" : "New Package"}</DialogTitle>
        <DialogContent dividers>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" sx={{ mb: 2 }}>
            <Tab label="Overview" />
            <Tab label="Itinerary" />
            <Tab label="Included Hotels" />
            <Tab label="Inclusions / Exclusions" />
            <Tab label="Entry Fees" />
          </Tabs>

          {tab === 0 && (
            <Stack spacing={2}>
              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <TextField
                  label="Title *"
                  fullWidth size="small"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value, slug: form.slug || slugify(e.target.value) })}
                />
                <TextField
                  label="Slug"
                  fullWidth size="small"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })}
                  helperText="URL-friendly identifier"
                />
              </Stack>
              <TextField
                label="Tagline"
                fullWidth size="small"
                value={form.tagline}
                onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                placeholder="e.g. Cultural Triangle Escape"
              />
              <TextField
                label="Summary"
                fullWidth size="small" multiline rows={3}
                value={form.summary}
                onChange={(e) => setForm({ ...form, summary: e.target.value })}
              />

              <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems="center">
                <TextField
                  label="Cover Image URL"
                  fullWidth size="small"
                  value={form.coverImageUrl}
                  onChange={(e) => setForm({ ...form, coverImageUrl: e.target.value })}
                />
                <Button component="label" variant="outlined" startIcon={<CloudUploadIcon />}>
                  Upload
                  <input
                    hidden
                    type="file"
                    accept="image/*"
                    onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                  />
                </Button>
                {coverFile && <Typography variant="caption">{coverFile.name}</Typography>}
              </Stack>

              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <TextField label="Duration (Days)" type="number" size="small" fullWidth
                  value={form.durationDays}
                  onChange={(e) => setForm({ ...form, durationDays: Number(e.target.value) || 0 })} />
                <TextField label="Duration (Nights)" type="number" size="small" fullWidth
                  value={form.durationNights}
                  onChange={(e) => setForm({ ...form, durationNights: Number(e.target.value) || 0 })} />
                <TextField label="Price From" type="number" size="small" fullWidth
                  value={form.priceFrom}
                  onChange={(e) => setForm({ ...form, priceFrom: Number(e.target.value) || 0 })} />
                <FormControl size="small" fullWidth>
                  <InputLabel>Currency</InputLabel>
                  <Select
                    label="Currency"
                    value={form.currency}
                    onChange={(e) => setForm({ ...form, currency: e.target.value })}
                  >
                    {["USD", "EUR", "GBP", "LKR", "INR"].map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                  </Select>
                </FormControl>
              </Stack>

              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <TextField
                  label="Validity"
                  size="small"
                  fullWidth
                  value={form.validityPeriod}
                  onChange={(e) => setForm({ ...form, validityPeriod: e.target.value })}
                  placeholder="e.g. Dec – Feb, Entire 2026, Mar – Nov"
                  helperText="Free text — type the validity period as you want it shown"
                />
                <TextField label="Nationality" size="small" fullWidth
                  value={form.nationality}
                  onChange={(e) => setForm({ ...form, nationality: e.target.value })}
                  placeholder="e.g. Indian" />
              </Stack>

              <Stack direction="row" spacing={2} alignItems="center">
                <TextField label="Display Order" type="number" size="small" sx={{ width: 160 }}
                  value={form.displayOrder}
                  onChange={(e) => setForm({ ...form, displayOrder: Number(e.target.value) || 0 })} />
                <TextField label="Accent Color" size="small" sx={{ width: 200 }}
                  value={form.accentColor}
                  onChange={(e) => setForm({ ...form, accentColor: e.target.value })} />
                <FormControlLabel
                  control={<Switch checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} />}
                  label="Published"
                />
              </Stack>
            </Stack>
          )}

          {tab === 1 && (
            <Stack spacing={2}>
              {form.days.map((d, i) => (
                <Paper key={i} sx={{ p: 2 }} variant="outlined">
                  <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
                    <TextField label="Day #" type="number" size="small" sx={{ width: 100 }}
                      value={d.dayNumber}
                      onChange={(e) => updateDay(i, { dayNumber: Number(e.target.value) || 0 })} />
                    <TextField label="Title" size="small" fullWidth
                      value={d.title}
                      onChange={(e) => updateDay(i, { title: e.target.value })}
                      placeholder="e.g. Airport - Colombo" />
                    <IconButton color="error" onClick={() => removeDay(i)} disabled={form.days.length <= 1}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                  <TextField label="Description" size="small" fullWidth multiline rows={4}
                    value={d.description}
                    onChange={(e) => updateDay(i, { description: e.target.value })} />

                  <Divider sx={{ my: 1.5 }} />
                  <Typography variant="caption" color="text.secondary">
                    Day images (max {MAX_DAY_IMAGES})
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
                    {(d.images || []).map((url, ii) => (
                      <Box
                        key={ii}
                        sx={{
                          position: "relative",
                          width: 130, height: 90,
                          border: "1px solid rgba(0,0,0,0.12)",
                          borderRadius: 1, overflow: "hidden",
                          backgroundImage: `url(${url})`,
                          backgroundSize: "cover", backgroundPosition: "center",
                        }}
                      >
                        <IconButton
                          size="small"
                          onClick={() => setDayImages(i, (d.images || []).filter((_, j) => j !== ii))}
                          sx={{
                            position: "absolute", top: 2, right: 2,
                            bgcolor: "rgba(255,255,255,0.85)",
                            "&:hover": { bgcolor: "rgba(255,255,255,1)" },
                          }}
                        >
                          <DeleteIcon fontSize="small" color="error" />
                        </IconButton>
                      </Box>
                    ))}
                    {(d.images || []).length < MAX_DAY_IMAGES && (
                      <Button
                        component="label"
                        variant="outlined"
                        startIcon={<CloudUploadIcon />}
                        sx={{ width: 130, height: 90 }}
                      >
                        Upload
                        <input
                          hidden
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            e.target.value = "";
                            uploadDayImage(i, f);
                          }}
                        />
                      </Button>
                    )}
                  </Stack>
                  <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                    <TextField
                      size="small"
                      placeholder="…or paste image URL"
                      fullWidth
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          const v = e.target.value.trim();
                          if (!v) return;
                          if ((d.images || []).length >= MAX_DAY_IMAGES) {
                            toast.warn(`Max ${MAX_DAY_IMAGES} images per day`);
                            return;
                          }
                          setDayImages(i, [...(d.images || []), v]);
                          e.target.value = "";
                        }
                      }}
                      helperText="Press Enter to add. Cloudinary or absolute URL."
                    />
                  </Stack>
                </Paper>
              ))}
              <Button startIcon={<AddIcon />} onClick={addDay} variant="outlined">Add Day</Button>
            </Stack>
          )}

          {tab === 2 && (() => {
            const i = 0;
            const opt = form.starOptions?.[0] || emptyStarOption();
            return (
            <Stack spacing={2}>
                <Paper sx={{ p: 2 }} variant="outlined">
                  <Typography variant="caption" color="text.secondary">
                    Add included hotels with name, location, and a photo for the public package page
                  </Typography>
                  {(opt.hotels || []).length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      No hotels added yet.
                    </Typography>
                  ) : null}
                  {(opt.hotels || []).map((h, hi) => (
                      <Paper key={hi} variant="outlined" sx={{ p: 1.5, mt: 1 }}>
                        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            Hotel {hi + 1}
                          </Typography>
                          <IconButton
                            color="error"
                            size="small"
                            onClick={() => removeStarHotel(i, hi)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Stack>

                        <Stack spacing={1.5}>
                          <TextField
                            label="Hotel Name"
                            size="small"
                            fullWidth
                            value={h.hotel}
                            onChange={(e) => updateStarHotel(i, hi, { hotel: e.target.value })}
                          />
                          <TextField
                            label="Location"
                            size="small"
                            fullWidth
                            value={h.location || ""}
                            onChange={(e) => updateStarHotel(i, hi, { location: e.target.value })}
                            placeholder="e.g. Colombo"
                          />
                          <Divider />
                          <Typography variant="caption" color="text.secondary">
                            Hotel photo
                          </Typography>
                          <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap>
                            {(h.imageUrl || h.ImageUrl) ? (
                              <Box
                                sx={{
                                  position: "relative",
                                  width: 160,
                                  height: 100,
                                  borderRadius: 1,
                                  overflow: "hidden",
                                  border: "1px solid rgba(0,0,0,0.12)",
                                  backgroundImage: `url(${h.imageUrl || h.ImageUrl})`,
                                  backgroundSize: "cover",
                                  backgroundPosition: "center",
                                  flexShrink: 0,
                                }}
                              >
                                <IconButton
                                  size="small"
                                  onClick={() => updateStarHotel(i, hi, { imageUrl: "" })}
                                  sx={{
                                    position: "absolute",
                                    top: 4,
                                    right: 4,
                                    bgcolor: "rgba(255,255,255,0.9)",
                                    "&:hover": { bgcolor: "rgba(255,255,255,1)" },
                                  }}
                                >
                                  <DeleteIcon fontSize="small" color="error" />
                                </IconButton>
                              </Box>
                            ) : null}
                            <Button component="label" variant="outlined" startIcon={<CloudUploadIcon />} size="small">
                              {h.imageUrl || h.ImageUrl ? "Replace photo" : "Upload photo"}
                              <input
                                hidden
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const f = e.target.files?.[0];
                                  e.target.value = "";
                                  uploadHotelImage(i, hi, f);
                                }}
                              />
                            </Button>
                          </Stack>
                        </Stack>
                      </Paper>
                  ))}
                  <Button size="small" startIcon={<AddIcon />} onClick={() => addStarHotel(i)} variant="outlined" sx={{ mt: 1 }}>
                    Add hotel
                  </Button>
                </Paper>
            </Stack>
            );
          })()}

          {tab === 3 && (
            <Stack spacing={3}>
              <ListEditor
                label="Inclusions"
                values={form.inclusions}
                onChange={(v) => setForm({ ...form, inclusions: v })}
                placeholder="e.g. Meet & Greet at Airport with Garlands"
              />
              <ListEditor
                label="Exclusions"
                values={form.exclusions}
                onChange={(v) => setForm({ ...form, exclusions: v })}
                placeholder="e.g. All lunches"
              />
            </Stack>
          )}

          {tab === 4 && (
            <Stack spacing={1}>
              <Typography variant="caption" color="text.secondary">
                Entrance ticket / activity fees (per person, USD).
              </Typography>
              {form.entryFees.map((f, i) => (
                <Stack key={i} direction="row" spacing={1}>
                  <TextField label="Site / Activity" size="small" fullWidth
                    value={f.site}
                    onChange={(e) => {
                      const arr = [...form.entryFees];
                      arr[i] = { ...arr[i], site: e.target.value };
                      setForm({ ...form, entryFees: arr });
                    }} />
                  <TextField label="USD" type="number" size="small" sx={{ width: 140 }}
                    value={f.perPersonUsd}
                    onChange={(e) => {
                      const arr = [...form.entryFees];
                      arr[i] = { ...arr[i], perPersonUsd: Number(e.target.value) || 0 };
                      setForm({ ...form, entryFees: arr });
                    }} />
                  <IconButton color="error" onClick={() => setForm({ ...form, entryFees: form.entryFees.filter((_, j) => j !== i) })}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Stack>
              ))}
              <Button startIcon={<AddIcon />} onClick={() => setForm({ ...form, entryFees: [...form.entryFees, emptyEntryFee()] })} variant="outlined" sx={{ alignSelf: "flex-start" }}>
                Add Entry Fee
              </Button>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving} sx={masterCategoryContainedButtonSx}>
            {saving ? "Saving…" : "Save Package"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ───── View ───── */}
      <Dialog open={viewOpen} onClose={() => setViewOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{viewing?.title}</DialogTitle>
        <DialogContent dividers>
          {viewing && (
            <Stack spacing={2}>
              {viewing.coverImageUrl && (
                <Box component="img" src={viewing.coverImageUrl} alt="" sx={{ width: "100%", maxHeight: 320, objectFit: "cover", borderRadius: 1 }} />
              )}
              <Typography variant="body2" color="text.secondary">{viewing.summary}</Typography>
              <Divider />
              <Typography variant="subtitle2">Itinerary</Typography>
              {(viewing.days || []).map((d, i) => (
                <Box key={i}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>Day {d.dayNumber} — {d.title}</Typography>
                  <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }} color="text.secondary">{d.description}</Typography>
                </Box>
              ))}
              <Divider />
              <Typography variant="subtitle2">Included Hotels</Typography>
              {(viewing.starOptions || []).flatMap((o) => o.hotels || []).map((h, i) => (
                <Paper key={i} variant="outlined" sx={{ p: 1.5 }}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    {h.imageUrl || h.ImageUrl ? (
                      <Box
                        component="img"
                        src={h.imageUrl || h.ImageUrl}
                        alt={h.hotel || h.location || "Hotel"}
                        sx={{ width: 120, height: 80, objectFit: "cover", borderRadius: 1, flexShrink: 0 }}
                      />
                    ) : null}
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {h.location ? `${h.location}: ` : ""}{h.hotel}
                        {h.categoryLabel ? ` (${h.categoryLabel})` : ""}
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* ───── Delete confirm ───── */}
      <Dialog open={deleteOpen} onClose={() => !deleting && setDeleteOpen(false)}>
        <DialogTitle>Delete</DialogTitle>
        <DialogContent>Are you sure you want to delete &quot;{toDelete?.title}&quot;?</DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)} disabled={deleting}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDelete} disabled={deleting} sx={masterCategoryContainedButtonSx}>
            {deleting ? "Deleting…" : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      <ToastContainer />
    </>
  );
}

/* ────────── Sub-component: list editor for inclusions/exclusions ────────── */
function ListEditor({ label, values, onChange, placeholder }) {
  const [input, setInput] = useState("");
  const add = () => {
    const v = input.trim();
    if (!v) return;
    onChange([...(values || []), v]);
    setInput("");
  };
  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>{label}</Typography>
      <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
        <TextField
          size="small" fullWidth
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder={placeholder}
        />
        <Button variant="outlined" startIcon={<AddIcon />} onClick={add}>Add</Button>
      </Stack>
      <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
        {(values || []).map((v, i) => (
          <Chip
            key={i}
            label={v}
            onDelete={() => onChange(values.filter((_, j) => j !== i))}
            sx={{ mb: 0.5 }}
          />
        ))}
        {(!values || values.length === 0) && (
          <Typography variant="caption" color="text.secondary">No items yet.</Typography>
        )}
      </Stack>
    </Box>
  );
}
