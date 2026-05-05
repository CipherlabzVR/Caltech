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
} from "@mui/material";
import { Search, StyledInputBase } from "@/styles/main/search-styles";
import BASE_URL from "Base/api";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";

export default function SuccessStories() {
  const cId = sessionStorage.getItem("category");
  const { navigate, create, update, remove } = IsPermissionEnabled(cId);
  const [stories, setStories] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStory, setEditingStory] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    coupleName: "",
    coupleNameSi: "",
    quote: "",
    quoteSi: "",
    imageUrl: "",
    displayOrder: 0,
    isActive: true,
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [storyToDelete, setStoryToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const fetchStories = async (currentPage = page, currentRowsPerPage = rowsPerPage, currentSearch = searchTerm) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const skipCount = currentPage * currentRowsPerPage;
      const searchValue = currentSearch?.trim() ? encodeURIComponent(currentSearch.trim()) : "null";
      const response = await fetch(
        `${BASE_URL}/Matrimonial/GetAllSuccessStoriesPaged?SkipCount=${skipCount}&MaxResultCount=${currentRowsPerPage}&Search=${searchValue}`,
        {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        }
      );
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      setStories(data?.result?.items || []);
      setTotalCount(data?.result?.totalCount || 0);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to fetch success stories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStories(page, rowsPerPage, searchTerm);
  }, [page, rowsPerPage, searchTerm]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setPage(0);
  };

  const openCreate = () => {
    setEditingStory(null);
    setForm({
      coupleName: "",
      coupleNameSi: "",
      quote: "",
      quoteSi: "",
      imageUrl: "",
      displayOrder: stories.length,
      isActive: true,
    });
    setDialogOpen(true);
  };

  const openEdit = (story) => {
    setEditingStory(story);
    setForm({
      coupleName: story.coupleName || "",
      coupleNameSi: story.coupleNameSi || "",
      quote: story.quote || "",
      quoteSi: story.quoteSi || "",
      imageUrl: story.imageUrl || "",
      displayOrder: story.displayOrder ?? 0,
      isActive: story.isActive ?? true,
    });
    setDialogOpen(true);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file (JPG, PNG, GIF, etc.)");
      return;
    }
    setUploadingImage(true);
    try {
      const formData = new FormData();
      const ext = file.name.split(".").pop() || "jpg";
      const fileName = `success-story-${Date.now()}.${ext}`;
      formData.append("File", file);
      formData.append("FileName", fileName);
      formData.append("storePath", "MatrimonialSuccessStories");

      const token = localStorage.getItem("token");
      const response = await fetch(`${BASE_URL}/AWS/DocumentUploadCommon`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const text = await response.text();
      if (response.ok) {
        let url = text;
        if (text.startsWith("{") || text.startsWith("[")) {
          try {
            const data = JSON.parse(text);
            url = data?.result ?? data?.url ?? data;
          } catch {
            throw new Error("Invalid response");
          }
        }
        if (typeof url === "string" && url.startsWith("http")) {
          setForm((f) => ({ ...f, imageUrl: url }));
          toast.success("Image uploaded");
        } else {
          throw new Error("Upload failed - no URL returned");
        }
      } else {
        throw new Error(text || "Upload failed");
      }
    } catch (error) {
      toast.error(error.message || "Failed to upload image");
    } finally {
      setUploadingImage(false);
      e.target.value = "";
    }
  };

  const handleSave = async () => {
    if (!form.coupleName?.trim()) {
      toast.error("Couple name is required");
      return;
    }
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const url = editingStory
        ? `${BASE_URL}/Matrimonial/UpdateSuccessStory`
        : `${BASE_URL}/Matrimonial/CreateSuccessStory`;
      const body = {
        id: editingStory?.id,
        coupleName: form.coupleName.trim(),
        coupleNameSi: form.coupleNameSi.trim(),
        quote: form.quote.trim(),
        quoteSi: form.quoteSi.trim(),
        imageUrl: form.imageUrl.trim(),
        displayOrder: Number(form.displayOrder) || 0,
        isActive: form.isActive,
      };
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (data.statusCode !== 1 && data.statusCode !== 200) {
        throw new Error(data.message || "Failed to save");
      }
      toast.success(editingStory ? "Success story updated" : "Success story created");
      setDialogOpen(false);
      fetchStories();
    } catch (error) {
      toast.error(error.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const openDelete = (story) => {
    setStoryToDelete(story);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!storyToDelete) return;
    setDeleting(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${BASE_URL}/Matrimonial/DeleteSuccessStory?id=${storyToDelete.id}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      const data = await response.json();
      if (data.statusCode !== 1 && data.statusCode !== 200) {
        throw new Error(data.message || "Failed to delete");
      }
      toast.success("Success story deleted");
      setDeleteDialogOpen(false);
      setStoryToDelete(null);
      fetchStories();
    } catch (error) {
      toast.error(error.message || "Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  if (!navigate) return <AccessDenied />;

  return (
    <>
      <div className={styles.pageTitle}>
        <div>
          <h1>Success Stories</h1>
          <ul>
            <li>
              <Link href="/matrimonial/matrimonial/">Matrimonial</Link>
            </li>
            <li>Success Stories</li>
          </ul>
        </div>
        {create && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={openCreate}
          >
            Add Success Story
          </Button>
        )}
      </div>

      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Box display="flex" justifyContent="flex-start" alignItems="center" mb={2}>
            <Search className="search-form">
              <StyledInputBase
                placeholder="Search by couple name or quote..."
                inputProps={{ "aria-label": "search" }}
                value={searchTerm}
                onChange={handleSearchChange}
              />
            </Search>
          </Box>

          <TableContainer component={Paper}>
            <Table className="dark-table">
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Order</TableCell>
                  <TableCell>Couple Name (EN)</TableCell>
                  <TableCell>Couple Name (SI)</TableCell>
                  <TableCell>Quote (preview)</TableCell>
                  <TableCell>Image</TableCell>
                  <TableCell>Active</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography>Loading...</Typography>
                    </TableCell>
                  </TableRow>
                ) : stories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography color="textSecondary">
                        No success stories. Add from backoffice to show on website.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  stories.map((row, idx) => (
                    <TableRow key={row.id}>
                      <TableCell>{page * rowsPerPage + idx + 1}</TableCell>
                      <TableCell>{row.displayOrder}</TableCell>
                      <TableCell>{row.coupleName || "-"}</TableCell>
                      <TableCell>{row.coupleNameSi || "-"}</TableCell>
                      <TableCell sx={{ maxWidth: 200 }}>
                        {(row.quote || "").slice(0, 60)}
                        {(row.quote || "").length > 60 ? "…" : ""}
                      </TableCell>
                      <TableCell>
                        {row.imageUrl ? (
                          <img
                            src={row.imageUrl}
                            alt=""
                            style={{ width: 48, height: 36, objectFit: "cover", borderRadius: 4 }}
                          />
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={row.isActive ? "Yes" : "No"}
                          size="small"
                          color={row.isActive ? "success" : "default"}
                          variant="outlined"
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
            <Grid container justifyContent="space-between" mt={2} mb={2}>
              <Pagination
                count={Math.max(1, Math.ceil(totalCount / rowsPerPage))}
                page={page + 1}
                onChange={(_, value) => setPage(value - 1)}
                color="primary"
                shape="rounded"
              />
              <FormControl size="small" sx={{ mr: 2, width: "100px" }}>
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

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingStory ? "Edit Success Story" : "Add Success Story"}</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} pt={1}>
            <TextField
              label="Couple Name (English)"
              value={form.coupleName}
              onChange={(e) => setForm((f) => ({ ...f, coupleName: e.target.value }))}
              fullWidth
              required
              placeholder="e.g. Nadeesha & Rajitha"
            />
            <TextField
              label="Couple Name (Sinhala)"
              value={form.coupleNameSi}
              onChange={(e) => setForm((f) => ({ ...f, coupleNameSi: e.target.value }))}
              fullWidth
              placeholder="e.g. නදීෂා සහ රාජිතා"
            />
            <TextField
              label="Quote (English)"
              value={form.quote}
              onChange={(e) => setForm((f) => ({ ...f, quote: e.target.value }))}
              fullWidth
              multiline
              rows={4}
              placeholder="Testimonial text shown on website"
            />
            <TextField
              label="Quote (Sinhala)"
              value={form.quoteSi}
              onChange={(e) => setForm((f) => ({ ...f, quoteSi: e.target.value }))}
              fullWidth
              multiline
              rows={4}
              placeholder="සිංහල පෙළ"
            />
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Image
              </Typography>
              <Box display="flex" flexDirection="column" gap={1}>
                <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<CloudUploadIcon />}
                    disabled={uploadingImage}
                  >
                    {uploadingImage ? "Uploading..." : "Upload Image"}
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={handleImageUpload}
                    />
                  </Button>
                  {form.imageUrl && (
                    <Button
                      size="small"
                      color="error"
                      variant="text"
                      onClick={() => setForm((f) => ({ ...f, imageUrl: "" }))}
                    >
                      Remove
                    </Button>
                  )}
                </Box>
                {form.imageUrl && (
                  <Box
                    sx={{
                      width: 120,
                      height: 90,
                      borderRadius: 1,
                      overflow: "hidden",
                      border: "1px solid",
                      borderColor: "divider",
                    }}
                  >
                    <img
                      src={form.imageUrl}
                      alt="Preview"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />
                  </Box>
                )}
                <TextField
                  label="Or paste image URL"
                  value={form.imageUrl}
                  onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
                  fullWidth
                  size="small"
                  placeholder="https://..."
                />
              </Box>
            </Box>
            <TextField
              label="Display Order"
              type="number"
              value={form.displayOrder}
              onChange={(e) => setForm((f) => ({ ...f, displayOrder: e.target.value }))}
              fullWidth
              inputProps={{ min: 0 }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={form.isActive}
                  onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                />
              }
              label="Active (show on website)"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialogOpen} onClose={() => !deleting && setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Success Story</DialogTitle>
        <DialogContent>
          Are you sure you want to delete &quot;{storyToDelete?.coupleName}&quot;?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
            Cancel
          </Button>
          <Button color="error" variant="contained" onClick={handleDelete} disabled={deleting}>
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      <ToastContainer />
    </>
  );
}
