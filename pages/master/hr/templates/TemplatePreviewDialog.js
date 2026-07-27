import React from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Paper,
  Typography,
} from "@mui/material";

/**
 * @param {string | null | undefined} str
 * @param {string} companyDisplayName resolved name or fallback
 */
export function applyTemplatePreviewPlaceholders(str, companyDisplayName) {
  const joinDate = new Date().toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const company = (companyDisplayName ?? "").trim() || "Your Company";
  let s = str ?? "";
  s = s.replace(/\{\{EmployeeName\}\}/g, "John Doe");
  s = s.replace(/\{\{Position\}\}/g, "Software Engineer");
  s = s.replace(/\{\{JoinDate\}\}/g, joinDate);
  s = s.replace(/\{\{Salary\}\}/g, "50,000");
  s = s.replace(/\{\{CompanyName\}\}/g, company);
  return s;
}

function resolveCompanyDisplayName(companyId, companies) {
  if (companyId === "" || companyId == null) return null;
  const id = Number(companyId);
  if (Number.isNaN(id)) return null;
  const c = companies?.find((x) => (x.id ?? x.Id) === id);
  return c?.name ?? c?.Name ?? null;
}

function isNonEmptyHtml(html) {
  if (!html || typeof html !== "string") return false;
  const text = html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .trim();
  return text.length > 0;
}

export default function TemplatePreviewDialog({
  open,
  onClose,
  values,
  companies,
  letterheadUrl = null,
}) {
  const companyName =
    resolveCompanyDisplayName(values?.CompanyId, companies) || "Your Company";

  const resolvedContent = applyTemplatePreviewPlaceholders(
    values?.Content,
    companyName
  );
  const resolvedSubject =
    values?.Type === "Email"
      ? applyTemplatePreviewPlaceholders(values?.SubjectLine ?? "", companyName)
      : "";

  const type = values?.Type;
  const isDocument = type === "OfferLetter" || type === "Other";
  const isEmail = type === "Email";

  const includeLetterhead = Boolean(values?.IncludeLetterhead);
  const recipientRaw = (values?.RecipientAddress ?? "").trim();
  const recipient = recipientRaw
    ? applyTemplatePreviewPlaceholders(recipientRaw, companyName)
    : "";
  const issuedBy = (values?.IssuedBy ?? "").trim();
  const sigUrl = (values?.SignatureImageUrl ?? "").trim();
  const systemGen = Boolean(values?.IsSystemGenerated);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      scroll="paper"
      aria-labelledby="template-preview-title"
    >
      <DialogTitle id="template-preview-title">Preview</DialogTitle>
      <DialogContent dividers>
        {isDocument && (
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
              {isNonEmptyHtml(values?.Content) ? (
                <Box
                  className="template-preview-html"
                  dangerouslySetInnerHTML={{ __html: resolvedContent }}
                />
              ) : (
                <Typography color="text.secondary" variant="body2">
                  No content yet.
                </Typography>
              )}
            </Paper>
            {issuedBy ? (
              <Typography variant="body2" sx={{ mt: 2 }}>
                Issued by: {issuedBy}
              </Typography>
            ) : null}
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
        )}

        {isEmail && (
          <Box>
            <Typography variant="body2">
              <strong>From:</strong> HR Team &lt;noreply@example.com&gt;
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              <strong>To:</strong> john.doe@example.com
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              <strong>Subject:</strong>{" "}
              {resolvedSubject.trim() ? resolvedSubject : "(No subject)"}
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Body
            </Typography>
            <Paper variant="outlined" sx={{ p: 2, "& img": { maxWidth: "100%" } }}>
              {isNonEmptyHtml(values?.Content) ? (
                <Box
                  dangerouslySetInnerHTML={{ __html: resolvedContent }}
                />
              ) : (
                <Typography color="text.secondary" variant="body2">
                  No content yet.
                </Typography>
              )}
            </Paper>
          </Box>
        )}

        {!isDocument && !isEmail && values && (
          <Typography color="text.secondary">Select a template type to preview.</Typography>
        )}
      </DialogContent>
      <DialogActions sx={{ flexDirection: "column", alignItems: "stretch", px: 3, pb: 2 }}>
        <Typography variant="caption" color="text.secondary" sx={{ mb: 1, textAlign: "left" }}>
          Preview uses sample data.
          <br />
          Actual values filled during onboarding.
        </Typography>
        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
          <Button onClick={onClose} variant="contained" color="primary">
            Close
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
}
