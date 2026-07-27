import React, { useCallback, useEffect, useState } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Paper,
  Typography,
} from "@mui/material";
import DescriptionIcon from "@mui/icons-material/Description";
import EmailIcon from "@mui/icons-material/Email";
import EditIcon from "@mui/icons-material/Edit";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import RefreshIcon from "@mui/icons-material/Refresh";
import SaveIcon from "@mui/icons-material/Save";
import { toast } from "react-toastify";
import BASE_URL from "Base/api";
import { createAuthHeaders, getOrgId } from "@/components/utils/apiHelpers";
import RichTextEditor from "@/components/help-desk/RichTextEditor";
import { fetchCompanyLetterheadUrl } from "@/components/utils/fetchCompanyLetterheadUrl";

function TemplateTypeIcon({ type }) {
  if (type === "Email") return <EmailIcon fontSize="small" color="action" />;
  if (type === "OfferLetter") return <DescriptionIcon fontSize="small" color="action" />;
  return <DescriptionIcon fontSize="small" color="disabled" />;
}

function parseFilenameFromContentDisposition(header) {
  if (!header) return null;
  const utf8 = /filename\*=UTF-8''([^;\n]+)/i.exec(header);
  if (utf8) {
    try {
      return decodeURIComponent(utf8[1].trim());
    } catch {
      return utf8[1].trim();
    }
  }
  const quoted = /filename="([^"]+)"/i.exec(header);
  if (quoted) return quoted[1];
  const plain = /filename=([^;\n]+)/i.exec(header);
  if (plain) return plain[1].trim().replace(/^"|"$/g, "");
  return null;
}

/** @param {string | null | undefined} html */
function isNonEmptyHtml(html) {
  if (!html || typeof html !== "string") return false;
  const text = html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .trim();
  return text.length > 0;
}

function pickContentField(content, camelKey, pascalKey) {
  if (!content) return undefined;
  if (content[camelKey] !== undefined && content[camelKey] !== null) return content[camelKey];
  return content[pascalKey];
}

/**
 * Document view layout aligned with TemplatePreviewDialog (OfferLetter / Other).
 */
function DocumentTaskPreview({ content, letterheadUrl }) {
  const includeLetterhead = Boolean(
    pickContentField(content, "includeLetterhead", "IncludeLetterhead")
  );
  const recipient = (
    pickContentField(content, "recipientAddress", "RecipientAddress") ?? ""
  ).trim();
  const displayHtml =
    pickContentField(content, "displayContent", "DisplayContent") ??
    pickContentField(content, "editedContent", "EditedContent") ??
    pickContentField(content, "resolvedContent", "ResolvedContent") ??
    "";
  const issuedBy = (pickContentField(content, "issuedBy", "IssuedBy") ?? "").trim();
  const sigUrl = (
    pickContentField(content, "signatureImageUrl", "SignatureImageUrl") ?? ""
  ).trim();
  const companyName = (
    pickContentField(content, "companyName", "CompanyName") ?? ""
  ).trim();
  const systemGen = Boolean(
    pickContentField(content, "isSystemGenerated", "IsSystemGenerated")
  );

  return (
    <Box>
      {includeLetterhead && letterheadUrl ? (
        <Box
          component="img"
          src={letterheadUrl}
          alt="Company letterhead"
          sx={{ width: "100%", display: "block", mb: 2 }}
        />
      ) : null}
      {includeLetterhead && !letterheadUrl ? (
        <Box
          sx={{
            bgcolor: "grey.300",
            color: "grey.700",
            py: 1.5,
            px: 2,
            textAlign: "center",
            typography: "body2",
            fontWeight: 600,
            mb: 2,
            borderRadius: 1,
          }}
        >
          [Company Letterhead]
        </Box>
      ) : null}
      {recipient ? (
        <Typography
          component="div"
          variant="body2"
          sx={{ whiteSpace: "pre-wrap", mb: 2 }}
        >
          {recipient}
        </Typography>
      ) : null}
      <Paper
        variant="outlined"
        sx={{
          p: 2,
          "& img": { maxWidth: "100%", height: "auto" },
          "& p": { mt: 0, mb: 1 },
          "& p:last-child": { mb: 0 },
        }}
      >
        {isNonEmptyHtml(displayHtml) ? (
          <Box
            className="template-preview-html"
            dangerouslySetInnerHTML={{ __html: displayHtml }}
          />
        ) : (
          <Typography color="text.secondary" variant="body2">
            No content yet.
          </Typography>
        )}
      </Paper>
      {sigUrl ? (
        <Box sx={{ mt: 2 }}>
          <Box
            component="img"
            src={sigUrl}
            alt="Signature"
            sx={{ maxHeight: 150, maxWidth: "100%", objectFit: "contain" }}
          />
        </Box>
      ) : null}
      {issuedBy ? (
        <Typography variant="body2" sx={{ mt: 2, fontWeight: 700 }}>
          {issuedBy}
        </Typography>
      ) : null}
      {companyName ? (
        <Typography variant="body2" sx={{ mt: issuedBy ? 0.5 : 2 }}>
          {companyName}
        </Typography>
      ) : null}
      {systemGen ? (
        <Typography
          variant="body2"
          sx={{ mt: 2, fontStyle: "italic", color: "text.secondary" }}
          component="div"
        >
          This is a system generated document.
          <br />
          No signature required.
        </Typography>
      ) : null}
    </Box>
  );
}

/**
 * Email view layout aligned with TemplatePreviewDialog.
 */
function EmailTaskPreview({ content }) {
  const subjectLine =
    pickContentField(content, "subjectLine", "SubjectLine") ?? "";
  const displayHtml =
    pickContentField(content, "displayContent", "DisplayContent") ??
    pickContentField(content, "editedContent", "EditedContent") ??
    pickContentField(content, "resolvedContent", "ResolvedContent") ??
    "";
  const from =
    pickContentField(content, "emailPreviewFrom", "EmailPreviewFrom") ??
    "HR Team <noreply@example.com>";
  const to =
    pickContentField(content, "emailPreviewTo", "EmailPreviewTo") ?? "";

  return (
    <Box>
      <Typography variant="body2">
        <strong>From:</strong> {from}
      </Typography>
      <Typography variant="body2" sx={{ mt: 0.5 }}>
        <strong>To:</strong> {to || "—"}
      </Typography>
      <Typography variant="body2" sx={{ mt: 0.5 }}>
        <strong>Subject:</strong>{" "}
        {subjectLine.trim() ? subjectLine : "(No subject)"}
      </Typography>
      <Divider sx={{ my: 2 }} />
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        Body
      </Typography>
      <Paper variant="outlined" sx={{ p: 2, "& img": { maxWidth: "100%" } }}>
        {isNonEmptyHtml(displayHtml) ? (
          <Box dangerouslySetInnerHTML={{ __html: displayHtml }} />
        ) : (
          <Typography color="text.secondary" variant="body2">
            No content yet.
          </Typography>
        )}
      </Paper>
    </Box>
  );
}

export default function TemplateTaskContentDialog({
  open,
  onClose,
  onboardingId,
  task,
  onboardingCompleted,
  onSaved,
}) {
  const taskId = task?.id;
  const taskTitle = task?.title ?? "";
  const rowTemplateType = task?.templateType ?? task?.TemplateType;

  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [reResolving, setReResolving] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [letterheadUrl, setLetterheadUrl] = useState(null);

  const load = useCallback(async () => {
    if (!taskId) return;
    setLoading(true);
    try {
      const res = await fetch(
        `${BASE_URL}/hr/onboarding/${onboardingId}/tasks/${taskId}/content`,
        { headers: createAuthHeaders() }
      );
      if (res.ok) setContent(await res.json());
      else setContent(null);
    } finally {
      setLoading(false);
    }
  }, [onboardingId, taskId]);

  useEffect(() => {
    if (open && taskId) {
      setEditing(false);
      load();
    }
  }, [open, taskId, load]);

  useEffect(() => {
    if (!open || !content) {
      setLetterheadUrl(null);
      return undefined;
    }

    const includeLetterhead = Boolean(
      pickContentField(content, "includeLetterhead", "IncludeLetterhead")
    );
    if (!includeLetterhead) {
      setLetterheadUrl(null);
      return undefined;
    }

    const fromApi =
      pickContentField(content, "letterheadImageUrl", "LetterheadImageUrl") ??
      null;
    if (fromApi && String(fromApi).trim()) {
      setLetterheadUrl(String(fromApi).trim());
      return undefined;
    }

    const companyId =
      pickContentField(content, "companyId", "CompanyId") ?? null;
    let cancelled = false;
    (async () => {
      const url = await fetchCompanyLetterheadUrl(companyId);
      if (!cancelled) setLetterheadUrl(url);
    })();
    return () => {
      cancelled = true;
    };
  }, [open, content]);

  const effectiveTemplateType =
    content?.templateType ?? content?.TemplateType ?? rowTemplateType;
  const isEmailDialog = effectiveTemplateType === "Email";
  const isDocumentDialog =
    effectiveTemplateType === "OfferLetter" ||
    effectiveTemplateType === "Other";

  const displayHtml =
    pickContentField(content, "displayContent", "DisplayContent") ??
    pickContentField(content, "editedContent", "EditedContent") ??
    pickContentField(content, "resolvedContent", "ResolvedContent") ??
    "";

  const hasContent = isNonEmptyHtml(displayHtml);
  const isEdited = Boolean(
    pickContentField(content, "editedContent", "EditedContent")
  );

  const handleEdit = () => {
    setDraft(displayHtml);
    setEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const orgId = getOrgId() ?? 0;
      const res = await fetch(
        `${BASE_URL}/hr/onboarding/${onboardingId}/tasks/${taskId}/content`,
        {
          method: "PATCH",
          headers: createAuthHeaders(),
          body: JSON.stringify({
            EditedContent: draft,
            OrgId: orgId,
          }),
        }
      );
      const data = await res.json();
      if (data.statusCode === 200) {
        toast.success("Content saved.");
        setEditing(false);
        await load();
        if (onSaved) onSaved();
      } else {
        toast.error(data.message || "Failed to save.");
      }
    } catch (err) {
      toast.error(err.message || "Network error.");
    } finally {
      setSaving(false);
    }
  };

  const handleReResolve = async () => {
    setReResolving(true);
    setConfirmReset(false);
    try {
      const res = await fetch(
        `${BASE_URL}/hr/onboarding/${onboardingId}/tasks/${taskId}/re-resolve`,
        { method: "POST", headers: createAuthHeaders(), body: JSON.stringify({}) }
      );
      const data = await res.json();
      if (data.statusCode === 200) {
        toast.success("Content re-resolved from template.");
        setEditing(false);
        await load();
        if (onSaved) onSaved();
      } else {
        toast.error(data.message || "Re-resolve failed.");
      }
    } catch (err) {
      toast.error(err.message || "Network error.");
    } finally {
      setReResolving(false);
    }
  };

  const handleDownloadPdf = async () => {
    const orgId = getOrgId() ?? 0;
    setDownloadingPdf(true);
    try {
      const res = await fetch(
        `${BASE_URL}/hr/onboarding/${onboardingId}/tasks/${taskId}/download-pdf?orgId=${orgId}`,
        { headers: createAuthHeaders() }
      );
      if (!res.ok) {
        let msg = "Download failed.";
        try {
          const err = await res.json();
          msg = err.message || msg;
        } catch {
          msg = res.statusText || msg;
        }
        toast.error(msg);
        return;
      }
      const blob = await res.blob();
      const cd = res.headers.get("Content-Disposition");
      const fromHeader = parseFilenameFromContentDisposition(cd);
      const safeTitle = (taskTitle || "document").replace(/[<>:"/\\|?*]/g, "_");
      const fallbackName = `${safeTitle}.pdf`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fromHeader || fallbackName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("PDF downloaded.");
    } catch (err) {
      toast.error(err.message || "Network error.");
    } finally {
      setDownloadingPdf(false);
    }
  };

  const showPdfDownload =
    hasContent &&
    (effectiveTemplateType === "OfferLetter" ||
      effectiveTemplateType === "Other");

  if (!open) return null;

  if (isEmailDialog) {
    return (
      <>
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth scroll="paper">
          <DialogTitle>Email Preview</DialogTitle>
          <DialogContent dividers>
            {loading ? (
              <Box display="flex" justifyContent="center" py={3}>
                <CircularProgress size={28} />
              </Box>
            ) : content ? (
              <EmailTaskPreview content={content} />
            ) : (
              <Typography variant="body2" color="text.secondary" fontStyle="italic">
                Content not yet generated.
              </Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={onClose}>Close</Button>
          </DialogActions>
        </Dialog>
      </>
    );
  }

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth scroll="paper">
        <DialogTitle>{taskTitle}</DialogTitle>
        <DialogContent dividers>
          {loading ? (
            <Box display="flex" justifyContent="center" py={3}>
              <CircularProgress size={28} />
            </Box>
          ) : (
            <>
              <Box display="flex" alignItems="center" gap={1} mb={2} flexWrap="wrap">
                {effectiveTemplateType && (
                  <TemplateTypeIcon type={effectiveTemplateType} />
                )}
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                  {effectiveTemplateType ?? ""}
                </Typography>
                {isEdited && (
                  <Chip label="HR Edited" size="small" color="secondary" variant="outlined" />
                )}
                {!isEdited && hasContent && (
                  <Chip label="Generated" size="small" color="info" variant="outlined" />
                )}
              </Box>

              {!hasContent && !editing && (
                <Typography variant="body2" color="text.secondary" fontStyle="italic">
                  Content not yet generated.
                </Typography>
              )}

              {!editing && hasContent && isDocumentDialog && content && (
                <DocumentTaskPreview content={content} letterheadUrl={letterheadUrl} />
              )}

              {!editing && hasContent && !isDocumentDialog && (
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    "& img": { maxWidth: "100%", height: "auto" },
                    "& p": { mt: 0, mb: 1 },
                  }}
                >
                  <Box
                    className="template-preview-html"
                    dangerouslySetInnerHTML={{ __html: displayHtml }}
                  />
                </Paper>
              )}

              {editing && (
                <RichTextEditor
                  value={draft}
                  onChange={setDraft}
                  placeholder="Edit document content…"
                />
              )}
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ flexWrap: "wrap", gap: 1, px: 2, pb: 2 }}>
          {!loading && !editing && hasContent && !onboardingCompleted && (
            <Button variant="outlined" startIcon={<EditIcon />} onClick={handleEdit}>
              Edit
            </Button>
          )}
          {!loading && !editing && hasContent && showPdfDownload && (
            <Button
              variant="outlined"
              color="primary"
              startIcon={
                downloadingPdf ? (
                  <CircularProgress size={14} color="inherit" />
                ) : (
                  <PictureAsPdfIcon />
                )
              }
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
            >
              {downloadingPdf ? "Downloading…" : "Download PDF"}
            </Button>
          )}
          {!loading && editing && (
            <>
              <Button
                variant="contained"
                color="success"
                startIcon={
                  saving ? <CircularProgress size={14} color="inherit" /> : <SaveIcon />
                }
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? "Saving…" : "Save"}
              </Button>
              <Button variant="outlined" onClick={() => setEditing(false)} disabled={saving}>
                Cancel
              </Button>
              {(content?.hasTemplate ?? content?.HasTemplate) && !onboardingCompleted && (
                <Button
                  variant="outlined"
                  color="warning"
                  startIcon={
                    reResolving ? (
                      <CircularProgress size={14} color="inherit" />
                    ) : (
                      <RefreshIcon />
                    )
                  }
                  onClick={() => setConfirmReset(true)}
                  disabled={reResolving || saving}
                >
                  Reset to Original
                </Button>
              )}
            </>
          )}
          <Box sx={{ flex: "1 1 auto" }} />
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={confirmReset} onClose={() => setConfirmReset(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Reset to Original?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            This will re-resolve the content from the template and{" "}
            <strong>discard any HR edits</strong>. This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmReset(false)}>Cancel</Button>
          <Button color="warning" variant="contained" onClick={handleReResolve} disabled={reResolving}>
            {reResolving ? "Resetting…" : "Reset"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
