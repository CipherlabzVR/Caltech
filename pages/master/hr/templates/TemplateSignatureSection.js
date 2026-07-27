import React, { useEffect, useRef, useState } from "react";
import { Box, Button, Tab, Tabs, Typography } from "@mui/material";
import { toast } from "react-toastify";
import BASE_URL from "Base/api";

function pickSignatureUrl(data) {
  const r = data.result ?? data.Result;
  if (!r) return null;
  return r.signatureImageUrl ?? r.SignatureImageUrl ?? null;
}

function authHeaders() {
  const token = localStorage.getItem("token");
  return { Authorization: `Bearer ${token}` };
}

/** @returns {boolean} true when canvas has no strokes */
function isSignatureCanvasEmpty(sig) {
  if (!sig) return true;
  if (typeof sig.isEmpty === "function" && !sig.isEmpty()) {
    return false;
  }
  if (typeof sig.getSignaturePad === "function") {
    const pad = sig.getSignaturePad();
    if (pad && typeof pad.isEmpty === "function" && !pad.isEmpty()) {
      return false;
    }
  }
  if (typeof sig.isEmpty === "function") {
    return sig.isEmpty();
  }
  return true;
}

/** @returns {string|null} PNG data URL */
function getSignatureDataUrl(sig) {
  if (!sig) return null;
  if (typeof sig.getTrimmedCanvas === "function") {
    return sig.getTrimmedCanvas().toDataURL("image/png");
  }
  if (typeof sig.toDataURL === "function") {
    return sig.toDataURL("image/png");
  }
  const pad =
    typeof sig.getSignaturePad === "function" ? sig.getSignaturePad() : null;
  if (pad?.canvas && typeof pad.canvas.toDataURL === "function") {
    return pad.canvas.toDataURL("image/png");
  }
  return null;
}

function clearSignatureCanvas(sig) {
  if (!sig) return;
  if (typeof sig.clear === "function") {
    sig.clear();
    return;
  }
  const pad =
    typeof sig.getSignaturePad === "function" ? sig.getSignaturePad() : null;
  if (pad && typeof pad.clear === "function") pad.clear();
}

/**
 * @param {"create"|"edit"} mode
 * @param {number|null} templateId — required for edit uploads / remove
 * @param {number} orgId
 * @param {string} [signatureImageUrl]
 * @param {(url: string | null) => void} onSignatureUrlChange
 * @param {File|null} pendingSignatureFile — create: staged file until template saved
 * @param {(f: File | null) => void} onPendingSignatureChange
 */
export default function TemplateSignatureSection({
  mode,
  templateId,
  orgId,
  signatureImageUrl = "",
  onSignatureUrlChange,
  pendingSignatureFile,
  onPendingSignatureChange,
}) {
  const [sigTab, setSigTab] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [SigComponent, setSigComponent] = useState(null);
  const fileInputRef = useRef(null);
  const sigCanvas = useRef(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState(null);

  const remoteUrl =
    typeof signatureImageUrl === "string" && signatureImageUrl.trim()
      ? signatureImageUrl.trim()
      : "";

  useEffect(() => {
    let cancelled = false;
    import("react-signature-canvas")
      .then((mod) => {
        if (!cancelled) setSigComponent(() => mod.default);
      })
      .catch((err) => {
        console.error("[TemplateSignatureSection] Failed to load react-signature-canvas", err);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!pendingSignatureFile) {
      setLocalPreviewUrl(null);
      return undefined;
    }
    const url = URL.createObjectURL(pendingSignatureFile);
    setLocalPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [pendingSignatureFile]);

  const postSignature = async (file) => {
    if (!templateId) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("signature", file);
      const res = await fetch(
        `${BASE_URL}/hr/templates/${templateId}/signature?orgId=${orgId}`,
        {
          method: "POST",
          headers: authHeaders(),
          body: fd,
        }
      );
      const data = await res.json();
      if (data.statusCode === 200) {
        const url = pickSignatureUrl(data);
        if (url) onSignatureUrlChange(url);
        toast.success(data.message || "Signature uploaded.");
      } else {
        toast.error(data.message || "Upload failed.");
      }
    } catch (e) {
      toast.error(e.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelected = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (mode === "edit") {
      await postSignature(f);
    } else {
      onPendingSignatureChange(f);
    }
  };

  const handleDrawSave = async () => {
    const sig = sigCanvas.current;
    console.log("[TemplateSignatureSection] sigCanvas.current:", sig);
    if (sig && typeof sig.getSignaturePad === "function") {
      console.log(
        "[TemplateSignatureSection] getSignaturePad():",
        sig.getSignaturePad()
      );
    }
    if (!sig) {
      toast.warning("Please draw a signature first");
      return;
    }
    if (isSignatureCanvasEmpty(sig)) {
      toast.warning("Please draw a signature first");
      return;
    }
    const dataUrl = getSignatureDataUrl(sig);
    if (!dataUrl) {
      toast.error("Could not read signature.");
      return;
    }
    const blob = await (await fetch(dataUrl)).blob();
    const file = new File([blob], "Signature.png", { type: "image/png" });

    if (mode === "edit") {
      await postSignature(file);
      clearSignatureCanvas(sig);
    } else {
      onPendingSignatureChange(file);
      clearSignatureCanvas(sig);
    }
  };

  const handleClearCanvas = () => {
    clearSignatureCanvas(sigCanvas.current);
  };

  const clearSignature = async () => {
    if (mode === "create") {
      onPendingSignatureChange(null);
      clearSignatureCanvas(sigCanvas.current);
      return;
    }
    if (!templateId) return;
    setUploading(true);
    try {
      const res = await fetch(
        `${BASE_URL}/hr/templates/${templateId}/signature?orgId=${orgId}`,
        { method: "DELETE", headers: authHeaders() }
      );
      const data = await res.json();
      if (data.statusCode === 200) {
        onSignatureUrlChange(null);
        toast.success(data.message || "Signature removed.");
      } else {
        toast.error(data.message || "Remove failed.");
      }
    } catch (e) {
      toast.error(e.message || "Remove failed.");
    } finally {
      setUploading(false);
    }
  };

  const displaySrc = localPreviewUrl || remoteUrl;
  const hasDisplay = Boolean(displaySrc);

  return (
    <>
      <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
        Signature
      </Typography>
      <Tabs value={sigTab} onChange={(_, v) => setSigTab(v)} sx={{ mb: 2 }}>
        <Tab label="Upload Signature" />
        <Tab label="Draw Signature" />
      </Tabs>

      {sigTab === 0 && (
        <Box sx={{ mb: 2 }}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg"
            hidden
            onChange={handleFileSelected}
          />
          {mode === "edit" && remoteUrl ? (
            <Box sx={{ mb: 2 }}>
              <Button
                size="small"
                variant="outlined"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                Change
              </Button>
            </Box>
          ) : (
            <Button
              size="small"
              variant="outlined"
              onClick={() => fileInputRef.current?.click()}
              sx={{ mb: 2 }}
              disabled={uploading}
            >
              Choose image
            </Button>
          )}
        </Box>
      )}

      {sigTab === 1 && (
        <Box sx={{ mb: 2 }}>
          <Box
            sx={{
              border: "1px solid rgba(0,0,0,0.23)",
              borderRadius: 1,
              width: 400,
              maxWidth: "100%",
              bgcolor: "#fafafa",
            }}
          >
            {SigComponent ? (
              <SigComponent
                ref={sigCanvas}
                canvasProps={{
                  width: 400,
                  height: 150,
                  className: "signature-canvas",
                }}
              />
            ) : (
              <Box
                sx={{
                  height: 150,
                  border: "1px dashed rgba(0,0,0,0.2)",
                  borderRadius: 1,
                }}
              />
            )}
          </Box>
          <Box sx={{ mt: 1, display: "flex", gap: 1, flexWrap: "wrap" }}>
            <Button size="small" variant="outlined" onClick={handleClearCanvas}>
              Clear
            </Button>
            <Button
              size="small"
              variant="contained"
              onClick={handleDrawSave}
              disabled={uploading || !SigComponent}
            >
              Save Signature
            </Button>
          </Box>
        </Box>
      )}

      {hasDisplay && (
        <Box sx={{ mt: 1 }}>
          <Typography variant="caption" color="text.secondary" display="block">
            Current Signature:
          </Typography>
          <Box
            component="img"
            src={displaySrc}
            alt="Signature"
            sx={{
              maxWidth: 200,
              width: "100%",
              border: "1px solid #eee",
              display: "block",
              my: 1,
            }}
          />
          <Button
            size="small"
            color="error"
            onClick={clearSignature}
            disabled={uploading}
          >
            Remove Signature
          </Button>
        </Box>
      )}
    </>
  );
}
