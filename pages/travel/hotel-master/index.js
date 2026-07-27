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
  FormControlLabel,
  Switch,
  Tabs,
  Tab,
  Stack,
  MenuItem,
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

const isOk = (res) => res?.statusCode === 200 || res?.statusCode === 1;
const authJsonHeaders = () => ({
  Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("token") : ""}`,
  "Content-Type": "application/json",
});

const TABS = [
  { key: "categories", label: "Hotel Categories" },
  { key: "roomTypes",  label: "Room Types"       },
];

const RESOURCES = {
  categories: {
    listUrl:   `${BASE_URL}/TravelHotelCategories/GetAllHotelCategories`,
    createUrl: `${BASE_URL}/TravelHotelCategories/CreateHotelCategory`,
    updateUrl: `${BASE_URL}/TravelHotelCategories/UpdateHotelCategory`,
    deleteUrl: (id) => `${BASE_URL}/TravelHotelCategories/DeleteHotelCategory?id=${id}`,
  },
  roomTypes: {
    listUrl:   `${BASE_URL}/TravelRoomTypes/GetAllRoomTypes`,
    createUrl: `${BASE_URL}/TravelRoomTypes/CreateRoomType`,
    updateUrl: `${BASE_URL}/TravelRoomTypes/UpdateRoomType`,
    deleteUrl: (id) => `${BASE_URL}/TravelRoomTypes/DeleteRoomType?id=${id}`,
  },
};

const emptyForm = {
  categories: { label: "", displayOrder: 0, isActive: true, rooms: [] },
  roomTypes:  { label: "", maxOccupancy: 0, displayOrder: 0, isActive: true },
};

export default function TravelHotelMaster() {
  const cId = typeof window !== "undefined" ? sessionStorage.getItem("category") : null;
  const { navigate, create, update, remove } = IsPermissionEnabled(cId);

  const [tab, setTab] = useState("categories");
  const [rows, setRows] = useState({ categories: [], roomTypes: [] });
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm.categories);
  const [saving, setSaving] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchTab = async (which) => {
    setLoading(true);
    try {
      const r = await fetch(RESOURCES[which].listUrl, { headers: authJsonHeaders() });
      const data = await r.json();
      setRows((prev) => ({ ...prev, [which]: Array.isArray(data?.result) ? data.result : [] }));
    } catch (err) {
      toast.error(err.message || "Failed to fetch");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!navigate) return;
    fetchTab("categories");
    fetchTab("roomTypes");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const openCreate = () => { setEditingId(null); setForm(emptyForm[tab]); setDialogOpen(true); };
  const openEdit = (row) => {
    setEditingId(row.id);
    if (tab === "categories") {
      setForm({
        label: row.label || "",
        displayOrder: row.displayOrder || 0,
        isActive: row.isActive !== false,
        rooms: Array.isArray(row.rooms)
          ? row.rooms.map((r) => ({
              id: r.id,
              travelRoomTypeId: r.travelRoomTypeId,
              pricePerNight: Number(r.pricePerNight) || 0,
              isActive: r.isActive !== false,
            }))
          : [],
      });
    } else {
      setForm({
        label: row.label || "",
        maxOccupancy: Number.isFinite(row.maxOccupancy) ? row.maxOccupancy : 0,
        displayOrder: row.displayOrder || 0,
        isActive: row.isActive !== false,
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.label?.trim()) return toast.error("Label is required.");
    if (tab === "categories") {
      const ids = (form.rooms || []).map((r) => r.travelRoomTypeId).filter((x) => x > 0);
      if (new Set(ids).size !== ids.length) return toast.error("Each room type can be added only once per category.");
      for (const r of form.rooms || []) {
        if (!r.travelRoomTypeId) return toast.error("Pick a room type for every row.");
        if (Number(r.pricePerNight) < 0) return toast.error("Price per night cannot be negative.");
      }
    }
    setSaving(true);
    try {
      const url = editingId ? RESOURCES[tab].updateUrl : RESOURCES[tab].createUrl;
      const body = editingId ? { id: editingId, ...form } : form;
      const r = await fetch(url, { method: "POST", headers: authJsonHeaders(), body: JSON.stringify(body) });
      const data = await r.json();
      if (!isOk(data)) throw new Error(data?.message || "Save failed");
      toast.success(editingId ? "Updated" : "Created");
      setDialogOpen(false);
      fetchTab(tab);
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
      const r = await fetch(RESOURCES[tab].deleteUrl(toDelete.id), { method: "POST", headers: authJsonHeaders() });
      const data = await r.json();
      if (!isOk(data)) throw new Error(data?.message || "Delete failed");
      toast.success("Deleted");
      setDeleteOpen(false);
      setToDelete(null);
      fetchTab(tab);
    } catch (err) {
      toast.error(err.message || "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  const visible = useMemo(() => {
    const list = rows[tab] || [];
    const q = searchTerm.trim().toLowerCase();
    if (!q) return list;
    return list.filter((row) => `${row.label}`.toLowerCase().includes(q));
  }, [rows, tab, searchTerm]);

  const roomTypeOptions = rows.roomTypes || [];

  const addRoomRow = () =>
    setForm((f) => ({ ...f, rooms: [...(f.rooms || []), { travelRoomTypeId: 0, pricePerNight: 0, isActive: true }] }));
  const removeRoomRow = (idx) =>
    setForm((f) => ({ ...f, rooms: (f.rooms || []).filter((_, i) => i !== idx) }));
  const updateRoomRow = (idx, patch) =>
    setForm((f) => ({
      ...f,
      rooms: (f.rooms || []).map((r, i) => (i === idx ? { ...r, ...patch } : r)),
    }));

  if (!navigate) return <AccessDenied />;

  return (
    <>
      <div className={styles.pageTitle}>
        <h1>Hotel Master</h1>
        <ul>
          <li><Link href="/">Dashboard</Link></li>
          <li>Travel</li>
          <li><Link href="/travel/hotel-master/">Hotel Master</Link></li>
        </ul>
      </div>

      <Paper sx={{ p: { xs: 1.5, md: 2 }, mb: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1 }}>
          <Tabs
            value={tab}
            onChange={(_, v) => { setTab(v); setSearchTerm(""); }}
            variant="scrollable"
            scrollButtons="auto"
          >
            {TABS.map((t) => <Tab key={t.key} value={t.key} label={t.label} />)}
          </Tabs>
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" startIcon={<RefreshIcon />} onClick={() => fetchTab(tab)} disabled={loading}>Refresh</Button>
            {create && (
              <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate} sx={masterCategoryContainedButtonSx}>New</Button>
            )}
          </Stack>
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
          {tab === "categories"
            ? "Star tiers used in the public custom plan builder. Each tier owns its per-night room prices (Single / Double / Triple)."
            : "Room layouts available across hotels (e.g. Single, Double, Triple). Price per night is set per category."}
        </Typography>
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
                  <TableCell>Label</TableCell>
                  {tab === "roomTypes" && <TableCell>Max Occupancy</TableCell>}
                  {tab === "categories" && <TableCell>Rooms</TableCell>}
                  <TableCell>Order</TableCell>
                  <TableCell>Active</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={7} align="center"><Typography>Loading...</Typography></TableCell></TableRow>
                ) : visible.length === 0 ? (
                  <TableRow><TableCell colSpan={7} align="center"><Typography color="textSecondary">Nothing here yet.</Typography></TableCell></TableRow>
                ) : (
                  visible.map((row, idx) => (
                    <TableRow key={row.id} hover>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell>{row.label}</TableCell>
                      {tab === "roomTypes" && <TableCell>{row.maxOccupancy}</TableCell>}
                      {tab === "categories" && (
                        <TableCell>
                          {(row.rooms || []).length === 0 ? (
                            <Typography variant="caption" color="text.secondary">No rooms</Typography>
                          ) : (
                            <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                              {(row.rooms || []).map((r) => (
                                <Chip
                                  key={r.id}
                                  size="small"
                                  variant="outlined"
                                  label={`${r.roomTypeLabel}: $${Number(r.pricePerNight || 0).toFixed(2)}`}
                                />
                              ))}
                            </Stack>
                          )}
                        </TableCell>
                      )}
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

      <Dialog open={dialogOpen} onClose={() => !saving && setDialogOpen(false)} maxWidth={tab === "categories" ? "sm" : "xs"} fullWidth>
        <DialogTitle>
          {editingId ? "Edit" : "Add"} {tab === "categories" ? "Hotel Category" : "Room Type"}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              label="Label *"
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              fullWidth size="small"
              helperText={tab === "categories" ? 'e.g. "3-Star", "4-Star", "5-Star"' : 'e.g. "Single", "Double", "Triple"'}
            />
            {tab === "roomTypes" && (
              <TextField
                label="Max Occupancy"
                type="number"
                value={form.maxOccupancy}
                onChange={(e) => {
                  const v = e.target.value;
                  setForm({ ...form, maxOccupancy: v === "" ? 0 : Math.max(0, Number(v) || 0) });
                }}
                size="small"
                inputProps={{ min: 0 }}
                fullWidth
              />
            )}
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
                control={<Switch checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />}
                label="Active"
              />
            </Stack>

            {tab === "categories" && (
              <>
                <Divider />
                <Box>
                  <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                    <Typography variant="subtitle2">Room prices (per night)</Typography>
                    <Button
                      size="small"
                      startIcon={<AddIcon />}
                      onClick={addRoomRow}
                      disabled={roomTypeOptions.length === 0}
                    >
                      Add room
                    </Button>
                  </Stack>
                  {roomTypeOptions.length === 0 && (
                    <Typography variant="caption" color="text.secondary">
                      Add room types in the &quot;Room Types&quot; tab first.
                    </Typography>
                  )}
                  {(form.rooms || []).length === 0 && roomTypeOptions.length > 0 && (
                    <Typography variant="caption" color="text.secondary">
                      No rooms configured. Use &quot;Add room&quot; to add Single / Double / Triple prices.
                    </Typography>
                  )}
                  <Stack spacing={1.25} sx={{ mt: 1 }}>
                    {(form.rooms || []).map((r, idx) => (
                      <Stack key={idx} direction={{ xs: "column", sm: "row" }} spacing={1.25} alignItems="center">
                        <TextField
                          select
                          size="small"
                          label="Room type"
                          value={r.travelRoomTypeId || ""}
                          onChange={(e) => updateRoomRow(idx, { travelRoomTypeId: Number(e.target.value) })}
                          sx={{ minWidth: 180, flex: 1 }}
                        >
                          <MenuItem value=""><em>— select —</em></MenuItem>
                          {roomTypeOptions.map((rt) => (
                            <MenuItem key={rt.id} value={rt.id}>
                              {rt.label} (max {rt.maxOccupancy})
                            </MenuItem>
                          ))}
                        </TextField>
                        <TextField
                          size="small"
                          type="number"
                          label="Price / night"
                          value={r.pricePerNight}
                          onChange={(e) => updateRoomRow(idx, { pricePerNight: Number(e.target.value) || 0 })}
                          inputProps={{ min: 0, step: 0.01 }}
                          sx={{ width: 160 }}
                        />
                        <FormControlLabel
                          control={<Switch checked={r.isActive} onChange={(e) => updateRoomRow(idx, { isActive: e.target.checked })} />}
                          label="Active"
                        />
                        <IconButton size="small" color="error" onClick={() => removeRoomRow(idx)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    ))}
                  </Stack>
                </Box>
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving} sx={masterCategoryContainedButtonSx}>{saving ? "Saving..." : "Save"}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteOpen} onClose={() => !deleting && setDeleteOpen(false)}>
        <DialogTitle>Delete</DialogTitle>
        <DialogContent>Are you sure you want to delete &quot;{toDelete?.label}&quot;?</DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)} disabled={deleting}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDelete} disabled={deleting} sx={masterCategoryContainedButtonSx}>{deleting ? "Deleting..." : "Delete"}</Button>
        </DialogActions>
      </Dialog>

      <ToastContainer />
    </>
  );
}
