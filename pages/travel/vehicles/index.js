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
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import CategoryIcon from "@mui/icons-material/Category";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { validateTravelVehicleTypeImage } from "@/lib/validateTravelVehicleTypeImage";

const isOk = (res) => res?.statusCode === 200 || res?.statusCode === 1;
const authJsonHeaders = () => ({
  Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("token") : ""}`,
  "Content-Type": "application/json",
});
const authMultipartHeaders = () => ({
  Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("token") : ""}`,
});

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
    // not JSON
  }
  if (raw.startsWith("http")) return raw;
  const unquoted = raw.replace(/^["']|["']$/g, "").trim();
  if (unquoted.startsWith("http")) return unquoted;
  throw new Error("Upload did not return a URL");
};

const EMPTY_VEHICLE_FORM = {
  name: "",
  description: "",
  travelVehicleTypeId: "",
  capacity: 4,
  pricePerKm: 0,
  basePerDay: "",
  displayOrder: 0,
  isActive: true,
};

const EMPTY_TYPE_FORM = {
  name: "",
  imageUrl: "",
};

export default function TravelVehicles() {
  const cId = typeof window !== "undefined" ? sessionStorage.getItem("category") : null;
  const { navigate, create, update, remove } = IsPermissionEnabled(cId);

  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_VEHICLE_FORM);
  const [saving, setSaving] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [typeDialogOpen, setTypeDialogOpen] = useState(false);
  const [typeEditingId, setTypeEditingId] = useState(null);
  const [typeForm, setTypeForm] = useState(EMPTY_TYPE_FORM);
  const [typeSaving, setTypeSaving] = useState(false);
  const [typeUploading, setTypeUploading] = useState(false);
  const [typeDeleteOpen, setTypeDeleteOpen] = useState(false);
  const [typeToDelete, setTypeToDelete] = useState(null);
  const [typeDeleting, setTypeDeleting] = useState(false);

  const fetchVehicleTypes = async () => {
    try {
      const r = await fetch(`${BASE_URL}/TravelVehicleTypes/GetAllVehicleTypes`, { headers: authJsonHeaders() });
      const data = await r.json();
      setVehicleTypes(Array.isArray(data?.result) ? data.result : []);
    } catch (err) {
      toast.error(err.message || "Failed to load vehicle types");
    }
  };

  const fetchRows = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${BASE_URL}/TravelVehicles/GetAllVehicles`, { headers: authJsonHeaders() });
      const data = await r.json();
      setRows(Array.isArray(data?.result) ? data.result : []);
    } catch (err) {
      toast.error(err.message || "Failed to load vehicles");
    } finally {
      setLoading(false);
    }
  };

  const refreshAll = async () => {
    await Promise.all([fetchVehicleTypes(), fetchRows()]);
  };

  useEffect(() => {
    if (!navigate) return;
    refreshAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_VEHICLE_FORM);
    setDialogOpen(true);
  };
  const openEdit = (row) => {
    setEditingId(row.id);
    setForm({
      name: row.name || "",
      description: row.description || "",
      travelVehicleTypeId: row.travelVehicleTypeId || "",
      capacity: row.capacity || 4,
      pricePerKm: row.pricePerKm ?? 0,
      basePerDay: row.basePerDay ?? "",
      displayOrder: row.displayOrder || 0,
      isActive: row.isActive !== false,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name?.trim()) return toast.error("Name is required.");
    if (!form.travelVehicleTypeId) return toast.error("Select a vehicle type.");
    if (Number(form.pricePerKm) < 0) return toast.error("Price per km must be non-negative.");

    setSaving(true);
    try {
      const body = {
        ...(editingId ? { id: editingId } : {}),
        name: form.name.trim(),
        description: form.description || null,
        travelVehicleTypeId: Number(form.travelVehicleTypeId),
        capacity: Number(form.capacity) || 1,
        pricePerKm: Number(form.pricePerKm) || 0,
        basePerDay: form.basePerDay === "" ? null : Number(form.basePerDay),
        displayOrder: Number(form.displayOrder) || 0,
        isActive: !!form.isActive,
      };
      const url = editingId
        ? `${BASE_URL}/TravelVehicles/UpdateVehicle`
        : `${BASE_URL}/TravelVehicles/CreateVehicle`;
      const r = await fetch(url, { method: "POST", headers: authJsonHeaders(), body: JSON.stringify(body) });
      const data = await r.json();
      if (!isOk(data)) throw new Error(data?.message || "Save failed");
      toast.success(editingId ? "Vehicle updated" : "Vehicle created");
      setDialogOpen(false);
      fetchRows();
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
      const r = await fetch(`${BASE_URL}/TravelVehicles/DeleteVehicle?id=${toDelete.id}`, {
        method: "POST",
        headers: authJsonHeaders(),
      });
      const data = await r.json();
      if (!isOk(data)) throw new Error(data?.message || "Delete failed");
      toast.success("Deleted");
      setDeleteOpen(false);
      setToDelete(null);
      fetchRows();
    } catch (err) {
      toast.error(err.message || "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  const openTypeCreate = () => {
    setTypeEditingId(null);
    setTypeForm(EMPTY_TYPE_FORM);
    setTypeDialogOpen(true);
  };
  const openTypeEdit = (row) => {
    setTypeEditingId(row.id);
    setTypeForm({ name: row.name || "", imageUrl: row.imageUrl || "" });
    setTypeDialogOpen(true);
  };

  const uploadTypeImage = async (file) => {
    const validation = await validateTravelVehicleTypeImage(file);
    if (!validation.ok) {
      toast.error(validation.message);
      return;
    }
    setTypeUploading(true);
    try {
      const fd = new FormData();
      const ext = (file.name?.split(".").pop() || "png").toLowerCase();
      fd.append("File", file);
      fd.append("FileName", `vehicle-type-${Date.now()}.${ext}`);
      fd.append("storePath", "Travel/VehicleTypes");
      const r = await fetch(`${BASE_URL}/AWS/DocumentUploadCommon`, {
        method: "POST",
        headers: authMultipartHeaders(),
        body: fd,
      });
      const text = await r.text();
      if (!r.ok) throw new Error(text || "Upload failed");
      const url = parseUploadUrl(text);
      setTypeForm((f) => ({ ...f, imageUrl: url }));
      toast.success("Image uploaded");
    } catch (err) {
      toast.error(err.message || "Image upload failed");
    } finally {
      setTypeUploading(false);
    }
  };

  const handleTypeImagePick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    await uploadTypeImage(file);
  };

  const handleTypeSave = async () => {
    if (!typeForm.name?.trim()) return toast.error("Type name is required.");
    if (!typeForm.imageUrl?.trim()) return toast.error("Upload a 700×700 transparent image.");

    setTypeSaving(true);
    try {
      const body = {
        ...(typeEditingId ? { id: typeEditingId } : {}),
        name: typeForm.name.trim(),
        imageUrl: typeForm.imageUrl.trim(),
      };
      const url = typeEditingId
        ? `${BASE_URL}/TravelVehicleTypes/UpdateVehicleType`
        : `${BASE_URL}/TravelVehicleTypes/CreateVehicleType`;
      const r = await fetch(url, { method: "POST", headers: authJsonHeaders(), body: JSON.stringify(body) });
      const data = await r.json();
      if (!isOk(data)) throw new Error(data?.message || "Save failed");
      toast.success(typeEditingId ? "Vehicle type updated" : "Vehicle type created");
      setTypeDialogOpen(false);
      await refreshAll();
    } catch (err) {
      toast.error(err.message || "Save failed");
    } finally {
      setTypeSaving(false);
    }
  };

  const handleTypeDelete = async () => {
    if (!typeToDelete) return;
    setTypeDeleting(true);
    try {
      const r = await fetch(`${BASE_URL}/TravelVehicleTypes/DeleteVehicleType?id=${typeToDelete.id}`, {
        method: "POST",
        headers: authJsonHeaders(),
      });
      const data = await r.json();
      if (!isOk(data)) throw new Error(data?.message || "Delete failed");
      toast.success("Vehicle type deleted");
      setTypeDeleteOpen(false);
      setTypeToDelete(null);
      await refreshAll();
    } catch (err) {
      toast.error(err.message || "Delete failed");
    } finally {
      setTypeDeleting(false);
    }
  };

  const selectedTypePreview = useMemo(() => {
    const id = Number(form.travelVehicleTypeId);
    if (!id) return null;
    return vehicleTypes.find((t) => t.id === id) || null;
  }, [form.travelVehicleTypeId, vehicleTypes]);

  const visible = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => `${r.name} ${r.description || ""} ${r.travelVehicleTypeName || ""}`.toLowerCase().includes(q));
  }, [rows, searchTerm]);

  if (!navigate) return <AccessDenied />;

  return (
    <>
      <div className={styles.pageTitle}>
        <h1>Vehicles</h1>
        <ul>
          <li><Link href="/">Dashboard</Link></li>
          <li>Travel</li>
          <li><Link href="/travel/vehicles/">Vehicles</Link></li>
        </ul>
      </div>

      <Paper sx={{ p: { xs: 1.5, md: 2 }, mb: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <CategoryIcon color="primary" />
            <Typography variant="subtitle1" fontWeight={600}>Vehicle types</Typography>
          </Stack>
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" startIcon={<RefreshIcon />} onClick={fetchVehicleTypes} disabled={loading}>
              Refresh
            </Button>
            {create && (
              <Button variant="contained" startIcon={<AddIcon />} onClick={openTypeCreate} sx={masterCategoryContainedButtonSx}>
                New type
              </Button>
            )}
          </Stack>
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
          Upload a 700×700 PNG or WebP with a transparent background. Each transport option picks one type for its icon.
        </Typography>
        <TableContainer sx={{ mt: 2 }}>
          <Table size="small" className="dark-table">
            <TableHead>
              <TableRow>
                <TableCell>Icon</TableCell>
                <TableCell>Type name</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {vehicleTypes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} align="center">
                    <Typography color="textSecondary" variant="body2">No vehicle types yet. Add one before creating vehicles.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                vehicleTypes.map((t) => (
                  <TableRow key={t.id} hover>
                    <TableCell>
                      {t.imageUrl ? (
                        <Box
                          component="img"
                          src={t.imageUrl}
                          alt=""
                          sx={{ width: 48, height: 48, objectFit: "contain", bgcolor: "action.hover", borderRadius: 1 }}
                        />
                      ) : "—"}
                    </TableCell>
                    <TableCell><Typography fontWeight={600}>{t.name}</Typography></TableCell>
                    <TableCell align="right">
                      {update && (
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => openTypeEdit(t)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {remove && (
                        <Tooltip title="Delete">
                          <IconButton size="small" color="error" onClick={() => { setTypeToDelete(t); setTypeDeleteOpen(true); }}>
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
      </Paper>

      <Paper sx={{ p: { xs: 1.5, md: 2 }, mb: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <DirectionsCarIcon color="primary" />
            <Typography variant="subtitle1" fontWeight={600}>Transport options &amp; per-km rates</Typography>
          </Stack>
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" startIcon={<RefreshIcon />} onClick={fetchRows} disabled={loading}>Refresh</Button>
            {create && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={openCreate}
                sx={masterCategoryContainedButtonSx}
                disabled={vehicleTypes.length === 0}
              >
                New Vehicle
              </Button>
            )}
          </Stack>
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
          The custom plan builder multiplies the per-km rate by the trip distance returned by Google Distance Matrix.
        </Typography>
      </Paper>

      <Grid container rowSpacing={1} columnSpacing={1}>
        <Grid item xs={12} lg={4}>
          <Search className="search-form">
            <StyledInputBase
              placeholder="Search vehicles.."
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
                  <TableCell>Name</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Capacity</TableCell>
                  <TableCell>Price / km</TableCell>
                  <TableCell>Base / day</TableCell>
                  <TableCell>Order</TableCell>
                  <TableCell>Active</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={9} align="center"><Typography>Loading...</Typography></TableCell></TableRow>
                ) : visible.length === 0 ? (
                  <TableRow><TableCell colSpan={9} align="center"><Typography color="textSecondary">No vehicles yet.</Typography></TableCell></TableRow>
                ) : (
                  visible.map((row, idx) => (
                    <TableRow key={row.id} hover>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell>
                        <Typography fontWeight={600}>{row.name}</Typography>
                        {row.description && (
                          <Typography variant="caption" color="text.secondary">{row.description}</Typography>
                        )}
                      </TableCell>
                      <TableCell>{row.travelVehicleTypeName || "—"}</TableCell>
                      <TableCell>{row.capacity ?? "—"}</TableCell>
                      <TableCell>{Number(row.pricePerKm || 0).toLocaleString()}</TableCell>
                      <TableCell>{row.basePerDay != null ? Number(row.basePerDay).toLocaleString() : "—"}</TableCell>
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

      <Dialog open={typeDialogOpen} onClose={() => !typeSaving && !typeUploading && setTypeDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{typeEditingId ? "Edit vehicle type" : "Add vehicle type"}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              label="Type name *"
              value={typeForm.name}
              onChange={(e) => setTypeForm({ ...typeForm, name: e.target.value })}
              fullWidth
              size="small"
            />
            <Box>
              <Button
                variant="outlined"
                component="label"
                startIcon={<CloudUploadIcon />}
                disabled={typeUploading || typeSaving}
                fullWidth
              >
                {typeUploading ? "Uploading…" : "Upload image (700×700, transparent)"}
                <input type="file" hidden accept="image/png,image/webp" onChange={handleTypeImagePick} />
              </Button>
              {typeForm.imageUrl && (
                <Box sx={{ mt: 2, textAlign: "center", p: 2, bgcolor: "action.hover", borderRadius: 1 }}>
                  <Box
                    component="img"
                    src={typeForm.imageUrl}
                    alt="Preview"
                    sx={{ maxWidth: "100%", maxHeight: 200, objectFit: "contain" }}
                  />
                </Box>
              )}
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTypeDialogOpen(false)} disabled={typeSaving || typeUploading}>Cancel</Button>
          <Button variant="contained" onClick={handleTypeSave} disabled={typeSaving || typeUploading} sx={masterCategoryContainedButtonSx}>
            {typeSaving ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={typeDeleteOpen} onClose={() => !typeDeleting && setTypeDeleteOpen(false)}>
        <DialogTitle>Delete vehicle type</DialogTitle>
        <DialogContent>Delete &quot;{typeToDelete?.name}&quot;? Vehicles using this type must be reassigned first.</DialogContent>
        <DialogActions>
          <Button onClick={() => setTypeDeleteOpen(false)} disabled={typeDeleting}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleTypeDelete} disabled={typeDeleting} sx={masterCategoryContainedButtonSx}>
            {typeDeleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={dialogOpen} onClose={() => !saving && setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? "Edit Vehicle" : "Add Vehicle"}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField label="Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} fullWidth size="small" />
            <TextField label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} fullWidth size="small" multiline rows={2} />
            <TextField
              select
              label="Vehicle type *"
              value={form.travelVehicleTypeId}
              onChange={(e) => setForm({ ...form, travelVehicleTypeId: e.target.value })}
              fullWidth
              size="small"
              helperText={vehicleTypes.length === 0 ? "Create a vehicle type first" : ""}
            >
              <MenuItem value="">Select type</MenuItem>
              {vehicleTypes.map((t) => (
                <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
              ))}
            </TextField>
            {selectedTypePreview?.imageUrl && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Box
                  component="img"
                  src={selectedTypePreview.imageUrl}
                  alt=""
                  sx={{ width: 72, height: 72, objectFit: "contain", bgcolor: "action.hover", borderRadius: 1 }}
                />
                <Typography variant="caption" color="text.secondary">Icon from vehicle type</Typography>
              </Box>
            )}
            <Divider />
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField label="Capacity" type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} size="small" fullWidth inputProps={{ min: 1 }} />
              <TextField label="Price per km *" type="number" value={form.pricePerKm} onChange={(e) => setForm({ ...form, pricePerKm: e.target.value })} size="small" fullWidth inputProps={{ min: 0, step: 0.01 }} />
              <TextField label="Base per day" type="number" value={form.basePerDay} onChange={(e) => setForm({ ...form, basePerDay: e.target.value })} size="small" fullWidth inputProps={{ min: 0, step: 0.01 }} helperText="Optional flat day rate" />
            </Stack>
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
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving} sx={masterCategoryContainedButtonSx}>{saving ? "Saving..." : "Save"}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteOpen} onClose={() => !deleting && setDeleteOpen(false)}>
        <DialogTitle>Delete Vehicle</DialogTitle>
        <DialogContent>Are you sure you want to delete &quot;{toDelete?.name}&quot;?</DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)} disabled={deleting}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDelete} disabled={deleting} sx={masterCategoryContainedButtonSx}>{deleting ? "Deleting..." : "Delete"}</Button>
        </DialogActions>
      </Dialog>

      <ToastContainer />
    </>
  );
}
