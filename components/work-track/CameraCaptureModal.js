import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  CircularProgress,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import FlipCameraIosIcon from "@mui/icons-material/FlipCameraIos";
import RefreshIcon from "@mui/icons-material/Refresh";
import PhotoLibraryIcon from "@mui/icons-material/PhotoLibrary";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { toast } from "react-toastify";

const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export default function CameraCaptureModal({
  open,
  onClose,
  onCapture,
  title = "Add Photos",
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [selectedImages, setSelectedImages] = useState([]);
  const [capturing, setCapturing] = useState(false);
  const [facingMode, setFacingMode] = useState("environment");
  const [cameraError, setCameraError] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const galleryInputRef = useRef(null);

  useEffect(() => {
    if (open) {
      startCamera();
    } else {
      stopCamera();
      setSelectedImages([]);
      setCameraError(null);
    }
    return () => stopCamera();
  }, [open, facingMode]);

  const startCamera = async () => {
    try {
      setCameraError(null);
      stopCamera();

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      setCameraError("Unable to access camera. You can still choose photos from the gallery.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const toggleCamera = () => {
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  };

  const addImages = (images) => {
    const next = (images || []).filter(Boolean);
    if (next.length === 0) return;
    setSelectedImages((prev) => [...prev, ...next]);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    setCapturing(true);
    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (facingMode === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = canvas.toDataURL("image/jpeg", 0.85);
    addImages([imageData]);
    setCapturing(false);
    toast("Photo added. Capture more or choose from gallery.", { type: "success" });
  };

  const handleGalleryChange = async (event) => {
    const files = Array.from(event.target.files || []).filter((file) =>
      file.type.startsWith("image/")
    );
    event.target.value = "";
    if (files.length === 0) return;

    try {
      const images = await Promise.all(files.map(fileToDataUrl));
      addImages(images);
      toast(
        files.length === 1 ? "Photo selected from gallery" : `${files.length} photos selected from gallery`,
        { type: "success" }
      );
    } catch (error) {
      console.error("Error reading gallery photos:", error);
      toast("Failed to read selected photos", { type: "error" });
    }
  };

  const removeSelectedImage = (index) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleConfirm = () => {
    if (selectedImages.length === 0) return;
    onCapture(selectedImages);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
    >
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="h6">{title}</Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 2 }}>
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={handleGalleryChange}
        />

        {cameraError ? (
          <Box sx={{ textAlign: "center", py: 3 }}>
            <Typography color="error" gutterBottom>
              {cameraError}
            </Typography>
            <Button variant="outlined" onClick={startCamera} startIcon={<RefreshIcon />} sx={{ mr: 1, mb: 1 }}>
              Retry Camera
            </Button>
            <Button
              variant="contained"
              startIcon={<PhotoLibraryIcon />}
              onClick={() => galleryInputRef.current?.click()}
              sx={{ mb: 1 }}
            >
              Choose from Gallery
            </Button>
          </Box>
        ) : (
          <Box>
            <Box
              sx={{
                position: "relative",
                width: "100%",
                bgcolor: "#000",
                borderRadius: 2,
                overflow: "hidden",
              }}
            >
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{
                  width: "100%",
                  height: "auto",
                  display: "block",
                  transform: facingMode === "user" ? "scaleX(-1)" : "none",
                }}
              />
              <canvas ref={canvasRef} style={{ display: "none" }} />

              <IconButton
                onClick={toggleCamera}
                sx={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  bgcolor: "rgba(0,0,0,0.5)",
                  color: "white",
                  "&:hover": { bgcolor: "rgba(0,0,0,0.7)" },
                }}
              >
                <FlipCameraIosIcon />
              </IconButton>
            </Box>

            <Box display="flex" gap={1} flexWrap="wrap" sx={{ mt: 2 }}>
              <Button
                variant="contained"
                startIcon={capturing ? <CircularProgress size={20} color="inherit" /> : <CameraAltIcon />}
                onClick={capturePhoto}
                disabled={capturing}
                sx={{ flex: 1, minWidth: 140 }}
              >
                {capturing ? "Capturing..." : "Take Photo"}
              </Button>
              <Button
                variant="outlined"
                startIcon={<PhotoLibraryIcon />}
                onClick={() => galleryInputRef.current?.click()}
                sx={{ flex: 1, minWidth: 140 }}
              >
                Gallery
              </Button>
            </Box>
          </Box>
        )}

        {selectedImages.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {selectedImages.length} photo{selectedImages.length === 1 ? "" : "s"} ready to upload
            </Typography>
            <Box display="flex" gap={1} flexWrap="wrap">
              {selectedImages.map((src, index) => (
                <Box key={`${index}-${src.slice(-16)}`} sx={{ position: "relative" }}>
                  <Box
                    component="img"
                    src={src}
                    alt={`Selected ${index + 1}`}
                    sx={{
                      width: 84,
                      height: 84,
                      objectFit: "cover",
                      borderRadius: 1,
                      border: "1px solid #ddd",
                      display: "block",
                    }}
                  />
                  <IconButton
                    size="small"
                    onClick={() => removeSelectedImage(index)}
                    sx={{
                      position: "absolute",
                      top: -8,
                      right: -8,
                      bgcolor: "error.main",
                      color: "white",
                      width: 22,
                      height: 22,
                      "&:hover": { bgcolor: "error.dark" },
                    }}
                  >
                    <DeleteOutlineIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                </Box>
              ))}
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          color="primary"
          disabled={selectedImages.length === 0}
        >
          {selectedImages.length <= 1 ? "Upload Photo" : `Upload ${selectedImages.length} Photos`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
