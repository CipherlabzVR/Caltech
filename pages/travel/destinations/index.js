import React, { useEffect, useState } from "react";
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
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Tabs,
  Tab,
  Divider,
  Stack,
  Alert,
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
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import VisibilityIcon from "@mui/icons-material/Visibility";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";

const MAX_IMAGES = 10;

const FIELD_LIMITS = {
  name: 200,
  region: 100,
  bestTime: 200,
  shortDescription: 500,
  overviewQuote: 500,
  highlight: 200,
};

const roundTo = (value, precision) => {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
};

/** Parse optional numeric text; empty input → null. */
const parseOptionalNumber = (raw) => {
  if (raw === "" || raw == null) return { value: null };
  const text = String(raw).trim().replace(",", ".");
  if (text === "" || text === "-" || text === "." || text === "-.") return { value: null };
  const num = Number(text);
  if (!Number.isFinite(num)) return { error: "Invalid number." };
  return { value: num };
};

const parseOptionalMoney = (raw) => {
  const parsed = parseOptionalNumber(raw);
  if (parsed.error) return { error: "Entry fee must be a valid number." };
  if (parsed.value == null) return { value: null };
  const rounded = roundTo(parsed.value, 2);
  if (rounded < 0) return { error: "Entry fee cannot be negative." };
  return { value: rounded };
};

const emptyForm = {
  name: "",
  region: "",
  bestTime: "",
  shortDescription: "",
  overviewQuote: "",
  details: "",
  highlights: [],
  displayOrder: 0,
  isActive: true,
  entryFee: "",
};

const isOk = (res) => {
  const code = res?.statusCode ?? res?.StatusCode;
  return code === 200 || code === 1 || code === "SUCCESS" || code === "200";
};

const parseApiMessage = (data, fallback) => {
  if (!data) return fallback;
  const message = data.message ?? data.Message;
  if (typeof message === "string" && message.trim()) return message.trim();
  if (data.errors && typeof data.errors === "object") {
    const msgs = Object.values(data.errors).flat().filter(Boolean);
    if (msgs.length) return msgs.join(" ");
  }
  if (typeof data.title === "string" && data.title.trim()) return data.title.trim();
  return fallback;
};

const authJsonHeaders = () => ({
  Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("token") : ""}`,
  "Content-Type": "application/json",
});

const authMultipartHeaders = () => ({
  Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("token") : ""}`,
});

export default function TravelDestinations() {
  const cId = typeof window !== "undefined" ? sessionStorage.getItem("category") : null;
  const { navigate, create, update, remove } = IsPermissionEnabled(cId);

  // List state
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [activeFilter, setActiveFilter] = useState("all");

  // Edit/Create dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [tab, setTab] = useState(0);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [highlightInput, setHighlightInput] = useState("");
  const [saving, setSaving] = useState(false);

  // Slideshow images for current destination being edited
  const [images, setImages] = useState([]);
  const [imagesLoading, setImagesLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageMeta, setImageMeta] = useState({ title: "", caption: "", isCover: false });
  const [editingImage, setEditingImage] = useState(null);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);

  // View detail dialog
  const [viewOpen, setViewOpen] = useState(false);
  const [viewing, setViewing] = useState(null);
  const [viewSlide, setViewSlide] = useState(0);

  // Delete confirm
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // ---------- Data fetch ----------

  const fetchAll = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/TravelDestinations/GetAllDestinations`, {
        method: "GET",
        headers: authJsonHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch destinations");
      const data = await response.json();
      setDestinations(Array.isArray(data?.result) ? data.result : []);
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to fetch destinations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // Client-side filtering / pagination
  const filtered = destinations.filter((d) => {
    if (activeFilter === "active" && !d.isActive) return false;
    if (activeFilter === "inactive" && d.isActive) return false;
    if (!searchTerm.trim()) return true;
    const q = searchTerm.trim().toLowerCase();
    return (
      (d.name || "").toLowerCase().includes(q) ||
      (d.region || "").toLowerCase().includes(q) ||
      (d.shortDescription || "").toLowerCase().includes(q)
    );
  });
  const pageRows = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  const totalCount = filtered.length;

  // ---------- Create / Edit ----------

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...emptyForm, displayOrder: destinations.length });
    setImages([]);
    setHighlightInput("");
    setTab(0);
    setDialogOpen(true);
  };

  const openEdit = async (row) => {
    setEditingId(row.id);
    setForm({
      name: row.name || "",
      region: row.region || "",
      bestTime: row.bestTime || "",
      shortDescription: row.shortDescription || "",
      overviewQuote: row.overviewQuote || "",
      details: row.details || "",
      highlights: Array.isArray(row.highlights) ? [...row.highlights] : [],
      displayOrder: row.displayOrder ?? 0,
      isActive: row.isActive ?? true,
      entryFee: row.entryFee != null && row.entryFee !== "" ? String(row.entryFee) : "",
    });
    setImages(Array.isArray(row.images) ? [...row.images].sort((a, b) => a.displayOrder - b.displayOrder) : []);
    setHighlightInput("");
    setTab(0);
    setDialogOpen(true);
  };

  const refreshOne = async (id) => {
    try {
      const response = await fetch(`${BASE_URL}/TravelDestinations/GetDestinationById?id=${id}`, {
        method: "GET",
        headers: authJsonHeaders(),
      });
      const data = await response.json();
      if (isOk(data) && data?.result) {
        const fresh = data.result;
        setImages(Array.isArray(fresh.images) ? [...fresh.images].sort((a, b) => a.displayOrder - b.displayOrder) : []);
        setDestinations((list) => list.map((d) => (d.id === id ? fresh : d)));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const addHighlight = () => {
    const v = highlightInput.trim();
    if (!v) return;
    if (v.length > FIELD_LIMITS.highlight) {
      toast.error(`Each highlight must be ${FIELD_LIMITS.highlight} characters or fewer.`);
      return;
    }
    if (form.highlights.includes(v)) {
      setHighlightInput("");
      return;
    }
    setForm((f) => ({ ...f, highlights: [...f.highlights, v] }));
    setHighlightInput("");
  };

  const removeHighlight = (val) => {
    setForm((f) => ({ ...f, highlights: f.highlights.filter((x) => x !== val) }));
  };

  const validateForm = () => {
    if (!form.name.trim()) return "Name is required.";
    if (!form.region.trim()) return "Region is required.";
    if (!form.bestTime.trim()) return "Best time is required.";
    if (!form.shortDescription.trim()) return "Short description is required.";
    if (!form.details.trim()) return "Details are required.";

    if (form.name.trim().length > FIELD_LIMITS.name)
      return `Name must be ${FIELD_LIMITS.name} characters or fewer.`;
    if (form.region.trim().length > FIELD_LIMITS.region)
      return `Region must be ${FIELD_LIMITS.region} characters or fewer.`;
    if (form.bestTime.trim().length > FIELD_LIMITS.bestTime)
      return `Best time must be ${FIELD_LIMITS.bestTime} characters or fewer.`;
    if (form.shortDescription.trim().length > FIELD_LIMITS.shortDescription)
      return `Short description must be ${FIELD_LIMITS.shortDescription} characters or fewer.`;
    if (form.overviewQuote.trim().length > FIELD_LIMITS.overviewQuote)
      return `Overview quote must be ${FIELD_LIMITS.overviewQuote} characters or fewer.`;

    const entryFeeParsed = parseOptionalMoney(form.entryFee);
    if (entryFeeParsed.error) return entryFeeParsed.error;

    return null;
  };

  const handleSave = async () => {
    const err = validateForm();
    if (err) {
      toast.error(err);
      return;
    }
    setSaving(true);
    try {
      const entryFeeParsed = parseOptionalMoney(form.entryFee);
      const existing = editingId ? destinations.find((d) => d.id === editingId) : null;

      const url = editingId
        ? `${BASE_URL}/TravelDestinations/UpdateDestination`
        : `${BASE_URL}/TravelDestinations/CreateDestination`;
      const body = {
        ...(editingId ? { id: editingId } : {}),
        name: form.name.trim(),
        region: form.region.trim(),
        bestTime: form.bestTime.trim(),
        shortDescription: form.shortDescription.trim(),
        overviewQuote: (form.overviewQuote ?? "").trim() || null,
        details: form.details.trim(),
        highlights: form.highlights,
        coverImageUrl: existing?.coverImageUrl?.trim() || null,
        displayOrder: Number(form.displayOrder) || 0,
        isActive: form.isActive,
        entryFee: entryFeeParsed.value,
        latitude: existing?.latitude ?? null,
        longitude: existing?.longitude ?? null,
      };
      const response = await fetch(url, {
        method: "POST",
        headers: authJsonHeaders(),
        body: JSON.stringify(body),
      });
      const data = await response.json().catch(() => ({}));
      if (!isOk(data)) throw new Error(parseApiMessage(data, "Failed to save"));
      toast.success(editingId ? "Destination updated" : "Destination created");

      // If created, capture the new id and stay open on the Images tab
      if (!editingId) {
        const newId = data?.result?.id ?? data?.result?.Id;
        if (newId) {
          setEditingId(newId);
          setTab(1);
        }
      }
      await fetchAll();
    } catch (e) {
      toast.error(e.message || "Failed to save destination");
    } finally {
      setSaving(false);
    }
  };

  // ---------- Image (slideshow) management ----------

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!editingId) {
      toast.error("Save the destination first, then upload images.");
      e.target.value = "";
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      e.target.value = "";
      return;
    }
    if (images.length >= MAX_IMAGES) {
      toast.error(`Maximum ${MAX_IMAGES} images per destination.`);
      e.target.value = "";
      return;
    }
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("File", file);
      formData.append("DestinationId", String(editingId));
      formData.append("Title", imageMeta.title || "");
      formData.append("Caption", imageMeta.caption || "");
      formData.append("DisplayOrder", String(images.length));
      formData.append("IsCover", String(imageMeta.isCover || images.length === 0));

      const response = await fetch(`${BASE_URL}/TravelDestinations/UploadDestinationImage`, {
        method: "POST",
        headers: authMultipartHeaders(),
        body: formData,
      });
      const data = await response.json();
      if (!isOk(data)) throw new Error(parseApiMessage(data, "Upload failed"));
      toast.success("Image uploaded");
      setImageMeta({ title: "", caption: "", isCover: false });
      await refreshOne(editingId);
    } catch (err) {
      toast.error(err.message || "Failed to upload image");
    } finally {
      setUploadingImage(false);
      e.target.value = "";
    }
  };

  const openImageEdit = (img) => {
    setEditingImage(img);
    setImageDialogOpen(true);
  };

  const handleImageSave = async () => {
    if (!editingImage) return;
    try {
      const body = {
        id: editingImage.id,
        title: editingImage.title || null,
        caption: editingImage.caption || null,
        displayOrder: Number(editingImage.displayOrder) || 0,
        isCover: !!editingImage.isCover,
      };
      const response = await fetch(`${BASE_URL}/TravelDestinations/UpdateDestinationImage`, {
        method: "POST",
        headers: authJsonHeaders(),
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!isOk(data)) throw new Error(parseApiMessage(data, "Failed to update image"));
      toast.success("Image updated");
      setImageDialogOpen(false);
      setEditingImage(null);
      await refreshOne(editingId);
    } catch (err) {
      toast.error(err.message || "Failed to update image");
    }
  };

  const handleImageDelete = async (img) => {
    if (!window.confirm("Delete this image from the slideshow?")) return;
    try {
      const response = await fetch(
        `${BASE_URL}/TravelDestinations/DeleteDestinationImage?imageId=${img.id}`,
        { method: "POST", headers: authJsonHeaders() }
      );
      const data = await response.json();
      if (!isOk(data)) throw new Error(parseApiMessage(data, "Failed to delete image"));
      toast.success("Image deleted");
      await refreshOne(editingId);
    } catch (err) {
      toast.error(err.message || "Failed to delete image");
    }
  };

  const moveImage = async (idx, dir) => {
    const next = [...images];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    setImages(next);
    try {
      const body = {
        destinationId: editingId,
        imageIdsInOrder: next.map((i) => i.id),
      };
      const response = await fetch(`${BASE_URL}/TravelDestinations/ReorderDestinationImages`, {
        method: "POST",
        headers: authJsonHeaders(),
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!isOk(data)) throw new Error(parseApiMessage(data, "Failed to reorder"));
      await refreshOne(editingId);
    } catch (err) {
      toast.error(err.message || "Failed to reorder");
      await refreshOne(editingId);
    }
  };

  const setAsCover = async (img) => {
    try {
      const body = {
        id: img.id,
        title: img.title || null,
        caption: img.caption || null,
        displayOrder: Number(img.displayOrder) || 0,
        isCover: true,
      };
      const response = await fetch(`${BASE_URL}/TravelDestinations/UpdateDestinationImage`, {
        method: "POST",
        headers: authJsonHeaders(),
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!isOk(data)) throw new Error(parseApiMessage(data, "Failed to set cover"));
      toast.success("Cover image updated");
      await refreshOne(editingId);
    } catch (err) {
      toast.error(err.message || "Failed to set cover");
    }
  };

  // ---------- Delete destination ----------

  const openDelete = (row) => {
    setToDelete(row);
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      const response = await fetch(
        `${BASE_URL}/TravelDestinations/DeleteDestination?id=${toDelete.id}`,
        { method: "POST", headers: authJsonHeaders() }
      );
      const data = await response.json();
      if (!isOk(data)) throw new Error(parseApiMessage(data, "Failed to delete"));
      toast.success("Destination deleted");
      setDeleteOpen(false);
      setToDelete(null);
      fetchAll();
    } catch (err) {
      toast.error(err.message || "Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  // ---------- View popup (preview) ----------

  const openView = (row) => {
    setViewing(row);
    setViewSlide(0);
    setViewOpen(true);
  };

  const viewImages = viewing?.images?.length
    ? [...viewing.images].sort((a, b) => a.displayOrder - b.displayOrder)
    : [];

  const cycleSlide = (dir) => {
    if (!viewImages.length) return;
    setViewSlide((s) => (s + dir + viewImages.length) % viewImages.length);
  };

  if (!navigate) return <AccessDenied />;

  return (
    <>
      <div className={styles.pageTitle}>
        <h1>Destinations</h1>
        <ul>
          <li>
            <Link href="/">Dashboard</Link>
          </li>
          <li>Travel</li>
          <li>
            <Link href="/travel/destinations/">Destinations</Link>
          </li>
        </ul>
      </div>

      <Grid
        container
        rowSpacing={1}
        columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}
      >
        <Grid item xs={12} lg={4} order={{ xs: 2, lg: 1 }}>
          <Search className="search-form">
            <StyledInputBase
              placeholder="Search here.."
              inputProps={{ "aria-label": "search" }}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(0);
              }}
            />
          </Search>
        </Grid>
        <Grid
          item
          xs={12}
          lg={8}
          mb={1}
          display="flex"
          justifyContent="end"
          alignItems="center"
          gap={1}
          order={{ xs: 1, lg: 2 }}
          flexWrap="wrap"
        >
          <FormControl size="small" sx={{ width: 160 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={activeFilter}
              label="Status"
              onChange={(e) => {
                setActiveFilter(e.target.value);
                setPage(0);
              }}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </Select>
          </FormControl>
          {create && (
            <Button variant="outlined" onClick={openCreate}>
              + add new
            </Button>
          )}
        </Grid>
        <Grid item xs={12} order={{ xs: 3, lg: 3 }}>

          <TableContainer component={Paper}>
            <Table className="dark-table">
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Order</TableCell>
                  <TableCell>Cover</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Region</TableCell>
                  <TableCell>Best Time</TableCell>
                  <TableCell>Images</TableCell>
                  <TableCell>Active</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      <Typography>Loading...</Typography>
                    </TableCell>
                  </TableRow>
                ) : pageRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      <Typography color="textSecondary">
                        No destinations yet. Click &quot;Add Destination&quot; to create one.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  pageRows.map((row, idx) => (
                    <TableRow key={row.id} hover>
                      <TableCell>{page * rowsPerPage + idx + 1}</TableCell>
                      <TableCell>{row.displayOrder}</TableCell>
                      <TableCell>
                        {row.coverImageUrl ? (
                          <img
                            src={row.coverImageUrl}
                            alt=""
                            style={{ width: 56, height: 40, objectFit: "cover", borderRadius: 4 }}
                          />
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>{row.name || "-"}</TableCell>
                      <TableCell>{row.region || "-"}</TableCell>
                      <TableCell>{row.bestTime || "-"}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={`${row.images?.length || 0} / ${MAX_IMAGES}`}
                          color={row.images?.length ? "primary" : "default"}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        {row.isActive ? (
                          <span className="successBadge">Active</span>
                        ) : (
                          <span className="dangerBadge">Inactive</span>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Preview">
                          <IconButton size="small" onClick={() => openView(row)}>
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {update && (
                          <Tooltip title="Edit">
                            <IconButton size="small" onClick={() => openEdit(row)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {remove && (
                          <Tooltip title="Delete">
                            <IconButton size="small" color="error" onClick={() => openDelete(row)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <Grid container justifyContent="space-between" alignItems="center" mt={2} mb={2} px={2}>
              <Pagination
                count={Math.max(1, Math.ceil(totalCount / rowsPerPage))}
                page={page + 1}
                onChange={(_, value) => setPage(value - 1)}
                color="primary"
                shape="rounded"
              />
              <FormControl size="small" sx={{ width: 110 }}>
                <InputLabel>Page Size</InputLabel>
                <Select
                  value={rowsPerPage}
                  label="Page Size"
                  onChange={(e) => {
                    setRowsPerPage(parseInt(e.target.value, 10));
                    setPage(0);
                  }}
                >
                  <MenuItem value={5}>5</MenuItem>
                  <MenuItem value={10}>10</MenuItem>
                  <MenuItem value={25}>25</MenuItem>
                  <MenuItem value={50}>50</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </TableContainer>
        </Grid>
      </Grid>

      {/* ===== Create / Edit Dialog ===== */}
      <Dialog
        open={dialogOpen}
        onClose={() => !saving && setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingId ? "Edit Destination" : "Add Destination"}
          {editingId && (
            <Typography variant="caption" color="textSecondary" sx={{ ml: 2 }}>
              ID: {editingId}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent dividers>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
            <Tab label="Details" />
            <Tab label={`Images / Slideshow (${images.length}/${MAX_IMAGES})`} disabled={!editingId} />
          </Tabs>

          {tab === 0 && (
            <Box display="flex" flexDirection="column" gap={2}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Name *"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    fullWidth
                    placeholder="e.g. Ella"
                    inputProps={{ maxLength: FIELD_LIMITS.name }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Region *"
                    value={form.region}
                    onChange={(e) => setForm((f) => ({ ...f, region: e.target.value }))}
                    fullWidth
                    placeholder="e.g. Hill Country"
                    inputProps={{ maxLength: FIELD_LIMITS.region }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Best Time to Visit *"
                    value={form.bestTime}
                    onChange={(e) => setForm((f) => ({ ...f, bestTime: e.target.value }))}
                    fullWidth
                    placeholder="e.g. December to March"
                    inputProps={{ maxLength: FIELD_LIMITS.bestTime }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Display Order"
                    type="number"
                    value={form.displayOrder}
                    onChange={(e) => setForm((f) => ({ ...f, displayOrder: e.target.value }))}
                    fullWidth
                    inputProps={{ min: 0 }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Short Description (card overview) *"
                    value={form.shortDescription}
                    onChange={(e) => setForm((f) => ({ ...f, shortDescription: e.target.value }))}
                    fullWidth
                    multiline
                    rows={2}
                    helperText={`Shown on the listing card. Max ${FIELD_LIMITS.shortDescription} characters.`}
                    inputProps={{ maxLength: FIELD_LIMITS.shortDescription }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Overview Quote (optional)"
                    value={form.overviewQuote}
                    onChange={(e) => setForm((f) => ({ ...f, overviewQuote: e.target.value }))}
                    fullWidth
                    multiline
                    rows={2}
                    helperText={`Editorial quote shown in the overview panel. Max ${FIELD_LIMITS.overviewQuote} characters.`}
                    inputProps={{ maxLength: FIELD_LIMITS.overviewQuote }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Details (popup body) *"
                    value={form.details}
                    onChange={(e) => setForm((f) => ({ ...f, details: e.target.value }))}
                    fullWidth
                    multiline
                    rows={5}
                    helperText="Long-form description shown in the destination popup."
                  />
                </Grid>

                {/* Highlights */}
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Highlights
                  </Typography>
                  <Box display="flex" gap={1} mb={1}>
                    <TextField
                      size="small"
                      value={highlightInput}
                      onChange={(e) => setHighlightInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addHighlight();
                        }
                      }}
                      placeholder="Type a highlight and press Enter"
                      fullWidth
                      inputProps={{ maxLength: FIELD_LIMITS.highlight }}
                    />
                    <Button variant="outlined" onClick={addHighlight}>
                      Add
                    </Button>
                  </Box>
                  <Box display="flex" gap={1} flexWrap="wrap">
                    {form.highlights.length === 0 ? (
                      <Typography variant="caption" color="textSecondary">
                        No highlights added.
                      </Typography>
                    ) : (
                      form.highlights.map((h) => (
                        <Chip key={h} label={h} onDelete={() => removeHighlight(h)} />
                      ))
                    )}
                  </Box>
                </Grid>

                {/* Custom plan calculator: per-person entry fee */}
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Entry / Ticket Fee (per person)"
                    type="text"
                    inputMode="decimal"
                    value={form.entryFee}
                    onChange={(e) => setForm((f) => ({ ...f, entryFee: e.target.value }))}
                    fullWidth
                    size="small"
                    helperText="Added to the custom plan total. Leave empty if no fee."
                  />
                </Grid>

                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={form.isActive}
                        onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                      />
                    }
                    label="Active (show on website)"
                  />
                </Grid>
              </Grid>
            </Box>
          )}

          {tab === 1 && (
            <Box>
              {!editingId ? (
                <Alert severity="info">Save the destination first to start uploading images.</Alert>
              ) : (
                <>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    Upload up to {MAX_IMAGES} images for the in-popup slideshow. Each image can have its own
                    Title and Caption. Mark one image as the cover used on the listing card.
                  </Alert>

                  <Stack spacing={2} mb={3} direction={{ xs: "column", md: "row" }}>
                    <TextField
                      label="Slide title (optional)"
                      size="small"
                      value={imageMeta.title}
                      onChange={(e) => setImageMeta((m) => ({ ...m, title: e.target.value }))}
                      fullWidth
                    />
                    <TextField
                      label="Slide caption (optional)"
                      size="small"
                      value={imageMeta.caption}
                      onChange={(e) => setImageMeta((m) => ({ ...m, caption: e.target.value }))}
                      fullWidth
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={imageMeta.isCover}
                          onChange={(e) => setImageMeta((m) => ({ ...m, isCover: e.target.checked }))}
                        />
                      }
                      label="Cover"
                    />
                    <Button
                      variant="contained"
                      component="label"
                      startIcon={<CloudUploadIcon />}
                      disabled={uploadingImage || images.length >= MAX_IMAGES}
                      sx={{ ...masterCategoryContainedButtonSx, minWidth: 180 }}
                    >
                      {uploadingImage ? "Uploading..." : "Upload Image"}
                      <input type="file" hidden accept="image/*" onChange={handleImageUpload} />
                    </Button>
                  </Stack>

                  <Divider sx={{ mb: 2 }} />

                  {imagesLoading ? (
                    <Typography>Loading images...</Typography>
                  ) : images.length === 0 ? (
                    <Typography color="textSecondary">No images uploaded yet.</Typography>
                  ) : (
                    <Grid container spacing={2}>
                      {images.map((img, idx) => (
                        <Grid item xs={12} sm={6} md={4} key={img.id}>
                          <Paper variant="outlined" sx={{ p: 1 }}>
                            <Box
                              sx={{
                                position: "relative",
                                width: "100%",
                                pt: "60%",
                                background: "#000",
                                borderRadius: 1,
                                overflow: "hidden",
                              }}
                            >
                              <img
                                src={img.imageUrl}
                                alt={img.title || ""}
                                style={{
                                  position: "absolute",
                                  inset: 0,
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover",
                                }}
                              />
                              {img.isCover && (
                                <Chip
                                  label="Cover"
                                  size="small"
                                  color="warning"
                                  icon={<StarIcon />}
                                  sx={{ position: "absolute", top: 6, left: 6 }}
                                />
                              )}
                              <Chip
                                label={`#${idx + 1}`}
                                size="small"
                                sx={{ position: "absolute", top: 6, right: 6 }}
                              />
                            </Box>
                            <Box mt={1}>
                              <Typography variant="subtitle2" noWrap>
                                {img.title || <em style={{ opacity: 0.6 }}>(no title)</em>}
                              </Typography>
                              <Typography variant="caption" color="textSecondary" noWrap title={img.caption}>
                                {img.caption || "(no caption)"}
                              </Typography>
                            </Box>
                            <Box display="flex" gap={0.5} mt={1} flexWrap="wrap">
                              <Tooltip title="Move up">
                                <span>
                                  <IconButton
                                    size="small"
                                    disabled={idx === 0}
                                    onClick={() => moveImage(idx, -1)}
                                  >
                                    <ArrowUpwardIcon fontSize="small" />
                                  </IconButton>
                                </span>
                              </Tooltip>
                              <Tooltip title="Move down">
                                <span>
                                  <IconButton
                                    size="small"
                                    disabled={idx === images.length - 1}
                                    onClick={() => moveImage(idx, 1)}
                                  >
                                    <ArrowDownwardIcon fontSize="small" />
                                  </IconButton>
                                </span>
                              </Tooltip>
                              <Tooltip title={img.isCover ? "Cover" : "Set as cover"}>
                                <IconButton
                                  size="small"
                                  color={img.isCover ? "warning" : "default"}
                                  onClick={() => !img.isCover && setAsCover(img)}
                                >
                                  {img.isCover ? <StarIcon fontSize="small" /> : <StarBorderIcon fontSize="small" />}
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Edit caption / title">
                                <IconButton size="small" onClick={() => openImageEdit(img)}>
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleImageDelete(img)}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </Paper>
                        </Grid>
                      ))}
                    </Grid>
                  )}
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={saving}>
            Close
          </Button>
          {tab === 0 && (
            <Button variant="contained" onClick={handleSave} disabled={saving} sx={masterCategoryContainedButtonSx}>
              {saving ? "Saving..." : editingId ? "Save Changes" : "Save & Continue"}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* ===== Edit single image dialog ===== */}
      <Dialog
        open={imageDialogOpen}
        onClose={() => setImageDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Slide</DialogTitle>
        <DialogContent dividers>
          {editingImage && (
            <Box display="flex" flexDirection="column" gap={2} pt={1}>
              <img
                src={editingImage.imageUrl}
                alt=""
                style={{ width: "100%", maxHeight: 240, objectFit: "cover", borderRadius: 4 }}
              />
              <TextField
                label="Title"
                value={editingImage.title || ""}
                onChange={(e) =>
                  setEditingImage((s) => ({ ...s, title: e.target.value }))
                }
                fullWidth
              />
              <TextField
                label="Caption"
                value={editingImage.caption || ""}
                onChange={(e) =>
                  setEditingImage((s) => ({ ...s, caption: e.target.value }))
                }
                fullWidth
                multiline
                rows={3}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={!!editingImage.isCover}
                    onChange={(e) =>
                      setEditingImage((s) => ({ ...s, isCover: e.target.checked }))
                    }
                  />
                }
                label="Use as cover"
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImageDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleImageSave} sx={masterCategoryContainedButtonSx}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* ===== Preview / View dialog (mimics website popup) ===== */}
      <Dialog open={viewOpen} onClose={() => setViewOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {viewing?.name}{" "}
          <Typography component="span" variant="caption" color="textSecondary" sx={{ ml: 1 }}>
            {viewing?.region}
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          {viewing && (
            <Box display="flex" flexDirection="column" gap={2}>
              {/* Slideshow preview */}
              {viewImages.length > 0 ? (
                <Box>
                  <Box
                    sx={{
                      position: "relative",
                      width: "100%",
                      pt: "50%",
                      background: "#000",
                      borderRadius: 2,
                      overflow: "hidden",
                    }}
                  >
                    <img
                      src={viewImages[viewSlide]?.imageUrl}
                      alt={viewImages[viewSlide]?.title || ""}
                      style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                    <Box
                      sx={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        p: 2,
                        background: "linear-gradient(to top, rgba(0,0,0,0.75), rgba(0,0,0,0))",
                        color: "#fff",
                      }}
                    >
                      {viewImages[viewSlide]?.title && (
                        <Typography variant="h6">{viewImages[viewSlide].title}</Typography>
                      )}
                      {viewImages[viewSlide]?.caption && (
                        <Typography variant="body2">{viewImages[viewSlide].caption}</Typography>
                      )}
                    </Box>
                    {viewImages.length > 1 && (
                      <>
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => cycleSlide(-1)}
                          sx={{
                            ...masterCategoryContainedButtonSx,
                            position: "absolute",
                            top: "50%",
                            left: 8,
                            transform: "translateY(-50%)",
                            minWidth: 36,
                          }}
                        >
                          ‹
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => cycleSlide(1)}
                          sx={{
                            ...masterCategoryContainedButtonSx,
                            position: "absolute",
                            top: "50%",
                            right: 8,
                            transform: "translateY(-50%)",
                            minWidth: 36,
                          }}
                        >
                          ›
                        </Button>
                      </>
                    )}
                  </Box>
                  <Box display="flex" gap={1} mt={1} flexWrap="wrap">
                    {viewImages.map((img, i) => (
                      <Box
                        key={img.id}
                        onClick={() => setViewSlide(i)}
                        sx={{
                          width: 64,
                          height: 44,
                          borderRadius: 1,
                          overflow: "hidden",
                          cursor: "pointer",
                          border: i === viewSlide ? "2px solid #1976d2" : "2px solid transparent",
                        }}
                      >
                        <img
                          src={img.imageUrl}
                          alt=""
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      </Box>
                    ))}
                  </Box>
                </Box>
              ) : viewing.coverImageUrl ? (
                <img
                  src={viewing.coverImageUrl}
                  alt=""
                  style={{ width: "100%", maxHeight: 320, objectFit: "cover", borderRadius: 8 }}
                />
              ) : null}

              <Divider />

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="overline" color="textSecondary">
                    Best Time to Visit
                  </Typography>
                  <Typography>{viewing.bestTime || "-"}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="overline" color="textSecondary">
                    Status
                  </Typography>
                  <Box>
                    <Chip
                      label={viewing.isActive ? "Active" : "Inactive"}
                      color={viewing.isActive ? "success" : "default"}
                      size="small"
                    />
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="overline" color="textSecondary">
                    Overview
                  </Typography>
                  <Typography>
                    {viewing.overviewQuote || viewing.shortDescription || "-"}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="overline" color="textSecondary">
                    Details
                  </Typography>
                  <Typography sx={{ whiteSpace: "pre-wrap" }}>
                    {viewing.details || "-"}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="overline" color="textSecondary">
                    Highlights
                  </Typography>
                  <Box display="flex" gap={1} flexWrap="wrap" mt={0.5}>
                    {(viewing.highlights || []).length === 0 ? (
                      <Typography variant="body2" color="textSecondary">
                        -
                      </Typography>
                    ) : (
                      (viewing.highlights || []).map((h) => (
                        <Chip key={h} label={h} size="small" />
                      ))
                    )}
                  </Box>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* ===== Delete confirm ===== */}
      <Dialog open={deleteOpen} onClose={() => !deleting && setDeleteOpen(false)}>
        <DialogTitle>Delete Destination</DialogTitle>
        <DialogContent>
          Are you sure you want to delete &quot;{toDelete?.name}&quot;? This will also remove all its
          slideshow images.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)} disabled={deleting}>
            Cancel
          </Button>
          <Button color="error" variant="contained" onClick={handleDelete} disabled={deleting} sx={masterCategoryContainedButtonSx}>
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      <ToastContainer />
    </>
  );
}
