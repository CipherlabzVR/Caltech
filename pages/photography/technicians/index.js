import React, { useEffect, useState, useCallback } from "react";
import styles from "@/styles/PageTitle.module.css";
import Link from "next/link";
import {
  Grid,
  Typography,
  Button,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Switch,
  FormControlLabel,
  Avatar,
  Stack,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import PersonIcon from "@mui/icons-material/Person";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import BASE_URL from "Base/api";
import StaffCredentialsDialog from "@/components/Photography/StaffCredentialsDialog";

export default function PhotographyTechnicians() {
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [creds, setCreds] = useState(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    specialization: "",
    contactNo: "",
    isActive: true,
  });

  const fetchTechnicians = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${BASE_URL}/PhotographyTechnician/GetAll`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (Array.isArray(data.result)) {
        setTechnicians(data.result);
      } else {
        setTechnicians([]);
        if (data.message && data.statusCode !== 200 && data.statusCode !== "SUCCESS") {
          toast.error(data.message);
        }
      }
    } catch (e) {
      toast.error("Failed to load technicians");
      setTechnicians([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTechnicians();
  }, [fetchTechnicians]);

  const handleOpenDialog = (item = null) => {
    if (item) {
      setEditItem(item);
      setForm({
        name: item.userName || "",
        email: item.email || "",
        specialization: item.specialization || "",
        contactNo: item.contactNo || "",
        isActive: item.isActive,
      });
    } else {
      setEditItem(null);
      setForm({ name: "", email: "", specialization: "", contactNo: "", isActive: true });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditItem(null);
    setForm({ name: "", email: "", specialization: "", contactNo: "", isActive: true });
  };

  const handleSave = async () => {
    const token = localStorage.getItem("token");
    if (!editItem) {
      if (!form.name?.trim()) {
        toast.error("Name is required");
        return;
      }
      if (!form.email?.trim() || !form.email.includes("@")) {
        toast.error("Valid email is required");
        return;
      }
    }

    try {
      const url = editItem
        ? `${BASE_URL}/PhotographyTechnician/Update/${editItem.id}`
        : `${BASE_URL}/PhotographyTechnician/Create`;
      const method = editItem ? "PUT" : "POST";
      const payload = editItem
        ? { specialization: form.specialization, contactNo: form.contactNo, isActive: form.isActive }
        : {
            name: form.name.trim(),
            email: form.email.trim(),
            specialization: form.specialization,
            contactNo: form.contactNo,
          };

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.statusCode === "SUCCESS" || data.statusCode === 200) {
        toast.success(editItem ? "Technician updated" : "Technician added");
        handleCloseDialog();
        await fetchTechnicians();
        const result = data.result ?? data.Result;
        if (!editItem && (result?.temporaryPassword || result?.TemporaryPassword)) {
          setCreds({
            email: result.email ?? result.Email ?? form.email,
            temporaryPassword: result.temporaryPassword ?? result.TemporaryPassword,
            emailSent: result.emailSent ?? result.EmailSent ?? false,
          });
        }
      } else {
        toast.error(data.message || "Failed to save");
      }
    } catch (e) {
      toast.error("Failed to save technician");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this technician?")) return;
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${BASE_URL}/PhotographyTechnician/Delete/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.statusCode === "SUCCESS" || data.statusCode === 200) {
        toast.success("Technician deleted");
        await fetchTechnicians();
      } else {
        toast.error(data.message || "Failed to delete");
      }
    } catch (e) {
      toast.error("Failed to delete");
    }
  };

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Photography Technicians</h1>
        <ul>
          <li>
            <Link href="/photography/reservations/">Photography</Link>
          </li>
          <li>Technicians</li>
        </ul>
      </div>

      <Paper sx={{ p: 2 }} className="bg-black">
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Technicians ({technicians.length})</Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
            Add Technician
          </Button>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Specialization</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell align="center">Pending</TableCell>
                <TableCell align="center">In Progress</TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {technicians.map((tech) => (
                <TableRow key={tech.id}>
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Avatar sx={{ width: 32, height: 32, bgcolor: "primary.main" }}>
                        <PersonIcon fontSize="small" />
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          {tech.userName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {tech.email}
                        </Typography>
                      </Box>
                    </Stack>
                  </TableCell>
                  <TableCell>{tech.specialization || "-"}</TableCell>
                  <TableCell>{tech.contactNo || "-"}</TableCell>
                  <TableCell align="center">
                    <Chip
                      size="small"
                      label={tech.pendingTasks || 0}
                      color={tech.pendingTasks > 0 ? "warning" : "default"}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      size="small"
                      label={tech.inProgressTasks || 0}
                      color={tech.inProgressTasks > 0 ? "info" : "default"}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      size="small"
                      label={tech.isActive ? "Active" : "Inactive"}
                      color={tech.isActive ? "success" : "default"}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => handleOpenDialog(tech)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDelete(tech.id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {technicians.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography color="text.secondary" py={3}>
                      {loading ? "Loading..." : "No technicians found. Add one to get started."}
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editItem ? "Edit Technician" : "Add Technician"}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {!editItem && (
              <>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    A login account will be created and granted Task Board access. A temporary password will be shown after save.
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Name"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Email (login)"
                    required
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </Grid>
              </>
            )}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                label="Specialization"
                value={form.specialization}
                onChange={(e) => setForm({ ...form, specialization: e.target.value })}
                placeholder="e.g., Photo Editing, Video Editing"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                label="Contact No"
                value={form.contactNo}
                onChange={(e) => setForm({ ...form, contactNo: e.target.value })}
              />
            </Grid>
            {editItem && (
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={form.isActive}
                      onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                    />
                  }
                  label="Active"
                />
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={!editItem && (!form.name?.trim() || !form.email?.trim())}
          >
            {editItem ? "Update" : "Add"}
          </Button>
        </DialogActions>
      </Dialog>

      <StaffCredentialsDialog
        open={Boolean(creds)}
        onClose={() => setCreds(null)}
        email={creds?.email}
        temporaryPassword={creds?.temporaryPassword}
        emailSent={creds?.emailSent}
      />
    </>
  );
}
