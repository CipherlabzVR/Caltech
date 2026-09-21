import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Grid,
  IconButton,
  MenuItem,
  TextField,
  Typography,
  CircularProgress,
  Dialog,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DeleteIcon from "@mui/icons-material/Delete";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CloseIcon from "@mui/icons-material/Close";
import { styled } from "@mui/material/styles";
import { toast } from "react-toastify";
import BASE_URL from "Base/api";

const VisuallyHiddenInput = styled("input")({
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  height: 1,
  overflow: "hidden",
  position: "absolute",
  bottom: 0,
  left: 0,
  whiteSpace: "nowrap",
  width: 1,
});

const ROTATION_OPTIONS = [
  { value: 0, label: "Manual (always show latest)" },
  { value: 1, label: "Weekly" },
  { value: 2, label: "Monthly" },
  { value: 3, label: "Yearly" },
  { value: 4, label: "Custom (date or month ranges)" },
];

const MONTHS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

function syncRangesToImages(images, existingRanges = []) {
  const scheduled = images.slice(0, Math.max(0, images.length - 1));
  return scheduled.map((url) => {
    const found = existingRanges.find(
      (range) => (range.imageUrl || range.ImageUrl) === url
    );
    return {
      imageUrl: url,
      fromDate: found?.fromDate || found?.FromDate || "",
      toDate: found?.toDate || found?.ToDate || "",
      fromMonth: found?.fromMonth ?? found?.FromMonth ?? "",
      toMonth: found?.toMonth ?? found?.ToMonth ?? "",
    };
  });
}

export default function SplashBannerTab({ companyId }) {
  const [rotation, setRotation] = useState(0);
  const [images, setImages] = useState([]);
  const [activeImageUrl, setActiveImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [customRangeType, setCustomRangeType] = useState("Date");
  const [customRanges, setCustomRanges] = useState([]);

  const applySettings = (data) => {
    const nextImages = data?.imageUrls || data?.ImageUrls || [];
    setRotation(Number(data?.rotation ?? data?.Rotation ?? 0));
    setImages(nextImages);
    setActiveImageUrl(data?.activeImageUrl || data?.ActiveImageUrl || "");
    setCustomRangeType(data?.customRangeType || data?.CustomRangeType || "Date");
    setCustomRanges(syncRangesToImages(nextImages, data?.customRanges || data?.CustomRanges || []));
  };

  const fetchSettings = async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const response = await fetch(
        `${BASE_URL}/Company/GetSplashBannerSettings?companyId=${companyId}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      const result = await response.json();
      if (result?.statusCode === 200 || response.ok) {
        applySettings(result.result || result.data || result);
      }
    } catch {
      toast.error("Could not load splash banner settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [companyId]);

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !companyId) return;

    const formData = new FormData();
    formData.append("CompanyId", String(companyId));
    formData.append("Image", file);

    setUploading(true);
    try {
      const response = await fetch(`${BASE_URL}/Company/UploadSplashBanner`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: formData,
      });
      const result = await response.json();
      if (result?.statusCode === 200 || response.ok) {
        applySettings(result.result || result.data || result);
        toast.success("Banner uploaded");
      } else {
        toast.error(result?.message || "Failed to upload banner");
      }
    } catch {
      toast.error("Failed to upload banner");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (imageUrl) => {
    try {
      const response = await fetch(`${BASE_URL}/Company/DeleteSplashBanner`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ companyId, imageUrl }),
      });
      const result = await response.json();
      if (result?.statusCode === 200 || response.ok) {
        applySettings(result.result || result.data || result);
        toast.success("Banner deleted");
      } else {
        toast.error(result?.message || "Failed to delete banner");
      }
    } catch {
      toast.error("Failed to delete banner");
    }
  };

  const updateRange = (imageUrl, field, value) => {
    setCustomRanges((prev) =>
      prev.map((range) =>
        range.imageUrl === imageUrl ? { ...range, [field]: value } : range
      )
    );
  };

  const saveSettings = async ({ nextRotation, nextImages, selectedImageUrl, successMessage }) => {
    const scheduledRanges = syncRangesToImages(nextImages, customRanges).map((range) => ({
      imageUrl: range.imageUrl,
      fromDate: range.fromDate || null,
      toDate: range.toDate || null,
      fromMonth: range.fromMonth === "" ? null : Number(range.fromMonth),
      toMonth: range.toMonth === "" ? null : Number(range.toMonth),
    }));

    const response = await fetch(`${BASE_URL}/Company/SaveSplashBannerSettings`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        companyId,
        rotation: Number(nextRotation),
        imageUrls: nextImages,
        selectedImageUrl,
        customRangeType,
        customRanges: scheduledRanges,
      }),
    });
    const result = await response.json();
    if (result?.statusCode === 200 || response.ok) {
      applySettings(result.result || result.data || result);
      toast.success(successMessage);
      return true;
    }
    toast.error(result?.message || "Failed to save splash banner");
    return false;
  };

  const handleShowThis = async (imageUrl) => {
    setSaving(true);
    try {
      await saveSettings({
        nextRotation: 0,
        nextImages: images,
        selectedImageUrl: imageUrl,
        successMessage: "This image will show now",
      });
    } catch {
      toast.error("Failed to select banner");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveRotation = async () => {
    if (Number(rotation) === 4 && images.length > 1) {
      const missing = customRanges.some((range) =>
        customRangeType === "Month"
          ? range.fromMonth === "" || range.toMonth === ""
          : !range.fromDate || !range.toDate
      );
      if (missing) {
        toast.error(`Add ${images.length - 1} range(s). The last image covers all remaining time.`);
        return;
      }
    }

    setSaving(true);
    try {
      await saveSettings({
        nextRotation: rotation,
        nextImages: images,
        selectedImageUrl: activeImageUrl,
        successMessage: "Splash banner schedule saved",
      });
    } catch {
      toast.error("Failed to save schedule");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py={4}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  return (
    <Box sx={{ maxHeight: "55vh", overflowY: "auto", my: 2 }}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Typography variant="body2" color="text.secondary">
            This image appears when the system first loads, before sign-in. For Custom schedule,
            set date or month ranges for n-1 images. The last image covers all remaining time.
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <Typography>Change schedule</Typography>
          <TextField
            select
            fullWidth
            size="small"
            value={String(rotation)}
            onChange={(e) => {
              const next = Number(e.target.value);
              setRotation(next);
              if (next === 4) {
                setCustomRanges(syncRangesToImages(images, customRanges));
              }
            }}
          >
            {ROTATION_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={String(option.value)}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        {Number(rotation) === 4 && (
          <Grid item xs={12}>
            <Typography>Range type</Typography>
            <TextField
              select
              fullWidth
              size="small"
              value={customRangeType}
              onChange={(e) => setCustomRangeType(e.target.value)}
            >
              <MenuItem value="Date">Specific date range</MenuItem>
              <MenuItem value="Month">Month range</MenuItem>
            </TextField>
          </Grid>
        )}
        <Grid item xs={12}>
          <Button
            component="label"
            variant="contained"
            fullWidth
            startIcon={uploading ? <CircularProgress size={16} color="inherit" /> : <CloudUploadIcon />}
            disabled={uploading}
          >
            Upload Banner
            <VisuallyHiddenInput type="file" accept="image/*" onChange={handleUpload} />
          </Button>
        </Grid>
        {images.length === 0 ? (
          <Grid item xs={12}>
            <Typography variant="body2" color="text.secondary">
              No custom banners yet. The default CBASS-AI splash will be used.
            </Typography>
          </Grid>
        ) : (
          images.map((url, index) => {
            const isFallback = Number(rotation) === 4 && images.length > 1 && index === images.length - 1;
            const range = customRanges.find((item) => item.imageUrl === url);
            return (
            <Grid item xs={12} key={url}>
              <Box sx={{ position: "relative" }}>
                <Box
                  onClick={() => setPreviewUrl(url)}
                  sx={{
                    width: "100%",
                    height: 160,
                    backgroundSize: "contain",
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "center",
                    backgroundImage: `url(${url})`,
                    border: url === activeImageUrl ? "2px solid #1565c0" : "1px solid #ddd",
                    borderRadius: 1,
                    bgcolor: "#fafafa",
                    cursor: "pointer",
                  }}
                />
                {Number(rotation) === 4 && images.length > 1 && (
                  <Box mt={1}>
                    {isFallback ? (
                      <Typography variant="caption" color="text.secondary">
                        Remaining time (automatic). No date range needed.
                      </Typography>
                    ) : customRangeType === "Month" ? (
                      <Grid container spacing={1}>
                        <Grid item xs={6}>
                          <TextField
                            select
                            fullWidth
                            size="small"
                            label="From month"
                            value={String(range?.fromMonth ?? "")}
                            onChange={(e) => updateRange(url, "fromMonth", e.target.value)}
                          >
                            <MenuItem value="">Select</MenuItem>
                            {MONTHS.map((month) => (
                              <MenuItem key={month.value} value={String(month.value)}>
                                {month.label}
                              </MenuItem>
                            ))}
                          </TextField>
                        </Grid>
                        <Grid item xs={6}>
                          <TextField
                            select
                            fullWidth
                            size="small"
                            label="To month"
                            value={String(range?.toMonth ?? "")}
                            onChange={(e) => updateRange(url, "toMonth", e.target.value)}
                          >
                            <MenuItem value="">Select</MenuItem>
                            {MONTHS.map((month) => (
                              <MenuItem key={month.value} value={String(month.value)}>
                                {month.label}
                              </MenuItem>
                            ))}
                          </TextField>
                        </Grid>
                      </Grid>
                    ) : (
                      <Grid container spacing={1}>
                        <Grid item xs={6}>
                          <TextField
                            fullWidth
                            size="small"
                            type="date"
                            label="From date"
                            InputLabelProps={{ shrink: true }}
                            value={range?.fromDate || ""}
                            onChange={(e) => updateRange(url, "fromDate", e.target.value)}
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <TextField
                            fullWidth
                            size="small"
                            type="date"
                            label="To date"
                            InputLabelProps={{ shrink: true }}
                            value={range?.toDate || ""}
                            onChange={(e) => updateRange(url, "toDate", e.target.value)}
                          />
                        </Grid>
                      </Grid>
                    )}
                  </Box>
                )}
                <Box mt={1} display="flex" alignItems="center" justifyContent="space-between" gap={1}>
                  {url === activeImageUrl ? (
                    <Typography variant="caption" color="primary" sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      <CheckCircleIcon fontSize="inherit" />
                      Showing now
                    </Typography>
                  ) : (
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => handleShowThis(url)}
                      disabled={saving}
                    >
                      Show this now
                    </Button>
                  )}
                </Box>
                <IconButton
                  onClick={() => handleDelete(url)}
                  sx={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    bgcolor: "error.main",
                    color: "white",
                    "&:hover": { bgcolor: "error.dark" },
                  }}
                  size="small"
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            </Grid>
            );
          })
        )}
        <Grid item xs={12}>
          <Button
            variant="contained"
            fullWidth
            size="small"
            disabled={saving}
            onClick={handleSaveRotation}
          >
            {saving ? "Saving..." : "Save Schedule"}
          </Button>
        </Grid>
      </Grid>
      <Dialog
        open={Boolean(previewUrl)}
        onClose={() => setPreviewUrl("")}
        fullScreen
        PaperProps={{ sx: { bgcolor: "#000" } }}
      >
        <IconButton
          onClick={() => setPreviewUrl("")}
          sx={{ position: "absolute", top: 16, right: 16, color: "#fff", zIndex: 1 }}
        >
          <CloseIcon />
        </IconButton>
        {previewUrl ? (
          <Box
            component="img"
            src={previewUrl}
            alt="Splash banner preview"
            sx={{
              width: "100vw",
              height: "100vh",
              objectFit: "cover",
              objectPosition: "center",
            }}
          />
        ) : null}
      </Dialog>
    </Box>
  );
}
