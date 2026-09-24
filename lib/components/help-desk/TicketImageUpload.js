import React, { useState } from "react";
import {
  Box,
  Button,
  Typography,
  Grid,
  IconButton,
  TextField,
  Paper,
  CircularProgress,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DeleteIcon from "@mui/icons-material/Delete";
import ImageIcon from "@mui/icons-material/Image";
import BASE_URL from "Base/api";
import { toast } from "react-toastify";

export default function TicketImageUpload({ ticketId, images = [], onImagesChange, readOnly = false }) {
  const [uploading, setUploading] = useState(false);
  const [localImages, setLocalImages] = useState(images || []);

  const handleImageUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setUploading(true);
    const uploadedImages = [];

    try {
      for (const file of files) {
        if (!file.type.startsWith("image/")) {
          toast.error(`${file.name} is not an image file`);
          continue;
        }

        const formData = new FormData();
        formData.append("File", file);
        formData.append("TicketId", ticketId);
        formData.append("FileName", file.name);

        const token = localStorage.getItem("token");
        const response = await fetch(`${BASE_URL}/HelpDesk/UploadTicketImage`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        const data = await response.json();

        if (response.ok && (data.status === "SUCCESS" || data.statusCode === 200)) {
          uploadedImages.push({
            id: data.result?.id || Date.now(),
            imageUrl: data.result?.imageUrl || data.result?.url,
            description: "",
            uploadedOn: new Date().toISOString(),
          });
        } else {
          toast.error(`Failed to upload ${file.name}: ${data.message || "Unknown error"}`);
        }
      }

      const newImages = [...localImages, ...uploadedImages];
      setLocalImages(newImages);
      onImagesChange?.(newImages);
      toast.success(`${uploadedImages.length} image(s) uploaded successfully`);
    } catch (error) {
      console.error("Error uploading images:", error);
      toast.error("An error occurred while uploading images");
    } finally {
      setUploading(false);
      event.target.value = ""; // Reset file input
    }
  };

  const handleDeleteImage = async (imageId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${BASE_URL}/HelpDesk/DeleteTicketImage?imageId=${imageId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (response.ok && (data.status === "SUCCESS" || data.statusCode === 200)) {
        const newImages = localImages.filter((img) => img.id !== imageId);
        setLocalImages(newImages);
        onImagesChange?.(newImages);
        toast.success("Image deleted successfully");
      } else {
        toast.error(data.message || "Failed to delete image");
      }
    } catch (error) {
      console.error("Error deleting image:", error);
      toast.error("An error occurred while deleting image");
    }
  };

  const handleDescriptionChange = async (imageId, description) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${BASE_URL}/HelpDesk/UpdateTicketImageDescription`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          imageId,
          description,
        }),
      });

      const data = await response.json();

      if (response.ok && (data.status === "SUCCESS" || data.statusCode === 200)) {
        const newImages = localImages.map((img) =>
          img.id === imageId ? { ...img, description } : img
        );
        setLocalImages(newImages);
        onImagesChange?.(newImages);
      } else {
        toast.error(data.message || "Failed to update description");
      }
    } catch (error) {
      console.error("Error updating description:", error);
      toast.error("An error occurred while updating description");
    }
  };

  return (
    <Box>
      {!readOnly && (
        <Box sx={{ mb: 2 }}>
          <input
            accept="image/*"
            style={{ display: "none" }}
            id="ticket-image-upload"
            multiple
            type="file"
            onChange={handleImageUpload}
            disabled={uploading || !ticketId}
          />
          <label htmlFor="ticket-image-upload">
            <Button
              variant="outlined"
              component="span"
              startIcon={uploading ? <CircularProgress size={20} /> : <CloudUploadIcon />}
              disabled={uploading || !ticketId}
              fullWidth
              sx={{ mb: 1 }}
            >
              {uploading ? "Uploading..." : "Upload Images"}
            </Button>
          </label>
        </Box>
      )}

      {localImages.length > 0 && (
        <Grid container spacing={2}>
          {localImages.map((image) => (
            <Grid item xs={12} sm={6} md={4} key={image.id}>
              <Paper
                elevation={2}
                sx={{
                  p: 2,
                  display: "flex",
                  flexDirection: "column",
                  gap: 1,
                }}
              >
                <Box
                  sx={{
                    width: "100%",
                    height: 200,
                    bgcolor: "#f5f5f5",
                    borderRadius: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                    position: "relative",
                  }}
                >
                  {image.imageUrl ? (
                    <img
                      src={image.imageUrl}
                      alt={image.description || "Ticket image"}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <ImageIcon sx={{ fontSize: 48, color: "#ccc" }} />
                  )}
                  {!readOnly && (
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteImage(image.id)}
                      sx={{
                        position: "absolute",
                        top: 8,
                        right: 8,
                        bgcolor: "rgba(255, 255, 255, 0.9)",
                        "&:hover": { bgcolor: "rgba(255, 255, 255, 1)" },
                      }}
                    >
                      <DeleteIcon fontSize="small" color="error" />
                    </IconButton>
                  )}
                </Box>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Image description..."
                  value={image.description || ""}
                  onChange={(e) => handleDescriptionChange(image.id, e.target.value)}
                  onBlur={(e) => handleDescriptionChange(image.id, e.target.value)}
                  disabled={readOnly}
                  multiline
                  rows={2}
                />
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}

      {localImages.length === 0 && !uploading && (
        <Box
          sx={{
            textAlign: "center",
            py: 4,
            border: "2px dashed #ddd",
            borderRadius: 2,
            bgcolor: "#fafafa",
          }}
        >
          <ImageIcon sx={{ fontSize: 48, color: "#ccc", mb: 1 }} />
          <Typography variant="body2" color="text.secondary">
            No images uploaded yet
          </Typography>
        </Box>
      )}
    </Box>
  );
}

