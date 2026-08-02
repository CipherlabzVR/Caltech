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
  Stack,
  Divider,
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
import HotelIcon from "@mui/icons-material/Hotel";

const isOk = (res) => res?.statusCode === 200 || res?.statusCode === 1;

const authJsonHeaders = () => ({
  Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("token") : ""}`,
  "Content-Type": "application/json",
});

const EMPTY_FORM = {
  name: "",
  travelDestinationId: "",
  travelHotelCategoryId: "",
  address: "",
  description: "",
  displayOrder: 0,
  isActive: true,
  rooms: [],
};

/** New (unsaved) row in the Rooms sub-grid. */
const newRoomRow = () => ({ id: null, travelRoomTypeId: "", pricePerNight: 0, isActive: true, seasonPrices: [] });

export default function TravelHotels() {
  const cId = typeof window !== "undefined" ? sessionStorage.getItem("category") : null;
  const { navigate, create, update, remove } = IsPermissionEnabled(cId);

  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(false);

  const [destinations, setDestinations] = useState([]);
  const [categories, setCategories] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);

  const [filterDestination, setFilterDestination] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingSnapshot, setEditingSnapshot] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  /* ─── Loaders ─────────────────────────────────────────────────────── */

  const fetchHotels = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${BASE_URL}/TravelHotels/GetAllHotels`, {
        headers: authJsonHeaders(),
      });
      const data = await r.json();
      setHotels(Array.isArray(data?.result) ? data.result : []);
    } catch (err) {
      toast.error(err.message || "Failed to load hotels");
    } finally {
      setLoading(false);
    }
  };

  const fetchMasters = async () => {
    try {
      const [d, c, rt] = await Promise.all([
        fetch(`${BASE_URL}/TravelDestinations/GetAllDestinations`, { headers: authJsonHeaders() }).then((x) => x.json()),
        fetch(`${BASE_URL}/TravelHotelCategories/GetAllHotelCategories`, { headers: authJsonHeaders() }).then((x) => x.json()),
        fetch(`${BASE_URL}/TravelRoomTypes/GetAllRoomTypes`, { headers: authJsonHeaders() }).then((x) => x.json()),
      ]);
      setDestinations(Array.isArray(d?.result) ? d.result : []);
      setCategories(Array.isArray(c?.result) ? c.result : []);
      setRoomTypes(Array.isArray(rt?.result) ? rt.result : []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!navigate) return;
    fetchHotels();
    fetchMasters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  /* ─── Dialog ──────────────────────────────────────────────────────── */

  const openCreate = () => {
    setEditingId(null);
    setEditingSnapshot(null);
    setForm({ ...EMPTY_FORM, rooms: [] });
    setDialogOpen(true);
  };

  const openEdit = (row) => {
    setEditingId(row.id);
    setEditingSnapshot({
      imageUrl: row.imageUrl || null,
      latitude: row.latitude ?? null,
      longitude: row.longitude ?? null,
    });
    setForm({
      name: row.name || "",
      travelDestinationId: row.travelDestinationId || "",
      travelHotelCategoryId: row.travelHotelCategoryId || "",
      address: row.address || "",
      description: row.description || "",
      displayOrder: row.displayOrder || 0,
      isActive: row.isActive !== false,
      rooms: (row.rooms || []).map((r) => ({
        id: r.id,
        travelRoomTypeId: r.travelRoomTypeId,
        pricePerNight: r.pricePerNight,
        isActive: r.isActive !== false,
        seasonPrices: (r.seasonPrices || []).map((s) => ({
          id: s.id,
          startMonth: s.startMonth ?? 1,
          startDay: s.startDay ?? 1,
          endMonth: s.endMonth ?? 12,
          endDay: s.endDay ?? 31,
          pricePerNight: s.pricePerNight ?? 0,
          label: s.label || "",
          priority: s.priority ?? 0,
          isActive: s.isActive !== false,
        })),
      })),
    });
    setDialogOpen(true);
  };

  const updateRoom = (idx, patch) => {
    setForm((prev) => {
      const rooms = [...prev.rooms];
      rooms[idx] = { ...rooms[idx], ...patch };
      return { ...prev, rooms };
    });
  };

  const addRoom = () => setForm((prev) => ({ ...prev, rooms: [...prev.rooms, newRoomRow()] }));
  const removeRoom = (idx) => setForm((prev) => ({ ...prev, rooms: prev.rooms.filter((_, i) => i !== idx) }));

  const addSeason = (roomIdx) => {
    setForm((prev) => {
      const rooms = [...prev.rooms];
      const row = rooms[roomIdx];
      if (!row) return prev;
      rooms[roomIdx] = { ...row, seasonPrices: [...(row.seasonPrices || []), newSeasonRow()] };
      return { ...prev, rooms };
    });
  };

  const updateSeason = (roomIdx, seasonIdx, patch) => {
    setForm((prev) => {
      const rooms = [...prev.rooms];
      const row = rooms[roomIdx];
      if (!row) return prev;
      const seasonPrices = [...(row.seasonPrices || [])];
      seasonPrices[seasonIdx] = { ...seasonPrices[seasonIdx], ...patch };
      rooms[roomIdx] = { ...row, seasonPrices };
      return { ...prev, rooms };
    });
  };

  const removeSeason = (roomIdx, seasonIdx) => {
    setForm((prev) => {
      const rooms = [...prev.rooms];
      const row = rooms[roomIdx];
      if (!row) return prev;
      rooms[roomIdx] = {
        ...row,
        seasonPrices: (row.seasonPrices || []).filter((_, i) => i !== seasonIdx),
      };
      return { ...prev, rooms };
    });
  };

  const handleSave = async () => {
    if (!form.name?.trim()) return toast.error("Hotel name is required.");
    if (!form.travelDestinationId) return toast.error("Destination is required.");
    if (!form.travelHotelCategoryId) return toast.error("Category is required.");

    // Disallow duplicate room types
    const seen = new Set();
    for (const r of form.rooms) {
      if (!r.travelRoomTypeId) continue;
      if (seen.has(r.travelRoomTypeId)) {
        return toast.error("Each room type can only appear once per hotel.");
      }
      seen.add(r.travelRoomTypeId);
    }

    setSaving(true);
    try {
      const body = {
        ...(editingId ? { id: editingId } : {}),
        name: form.name.trim(),
        travelDestinationId: Number(form.travelDestinationId),
        travelHotelCategoryId: Number(form.travelHotelCategoryId),
        address: form.address || null,
        description: form.description || null,
        imageUrl: editingId ? editingSnapshot?.imageUrl ?? null : null,
        latitude: editingId ? editingSnapshot?.latitude ?? null : null,
        longitude: editingId ? editingSnapshot?.longitude ?? null : null,
        displayOrder: Number(form.displayOrder) || 0,
        isActive: !!form.isActive,
        rooms: form.rooms
          .filter((r) => r.travelRoomTypeId)
          .map((r) => ({
            id: r.id || 0,
            travelRoomTypeId: Number(r.travelRoomTypeId),
            pricePerNight: Number(r.pricePerNight) || 0,
            isActive: !!r.isActive,
            seasonPrices: (r.seasonPrices || []).map((s) => ({
              ...(s.id ? { id: Number(s.id) } : {}),
              startMonth: Number(s.startMonth) || 1,
              startDay: Number(s.startDay) || 1,
              endMonth: Number(s.endMonth) || 12,
              endDay: Number(s.endDay) || 31,
              pricePerNight: Number(s.pricePerNight) || 0,
              label: (s.label || "").trim() || null,
              priority: Number(s.priority) || 0,
              isActive: s.isActive !== false,
            })),
          })),
      };
      const url = editingId
        ? `${BASE_URL}/TravelHotels/UpdateHotel`
        : `${BASE_URL}/TravelHotels/CreateHotel`;
      const r = await fetch(url, { method: "POST", headers: authJsonHeaders(), body: JSON.stringify(body) });
      const data = await r.json();
      if (!isOk(data)) throw new Error(data?.message || "Save failed");
      toast.success(editingId ? "Hotel updated" : "Hotel created");
      setDialogOpen(false);
      fetchHotels();
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
      const r = await fetch(`${BASE_URL}/TravelHotels/DeleteHotel?id=${toDelete.id}`, {
        method: "POST",
        headers: authJsonHeaders(),
      });
      const data = await r.json();
      if (!isOk(data)) throw new Error(data?.message || "Delete failed");
      toast.success("Deleted");
      setDeleteOpen(false);
      setToDelete(null);
      fetchHotels();
    } catch (err) {
      toast.error(err.message || "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  /* ─── Filtering ───────────────────────────────────────────────────── */

  const visible = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return (hotels || []).filter((h) => {
      if (filterDestination && h.travelDestinationId !== Number(filterDestination)) return false;
      if (filterCategory && h.travelHotelCategoryId !== Number(filterCategory)) return false;
      if (!q) return true;
      const text = `${h.name} ${h.destinationName} ${h.categoryLabel} ${h.address || ""}`.toLowerCase();
      return text.includes(q);
    });
  }, [hotels, filterDestination, filterCategory, searchTerm]);

  if (!navigate) return <AccessDenied />;

  return (
    <>
      <div className={styles.pageTitle}>
        <h1>Hotels</h1>
        <ul>
          <li><Link href="/">Dashboard</Link></li>
          <li>Travel</li>
          <li><Link href="/travel/hotels/">Hotels</Link></li>
        </ul>
      </div>

      <Paper sx={{ p: { xs: 1.5, md: 2 }, mb: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <HotelIcon color="primary" />
            <Typography variant="subtitle1" fontWeight={600}>
              Hotel inventory for the custom plan builder
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" startIcon={<RefreshIcon />} onClick={fetchHotels} disabled={loading}>
              Refresh
            </Button>
            {create && (
              <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate} sx={masterCategoryContainedButtonSx}>
                New Hotel
              </Button>
            )}
          </Stack>
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
          Each hotel must belong to a destination and a star tier. Configure room types and per-night prices below; the
          public custom plan builder uses these to live-calculate the trip total.
        </Typography>
      </Paper>

      <Grid container rowSpacing={1} columnSpacing={1}>
        <Grid item xs={12} md={4} lg={3}>
          <Search className="search-form">
            <StyledInputBase
              placeholder="Search hotels.."
              inputProps={{ "aria-label": "search" }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </Search>
        </Grid>
        <Grid item xs={6} md={3} lg={2}>
          <FormControl fullWidth size="small">
            <InputLabel>Destination</InputLabel>
            <Select
              label="Destination"
              value={filterDestination}
              onChange={(e) => setFilterDestination(e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              {destinations.map((d) => (
                <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={6} md={3} lg={2}>
          <FormControl fullWidth size="small">
            <InputLabel>Category</InputLabel>
            <Select
              label="Category"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              {categories.map((c) => (
                <MenuItem key={c.id} value={c.id}>{c.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12}>
          <TableContainer component={Paper}>
            <Table className="dark-table">
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Destination</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Rooms</TableCell>
                  <TableCell>Order</TableCell>
                  <TableCell>Active</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={8} align="center"><Typography>Loading...</Typography></TableCell></TableRow>
                ) : visible.length === 0 ? (
                  <TableRow><TableCell colSpan={8} align="center"><Typography color="textSecondary">No hotels yet.</Typography></TableCell></TableRow>
                ) : (
                  visible.map((row, idx) => (
                    <TableRow key={row.id} hover>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell>
                        <Typography fontWeight={600}>{row.name}</Typography>
                        {row.address && (
                          <Typography variant="caption" color="text.secondary">{row.address}</Typography>
                        )}
                      </TableCell>
                      <TableCell>{row.destinationName || "—"}</TableCell>
                      <TableCell><Chip size="small" label={row.categoryLabel || "—"} /></TableCell>
                      <TableCell>
                        {(row.rooms || []).length === 0 ? (
                          <Typography variant="caption" color="error">No rooms priced</Typography>
                        ) : (
                          <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                            {row.rooms.map((rm) => (
                              <Chip
                                key={rm.id}
                                size="small"
                                variant="outlined"
                                label={`${rm.roomTypeLabel}: ${Number(rm.pricePerNight).toLocaleString()}${
                                  (rm.seasonPrices || []).length
                                    ? ` (+${rm.seasonPrices.length} season${rm.seasonPrices.length === 1 ? "" : "s"})`
                                    : ""
                                }`}
                              />
                            ))}
                          </Stack>
                        )}
                      </TableCell>
                      <TableCell>{row.displayOrder ?? 0}</TableCell>
                      <TableCell>
                        <Chip
                          label={row.isActive ? "Active" : "Inactive"}
                          size="small"
                          color={row.isActive ? "success" : "default"}
                          variant={row.isActive ? "filled" : "outlined"}
                        />
                      </TableCell>
                      <TableCell align="right">
                        {update && (
                          <Tooltip title="Edit">
                            <IconButton size="small" onClick={() => openEdit(row)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {remove && (
                          <Tooltip title="Delete">
                            <IconButton size="small" color="error" onClick={() => { setToDelete(row); setDeleteOpen(true); }}>
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
          </TableContainer>
        </Grid>
      </Grid>

      {/* ── Add / Edit dialog ─────────────────────────────────────────── */}
      <Dialog open={dialogOpen} onClose={() => !saving && setDialogOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>{editingId ? "Edit Hotel" : "Add Hotel"}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              label="Hotel Name *"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              fullWidth size="small"
            />
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Destination *</InputLabel>
                <Select
                  label="Destination *"
                  value={form.travelDestinationId}
                  onChange={(e) => setForm({ ...form, travelDestinationId: e.target.value })}
                >
                  {destinations.map((d) => (
                    <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth size="small">
                <InputLabel>Category *</InputLabel>
                <Select
                  label="Category *"
                  value={form.travelHotelCategoryId}
                  onChange={(e) => setForm({ ...form, travelHotelCategoryId: e.target.value })}
                >
                  {categories.map((c) => (
                    <MenuItem key={c.id} value={c.id}>{c.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>

            <TextField
              label="Address"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              fullWidth size="small"
            />
            <TextField
              label="Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              fullWidth size="small" multiline rows={2}
            />

            <Divider />

            <Box>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                <Typography variant="subtitle2">Room types &amp; nightly prices</Typography>
                <Button size="small" startIcon={<AddIcon />} onClick={addRoom}>Add room</Button>
              </Stack>
              {form.rooms.length === 0 ? (
                <Typography variant="caption" color="text.secondary">
                  No room layouts yet. Add at least one (Single / Double / Triple) so guests can pick this hotel.
                </Typography>
              ) : (
                <Stack spacing={2}>
                  {form.rooms.map((rm, idx) => (
                    <Paper key={`${rm.id ?? "new"}-${idx}`} variant="outlined" sx={{ p: 2 }}>
                      <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={1.5}
                        alignItems={{ xs: "stretch", sm: "center" }}
                        flexWrap="wrap"
                      >
                        <FormControl sx={{ minWidth: 200 }} size="small">
                          <InputLabel>Room Type *</InputLabel>
                          <Select
                            label="Room Type *"
                            value={rm.travelRoomTypeId}
                            onChange={(e) => updateRoom(idx, { travelRoomTypeId: e.target.value })}
                          >
                            {roomTypes.map((t) => (
                              <MenuItem key={t.id} value={t.id}>
                                {t.label} (max {t.maxOccupancy})
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                        <TextField
                          label="Default price / night *"
                          type="number"
                          value={rm.pricePerNight}
                          onChange={(e) => updateRoom(idx, { pricePerNight: e.target.value })}
                          size="small"
                          inputProps={{ min: 0, step: 0.01 }}
                          sx={{ maxWidth: 200 }}
                        />
                        <FormControlLabel
                          control={
                            <Switch
                              checked={rm.isActive}
                              onChange={(e) => updateRoom(idx, { isActive: e.target.checked })}
                            />
                          }
                          label="Active"
                        />
                        <IconButton color="error" onClick={() => removeRoom(idx)} aria-label="Remove room">
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Stack>

                      <Divider sx={{ my: 1.5 }} />
                      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                          Seasonal prices (from month → to month)
                        </Typography>
                        <Button size="small" startIcon={<AddIcon />} onClick={() => addSeason(idx)}>
                          Add season
                        </Button>
                      </Stack>
                      {(rm.seasonPrices || []).length === 0 ? (
                        <Typography variant="caption" color="text.secondary">
                          No seasonal bands — only the default price above is used all year.
                        </Typography>
                      ) : (
                        <Stack spacing={1.5}>
                          {rm.seasonPrices.map((sp, si) => (
                            <Stack
                              key={`${sp.id ?? "new"}-${si}`}
                              direction={{ xs: "column", md: "row" }}
                              spacing={1}
                              alignItems={{ xs: "stretch", md: "center" }}
                              flexWrap="wrap"
                              useFlexGap
                              sx={{
                                p: 1,
                                borderRadius: 1,
                                border: "1px solid",
                                borderColor: "divider",
                                bgcolor: "action.hover",
                              }}
                            >
                              <FormControl size="small" sx={{ minWidth: 130 }}>
                                <InputLabel>From month</InputLabel>
                                <Select
                                  label="From month"
                                  value={sp.startMonth}
                                  onChange={(e) => updateSeason(idx, si, { startMonth: Number(e.target.value) })}
                                >
                                  {HOTEL_SEASON_MONTHS.map((m) => (
                                    <MenuItem key={`sm-${m.value}`} value={m.value}>{m.label}</MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                              <TextField
                                label="Day"
                                type="number"
                                size="small"
                                value={sp.startDay}
                                onChange={(e) => updateSeason(idx, si, { startDay: e.target.value })}
                                inputProps={{ min: 1, max: 31 }}
                                sx={{ width: 80 }}
                              />
                              <Typography variant="body2" color="text.secondary" sx={{ px: 0.5 }}>
                                to
                              </Typography>
                              <FormControl size="small" sx={{ minWidth: 130 }}>
                                <InputLabel>To month</InputLabel>
                                <Select
                                  label="To month"
                                  value={sp.endMonth}
                                  onChange={(e) => updateSeason(idx, si, { endMonth: Number(e.target.value) })}
                                >
                                  {HOTEL_SEASON_MONTHS.map((m) => (
                                    <MenuItem key={`em-${m.value}`} value={m.value}>{m.label}</MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                              <TextField
                                label="Day"
                                type="number"
                                size="small"
                                value={sp.endDay}
                                onChange={(e) => updateSeason(idx, si, { endDay: e.target.value })}
                                inputProps={{ min: 1, max: 31 }}
                                sx={{ width: 80 }}
                              />
                              <TextField
                                label="Price / night"
                                type="number"
                                size="small"
                                value={sp.pricePerNight}
                                onChange={(e) => updateSeason(idx, si, { pricePerNight: e.target.value })}
                                inputProps={{ min: 0, step: 0.01 }}
                                sx={{ width: 120 }}
                              />
                              <TextField
                                label="Label"
                                size="small"
                                placeholder="e.g. Peak"
                                value={sp.label}
                                onChange={(e) => updateSeason(idx, si, { label: e.target.value })}
                                sx={{ minWidth: 100, flex: 1 }}
                              />
                              <TextField
                                label="Priority"
                                type="number"
                                size="small"
                                value={sp.priority}
                                onChange={(e) => updateSeason(idx, si, { priority: e.target.value })}
                                inputProps={{ min: 0 }}
                                sx={{ width: 90 }}
                              />
                              <FormControlLabel
                                control={
                                  <Switch
                                    size="small"
                                    checked={sp.isActive}
                                    onChange={(e) => updateSeason(idx, si, { isActive: e.target.checked })}
                                  />
                                }
                                label="On"
                              />
                              <IconButton
                                color="error"
                                size="small"
                                onClick={() => removeSeason(idx, si)}
                                aria-label="Remove season"
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Stack>
                          ))}
                        </Stack>
                      )}
                    </Paper>
                  ))}
                </Stack>
              )}
            </Box>

            <Divider />

            <Stack direction="row" spacing={2} alignItems="center">
              <TextField
                label="Display Order"
                type="number"
                value={form.displayOrder}
                onChange={(e) => setForm({ ...form, displayOrder: Number(e.target.value) || 0 })}
                size="small"
                sx={{ width: 160 }}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={form.isActive}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  />
                }
                label="Active"
              />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving} sx={masterCategoryContainedButtonSx}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Delete confirm ────────────────────────────────────────────── */}
      <Dialog open={deleteOpen} onClose={() => !deleting && setDeleteOpen(false)}>
        <DialogTitle>Delete Hotel</DialogTitle>
        <DialogContent>
          Are you sure you want to delete &quot;{toDelete?.name}&quot;? Linked rooms will be removed too.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)} disabled={deleting}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDelete} disabled={deleting} sx={masterCategoryContainedButtonSx}>
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      <ToastContainer />
    </>
  );
}

/** Seasonal price helpers (hotel room year-less month/day bands). */
function newSeasonRow() {
  return {
    id: null,
    startMonth: 1,
    startDay: 1,
    endMonth: 3,
    endDay: 31,
    pricePerNight: 0,
    label: "",
    priority: 0,
    isActive: true,
  };
}

const HOTEL_SEASON_MONTHS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];
