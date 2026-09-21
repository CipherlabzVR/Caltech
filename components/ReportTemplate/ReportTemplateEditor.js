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
  addLineColumn,
  EMPTY_LINE_ITEMS_HTML,
  getUsedLineTokens,
  removeLineColumn,
  upgradeLineItemsPlaceholder,
} from "@/components/ReportTemplate/lineItemsEditor";
import {
  applyPageOrientation,
  PAGE_ORIENTATION,
  parsePageOrientation,
} from "@/components/ReportTemplate/pageOrientation";

/**
 * Reusable editor for HTML print templates managed via the ReportTemplate API.
 *
 * Props:
 *  - reportKey, templateName, pageTitle, breadcrumbs
 *  - renderPreview: (html) => string  — custom preview (optional if sampleData given)
 *  - sampleData, sampleLineItems, buildLineTokenMap, fieldGroups, defaultLineItemsBlock
 *  - upgradePlaceholders: optional custom upgrader (e.g. stockLineRows)
 *  - enableOrientation: default true when fieldGroups provided, else false unless set
 */
export default function ReportTemplateEditor({
  reportKey,
  templateName,
  pageTitle,
  breadcrumbs = [],
  renderPreview,
  sampleData,
  sampleLineItems,
  buildLineTokenMap,
  fieldGroups,
  defaultLineItemsBlock,
  upgradePlaceholders,
  enableOrientation,
}) {
  const hasLineEditor = Array.isArray(fieldGroups) && fieldGroups.length > 0;
  const orientationEnabled =
    enableOrientation !== undefined ? enableOrientation : hasLineEditor || Boolean(sampleData);

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

  const prepareLoadedHtml = useCallback(
    (content) => {
      let next = content || "";
      if (typeof upgradePlaceholders === "function" && defaultLineItemsBlock) {
        next = upgradePlaceholders(next, defaultLineItemsBlock);
      } else if (defaultLineItemsBlock) {
        next = upgradeLineItemsPlaceholder(next, defaultLineItemsBlock);
      }
      if (orientationEnabled) {
        next = applyPageOrientation(next, parsePageOrientation(next));
      }
      return next;
    },
    [defaultLineItemsBlock, orientationEnabled, upgradePlaceholders]
  );

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
        `${BASE_URL}/ReportTemplate/GetReportTemplateByKey?reportKey=${reportKey}`,
        { method: "GET", headers: authHeaders() }
      );
      const data = await response.json().catch(() => null);

      if (response.ok && data) {
        const content = data.htmlContent || "";
        const nextHtml = prepareLoadedHtml(content);
        setHtml(nextHtml);
        setSavedHtml(content);
        setIsCustomized(Boolean(data.isCustomized));

        // Auto-save when the editor upgrades default / legacy HTML
        // (editable line columns + page orientation meta).
        if (nextHtml !== content && nextHtml.trim()) {
          try {
            setSaving(true);
            const saveResponse = await fetch(
              `${BASE_URL}/ReportTemplate/UpsertReportTemplate`,
              {
                method: "POST",
                headers: authHeaders(),
                body: JSON.stringify({
                  reportKey,
                  name: templateName,
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
            console.error("Error auto-saving upgraded template:", saveError);
            toast.warning(
              "Template options updated. Click Save Template to keep changes."
            );
          } finally {
            setSaving(false);
          }
        }
      } else {
        toast.error(data?.message || "Failed to load the print template.");
      }
    } catch (error) {
      console.error("Error loading report template:", error);
      toast.error("Failed to load the print template.");
    } finally {
      setLoading(false);
    }
  }, [authHeaders, prepareLoadedHtml, reportKey, templateName]);

  useEffect(() => {
    fetchTemplate();
  }, [fetchTemplate]);

  const builtPreview = useCallback(
    (sourceHtml) => {
      if (!sourceHtml) return "";
      if (renderPreview) return renderPreview(sourceHtml);
      if (!sampleData) return sourceHtml;

      const lineTokenMaps = (sampleLineItems || []).map((item) =>
        buildLineTokenMap ? buildLineTokenMap(item) : item
      );

      let simpleLegacy = EMPTY_LINE_ITEMS_HTML;
      if (sampleLineItems?.length && defaultLineItemsBlock) {
        const rowTplMatch = defaultLineItemsBlock.match(
          /\{\{#\s*lineItems\s*\}\}([\s\S]*?)\{\{\/\s*lineItems\s*\}\}/i
        );
        const rowTpl = rowTplMatch?.[1] || "";
        simpleLegacy = lineTokenMaps
          .map((tokens) => {
            let row = rowTpl;
            Object.entries(tokens || {}).forEach(([key, value]) => {
              row = row.replace(
                new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, "gi"),
                value ?? ""
              );
            });
            return row;
          })
          .join("\n");
      }

      return applyTemplate(sourceHtml, sampleData, simpleLegacy, {
        lineTokenMaps,
        emptyLineItemsHtml: EMPTY_LINE_ITEMS_HTML,
      });
    },
    [
      buildLineTokenMap,
      defaultLineItemsBlock,
      renderPreview,
      sampleData,
      sampleLineItems,
    ]
  );

  const previewSrcDoc = useMemo(
    () => builtPreview(html),
    [builtPreview, html]
  );
  const isDirty = html !== savedHtml;
  const pageOrientation = useMemo(() => parsePageOrientation(html), [html]);
  const usedLineTokens = useMemo(
    () => (hasLineEditor ? getUsedLineTokens(html, fieldGroups) : new Set()),
    [fieldGroups, hasLineEditor, html]
  );

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
      if (getUsedLineTokens(prev, fieldGroups).has(token)) {
        return removeLineColumn(prev, token, fieldGroups);
      }
      return addLineColumn(prev, token, fieldGroups);
    });
  };

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
        body: JSON.stringify({ reportKey, name: templateName, htmlContent: html }),
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
        `${BASE_URL}/ReportTemplate/ResetReportTemplate?reportKey=${reportKey}`,
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
      setHtml(prepareLoadedHtml(String(e.target?.result || "")));
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
        <h1>{pageTitle}</h1>
        <ul>
          {breadcrumbs.map((crumb, index) => (
            <li key={`${crumb.label}-${index}`}>
              {crumb.href ? <Link href={crumb.href}>{crumb.label}</Link> : crumb.label}
            </li>
          ))}
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

        <Grid container spacing={1}>
          {orientationEnabled && (
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
          )}

          <Grid item xs={12} md={orientationEnabled ? 7 : 12}>
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
              {hasLineEditor ? (
                <>
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
                    {fieldGroups.map((group) => (
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
                </>
              ) : (
                <Typography sx={{ fontSize: 12, color: "text.secondary", mb: 1 }}>
                  Edit the HTML template below. Preview updates live.
                </Typography>
              )}
              <Box
                component="textarea"
                value={html}
                onChange={(e) => setHtml(e.target.value)}
                spellCheck={false}
                sx={{
                  width: "100%",
                  height: {
                    xs: hasLineEditor ? "45vh" : "55vh",
                    md: hasLineEditor ? "58vh" : "70vh",
                  },
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
                  title={`${pageTitle} preview`}
                  srcDoc={previewSrcDoc}
                  onLoad={fitPreview}
                  scrolling="no"
                  sx={{ border: 0, display: "block", bgcolor: "#fff" }}
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
            This will permanently delete the custom {templateName} and restore the built-in
            default. This action cannot be undone.
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
