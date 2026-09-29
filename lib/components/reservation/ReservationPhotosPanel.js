import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  Grid,
  IconButton,
  ImageList,
  ImageListItem,
  ImageListItemBar,
  TextField,
  Typography,
} from "@mui/material";
import { CloudUpload, DeleteOutline } from "@mui/icons-material";
import BASE_URL from "Base/api";
import { toast } from "react-toastify";

export const MAX_CLIENT_BRIDE_PHOTOS = 5;

/**
 * Shared photo gallery for reservation media.
 * - Customer portal: editable (upload + delete own photos)
 * - Admin reserved-customer view: read-only display
 */
export default function ReservationPhotosPanel({
  reservationId,
  initialMedia = [],
  readOnly = false,
  maxPhotos = null,
  onMediaChange,
  emptyMessage = "No bride photo uploaded yet.",
}) {
  const [media, setMedia] = useState(initialMedia);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState("");
  const [pendingFile, setPendingFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    setMedia(initialMedia);
  }, [initialMedia]);

  const fetchMedia = async () => {
    if (!reservationId) return;
    try {
      const response = await fetch(
        `${BASE_URL}/ReservationMedia/GetAllReservationMediaByID?id=${reservationId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok) throw new Error("Failed to load photos");
      const data = await response.json();
      const items = data?.result || [];
      setMedia(items);
      onMediaChange?.(items);
    } catch (error) {
      console.error("Error fetching reservation media:", error);
    }
  };

  useEffect(() => {
    if (reservationId && initialMedia.length === 0) {
      fetchMedia();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reservationId]);

  const resetPicker = () => {
    setPendingFile(null);
    setPreviewUrl("");
    setTitle("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const atPhotoLimit = maxPhotos != null && media.length >= maxPhotos;

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (atPhotoLimit) {
      toast.error(`You can upload a maximum of ${maxPhotos} bride photos.`);
      event.target.value = "";
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      event.target.value = "";
      return;
    }
    setPendingFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    if (!title) setTitle(file.name);
  };

  const handleUpload = async () => {
    if (!reservationId) {
      toast.error("Reservation not loaded yet.");
      return;
    }
    if (!pendingFile) {
      toast.error("Choose an image first.");
      return;
    }
    if (atPhotoLimit) {
      toast.error(`You can upload a maximum of ${maxPhotos} bride photos.`);
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("File", pendingFile);
      formData.append("FileName", title.trim() || pendingFile.name);
      formData.append("ReservationId", String(reservationId));

      const response = await fetch(`${BASE_URL}/ReservationMedia/Create`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });
      const json = await response.json().catch(() => ({}));
      if (!response.ok || (json?.statusCode != null && Number(json.statusCode) !== 200)) {
        throw new Error(json?.message || "Upload failed");
      }

      toast.success("Bride photo uploaded successfully");
      resetPicker();
      await fetchMedia();
    } catch (error) {
      toast.error(error.message || "Failed to upload photo");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await fetch(`${BASE_URL}/ReservationMedia/Delete?id=${id}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });
      const json = await response.json().catch(() => ({}));
      if (!response.ok || (json?.statusCode != null && Number(json.statusCode) !== 200)) {
        throw new Error(json?.message || "Delete failed");
      }
      toast.success("Bride photo removed");
      await fetchMedia();
    } catch (error) {
      toast.error(error.message || "Failed to remove photo");
    }
  };

  return (
    <Box>
      {!readOnly && (
        <Box
          sx={{
            mb: 3,
            p: 2.5,
            borderRadius: 2,
            border: "1px dashed",
            borderColor: "divider",
            background: "rgba(0,0,0,0.02)",
          }}
        >
          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
            Upload bride photo
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>
            Add a clear photo of the bride so the studio team can recognise her on the wedding day.
            {maxPhotos != null ? ` You can upload up to ${maxPhotos} photos.` : ""}
          </Typography>

          {maxPhotos != null && (
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>
              {media.length} of {maxPhotos} photos uploaded
            </Typography>
          )}

          {atPhotoLimit ? (
            <Typography variant="body2" color="warning.main" sx={{ fontWeight: 600 }}>
              Maximum of {maxPhotos} bride photos reached. Remove a photo to upload another.
            </Typography>
          ) : (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleFileChange}
              />

              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={4}>
                  <Button
                    variant="outlined"
                    startIcon={<CloudUpload />}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    fullWidth
                  >
                    Choose bride photo
                  </Button>
                </Grid>
                <Grid item xs={12} md={5}>
                  <TextField
                    label="Bride photo label (optional)"
                    size="small"
                    fullWidth
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={uploading}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <Button
                    variant="contained"
                    onClick={handleUpload}
                    disabled={uploading || !pendingFile}
                    fullWidth
                  >
                    {uploading ? "Uploading…" : "Upload"}
                  </Button>
                </Grid>
              </Grid>

              {previewUrl && (
                <Box sx={{ mt: 2 }}>
                  <img
                    src={previewUrl}
                    alt="Preview"
                    style={{ maxWidth: 220, maxHeight: 160, borderRadius: 8, objectFit: "cover" }}
                  />
                </Box>
              )}
            </>
          )}
        </Box>
      )}

      {media.length === 0 ? (
        <Typography color="text.secondary" align="center" py={3}>
          {emptyMessage}
        </Typography>
      ) : (
        <ImageList variant="masonry" cols={readOnly ? 4 : 3} gap={8}>
          {media.map((item) => (
            <ImageListItem key={item.id}>
              <img
                src={item.imageURL}
                alt={item.fileName}
                loading="lazy"
                style={{ borderRadius: 8, cursor: "pointer" }}
                onClick={() => window.open(item.imageURL, "_blank")}
              />
              <ImageListItemBar
                title={item.fileName}
                position="bottom"
                actionIcon={
                  !readOnly ? (
                    <IconButton
                      sx={{ color: "rgba(255,255,255,0.9)" }}
                      onClick={() => handleDelete(item.id)}
                      aria-label={`delete ${item.fileName}`}
                    >
                      <DeleteOutline />
                    </IconButton>
                  ) : null
                }
              />
            </ImageListItem>
          ))}
        </ImageList>
      )}
    </Box>
  );
}
