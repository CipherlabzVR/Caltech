import React, { useCallback, useEffect, useState } from "react";
import Button from "@mui/material/Button";
import Modal from "@mui/material/Modal";
import BorderColorIcon from "@mui/icons-material/BorderColor";
import DeleteIcon from "@mui/icons-material/Delete";
import {
  Box,
  Checkbox,
  Chip,
  Divider,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import TextField from "@mui/material/TextField";
import { Field, Form, Formik } from "formik";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import * as Yup from "yup";
import BASE_URL from "Base/api";
import { createAuthHeaders, getOrgId } from "@/components/utils/apiHelpers";

const ITEM_TYPES = ["Document", "Asset", "Task"];
const ASSIGNED_TO_OPTIONS = ["HR", "IT", "Manager"];

const modalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { lg: 720, md: 600, xs: 360 },
  maxHeight: "90vh",
  overflowY: "auto",
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 3,
};

const labelSx = {
  fontWeight: "500",
  fontSize: "14px",
  mb: "5px",
};

const footerButtonSx = {
  mt: 2,
  textTransform: "uppercase",
  borderRadius: "8px",
  fontWeight: "600",
  fontSize: "13px",
  padding: "12px 20px",
};

const emptyItem = () => ({
  title: "",
  type: "Document",
  isRequired: true,
  assignedTo: "HR",
  templateId: "",
});

/** @returns {number|null} */
function toNullableTemplateId(value) {
  if (value === "" || value == null) return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

function normalizeProfileItem(it) {
  const tid = it.templateId ?? it.TemplateId;
  return {
    id: it.id ?? it.Id,
    title: it.title ?? it.Title ?? "",
    type: it.type ?? it.Type ?? "Document",
    isRequired: it.isRequired ?? it.IsRequired ?? true,
    assignedTo: it.assignedTo ?? it.AssignedTo ?? "HR",
    templateId: tid != null && tid !== "" ? String(tid) : "",
  };
}

const validationSchema = Yup.object().shape({
  Name: Yup.string().trim().required("Profile name is required"),
});

export default function EditOnboardingProfileDialog({ item, fetchItems }) {
  const profileId = item?.id ?? item?.Id;
  const profileName = item?.name ?? item?.Name ?? "";
  const departmentIdInitial = item?.departmentId ?? item?.DepartmentId ?? "";
  const isActiveInitial = item?.isActive ?? item?.IsActive ?? true;

  const [open, setOpen] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [existingItems, setExistingItems] = useState([]);
  const [newItems, setNewItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setNewItems([]);
    setExistingItems([]);
  };

  const loadDepartments = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${BASE_URL}/Employee/GetAlldepartment`, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      if (res.ok) { const json = await res.json(); setDepartments(json.result || json || []); }
    } catch { setDepartments([]); }
  }, []);

  const loadTemplates = useCallback(async () => {
    try {
      const orgId = getOrgId();
      const params = new URLSearchParams({ OrgId: String(orgId || 0), IsActive: "true", MaxResultCount: "200", SkipCount: "0" });
      const res = await fetch(`${BASE_URL}/hr/templates?${params}`, { headers: createAuthHeaders() });
      if (res.ok) {
        const json = await res.json();
        setTemplates(json.result?.items || json.items || json.result || []);
      }
    } catch { setTemplates([]); }
  }, []);

  const loadExistingItems = useCallback(async () => {
    if (profileId == null) return;
    try {
      setLoadingItems(true);
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${BASE_URL}/hr/onboarding-profiles/${profileId}/items`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (res.ok) {
        const json = await res.json();
        const list = json.items || json.result?.items || [];
        setExistingItems(list.map(normalizeProfileItem));
      }
    } catch {
      setExistingItems([]);
    } finally {
      setLoadingItems(false);
    }
  }, [profileId]);

  useEffect(() => {
    if (open) {
      loadDepartments();
      loadTemplates();
      loadExistingItems();
    }
  }, [open, loadDepartments, loadTemplates, loadExistingItems]);

  // ── New-item helpers ────────────────────────────────────────────────────────
  const addNewItem = () => setNewItems((prev) => [...prev, emptyItem()]);

  const removeNewItem = (index) =>
    setNewItems((prev) => prev.filter((_, i) => i !== index));

  const updateNewItem = (index, field, value) =>
    setNewItems((prev) =>
      prev.map((it, i) => (i === index ? { ...it, [field]: value } : it))
    );

  const updateExistingItem = (index, field, value) =>
    setExistingItems((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async (values) => {
    const token = localStorage.getItem("token");
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };

    try {
      setSubmitting(true);

      // 1. Update profile
      const profileRes = await fetch(
        `${BASE_URL}/hr/onboarding-profiles/${profileId}`,
        {
          method: "PUT",
          headers,
          body: JSON.stringify({
            Id: profileId,
            Name: values.Name.trim(),
            DepartmentId: values.DepartmentId || null,
            IsActive: values.IsActive,
          }),
        }
      );

      const profileData = await profileRes.json();
      if (profileData.statusCode !== 200) {
        toast.error(profileData.message || "Failed to update profile.");
        return;
      }

      // 2. Update existing checklist items (e.g. TemplateId)
      for (const it of existingItems) {
        if (it.id == null) continue;
        const itemRes = await fetch(
          `${BASE_URL}/hr/onboarding-profiles/${profileId}/items/${it.id}`,
          {
            method: "PUT",
            headers,
            body: JSON.stringify({
              Id: it.id,
              ProfileId: profileId,
              Title: it.title.trim(),
              Type: it.type,
              IsRequired: it.isRequired,
              AssignedTo: it.assignedTo,
              TemplateId:
                it.type === "Document"
                  ? toNullableTemplateId(it.templateId)
                  : null,
            }),
          }
        );
        let itemData = {};
        try {
          itemData = await itemRes.json();
        } catch {
          itemData = {};
        }
        if (itemData.statusCode !== 200) {
          const detail =
            itemData.message ||
            (itemRes.ok ? "Unknown error" : `${itemRes.status} ${itemRes.statusText}`);
          toast.warning(
            `Profile saved but item "${it.title}" could not be updated: ${detail}`
          );
        }
      }

      // 3. Add new checklist items
      const validNewItems = newItems.filter((it) => it.title.trim() !== "");
      for (const it of validNewItems) {
        const itemRes = await fetch(
          `${BASE_URL}/hr/onboarding-profiles/${profileId}/items`,
          {
            method: "POST",
            headers,
            body: JSON.stringify({
              ProfileId: profileId,
              Title: it.title.trim(),
              Type: it.type,
              IsRequired: it.isRequired,
              AssignedTo: it.assignedTo,
              TemplateId:
                it.type === "Document"
                  ? toNullableTemplateId(it.templateId)
                  : null,
            }),
          }
        );
        let itemData = {};
        try {
          itemData = await itemRes.json();
        } catch {
          itemData = {};
        }
        if (itemData.statusCode !== 200) {
          const detail =
            itemData.message ||
            (itemRes.ok ? "Unknown error" : `${itemRes.status} ${itemRes.statusText}`);
          toast.warning(
            `Profile saved but item "${it.title}" failed to add: ${detail}`
          );
        }
      }

      toast.success(profileData.message || "Onboarding profile updated.");
      handleClose();
      if (fetchItems) fetchItems();
    } catch (err) {
      toast.error(err.message || "An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  if (profileId == null) {
    return null;
  }

  return (
    <>
      <Tooltip title="Edit" placement="top">
        <IconButton onClick={handleOpen} aria-label="edit" size="small">
          <BorderColorIcon color="primary" fontSize="inherit" />
        </IconButton>
      </Tooltip>

      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="onboarding-profile-edit-title"
      >
        <Box sx={modalStyle} className="bg-black">
          <Formik
            initialValues={{
              Name: profileName,
              DepartmentId: departmentIdInitial,
              IsActive: isActiveInitial,
            }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
            enableReinitialize
          >
            {({ errors, touched, values, setFieldValue }) => (
              <Form>
                {/* ── Header ─────────────────────────────────────── */}
                <Typography
                  variant="h5"
                  sx={{ fontWeight: 500, mb: 2 }}
                  id="onboarding-profile-edit-title"
                >
                  Edit Onboarding Profile
                </Typography>

                <Grid container spacing={2}>
                  {/* Name */}
                  <Grid item xs={12} sm={8}>
                    <Typography sx={labelSx}>
                      Profile Name <span style={{ color: "red" }}>*</span>
                    </Typography>
                    <Field
                      as={TextField}
                      fullWidth
                      name="Name"
                      size="small"
                      error={touched.Name && Boolean(errors.Name)}
                      helperText={touched.Name && errors.Name}
                    />
                  </Grid>

                  {/* IsActive */}
                  <Grid item xs={12} sm={4} display="flex" alignItems="flex-end">
                    <FormControlLabel
                      control={
                        <Field
                          as={Checkbox}
                          name="IsActive"
                          checked={values.IsActive}
                          onChange={() =>
                            setFieldValue("IsActive", !values.IsActive)
                          }
                        />
                      }
                      label="Active"
                    />
                  </Grid>

                  {/* Department */}
                  <Grid item xs={12} sm={6}>
                    <Typography sx={labelSx}>Department (optional)</Typography>
                    <FormControl fullWidth size="small">
                      <Select
                        value={values.DepartmentId}
                        displayEmpty
                        onChange={(e) =>
                          setFieldValue("DepartmentId", e.target.value)
                        }
                      >
                        <MenuItem value="">
                          <em>None</em>
                        </MenuItem>
                        {departments.map((d) => (
                          <MenuItem key={d.id} value={d.id}>
                            {d.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>

                {/* ── Existing Items ──────────────────────────────── */}
                <Divider sx={{ my: 3 }} />
                <Typography variant="subtitle1" fontWeight={600} mb={1}>
                  Existing Checklist Items
                </Typography>

                {loadingItems ? (
                  <Typography variant="body2" color="text.secondary">
                    Loading items…
                  </Typography>
                ) : existingItems.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No items yet.
                  </Typography>
                ) : (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Title</TableCell>
                          <TableCell>Type</TableCell>
                          <TableCell>Assigned To</TableCell>
                          <TableCell sx={{ minWidth: 200 }}>Template</TableCell>
                          <TableCell align="center">Required</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {existingItems.map((it, idx) => (
                          <TableRow key={it.id ?? idx}>
                            <TableCell>{it.title}</TableCell>
                            <TableCell>
                              <Chip
                                label={it.type}
                                size="small"
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell>{it.assignedTo}</TableCell>
                            <TableCell>
                              {it.type === "Document" ? (
                                <FormControl fullWidth size="small">
                                  <Select
                                    value={it.templateId}
                                    displayEmpty
                                    onChange={(e) =>
                                      updateExistingItem(
                                        idx,
                                        "templateId",
                                        e.target.value
                                      )
                                    }
                                  >
                                    <MenuItem value="">
                                      <em>None</em>
                                    </MenuItem>
                                    {templates.map((t) => (
                                      <MenuItem
                                        key={t.id ?? t.Id}
                                        value={String(t.id ?? t.Id)}
                                      >
                                        {t.name ?? t.Name}
                                        <Chip
                                          label={t.type ?? t.Type}
                                          size="small"
                                          variant="outlined"
                                          sx={{ ml: 1, fontSize: 10 }}
                                        />
                                      </MenuItem>
                                    ))}
                                  </Select>
                                </FormControl>
                              ) : (
                                <Typography
                                  variant="caption"
                                  color="text.disabled"
                                >
                                  —
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell align="center">
                              {it.isRequired ? (
                                <Chip label="Yes" size="small" color="primary" />
                              ) : (
                                <Chip label="No" size="small" />
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}

                {/* ── Add New Items ───────────────────────────────── */}
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  mt={3}
                  mb={1}
                >
                  <Typography variant="subtitle1" fontWeight={600}>
                    Add New Items
                  </Typography>
                  <Button size="small" variant="outlined" onClick={addNewItem}>
                    + Add Item
                  </Button>
                </Box>

                {newItems.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    Click &ldquo;+ Add Item&rdquo; to append new checklist items.
                  </Typography>
                ) : (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Title</TableCell>
                          <TableCell sx={{ minWidth: 120 }}>Type</TableCell>
                          <TableCell sx={{ minWidth: 130 }}>Assigned To</TableCell>
                          <TableCell sx={{ minWidth: 160 }}>Template</TableCell>
                          <TableCell align="center">Required</TableCell>
                          <TableCell />
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {newItems.map((it, idx) => (
                          <TableRow key={idx}>
                            <TableCell>
                              <TextField
                                fullWidth
                                size="small"
                                placeholder="e.g. Return Equipment"
                                value={it.title}
                                onChange={(e) =>
                                  updateNewItem(idx, "title", e.target.value)
                                }
                              />
                            </TableCell>

                            <TableCell>
                              <FormControl fullWidth size="small">
                                <Select
                                  value={it.type}
                                  onChange={(e) =>
                                    updateNewItem(idx, "type", e.target.value)
                                  }
                                >
                                  {ITEM_TYPES.map((t) => (
                                    <MenuItem key={t} value={t}>
                                      {t}
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            </TableCell>

                            <TableCell>
                              <FormControl fullWidth size="small">
                                <Select
                                  value={it.assignedTo}
                                  onChange={(e) =>
                                    updateNewItem(
                                      idx,
                                      "assignedTo",
                                      e.target.value
                                    )
                                  }
                                >
                                  {ASSIGNED_TO_OPTIONS.map((a) => (
                                    <MenuItem key={a} value={a}>
                                      {a}
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            </TableCell>

                            {/* Template (Document only) */}
                            <TableCell>
                              {it.type === "Document" ? (
                                <FormControl fullWidth size="small">
                                  <Select
                                    value={it.templateId}
                                    displayEmpty
                                    onChange={(e) => updateNewItem(idx, "templateId", e.target.value)}
                                  >
                                    <MenuItem value=""><em>None</em></MenuItem>
                                    {templates.map((t) => (
                                      <MenuItem key={t.id ?? t.Id} value={t.id ?? t.Id}>
                                        {t.name ?? t.Name}
                                        <Chip label={t.type ?? t.Type} size="small" variant="outlined"
                                          sx={{ ml: 1, fontSize: 10 }} />
                                      </MenuItem>
                                    ))}
                                  </Select>
                                </FormControl>
                              ) : (
                                <Typography variant="caption" color="text.disabled">—</Typography>
                              )}
                            </TableCell>

                            <TableCell align="center">
                              <Checkbox
                                size="small"
                                checked={it.isRequired}
                                onChange={(e) =>
                                  updateNewItem(idx, "isRequired", e.target.checked)
                                }
                              />
                            </TableCell>

                            <TableCell>
                              <Tooltip title="Remove">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => removeNewItem(idx)}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}

                {/* ── Footer ─────────────────────────────────────── */}
                <Box display="flex" justifyContent="space-between" mt={3}>
                  <Button
                    variant="contained"
                    color="error"
                    onClick={handleClose}
                    sx={footerButtonSx}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    sx={{ ...footerButtonSx, color: "#fff !important" }}
                    disabled={submitting}
                  >
                    {submitting ? "Saving…" : "Save"}
                  </Button>
                </Box>
              </Form>
            )}
          </Formik>
        </Box>
      </Modal>
    </>
  );
}
