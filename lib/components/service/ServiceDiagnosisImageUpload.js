import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Typography,
  Grid,
  IconButton,
  Paper,
  CircularProgress,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DeleteIcon from "@mui/icons-material/Delete";
import ImageIcon from "@mui/icons-material/Image";
import BASE_URL from "Base/api";
import { toast } from "react-toastify";

const MAX_IMAGES = 10;

export default function ServiceDiagnosisImageUpload({
  jobCardId,
  images = [],
  readOnly = false,
  onImagesChange,
}) {
  const [uploading, setUploading] = useState(false);
  const [localImages, setLocalImages] = useState(images || []);

  useEffect(() => {
    setLocalImages(images || []);
  }, [images]);

  const handleImageUpload = async (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0 || !jobCardId) return;

    if (localImages.length >= MAX_IMAGES) {
      toast.error(`Maximum ${MAX_IMAGES} images allowed.`);
      return;
    }

    setUploading(true);
    const uploaded = [];

    try {
      const token = localStorage.getItem("token");
      for (const file of files) {
        if (localImages.length + uploaded.length >= MAX_IMAGES) {
          toast.warning(`Only ${MAX_IMAGES} images are allowed per job card.`);
          break;
        }
        if (!file.type.startsWith("image/")) {
          toast.error(`${file.name} is not an image file.`);
          continue;
        }
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name} must be 5 MB or smaller.`);
          continue;
        }

        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch(
          `${BASE_URL}/ServiceJobCard/UploadDiagnosisImage/${jobCardId}`,
          {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
          }
        );
        const data = await response.json();

        if (
          response.ok &&
          (data.status === "SUCCESS" || data.statusCode === 200) &&
          data.result
        ) {
          uploaded.push(data.result);
        } else {
          toast.error(data.message || `Failed to upload ${file.name}`);
        }
      }

      if (uploaded.length > 0) {
        const next = [...localImages, ...uploaded];
        setLocalImages(next);
        onImagesChange?.(next);
        toast.success(
          `${uploaded.length} image${uploaded.length > 1 ? "s" : ""} uploaded`
        );
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while uploading images.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const handleDeleteImage = async (imageId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${BASE_URL}/ServiceJobCard/DeleteDiagnosisImage/${imageId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      const data = await response.json();

      if (response.ok && (data.status === "SUCCESS" || data.statusCode === 200)) {
        const next = localImages.filter((img) => img.id !== imageId);
        setLocalImages(next);
        onImagesChange?.(next);
        toast.success("Image removed");
      } else {
        toast.error(data.message || "Failed to delete image");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while deleting the image.");
    }
  };

  const inputId = `diagnosis-image-upload-${jobCardId || "new"}`;

  return (
    <Box>
      {!readOnly && (
        <Box sx={{ mb: 1.5 }}>
          <input
            accept="image/*"
            style={{ display: "none" }}
            id={inputId}
            multiple
            type="file"
            onChange={handleImageUpload}
            disabled={uploading || !jobCardId || localImages.length >= MAX_IMAGES}
          />
          <label htmlFor={inputId}>
            <Button
              variant="outlined"
              component="span"
              size="small"
              startIcon={
                uploading ? <CircularProgress size={18} /> : <CloudUploadIcon />
              }
              disabled={uploading || !jobCardId || localImages.length >= MAX_IMAGES}
            >
              {uploading
                ? "Uploading..."
                : localImages.length >= MAX_IMAGES
                ? "Image limit reached"
                : "Add photos"}
            </Button>
          </label>
          <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
            Up to {MAX_IMAGES} images, 5 MB each (JPG, PNG, etc.)
          </Typography>
        </Box>
      )}

      {localImages.length > 0 ? (
        <Grid container spacing={1.5}>
          {localImages.map((image) => (
            <Grid item xs={6} sm={4} md={3} key={image.id}>
              <Paper
                variant="outlined"
                sx={{
                  position: "relative",
                  height: 120,
                  overflow: "hidden",
                  bgcolor: "#f5f5f5",
                }}
              >
                {image.imageUrl ? (
                  <Box
                    component="img"
                    src={image.imageUrl}
                    alt="Diagnosis"
                    sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <Box
                    sx={{
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <ImageIcon color="disabled" />
                  </Box>
                )}
                {!readOnly && (
                  <IconButton
                    size="small"
                    onClick={() => handleDeleteImage(image.id)}
                    sx={{
                      position: "absolute",
                      top: 4,
                      right: 4,
                      bgcolor: "rgba(255,255,255,0.9)",
                    }}
                  >
                    <DeleteIcon fontSize="small" color="error" />
                  </IconButton>
                )}
              </Paper>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Typography variant="body2" color="text.secondary">
          {readOnly
            ? "No diagnosis photos attached."
            : "Add photos of the device, fault, or repair findings (optional)."}
        </Typography>
      )}
    </Box>
  );
}
