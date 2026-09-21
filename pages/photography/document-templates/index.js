import React, { useEffect, useState } from "react";
import styles from "@/styles/PageTitle.module.css";
import Link from "next/link";
import {
  Grid,
  Typography,
  Button,
  Box,
  Paper,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditIcon from "@mui/icons-material/Edit";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DescriptionIcon from "@mui/icons-material/Description";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import BASE_URL from "Base/api";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";

const CATEGORY_ID = 308;
const AGREEMENT_TYPE = 3;

export default function DocumentTemplates() {
  const sessionCategory = typeof window !== "undefined" ? sessionStorage.getItem("category") : null;
  const cId = sessionCategory ? parseInt(sessionCategory, 10) : CATEGORY_ID;
  const { navigate, create, update } = IsPermissionEnabled(Number.isFinite(cId) ? cId : CATEGORY_ID);

  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [formData, setFormData] = useState({ name: "", description: "", displayOrder: 0 });
  const [uploading, setUploading] = useState({});

  const fetchTemplates = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${BASE_URL}/PhotographyDocumentTemplate/GetAllTemplates`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const allTemplates = data?.result || [];
      setTemplates(allTemplates.filter((t) => t.documentType === AGREEMENT_TYPE));
    } catch (e) {
      toast.error("Failed to load templates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleOpenDialog = (template = null) => {
    if (template) {
      setEditingTemplate(template);
      setFormData({
        name: template.name,
        description: template.description || "",
        displayOrder: template.displayOrder,
      });
    } else {
      setEditingTemplate(null);
      setFormData({ name: "", description: "", displayOrder: 0 });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingTemplate(null);
    setFormData({ name: "", description: "", displayOrder: 0 });
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error("Name is required");
      return;
    }
    const token = localStorage.getItem("token");
    const isEdit = Boolean(editingTemplate);
    const url = isEdit
      ? `${BASE_URL}/PhotographyDocumentTemplate/UpdateTemplate`
      : `${BASE_URL}/PhotographyDocumentTemplate/CreateTemplate`;
    const payload = isEdit
      ? { id: editingTemplate.id, ...formData, documentType: AGREEMENT_TYPE }
      : { ...formData, documentType: AGREEMENT_TYPE };

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      const sc = data.statusCode ?? data.StatusCode;
      if (sc === 200 || sc === "SUCCESS") {
        toast.success(data.message || (isEdit ? "Template updated" : "Template created"));
        handleCloseDialog();
        fetchTemplates();
      } else {
        toast.error(data.message || "Failed to save template");
      }
    } catch (e) {
      toast.error("Failed to save template");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this agreement document?")) return;
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${BASE_URL}/PhotographyDocumentTemplate/DeleteTemplate?id=${id}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const sc = data.statusCode ?? data.StatusCode;
      if (sc === 200 || sc === "SUCCESS") {
        toast.success("Agreement deleted");
        fetchTemplates();
      } else {
        toast.error(data.message || "Failed to delete");
      }
    } catch (e) {
      toast.error("Failed to delete");
    }
  };

  const handleSetActive = async (id) => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${BASE_URL}/PhotographyDocumentTemplate/SetActiveTemplate?templateId=${id}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const sc = data.statusCode ?? data.StatusCode;
      if (sc === 200 || sc === "SUCCESS") {
        toast.success(data.message || "Agreement activated");
        fetchTemplates();
      } else {
        toast.error(data.message || "Failed to activate");
      }
    } catch (e) {
      toast.error("Failed to activate");
    }
  };

  const handleUpload = async (templateId, file) => {
    const token = localStorage.getItem("token");
    const formDataUpload = new FormData();
    formDataUpload.append("templateId", templateId);
    formDataUpload.append("file", file);

    setUploading((prev) => ({ ...prev, [templateId]: true }));

    try {
      const res = await fetch(`${BASE_URL}/PhotographyDocumentTemplate/UploadDocument`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formDataUpload,
      });
      const data = await res.json();
      const sc = data.statusCode ?? data.StatusCode;
      if (sc === 200 || sc === "SUCCESS") {
        toast.success(data.message || "Document uploaded to S3");
        fetchTemplates();
      } else {
        toast.error(data.message || "Failed to upload document");
      }
    } catch (e) {
      toast.error("Failed to upload document");
    } finally {
      setUploading((prev) => ({ ...prev, [templateId]: false }));
    }
  };

  if (!navigate) return <AccessDenied />;

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>📄 Agreement Documents</h1>
        <ul>
          <li>
            <Link href="/photography/reservations/">Photography</Link>
          </li>
          <li>Agreement Documents</li>
        </ul>
      </div>

      <Paper sx={{ p: 2 }} className="bg-black">
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box>
            <Typography variant="h6">📝 Agreement Documents</Typography>
            <Typography variant="body2" color="text.secondary">
              Upload agreement documents to be sent with quotations. Files are stored in S3 (photography folder).
            </Typography>
          </Box>
          {create && (
            <Button variant="outlined" startIcon={<AddCircleOutlineIcon />} onClick={() => handleOpenDialog()}>
              Add Agreement
            </Button>
          )}
        </Box>

        {loading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : templates.length === 0 ? (
          <Box textAlign="center" py={4}>
            <Typography color="text.secondary">No agreement documents found. Add your first agreement.</Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Document</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {templates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>{template.name}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">{template.description || "-"}</Typography>
                    </TableCell>
                    <TableCell>
                      {template.documentUrl ? (
                        <Box display="flex" alignItems="center" gap={1}>
                          <DescriptionIcon color="success" fontSize="small" />
                          <Tooltip title="View Document">
                            <IconButton size="small" onClick={() => window.open(template.documentUrl, "_blank")}>
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Button
                            size="small"
                            variant="text"
                            component="label"
                            startIcon={uploading[template.id] ? <CircularProgress size={14} /> : <CloudUploadIcon />}
                            disabled={uploading[template.id]}
                          >
                            Replace
                            <input type="file" hidden accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => e.target.files?.[0] && handleUpload(template.id, e.target.files[0])} />
                          </Button>
                        </Box>
                      ) : (
                        <Button
                          size="small"
                          variant="outlined"
                          component="label"
                          startIcon={uploading[template.id] ? <CircularProgress size={16} /> : <CloudUploadIcon />}
                          disabled={uploading[template.id]}
                        >
                          Upload to S3
                          <input type="file" hidden accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => e.target.files?.[0] && handleUpload(template.id, e.target.files[0])} />
                        </Button>
                      )}
                    </TableCell>
                    <TableCell>
                      {template.isActive ? (
                        <Chip label="Active" color="success" size="small" icon={<CheckCircleIcon />} />
                      ) : (
                        <Chip label="Inactive" variant="outlined" size="small" />
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <Box display="flex" gap={0.5} justifyContent="end">
                        {!template.isActive && template.documentUrl && (
                          <Tooltip title="Set as Active">
                            <IconButton size="small" color="success" onClick={() => handleSetActive(template.id)}>
                              <CheckCircleIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {update && (
                          <Tooltip title="Edit">
                            <IconButton size="small" onClick={() => handleOpenDialog(template)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="Delete">
                          <IconButton size="small" color="error" onClick={() => handleDelete(template.id)}>
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <Box mt={2} p={2} bgcolor="info.main" borderRadius={1} sx={{ opacity: 0.9 }}>
          <Typography variant="body2" color="info.contrastText">
            <strong>Note:</strong> The active agreement document will be automatically sent along with quotations via WhatsApp.
            Documents are uploaded to S3 in the <code>photography/agreements</code> folder.
          </Typography>
        </Box>
      </Paper>

      {/* Add/Edit Agreement Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingTemplate ? "Edit Agreement" : "Add Agreement"}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Agreement Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="e.g. Wedding Photography Agreement 2026"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                minRows={2}
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description for this agreement document"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                type="number"
                label="Display Order"
                value={formData.displayOrder}
                onChange={(e) => setFormData({ ...formData, displayOrder: Number(e.target.value) })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>
            {editingTemplate ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
