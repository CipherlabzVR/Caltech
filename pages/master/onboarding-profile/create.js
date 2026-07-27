import React, { useCallback, useEffect, useRef, useState } from "react";
import Button from "@mui/material/Button";
import Modal from "@mui/material/Modal";
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
import DeleteIcon from "@mui/icons-material/Delete";
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

/** Stable React row id (not sent to API). */
const emptyItem = (rowId) => ({
  rowId,
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

const validationSchema = Yup.object().shape({
  Name: Yup.string().trim().required("Profile name is required"),
});

export default function AddOnboardingProfileDialog({ fetchItems }) {
  const [open, setOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [departments, setDepartments] = useState([]);
  const [templates, setTemplates] = useState([]);
  const rowIdRef = useRef(0);
  const [items, setItems] = useState(() => {
    rowIdRef.current = 1;
    return [emptyItem(rowIdRef.current)];
  });
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef(null);

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    rowIdRef.current = 0;
    setItems([emptyItem(++rowIdRef.current)]);
    setFormKey((k) => k + 1);
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

  useEffect(() => {
    if (open) {
      loadDepartments();
      loadTemplates();
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, loadDepartments, loadTemplates]);

  // ── Item helpers ────────────────────────────────────────────────────────────
  const addItem = () =>
    setItems((prev) => {
      rowIdRef.current += 1;
      return [...prev, emptyItem(rowIdRef.current)];
    });

  const removeItem = (index) =>
    setItems((prev) => prev.filter((_, i) => i !== index));

  const updateItem = (index, field, value) =>
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
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

      // 1. Create the profile
      const profileRes = await fetch(`${BASE_URL}/hr/onboarding-profiles`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          Name: values.Name.trim(),
          DepartmentId: values.DepartmentId || null,
          IsActive: values.IsActive,
        }),
      });

      const profileData = await profileRes.json();
      if (profileData.statusCode !== 200) {
        toast.error(profileData.message || "Failed to create profile.");
        return;
      }

      const created = profileData.result ?? profileData.Result;
      const profileId = created?.id ?? created?.Id;
      if (profileId == null || profileId === "") {
        toast.error(
          "Profile was saved but the server response did not include a profile id. Checklist items were not added."
        );
        handleClose();
        if (fetchItems) fetchItems();
        return;
      }

      const numericProfileId = Number(profileId);

      // 2. Add checklist items
      const validItems = items.filter((it) => it.title.trim() !== "");
      for (const it of validItems) {
        const itemRes = await fetch(
          `${BASE_URL}/hr/onboarding-profiles/${numericProfileId}/items`,
          {
            method: "POST",
            headers,
            body: JSON.stringify({
              ProfileId: numericProfileId,
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

      toast.success(profileData.message || "Onboarding profile created.");
      handleClose();
      if (fetchItems) fetchItems();
    } catch (err) {
      toast.error(err.message || "An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Button variant="outlined" onClick={handleOpen}>
        + ADD NEW
      </Button>

      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="onboarding-profile-create-title"
      >
        <Box sx={modalStyle} className="bg-black">
          <Formik
            key={formKey}
            initialValues={{ Name: "", DepartmentId: "", IsActive: true }}
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
                  id="onboarding-profile-create-title"
                >
                  Add Onboarding Profile
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
                      inputRef={inputRef}
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

                {/* ── Checklist Items ─────────────────────────────── */}
                <Divider sx={{ my: 3 }} />
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    Checklist Items
                  </Typography>
                  <Button type="button" size="small" variant="outlined" onClick={addItem}>
                    + Add Item
                  </Button>
                </Box>

                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ minWidth: 200 }}>Title</TableCell>
                        <TableCell sx={{ minWidth: 120 }}>Type</TableCell>
                        <TableCell sx={{ minWidth: 130 }}>Assigned To</TableCell>
                        <TableCell sx={{ minWidth: 160 }}>Template</TableCell>
                        <TableCell align="center">Required</TableCell>
                        <TableCell />
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {items.map((item, idx) => (
                        <TableRow key={item.rowId}>
                          {/* Title */}
                          <TableCell sx={{ minWidth: 200 }}>
                            <TextField
                              fullWidth
                              size="small"
                              placeholder="e.g. Sign NDA"
                              value={item.title}
                              onChange={(e) =>
                                updateItem(idx, "title", e.target.value)
                              }
                              sx={{ minWidth: 200, width: "100%" }}
                            />
                          </TableCell>

                          {/* Type */}
                          <TableCell>
                            <FormControl fullWidth size="small">
                              <Select
                                value={item.type}
                                onChange={(e) =>
                                  updateItem(idx, "type", e.target.value)
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

                          {/* Assigned To */}
                          <TableCell>
                            <FormControl fullWidth size="small">
                              <Select
                                value={item.assignedTo}
                                onChange={(e) =>
                                  updateItem(idx, "assignedTo", e.target.value)
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

                          {/* Template (Document type only) */}
                          <TableCell>
                            {item.type === "Document" ? (
                              <FormControl fullWidth size="small">
                                <Select
                                  value={item.templateId}
                                  displayEmpty
                                  onChange={(e) => updateItem(idx, "templateId", e.target.value)}
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

                          {/* Required */}
                          <TableCell align="center">
                            <Checkbox
                              size="small"
                              checked={item.isRequired}
                              onChange={(e) =>
                                updateItem(idx, "isRequired", e.target.checked)
                              }
                            />
                          </TableCell>

                          {/* Remove */}
                          <TableCell>
                            <Tooltip title="Remove">
                              <span>
                                <IconButton
                                  size="small"
                                  color="error"
                                  disabled={items.length === 1}
                                  onClick={() => removeItem(idx)}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* ── Footer ─────────────────────────────────────── */}
                <Box display="flex" justifyContent="space-between" mt={3}>
                  <Button
                    type="button"
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
