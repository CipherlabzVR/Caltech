import React, { useCallback, useEffect, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
  Typography,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import ShareIcon from "@mui/icons-material/Share";
import LinkOffIcon from "@mui/icons-material/LinkOff";
import RefreshIcon from "@mui/icons-material/Refresh";
import { toast } from "react-toastify";
import BASE_URL from "Base/api";

function extractResult(json) {
  return json?.result ?? json?.data ?? json;
}

/**
 * Share dialog for a work track / project — generates a view-only public link.
 */
export default function WorkTrackShareDialog({ open, onClose, workTrackId, customerName, projectName }) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);

  const shareUrl =
    typeof window !== "undefined" && status?.shareToken
      ? `${window.location.origin}/work-track/share/${status.shareToken}`
      : "";

  const authHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("token")}`,
    "Content-Type": "application/json",
  });

  const loadStatus = useCallback(async () => {
    if (!workTrackId) return;
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/WorkTrack/GetShareStatus?workTrackId=${workTrackId}`, {
        headers: authHeaders(),
      });
      const json = await res.json();
      const data = extractResult(json);
      setStatus(data && typeof data === "object" ? data : null);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load share status");
    } finally {
      setLoading(false);
    }
  }, [workTrackId]);

  useEffect(() => {
    if (open && workTrackId) loadStatus();
  }, [open, workTrackId, loadStatus]);

  const enableShare = async (regenerateToken = false) => {
    setSaving(true);
    try {
      const res = await fetch(`${BASE_URL}/WorkTrack/EnableShare`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ workTrackId: Number(workTrackId), regenerateToken }),
      });
      const json = await res.json();
      if (json?.statusCode === 200 || json?.statusCode === "SUCCESS" || res.ok) {
        setStatus(extractResult(json));
        toast.success(regenerateToken ? "Share link regenerated" : "Share link enabled");
      } else {
        toast.error(json?.message || "Failed to enable share");
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to enable share");
    } finally {
      setSaving(false);
    }
  };

  const disableShare = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${BASE_URL}/WorkTrack/DisableShare?workTrackId=${workTrackId}`, {
        method: "POST",
        headers: authHeaders(),
      });
      const json = await res.json();
      if (json?.statusCode === 200 || json?.statusCode === "SUCCESS" || res.ok) {
        setStatus(extractResult(json));
        toast.success("Share link disabled");
      } else {
        toast.error(json?.message || "Failed to disable share");
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to disable share");
    } finally {
      setSaving(false);
    }
  };

  const copyLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied");
    } catch {
      toast.error("Could not copy link");
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <ShareIcon color="primary" />
        Share Work Track
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" mb={2}>
          Share a <strong>view-only</strong> link for this project. Recipients can see the dashboard
          summary and saved forms. Opening a form shows technician assignment, checklists, and
          summary only — no editing.
        </Typography>

        {(customerName || projectName) && (
          <Box sx={{ p: 1.5, mb: 2, bgcolor: "#f5f5f5", borderRadius: 1 }}>
            {customerName && (
              <Typography variant="body2">
                <strong>Customer:</strong> {customerName}
              </Typography>
            )}
            {projectName && (
              <Typography variant="body2">
                <strong>Project:</strong> {projectName}
              </Typography>
            )}
          </Box>
        )}

        {loading ? (
          <Box display="flex" justifyContent="center" py={3}>
            <CircularProgress size={28} />
          </Box>
        ) : status?.isShareEnabled && status?.shareToken ? (
          <Box>
            <Typography variant="caption" color="text.secondary">
              Public link (view only)
            </Typography>
            <Box display="flex" gap={1} alignItems="center" mt={0.5}>
              <TextField
                fullWidth
                size="small"
                value={shareUrl}
                InputProps={{ readOnly: true }}
              />
              <IconButton color="primary" onClick={copyLink} aria-label="copy link">
                <ContentCopyIcon />
              </IconButton>
            </Box>
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary">
            Sharing is currently off. Enable a link to share this work track.
          </Typography>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, flexWrap: "wrap", gap: 1 }}>
        <Button onClick={onClose}>Close</Button>
        {status?.isShareEnabled ? (
          <>
            <Button
              startIcon={<RefreshIcon />}
              onClick={() => enableShare(true)}
              disabled={saving}
            >
              Regenerate
            </Button>
            <Button
              color="error"
              startIcon={<LinkOffIcon />}
              onClick={disableShare}
              disabled={saving}
            >
              Disable
            </Button>
            <Button variant="contained" startIcon={<ContentCopyIcon />} onClick={copyLink}>
              Copy Link
            </Button>
          </>
        ) : (
          <Button
            variant="contained"
            startIcon={<ShareIcon />}
            onClick={() => enableShare(false)}
            disabled={saving}
          >
            {saving ? "Enabling..." : "Enable Share Link"}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
