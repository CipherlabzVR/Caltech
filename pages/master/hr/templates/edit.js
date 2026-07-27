import React, { useRef, useState, useEffect, useCallback } from "react";
import Button from "@mui/material/Button";
import Modal from "@mui/material/Modal";
import BorderColorIcon from "@mui/icons-material/BorderColor";
import {
  Box,
  Checkbox,
  Chip,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  Tooltip,
  Typography,
} from "@mui/material";
import TextField from "@mui/material/TextField";
import { Field, Form, Formik } from "formik";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import * as Yup from "yup";
import BASE_URL from "Base/api";
import { getOrgId } from "@/components/utils/apiHelpers";
import TemplateSignatureSection from "./TemplateSignatureSection";
import TemplatePreviewDialog from "./TemplatePreviewDialog";
import { fetchCompanyLetterheadUrl } from "@/components/utils/fetchCompanyLetterheadUrl";
import RichTextEditor from "@/components/help-desk/RichTextEditor";

const TEMPLATE_TYPES = ["OfferLetter", "Email", "Other"];

const COMPANY_SELECT_NONE_VALUE = "__no_company__";

const isDocumentTemplateType = (t) =>
  t === "OfferLetter" || t === "Other";

const PLACEHOLDER_HINTS = [
  "{{EmployeeName}}",
  "{{JoinDate}}",
  "{{Position}}",
  "{{Salary}}",
  "{{CompanyName}}",
];

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

const validationSchema = Yup.object().shape({
  Name: Yup.string().trim().required("Template name is required"),
  Type: Yup.string().required("Type is required"),
  SubjectLine: Yup.string().max(500, "Subject must be at most 500 characters"),
  IssuedBy: Yup.string().max(200, "Issued By must be at most 200 characters"),
  RecipientAddress: Yup.string().max(
    500,
    "Recipient Address must be at most 500 characters"
  ),
  Content: Yup.string()
    .required("Content is required")
    .test(
      "non-empty-html",
      "Content is required",
      (value) => {
        if (!value || typeof value !== "string") return false;
        const text = value
          .replace(/<[^>]*>/g, " ")
          .replace(/&nbsp;/gi, " ")
          .trim();
        return text.length > 0;
      }
    ),
});

export default function EditTemplateDialog({ item, fetchItems }) {
  const templateId = item?.id ?? item?.Id;
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewSnapshot, setPreviewSnapshot] = useState(null);
  const [letterheadUrl, setLetterheadUrl] = useState(null);
  const letterheadFetchSeq = useRef(0);
  const quillRef = useRef(null);

  const loadLetterheadForCompanyId = useCallback(async (rawCompanyId) => {
    if (rawCompanyId === "" || rawCompanyId == null) {
      letterheadFetchSeq.current += 1;
      setLetterheadUrl(null);
      return;
    }
    const seq = ++letterheadFetchSeq.current;
    const url = await fetchCompanyLetterheadUrl(rawCompanyId);
    if (letterheadFetchSeq.current !== seq) return;
    setLetterheadUrl(url);
  }, []);

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setPreviewOpen(false);
    setPreviewSnapshot(null);
    letterheadFetchSeq.current += 1;
    setLetterheadUrl(null);
  };

  const handleOpenPreview = (values) => {
    setPreviewSnapshot({ ...values });
    setPreviewOpen(true);
  };

  const handleClosePreview = () => {
    setPreviewOpen(false);
    setPreviewSnapshot(null);
  };

  useEffect(() => {
    if (!open) return;
    const token = localStorage.getItem("token");
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${BASE_URL}/Company/GetAllCompanies`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (!res.ok) return;
        const json = await res.json();
        const list = json.result ?? json.Result ?? [];
        if (!cancelled && Array.isArray(list)) setCompanies(list);
      } catch {
        //
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const cid = item?.companyId ?? item?.CompanyId;
    void loadLetterheadForCompanyId(
      cid != null && cid !== "" ? String(cid) : ""
    );
  }, [open, item?.companyId, item?.CompanyId, loadLetterheadForCompanyId]);

  const handleSubmit = async (values) => {
    const token = localStorage.getItem("token");
    const orgId = getOrgId() ?? 0;
    try {
      setSubmitting(true);
      const res = await fetch(`${BASE_URL}/hr/templates/${templateId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          OrgId: orgId,
          Name: values.Name.trim(),
          Type: values.Type,
          SubjectLine:
            values.Type === "Email"
              ? values.SubjectLine?.trim() || null
              : null,
          Content: values.Content,
          IsActive: values.IsActive,
          CompanyId:
            values.CompanyId === "" || values.CompanyId == null
              ? null
              : Number(values.CompanyId),
          IssuedBy: values.IssuedBy?.trim() || null,
          IncludeLetterhead: values.IncludeLetterhead,
          IsSystemGenerated: values.IsSystemGenerated,
          RecipientAddress: values.RecipientAddress?.trim() || null,
          SignatureImageUrl: values.SignatureImageUrl?.trim() || null,
        }),
      });
      const data = await res.json();
      if (data.statusCode === 200) {
        toast.success(data.message || "Template updated.");
        handleClose();
        if (fetchItems) fetchItems();
      } else {
        toast.error(data.message || "Failed to update template.");
      }
    } catch (err) {
      toast.error(err.message || "An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  if (templateId == null) return null;

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
        aria-labelledby="template-edit-title"
      >
        <Box sx={modalStyle} className="bg-black">
          <Formik
            initialValues={{
              Name: item?.name ?? item?.Name ?? "",
              Type: item?.type ?? item?.Type ?? "OfferLetter",
              SubjectLine:
                item?.subjectLine ?? item?.SubjectLine ?? "",
              Content: item?.content ?? item?.Content ?? "",
              IssuedBy: item?.issuedBy ?? item?.IssuedBy ?? "",
              IncludeLetterhead:
                item?.includeLetterhead ?? item?.IncludeLetterhead ?? true,
              IsSystemGenerated:
                item?.isSystemGenerated ?? item?.IsSystemGenerated ?? false,
              RecipientAddress:
                item?.recipientAddress ?? item?.RecipientAddress ?? "",
              SignatureImageUrl:
                item?.signatureImageUrl ?? item?.SignatureImageUrl ?? "",
              IsActive: item?.isActive ?? item?.IsActive ?? true,
              CompanyId:
                item?.companyId != null && item?.companyId !== ""
                  ? String(item.companyId)
                  : item?.CompanyId != null && item?.CompanyId !== ""
                    ? String(item.CompanyId)
                    : "",
            }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
            enableReinitialize
          >
            {({ errors, touched, values, setFieldValue, setFieldTouched }) => {
              const handleCompanyChange = async (companyId) => {
                setFieldValue(
                  "CompanyId",
                  companyId === "" || companyId == null ? "" : companyId
                );
                await loadLetterheadForCompanyId(companyId);
              };

              const insertPlaceholder = (token) => {
                const api = quillRef.current;
                const editor =
                  api && typeof api.getEditor === "function"
                    ? api.getEditor()
                    : null;
                if (editor) {
                  const range = editor.getSelection?.();
                  const position = range ? range.index : 0;
                  editor.insertText(position, token);
                  return;
                }
                const prev = values.Content || "";
                setFieldValue("Content", prev + token);
                setFieldTouched("Content", true);
              };

              return (
              <Form>
                <Typography
                  variant="h5"
                  sx={{ fontWeight: 500, mb: 2 }}
                  id="template-edit-title"
                >
                  Edit Template
                </Typography>

                <Grid container spacing={2}>
                  {/* Name */}
                  <Grid item xs={12} sm={8}>
                    <Typography sx={labelSx}>
                      Template Name <span style={{ color: "red" }}>*</span>
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

                  {/* Type */}
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth size="small" required>
                      <InputLabel id="template-edit-type-label">Type</InputLabel>
                      <Select
                        labelId="template-edit-type-label"
                        id="template-edit-type-select"
                        label="Type"
                        value={values.Type}
                        onChange={(e) => {
                          const v = e.target.value;
                          setFieldValue("Type", v);
                          if (v !== "Email") setFieldValue("SubjectLine", "");
                          if (v === "Email") {
                            setFieldValue("IssuedBy", "");
                            setFieldValue("IncludeLetterhead", true);
                            setFieldValue("IsSystemGenerated", false);
                            setFieldValue("RecipientAddress", "");
                            setFieldValue("SignatureImageUrl", "");
                          }
                        }}
                      >
                        {TEMPLATE_TYPES.map((t) => (
                          <MenuItem key={t} value={t}>
                            {t === "OfferLetter" ? "Offer Letter" : t}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* Company */}
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth size="small">
                      <InputLabel id="template-edit-company-label">Company</InputLabel>
                      <Select
                        labelId="template-edit-company-label"
                        id="template-edit-company-select"
                        label="Company"
                        value={
                          values.CompanyId === "" ||
                          values.CompanyId == null ||
                          values.CompanyId === undefined
                            ? COMPANY_SELECT_NONE_VALUE
                            : String(values.CompanyId)
                        }
                        onChange={(e) => {
                          const v = e.target.value;
                          void handleCompanyChange(
                            v === COMPANY_SELECT_NONE_VALUE ? "" : v
                          );
                        }}
                      >
                        <MenuItem value={COMPANY_SELECT_NONE_VALUE}>
                          <em>None</em>
                        </MenuItem>
                        {companies.map((c) => {
                          const cid = c.id ?? c.Id;
                          const cname = c.name ?? c.Name ?? "";
                          return (
                            <MenuItem key={cid} value={String(cid)}>
                              {cname}
                            </MenuItem>
                          );
                        })}
                      </Select>
                    </FormControl>
                  </Grid>

                  {values.Type === "Email" && (
                    <Grid item xs={12}>
                      <TextField
                        label="Email Subject"
                        name="SubjectLine"
                        value={values.SubjectLine}
                        onChange={(e) =>
                          setFieldValue("SubjectLine", e.target.value)
                        }
                        onBlur={() => setFieldTouched("SubjectLine", true)}
                        fullWidth
                        size="small"
                        placeholder="e.g. Job Offer - {{Position}} at {{CompanyName}}"
                        error={
                          touched.SubjectLine && Boolean(errors.SubjectLine)
                        }
                        helperText={
                          touched.SubjectLine && errors.SubjectLine
                            ? errors.SubjectLine
                            : "You can use placeholders like {{EmployeeName}}"
                        }
                      />
                    </Grid>
                  )}

                  {/* Content */}
                  <Grid item xs={12}>
                    <Typography sx={labelSx}>
                      Content <span style={{ color: "red" }}>*</span>
                    </Typography>
                    <Typography variant="caption" sx={{ display: "block", mb: 0.5 }}>
                      Insert Placeholder:
                    </Typography>
                    <Box
                      sx={{
                        display: "flex",
                        gap: 1,
                        flexWrap: "wrap",
                        mb: 1,
                      }}
                    >
                      {PLACEHOLDER_HINTS.map((p) => (
                        <Chip
                          key={p}
                          label={p}
                          onClick={() => insertPlaceholder(p)}
                          variant="outlined"
                          size="small"
                          sx={{ cursor: "pointer", fontFamily: "monospace" }}
                        />
                      ))}
                    </Box>
                    <RichTextEditor
                      ref={quillRef}
                      value={values.Content || ""}
                      onChange={(html) => {
                        setFieldValue("Content", html);
                        setFieldTouched("Content", true);
                      }}
                      error={touched.Content && !!errors.Content}
                      helperText={
                        touched.Content && errors.Content ? errors.Content : undefined
                      }
                      placeholder="Type your template content here. Use {{EmployeeName}}, {{JoinDate}}, etc. for dynamic values."
                    />
                  </Grid>

                  {isDocumentTemplateType(values.Type) && (
                    <>
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" sx={{ mt: 1, mb: 1.5 }}>
                        Document Settings
                      </Typography>
                      <TextField
                        label="Issued By"
                        value={values.IssuedBy}
                        onChange={(e) =>
                          setFieldValue("IssuedBy", e.target.value)
                        }
                        onBlur={() => setFieldTouched("IssuedBy", true)}
                        fullWidth
                        size="small"
                        placeholder="e.g. HR Manager, CEO"
                        error={touched.IssuedBy && Boolean(errors.IssuedBy)}
                        helperText={
                          touched.IssuedBy && errors.IssuedBy
                            ? errors.IssuedBy
                            : "Person authorizing this document"
                        }
                        sx={{ mb: 2 }}
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={values.IncludeLetterhead}
                            onChange={(e) =>
                              setFieldValue(
                                "IncludeLetterhead",
                                e.target.checked
                              )
                            }
                          />
                        }
                        label="Include Company Letterhead in PDF"
                        sx={{ display: "block", mb: 1 }}
                      />
                      <Box sx={{ mb: 2 }}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={values.IsSystemGenerated}
                              onChange={(e) =>
                                setFieldValue(
                                  "IsSystemGenerated",
                                  e.target.checked
                                )
                              }
                            />
                          }
                          label="System Generated Document"
                        />
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          display="block"
                          sx={{ ml: 4.5, mt: -0.5 }}
                        >
                          Adds &quot;This is a system generated document&quot;
                          note — no signature required
                        </Typography>
                      </Box>
                      <TextField
                        label="Recipient Address"
                        value={values.RecipientAddress}
                        onChange={(e) =>
                          setFieldValue("RecipientAddress", e.target.value)
                        }
                        onBlur={() => setFieldTouched("RecipientAddress", true)}
                        multiline
                        rows={3}
                        fullWidth
                        size="small"
                        placeholder="Address will appear at top of letter"
                        error={
                          touched.RecipientAddress &&
                          Boolean(errors.RecipientAddress)
                        }
                        helperText={
                          touched.RecipientAddress && errors.RecipientAddress
                            ? errors.RecipientAddress
                            : undefined
                        }
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TemplateSignatureSection
                        mode="edit"
                        templateId={templateId}
                        orgId={getOrgId() ?? 0}
                        signatureImageUrl={values.SignatureImageUrl}
                        onSignatureUrlChange={(url) =>
                          setFieldValue("SignatureImageUrl", url ?? "")
                        }
                        pendingSignatureFile={null}
                        onPendingSignatureChange={() => {}}
                      />
                    </Grid>
                    </>
                  )}
                </Grid>

                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  flexWrap="wrap"
                  gap={1}
                  mt={3}
                >
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
                  <Box display="flex" gap={1} flexWrap="wrap">
                    <Button
                      type="button"
                      variant="outlined"
                      onClick={() => handleOpenPreview(values)}
                      sx={footerButtonSx}
                      disabled={submitting}
                    >
                      Preview
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
                </Box>
              </Form>
            );
            }}
          </Formik>
        </Box>
      </Modal>

      <TemplatePreviewDialog
        open={previewOpen}
        onClose={handleClosePreview}
        values={previewSnapshot}
        companies={companies}
        letterheadUrl={letterheadUrl}
      />
    </>
  );
}
