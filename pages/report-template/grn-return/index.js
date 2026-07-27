import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  Paper,
  Tooltip,
  Typography,
} from "@mui/material";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import RestartAltOutlinedIcon from "@mui/icons-material/RestartAltOutlined";
import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import styles from "@/styles/PageTitle.module.css";
import BASE_URL from "Base/api";

const REPORT_KEY = "GRNRETURN";
const TEMPLATE_NAME = "Goods Return Note Print Template";

// Sample data used to render a realistic live preview of the template.
const SAMPLE_DATA = {
  companyLogo:
    '<div style="width:150px;height:58px;border:1px dashed #c0c0c0;border-radius:6px;display:flex;align-items:center;justify-content:center;color:#9aa0a6;font:600 12px Arial,sans-serif;">LOGO</div>',
  companyName: "Your Company (Pvt) Ltd",
  companyAddress: "No. 123, Main Street, Colombo 03",
  companyContact: "+94 11 234 5678 / info@company.com",
  documentNo: "GRNR-000045",
  supplierName: "Global Supplies Ltd",
  grnDocumentNo: "GRN-000123",
  returnDate: "26-Jun-2026",
  remark: "Damaged items returned",
  totalQty: "18",
  warehouseName: "Main Warehouse",
  createdBy: "John Perera",
  createdDate: "26-Jun-2026 10:30:00AM",
  subtotal: "12,500.00",
  grossTotal: "12,500.00",
};

const SAMPLE_ROWS = [
  { productName: "A4 Copy Paper 80gsm", productCode: "ITM-1001", batch: "B-2207", expDate: "-", returnQty: "10", unitPrice: "850.00", discountRate: "0.00", lineTotal: "8,500.00" },
  { productName: "Blue Ball Pen", productCode: "ITM-1002", batch: "B-3310", expDate: "-", returnQty: "5", unitPrice: "45.00", discountRate: "5.00", lineTotal: "213.75" },
  { productName: "Stapler Heavy Duty", productCode: "ITM-1003", batch: "B-9921", expDate: "-", returnQty: "3", unitPrice: "1,250.00", discountRate: "0.00", lineTotal: "3,750.00" },
];

const buildSampleRows = () =>
  SAMPLE_ROWS.map(
    (r) => `<tr>
      <td>${r.productName}<br/>${r.productCode}</td>
      <td>${r.batch}</td>
      <td>${r.expDate}</td>
      <td class="num">${r.returnQty}</td>
      <td class="num">${r.unitPrice}</td>
      <td class="num">${r.discountRate}</td>
      <td class="num">${r.lineTotal}</td>
    </tr>`
  ).join("\n");

/** Replace {{token}} placeholders with sample values so the preview looks like a real document. */
const renderPreview = (html) => {
  if (!html) return "";
  let output = html.replace(/\{\{\s*lineItemsRows\s*\}\}/gi, buildSampleRows());
  Object.entries(SAMPLE_DATA).forEach(([token, value]) => {
    const pattern = new RegExp(`\\{\\{\\s*${token}\\s*\\}\\}`, "gi");
    output = output.replace(pattern, value ?? "");
  });
  return output;
};

export default function GoodsReturnNotePrintTemplatePage() {
  const [html, setHtml] = useState("");
  const [savedHtml, setSavedHtml] = useState("");
  const [isCustomized, setIsCustomized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const fileInputRef = useRef(null);
  const iframeRef = useRef(null);
  const previewWrapRef = useRef(null);
  const [previewHeight, setPreviewHeight] = useState(0);

  const authHeaders = useCallback(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }, []);

  const fetchTemplate = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${BASE_URL}/ReportTemplate/GetReportTemplateByKey?reportKey=${REPORT_KEY}`,
        { method: "GET", headers: authHeaders() }
      );
      const data = await response.json().catch(() => null);

      if (response.ok && data) {
        const content = data.htmlContent || "";
        setHtml(content);
        setSavedHtml(content);
        setIsCustomized(Boolean(data.isCustomized));
      } else {
        toast.error(data?.message || "Failed to load the Goods Return Note print template.");
      }
    } catch (error) {
      console.error("Error loading report template:", error);
      toast.error("Failed to load the Goods Return Note print template.");
    } finally {
      setLoading(false);
    }
  }, [authHeaders]);

  useEffect(() => {
    fetchTemplate();
  }, [fetchTemplate]);

  const previewSrcDoc = useMemo(() => renderPreview(html), [html]);
  const isDirty = html !== savedHtml;

  // Scale the rendered document to fit the preview pane width and grow the
  // iframe to its full content height, so the whole template is always visible
  // without inner scrollbars (acts like a real print preview).
  const fitPreview = useCallback(() => {
    const iframe = iframeRef.current;
    const wrap = previewWrapRef.current;
    if (!iframe || !wrap) return;

    const doc = iframe.contentDocument;
    if (!doc || !doc.documentElement) return;

    const contentWidth = Math.max(
      doc.documentElement.scrollWidth,
      doc.body ? doc.body.scrollWidth : 0
    );
    const contentHeight = Math.max(
      doc.documentElement.scrollHeight,
      doc.body ? doc.body.scrollHeight : 0
    );
    if (!contentWidth || !contentHeight) return;

    const availWidth = wrap.clientWidth;
    const scale = Math.min(1, availWidth / contentWidth);

    iframe.style.width = `${contentWidth}px`;
    iframe.style.height = `${contentHeight}px`;
    iframe.style.transformOrigin = "top left";
    iframe.style.transform = `scale(${scale})`;

    setPreviewHeight(Math.ceil(contentHeight * scale));
  }, []);

  // Re-fit whenever the preview content changes or the container resizes.
  useEffect(() => {
    if (loading) return;
    const id = requestAnimationFrame(fitPreview);

    const wrap = previewWrapRef.current;
    let observer;
    if (wrap && typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(() => fitPreview());
      observer.observe(wrap);
    }
    return () => {
      cancelAnimationFrame(id);
      if (observer) observer.disconnect();
    };
  }, [fitPreview, previewSrcDoc, loading]);

  const handleSave = async () => {
    if (!html.trim()) {
      toast.error("HTML content cannot be empty.");
      return;
    }
    try {
      setSaving(true);
      const response = await fetch(`${BASE_URL}/ReportTemplate/UpsertReportTemplate`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ reportKey: REPORT_KEY, name: TEMPLATE_NAME, htmlContent: html }),
      });
      const data = await response.json().catch(() => null);

      if (response.ok && data?.statusCode === 200) {
        toast.success(data.message || "Template saved successfully.");
        setSavedHtml(html);
        setIsCustomized(true);
      } else {
        toast.error(data?.message || "Failed to save template.");
      }
    } catch (error) {
      console.error("Error saving report template:", error);
      toast.error("Failed to save template.");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    try {
      setSaving(true);
      const response = await fetch(
        `${BASE_URL}/ReportTemplate/ResetReportTemplate?reportKey=${REPORT_KEY}`,
        { method: "DELETE", headers: authHeaders() }
      );
      const data = await response.json().catch(() => null);

      if (response.ok && data?.statusCode === 200) {
        toast.success(data.message || "Reverted to the default template.");
        setResetOpen(false);
        await fetchTemplate();
      } else {
        toast.error(data?.message || "Failed to reset template.");
      }
    } catch (error) {
      console.error("Error resetting report template:", error);
      toast.error("Failed to reset template.");
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      setHtml(String(e.target?.result || ""));
      toast.info(`Loaded "${file.name}". Review the preview, then click Save to apply.`);
    };
    reader.onerror = () => toast.error("Could not read the selected file.");
    reader.readAsText(file);
    event.target.value = "";
  };

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />

      <div className={styles.pageTitle}>
        <h1>Goods Return Note Print Template</h1>
        <ul>
          <li>
            <Link href="/report-template/screens-template/">Screens Template</Link>
          </li>
          <li>
            <Link href="/report-template/screens-template/?module=inventory">Inventory</Link>
          </li>
          <li>Goods Return Note Print Template</li>
        </ul>
      </div>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 1.5,
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
            <Typography sx={{ fontWeight: 600 }}>Status:</Typography>
            <Chip
              label={isCustomized ? "Custom Template" : "Default Template"}
              color={isCustomized ? "primary" : "default"}
              size="small"
            />
            {isDirty && <Chip label="Unsaved changes" color="warning" size="small" variant="outlined" />}
          </Box>

          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            <input
              ref={fileInputRef}
              type="file"
              accept=".html,.htm,text/html"
              style={{ display: "none" }}
              onChange={handleFileUpload}
            />
            <Button
              variant="outlined"
              startIcon={<UploadFileOutlinedIcon />}
              onClick={() => fileInputRef.current?.click()}
              sx={{ textTransform: "none" }}
            >
              Upload HTML
            </Button>
            <Tooltip title="Discard unsaved changes and reload the saved template">
              <span>
                <Button
                  variant="outlined"
                  color="inherit"
                  startIcon={<RefreshOutlinedIcon />}
                  onClick={fetchTemplate}
                  disabled={saving || loading}
                  sx={{ textTransform: "none" }}
                >
                  Reload
                </Button>
              </span>
            </Tooltip>
            <Tooltip title="Delete the custom template and restore the built-in default">
              <span>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<RestartAltOutlinedIcon />}
                  onClick={() => setResetOpen(true)}
                  disabled={saving || loading || !isCustomized}
                  sx={{ textTransform: "none" }}
                >
                  Delete / Reset to Default
                </Button>
              </span>
            </Tooltip>
            <Button
              variant="contained"
              startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveOutlinedIcon />}
              onClick={handleSave}
              disabled={saving || loading || !isDirty}
              sx={{ textTransform: "none" }}
            >
              Save Template
            </Button>
          </Box>
        </Box>
      </Paper>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 320 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 1.5, height: "100%" }}>
              <Typography sx={{ fontWeight: 600, mb: 1 }}>HTML Source</Typography>
              <Box
                component="textarea"
                value={html}
                onChange={(e) => setHtml(e.target.value)}
                spellCheck={false}
                sx={{
                  width: "100%",
                  height: { xs: "55vh", md: "70vh" },
                  resize: "vertical",
                  fontFamily: "'DM Mono', 'Courier New', monospace",
                  fontSize: "12.5px",
                  lineHeight: 1.5,
                  p: 1.5,
                  border: "1px solid #d8d8d8",
                  borderRadius: "8px",
                  outline: "none",
                  whiteSpace: "pre",
                  overflow: "auto",
                  bgcolor: "#fafafa",
                  color: "#1a1a1a",
                }}
              />
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 1.5, height: "100%" }}>
              <Typography sx={{ fontWeight: 600, mb: 1 }}>Live Preview</Typography>
              <Box
                ref={previewWrapRef}
                sx={{
                  width: "100%",
                  height: previewHeight ? `${previewHeight}px` : "auto",
                  minHeight: 200,
                  border: "1px solid #d8d8d8",
                  borderRadius: "8px",
                  bgcolor: "#fff",
                  overflow: "hidden",
                }}
              >
                <Box
                  component="iframe"
                  ref={iframeRef}
                  title="Goods Return Note template preview"
                  srcDoc={previewSrcDoc}
                  onLoad={fitPreview}
                  scrolling="no"
                  sx={{
                    border: 0,
                    display: "block",
                    bgcolor: "#fff",
                  }}
                />
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}

      <Dialog open={resetOpen} onClose={() => (saving ? null : setResetOpen(false))}>
        <DialogTitle>Reset to default template?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will permanently delete the custom Goods Return Note print template and restore the
            built-in default. This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetOpen(false)} disabled={saving} sx={{ textTransform: "none" }}>
            Cancel
          </Button>
          <Button onClick={handleReset} color="error" variant="contained" disabled={saving} sx={{ textTransform: "none" }}>
            Delete & Reset
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
