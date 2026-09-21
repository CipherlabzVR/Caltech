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
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import RestartAltOutlinedIcon from "@mui/icons-material/RestartAltOutlined";
import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";
import CropPortraitOutlinedIcon from "@mui/icons-material/CropPortraitOutlined";
import CropLandscapeOutlinedIcon from "@mui/icons-material/CropLandscapeOutlined";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import styles from "@/styles/PageTitle.module.css";
import BASE_URL from "Base/api";
import { applyTemplate } from "@/components/ReportTemplate/applyTemplate";
import {
  addGrnLineColumn,
  buildGrnLineTokenMap,
  buildLegacyGrnLineItemsRows,
  EMPTY_LINE_ITEMS_HTML,
  getUsedGrnLineTokens,
  GRN_LINE_FIELD_GROUPS,
  removeGrnLineColumn,
  upgradeGrnLineItemsPlaceholder,
} from "@/components/ReportTemplate/grnLineItems";
import {
  applyPageOrientation,
  PAGE_ORIENTATION,
  parsePageOrientation,
} from "@/components/ReportTemplate/pageOrientation";

const REPORT_KEY = "GRN";
const TEMPLATE_NAME = "GRN Print Template";

// Sample data used to render a realistic live preview of the template.
const SAMPLE_DATA = {
  companyLogo:
    '<div style="width:150px;height:58px;border:1px dashed #c0c0c0;border-radius:6px;display:flex;align-items:center;justify-content:center;color:#9aa0a6;font:600 12px Arial,sans-serif;">LOGO</div>',
  companyName: "Your Company (Pvt) Ltd",
  companyAddress: "No. 123, Main Street, Colombo 03",
  companyContact: "+94 11 234 5678 / info@company.com",
  documentNo: "GRN-000123",
  supplierName: "Global Supplies Ltd",
  grnDate: "26-Jun-2026",
  remark: "Received in good condition",
  totalQty: "120",
  warehouseName: "Main Warehouse",
  createdBy: "John Perera",
  createdDate: "26-Jun-2026 10:30:00AM",
  referenceNo: "PO-000045",
  salesPerson: "Nimal Silva",
  freightDutyTotal: "2,850.00",
  subtotal: "150,000.00",
  orderDiscountPercent: "5.00",
  totalDiscount: "7,500.00",
  grossTotal: "142,500.00",
};

const SAMPLE_LINE_ITEMS = [
  {
    productName: "A4 Copy Paper 80gsm",
    productCode: "ITM-1001",
    batch: "B-2207",
    expDate: null,
    qty: 50,
    free: 2,
    unitPrice: 850,
    additionalCost: 25,
    discountRate: 0,
    sellingPrice: 1100,
    lineTotal: 42500,
    costPrice: 875,
  },
  {
    productName: "Blue Ball Pen",
    productCode: "ITM-1002",
    batch: "B-3310",
    expDate: null,
    qty: 40,
    free: 0,
    unitPrice: 45,
    additionalCost: 5,
    discountRate: 5,
    sellingPrice: 75,
    lineTotal: 1710,
    costPrice: 50,
  },
  {
    productName: "Stapler Heavy Duty",
    productCode: "ITM-1003",
    batch: "B-9921",
    expDate: null,
    qty: 30,
    free: 1,
    unitPrice: 1250,
    additionalCost: 50,
    discountRate: 0,
    sellingPrice: 1650,
    lineTotal: 37500,
    costPrice: 1300,
  },
];

const formatSampleDate = (value) => {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "-";
  }
};

const ensureFreightDutyColumnHeader = (html) => {
  if (!html || /<th[^>]*>\s*Freight\s*Duty/i.test(html)) return html;
  return html.replace(
    /(<th[^>]*>\s*Unit\s*Price\s*<\/th>)/i,
    `$1\n          <th class="num">Freight Duty</th>`
  );
};

const ensureFreightDutyTotalRow = (html) => {
  if (
    !html ||
    /\{\{\s*freightDutyTotal\s*\}\}/i.test(html) ||
    /Freight\s*Duty\s*Total/i.test(html)
  ) {
    return html;
  }
  return html.replace(
    /(<div class=["']totals["']>\s*)(<div class=["']row["']>\s*<span>\s*Total\s*<\/span>)/i,
    `$1<div class="row"><span>Freight Duty Total</span><span>{{freightDutyTotal}}</span></div>\n      $2`
  );
};

/** Replace {{token}} placeholders with sample values so the preview looks like a real document. */
const renderPreview = (html) => {
  if (!html) return "";
  let output = ensureFreightDutyColumnHeader(html);
  output = ensureFreightDutyTotalRow(output);

  const lineTokenMaps = SAMPLE_LINE_ITEMS.map((item) =>
    buildGrnLineTokenMap(item, { formatDisplayDate: formatSampleDate })
  );
  const legacyRowsHtml = buildLegacyGrnLineItemsRows(SAMPLE_LINE_ITEMS, {
    formatDisplayDate: formatSampleDate,
  });

  return applyTemplate(output, SAMPLE_DATA, legacyRowsHtml, {
    lineTokenMaps,
    emptyLineItemsHtml: EMPTY_LINE_ITEMS_HTML,
  });
};

export default function GRNPrintTemplatePage() {
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
        let nextHtml = upgradeGrnLineItemsPlaceholder(content);
        // Ensure orientation meta exists so Portrait/Landscape toggle can persist.
        nextHtml = applyPageOrientation(nextHtml, parsePageOrientation(nextHtml));
        setHtml(nextHtml);
        setSavedHtml(content);
        setIsCustomized(Boolean(data.isCustomized));

        // Auto-save when the editor upgrades default / legacy HTML.
        if (nextHtml !== content && nextHtml.trim()) {
          try {
            setSaving(true);
            const saveResponse = await fetch(
              `${BASE_URL}/ReportTemplate/UpsertReportTemplate`,
              {
                method: "POST",
                headers: authHeaders(),
                body: JSON.stringify({
                  reportKey: REPORT_KEY,
                  name: TEMPLATE_NAME,
                  htmlContent: nextHtml,
                }),
              }
            );
            const saveData = await saveResponse.json().catch(() => null);
            if (saveResponse.ok && saveData?.statusCode === 200) {
              setSavedHtml(nextHtml);
              setIsCustomized(true);
              toast.success("Default template options applied and saved.");
            } else {
              toast.warning(
                saveData?.message ||
                  "Template options updated. Click Save Template to keep changes."
              );
            }
          } catch (saveError) {
            console.error("Error auto-saving upgraded GRN template:", saveError);
            toast.warning(
              "Template options updated. Click Save Template to keep changes."
            );
          } finally {
            setSaving(false);
          }
        }
      } else {
        toast.error(data?.message || "Failed to load the GRN print template.");
      }
    } catch (error) {
      console.error("Error loading report template:", error);
      toast.error("Failed to load the GRN print template.");
    } finally {
      setLoading(false);
    }
  }, [authHeaders]);

  useEffect(() => {
    fetchTemplate();
  }, [fetchTemplate]);

  const previewSrcDoc = useMemo(() => renderPreview(html), [html]);
  const isDirty = html !== savedHtml;
  const pageOrientation = useMemo(() => parsePageOrientation(html), [html]);
  const usedLineTokens = useMemo(() => getUsedGrnLineTokens(html), [html]);

  const handleOrientationChange = (_event, value) => {
    if (!value) return;
    setHtml((prev) => applyPageOrientation(prev, value));
  };

  const handleToggleLineField = (token) => {
    setHtml((prev) => {
      if (!/\{\{#\s*lineItems\s*\}\}/i.test(prev)) {
        toast.warning(
          "Add an editable {{#lineItems}} block first, or Reset to Default."
        );
        return prev;
      }
      if (getUsedGrnLineTokens(prev).has(token)) {
        return removeGrnLineColumn(prev, token);
      }
      return addGrnLineColumn(prev, token);
    });
  };

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
        <h1>GRN Print Template</h1>
        <ul>
          <li>
            <Link href="/report-template/screens-template/">Screens Template</Link>
          </li>
          <li>
            <Link href="/report-template/screens-template/?module=inventory">Inventory</Link>
          </li>
          <li>GRN Print Template</li>
        </ul>
      </div>

      <Paper sx={{ p: 1.25, mb: 1.5 }}>
        <input
          ref={fileInputRef}
          type="file"
          accept=".html,.htm,text/html"
          style={{ display: "none" }}
          onChange={handleFileUpload}
        />

        {/* Header: status + primary save */}
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 1,
            alignItems: "center",
            justifyContent: "space-between",
            pb: 1,
            mb: 1,
            borderBottom: "1px solid #ececec",
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: 1,
              minWidth: 0,
            }}
          >
            <Typography sx={{ fontWeight: 700, fontSize: 14, lineHeight: 1.2 }}>
              Template settings
            </Typography>
            <Chip
              label={isCustomized ? "Custom" : "Default"}
              color={isCustomized ? "primary" : "default"}
              size="small"
              sx={{ height: 22, fontSize: 11, fontWeight: 600 }}
            />
            {isDirty ? (
              <Chip
                label="Unsaved"
                color="warning"
                size="small"
                variant="outlined"
                sx={{ height: 22, fontSize: 11, fontWeight: 600 }}
              />
            ) : (
              <Chip
                label="Saved"
                size="small"
                variant="outlined"
                sx={{
                  height: 22,
                  fontSize: 11,
                  color: "success.dark",
                  borderColor: "success.light",
                }}
              />
            )}
          </Box>

          <Button
            variant="contained"
            size="small"
            startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <SaveOutlinedIcon />}
            onClick={handleSave}
            disabled={saving || loading || !isDirty}
            sx={{ textTransform: "none", px: 1.75 }}
          >
            Save Template
          </Button>
        </Box>

        {/* Two clear sections: page size | other actions */}
        <Grid container spacing={1}>
          <Grid item xs={12} md={5}>
            <Box
              sx={{
                height: "100%",
                px: 1.25,
                py: 1,
                borderRadius: "8px",
                bgcolor: "#f7f8fa",
                border: "1px solid #e8eaee",
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: 1,
              }}
            >
              <Typography
                sx={{
                  fontSize: 10.5,
                  fontWeight: 700,
                  color: "text.secondary",
                  textTransform: "uppercase",
                  letterSpacing: 0.4,
                  minWidth: 64,
                }}
              >
                Page size
              </Typography>
              <ToggleButtonGroup
                value={pageOrientation}
                exclusive
                size="small"
                onChange={handleOrientationChange}
                disabled={loading || !html}
                aria-label="Print page orientation"
                sx={{
                  bgcolor: "#fff",
                  flex: 1,
                  minWidth: 180,
                  "& .MuiToggleButton-root": {
                    textTransform: "none",
                    py: 0.35,
                    px: 1.25,
                    fontSize: 12.5,
                    borderColor: "#d9dde3",
                    flex: 1,
                  },
                }}
              >
                <ToggleButton value={PAGE_ORIENTATION.PORTRAIT}>
                  <CropPortraitOutlinedIcon sx={{ fontSize: 16, mr: 0.5 }} />
                  Portrait
                </ToggleButton>
                <ToggleButton value={PAGE_ORIENTATION.LANDSCAPE}>
                  <CropLandscapeOutlinedIcon sx={{ fontSize: 16, mr: 0.5 }} />
                  Landscape
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>
          </Grid>

          <Grid item xs={12} md={7}>
            <Box
              sx={{
                height: "100%",
                px: 1.25,
                py: 1,
                borderRadius: "8px",
                bgcolor: "#f7f8fa",
                border: "1px solid #e8eaee",
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: 1,
              }}
            >
              <Typography
                sx={{
                  fontSize: 10.5,
                  fontWeight: 700,
                  color: "text.secondary",
                  textTransform: "uppercase",
                  letterSpacing: 0.4,
                  minWidth: 78,
                }}
              >
                More actions
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<UploadFileOutlinedIcon />}
                  onClick={() => fileInputRef.current?.click()}
                  sx={{ textTransform: "none", bgcolor: "#fff" }}
                >
                  Upload HTML
                </Button>
                <Tooltip title="Discard unsaved changes and reload the saved template">
                  <span>
                    <Button
                      variant="outlined"
                      size="small"
                      color="inherit"
                      startIcon={<RefreshOutlinedIcon />}
                      onClick={fetchTemplate}
                      disabled={saving || loading}
                      sx={{ textTransform: "none", bgcolor: "#fff" }}
                    >
                      Reload
                    </Button>
                  </span>
                </Tooltip>
                <Tooltip title="Delete the custom template and restore the built-in default">
                  <span>
                    <Button
                      variant="outlined"
                      size="small"
                      color="error"
                      startIcon={<RestartAltOutlinedIcon />}
                      onClick={() => setResetOpen(true)}
                      disabled={saving || loading || !isCustomized}
                      sx={{ textTransform: "none", bgcolor: "#fff" }}
                    >
                      Reset to Default
                    </Button>
                  </span>
                </Tooltip>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 320 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 1.5, height: "100%" }}>
              <Typography sx={{ fontWeight: 600, mb: 0.5 }}>HTML Source</Typography>
              <Typography sx={{ fontSize: 12, color: "text.secondary", mb: 1.25 }}>
                Click a field to add or remove it as a table column. Blue = already on the
                print. Hover to see the token name.
              </Typography>
              <Box
                sx={{
                  mb: 1.5,
                  p: 1.25,
                  border: "1px solid #e6e6e6",
                  borderRadius: "8px",
                  bgcolor: "#fcfcfc",
                  maxHeight: 180,
                  overflow: "auto",
                }}
              >
                {GRN_LINE_FIELD_GROUPS.map((group) => (
                  <Box key={group.id} sx={{ mb: 1.25, "&:last-child": { mb: 0 } }}>
                    <Typography
                      sx={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: "text.secondary",
                        textTransform: "uppercase",
                        letterSpacing: 0.4,
                        mb: 0.75,
                      }}
                    >
                      {group.title}
                    </Typography>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                      {group.fields.map((field) => {
                        const active = usedLineTokens.has(field.token);
                        return (
                          <Tooltip
                            key={field.token}
                            title={
                              active
                                ? `Remove column · {{${field.token}}}`
                                : `Add column · {{${field.token}}}`
                            }
                          >
                            <Chip
                              label={field.label}
                              size="small"
                              color={active ? "primary" : "default"}
                              variant={active ? "filled" : "outlined"}
                              onClick={() => handleToggleLineField(field.token)}
                              sx={{
                                fontSize: 12,
                                height: 28,
                                cursor: "pointer",
                                fontWeight: active ? 600 : 500,
                              }}
                            />
                          </Tooltip>
                        );
                      })}
                    </Box>
                  </Box>
                ))}
              </Box>
              <Box
                component="textarea"
                value={html}
                onChange={(e) => setHtml(e.target.value)}
                spellCheck={false}
                sx={{
                  width: "100%",
                  height: { xs: "45vh", md: "58vh" },
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
                  title="GRN template preview"
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
            This will permanently delete the custom GRN print template and restore the
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
